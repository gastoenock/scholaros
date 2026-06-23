<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\PettyCashFund;
use App\Models\Student;
use App\Services\AccountingService;
use App\Services\StudentFeeBalanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function __construct(
        private AccountingService $accounting,
        private StudentFeeBalanceService $feeBalances,
    ) {}

    public function index(Request $request): Response
    {
        $schoolId = $this->schoolId();
        $academicYear = $request->query(
            'academicYear',
            sprintf('%d-%d', now()->year, now()->year + 1),
        );
        $reportAsOf = $request->query('asOf', now()->toDateString());

        if (! $schoolId) {
            return Inertia::render('dashboard/finance/page', [
                'academicYear' => $academicYear,
                'reportAsOf' => $reportAsOf,
                'summary' => null,
                'payments' => [],
                'expenses' => [],
                'feeStructures' => [],
                'students' => [],
                'accounting' => null,
            ]);
        }

        $this->accounting->ensureChartOfAccounts($schoolId);
        $this->accounting->ensurePettyCashFund($schoolId, auth()->id());

        $payments = FeePayment::forSchool($schoolId)
            ->where('academic_year', $academicYear)
            ->orderByDesc('payment_date')
            ->get();

        $studentMap = Student::forSchool($schoolId)->get(['id', 'first_name', 'last_name'])->keyBy('id');
        $payments = $payments->map(function (FeePayment $payment) use ($studentMap) {
            $student = $studentMap->get($payment->student_id);

            return array_merge($payment->toArray(), [
                'studentName' => $student ? trim("{$student->first_name} {$student->last_name}") : 'Unknown',
            ]);
        });

        $expenses = Expense::forSchool($schoolId)
            ->orderByDesc('date')
            ->get();

        $feeStructures = FeeStructure::forSchool($schoolId)
            ->where('academic_year', $academicYear)
            ->orderByDesc('created_at')
            ->get();

        $students = Student::forSchool($schoolId)
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'student_id', 'grade_level']);

        $summary = $this->buildSummary($schoolId, $academicYear, $payments, $expenses);

        $yearPrefix = explode('-', $academicYear)[0];
        $pettyCashFund = PettyCashFund::forSchool($schoolId)->first();

        return Inertia::render('dashboard/finance/page', [
            'academicYear' => $academicYear,
            'reportAsOf' => $reportAsOf,
            'summary' => $summary,
            'payments' => $payments,
            'expenses' => $expenses,
            'feeStructures' => $feeStructures,
            'students' => $students,
            'accounting' => [
                'cashBook' => $this->accounting->cashBook($schoolId, "{$yearPrefix}-01-01", $reportAsOf),
                'pettyCashBook' => $this->accounting->pettyCashBook($schoolId),
                'trialBalance' => $this->accounting->trialBalance($schoolId, $reportAsOf),
                'balanceSheet' => $this->accounting->balanceSheet($schoolId, $reportAsOf),
                'pettyCashFund' => $pettyCashFund?->toArray(),
            ],
        ]);
    }

    public function feeBalancePreview(Request $request): JsonResponse
    {
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'studentId' => ['required', 'integer', 'exists:students,id'],
            'academicYear' => ['required', 'string'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'status' => ['nullable', 'in:paid,partial,overdue,waived'],
            'feeStructureId' => ['nullable', 'integer', 'exists:fee_structures,id'],
        ]);

        $student = Student::forSchool($schoolId)->findOrFail($validated['studentId']);

        return response()->json(
            $this->feeBalances->previewPayment(
                $schoolId,
                $student,
                $validated['academicYear'],
                (float) ($validated['amount'] ?? 0),
                $validated['status'] ?? 'paid',
                isset($validated['feeStructureId']) ? (int) $validated['feeStructureId'] : null,
            ),
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, array<string, mixed>|FeePayment>  $payments
     * @param  \Illuminate\Support\Collection<int, Expense>  $expenses
     * @return array<string, mixed>
     */
    private function buildSummary(int $schoolId, string $academicYear, $payments, $expenses): array
    {
        $yearPrefix = explode('-', $academicYear)[0];
        $yearExpenses = $expenses->filter(fn (Expense $e) => str_starts_with($e->date, $yearPrefix));

        $totalIncome = collect($payments)
            ->where('status', 'paid')
            ->sum(fn ($p) => is_array($p) ? $p['amount'] : $p->amount);

        $totalExpenses = $yearExpenses
            ->where('status', 'approved')
            ->sum('amount');

        $totalCollected = collect($payments)
            ->whereIn('status', ['paid', 'partial', 'waived'])
            ->sum(fn ($p) => is_array($p) ? $p['amount'] : $p->amount);

        $totalOutstanding = $this->feeBalances->totalOutstandingForSchool($schoolId, $academicYear);

        $byMonth = [];
        for ($m = 1; $m <= 12; $m++) {
            $byMonth[str_pad((string) $m, 2, '0', STR_PAD_LEFT)] = [
                'income' => 0,
                'expenses' => 0,
            ];
        }

        collect($payments)->where('status', 'paid')->each(function ($payment) use (&$byMonth) {
            $date = is_array($payment) ? $payment['paymentDate'] : $payment->payment_date;
            $amount = is_array($payment) ? $payment['amount'] : $payment->amount;
            $month = substr($date, 5, 2);
            if (isset($byMonth[$month])) {
                $byMonth[$month]['income'] += (float) $amount;
            }
        });

        $yearExpenses->where('status', 'approved')->each(function (Expense $expense) use (&$byMonth) {
            $month = substr($expense->date, 5, 2);
            if (isset($byMonth[$month])) {
                $byMonth[$month]['expenses'] += (float) $expense->amount;
            }
        });

        return [
            'totalIncome' => $totalIncome,
            'totalExpenses' => $totalExpenses,
            'netBalance' => $totalIncome - $totalExpenses,
            'totalCollected' => $totalCollected,
            'totalOutstanding' => $totalOutstanding,
            'byMonth' => $byMonth,
        ];
    }

    public function storeFeeStructure(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'gradeLevel' => ['nullable', 'string'],
            'academicYear' => ['required', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.name' => ['required', 'string'],
            'items.*.amount' => ['required', 'numeric', 'min:0'],
            'items.*.dueDate' => ['nullable', 'string'],
            'items.*.isOptional' => ['boolean'],
        ]);

        $totalAmount = collect($validated['items'])->sum('amount');

        FeeStructure::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'total_amount' => $totalAmount,
        ]);

        return back()->with('success', 'Fee structure created');
    }

    public function destroyFeeStructure(FeeStructure $feeStructure): RedirectResponse
    {
        abort_unless($feeStructure->school_id === $this->schoolId(), 403);

        $feeStructure->delete();

        return back()->with('success', 'Fee structure deleted');
    }

    public function storePayment(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'studentId' => ['required', 'integer', 'exists:students,id'],
            'feeStructureId' => ['nullable', 'integer', 'exists:fee_structures,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'paymentDate' => ['required', 'string'],
            'method' => ['required', 'in:cash,card,online,bank_transfer,check'],
            'paidFor' => ['required', 'string'],
            'academicYear' => ['required', 'string'],
            'term' => ['nullable', 'string'],
            'status' => ['required', 'in:paid,partial,overdue,waived'],
            'notes' => ['nullable', 'string'],
        ]);

        $student = Student::forSchool($schoolId)->findOrFail($validated['studentId']);
        $amount = (float) $validated['amount'];
        $feeStructureId = isset($validated['feeStructureId']) ? (int) $validated['feeStructureId'] : null;

        $snapshot = $this->feeBalances->snapshotForPayment(
            $schoolId,
            $student,
            $validated['academicYear'],
            $amount,
            $validated['status'],
            $feeStructureId,
        );

        $status = $this->feeBalances->resolveStatus(
            $amount,
            $snapshot['balance_before'],
            $validated['status'],
        );

        $count = FeePayment::forSchool($schoolId)->count();
        $receiptNumber = sprintf('RCP-%d-%04d', now()->year, $count + 1);

        $payment = FeePayment::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'fee_structure_id' => $feeStructureId,
            'status' => $status,
            'receipt_number' => $receiptNumber,
            'recorded_by' => auth()->id(),
            ...$snapshot,
        ]);

        $this->accounting->postFeePayment($payment);

        return back()->with('success', 'Payment recorded successfully');
    }

    public function destroyPayment(FeePayment $feePayment): RedirectResponse
    {
        abort_unless($feePayment->school_id === $this->schoolId(), 403);

        $feePayment->delete();

        return back()->with('success', 'Payment deleted');
    }

    public function storeExpense(Request $request): RedirectResponse
    {
        $schoolId = $this->schoolId();
        abort_unless($schoolId, 403);

        $validated = $request->validate([
            'category' => ['required', 'string'],
            'description' => ['required', 'string'],
            'amount' => ['required', 'numeric', 'min:0'],
            'date' => ['required', 'string'],
            'vendor' => ['nullable', 'string'],
            'paymentMethod' => ['nullable', 'in:cash,bank,petty_cash'],
            'referenceNumber' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $expense = Expense::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
        ]);

        if ($expense->status === 'approved') {
            $this->accounting->postExpense($expense);
        }

        return back()->with('success', 'Expense recorded');
    }

    public function updateExpenseStatus(Request $request, Expense $expense): RedirectResponse
    {
        abort_unless($expense->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:pending,approved,rejected'],
        ]);

        $expense->update([
            'status' => $validated['status'],
            'approved_by' => auth()->id(),
        ]);

        if ($validated['status'] === 'approved') {
            $this->accounting->postExpense($expense->fresh());
        }

        return back()->with('success', 'Expense status updated');
    }

    public function destroyExpense(Expense $expense): RedirectResponse
    {
        abort_unless($expense->school_id === $this->schoolId(), 403);

        $expense->delete();

        return back()->with('success', 'Expense deleted');
    }
}
