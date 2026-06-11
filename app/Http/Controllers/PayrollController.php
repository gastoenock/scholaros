<?php

namespace App\Http\Controllers;

use App\Models\LeaveRequest;
use App\Models\PayrollRecord;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $staff = $schoolId
            ? Staff::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name'])
            : collect();

        $staffNames = $staff->keyBy('id')->map(fn ($s) => $s->first_name.' '.$s->last_name);

        $payroll = $schoolId
            ? PayrollRecord::forSchool($schoolId)->orderByDesc('id')->get()
                ->map(fn ($r) => [
                    ...$r->toArray(),
                    'staffName' => $staffNames[$r->staff_id] ?? 'Unknown',
                ])->values()
            : collect();

        $leaves = $schoolId
            ? LeaveRequest::forSchool($schoolId)->orderByDesc('id')->get()
                ->map(fn ($l) => [
                    ...$l->toArray(),
                    'staffName' => $staffNames[$l->staff_id] ?? 'Unknown',
                ])->values()
            : collect();

        return Inertia::render('dashboard/payroll/page', [
            'payroll' => $payroll,
            'leaves' => $leaves,
            'staff' => $staff,
        ]);
    }

    // ─── Payroll ─────────────────────────────────────────────────

    public function generate(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer'],
        ]);

        $activeStaff = Staff::forSchool($schoolId)->where('status', 'active')->get();

        $existingStaffIds = PayrollRecord::forSchool($schoolId)
            ->where('month', $validated['month'])
            ->where('year', $validated['year'])
            ->pluck('staff_id')
            ->all();

        $created = 0;
        foreach ($activeStaff as $member) {
            if (in_array($member->id, $existingStaffIds)) {
                continue;
            }

            // Replicates convex/payroll.ts generatePayroll salary breakdown
            $basic = $member->salary ?? 3000;
            $allowances = $basic * 0.1;
            $deductions = $basic * 0.05;

            PayrollRecord::create([
                'school_id' => $schoolId,
                'staff_id' => $member->id,
                'month' => $validated['month'],
                'year' => $validated['year'],
                'basic_salary' => $basic,
                'allowances' => $allowances,
                'deductions' => $deductions,
                'net_salary' => $basic + $allowances - $deductions,
                'status' => 'pending',
            ]);
            $created++;
        }

        if ($created === 0) {
            return back()->with('success', 'Payroll already generated for this period');
        }

        return back()->with('success', "Generated payroll for {$created} staff members");
    }

    public function updateStatus(Request $request, PayrollRecord $payrollRecord): RedirectResponse
    {
        abort_unless($payrollRecord->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,paid,cancelled'],
            'paymentDate' => ['nullable', 'string'],
        ]);

        $payrollRecord->update($this->snakeKeys($validated));

        return back()->with('success', 'Payroll updated');
    }

    // ─── Leave Requests ──────────────────────────────────────────

    public function storeLeave(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'staffId' => ['required', 'integer'],
            'type' => ['required', 'in:sick,annual,casual,maternity,unpaid'],
            'startDate' => ['required', 'string'],
            'endDate' => ['required', 'string'],
            'reason' => ['required', 'string'],
        ]);

        abort_unless(Staff::forSchool($schoolId)->whereKey($validated['staffId'])->exists(), 403);

        LeaveRequest::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Leave request submitted');
    }

    public function updateLeaveStatus(Request $request, LeaveRequest $leaveRequest): RedirectResponse
    {
        abort_unless($leaveRequest->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $leaveRequest->update([
            'status' => $validated['status'],
            'approved_by' => auth()->id(),
        ]);

        return back()->with('success', 'Leave request '.$validated['status']);
    }
}
