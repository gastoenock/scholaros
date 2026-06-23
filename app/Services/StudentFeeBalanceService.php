<?php

namespace App\Services;

use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Student;

class StudentFeeBalanceService
{
    /**
     * @return array{
     *     feesDue: float,
     *     totalPaid: float,
     *     balanceDue: float,
     *     feeStructureId: int|null,
     *     feeStructureName: string|null
     * }
     */
    public function currentBalance(
        int $schoolId,
        Student $student,
        string $academicYear,
        ?int $feeStructureId = null,
    ): array {
        $structure = $this->resolveFeeStructure($schoolId, $student, $academicYear, $feeStructureId);
        $feesDue = $this->structureTotalDue($structure);
        $totalPaid = $this->totalPaid($schoolId, $student->id, $academicYear);

        return [
            'feesDue' => $feesDue,
            'totalPaid' => $totalPaid,
            'balanceDue' => $this->balanceDue($feesDue, $totalPaid),
            'feeStructureId' => $structure?->id,
            'feeStructureName' => $structure?->name,
        ];
    }

    /**
     * @return array{
     *     fees_due: float,
     *     paid_total_before: float,
     *     paid_total_after: float,
     *     balance_before: float,
     *     balance_after: float
     * }
     */
    public function snapshotForPayment(
        int $schoolId,
        Student $student,
        string $academicYear,
        float $paymentAmount,
        string $status,
        ?int $feeStructureId = null,
    ): array {
        $structure = $this->resolveFeeStructure($schoolId, $student, $academicYear, $feeStructureId);
        $feesDue = $this->structureTotalDue($structure);
        $paidBefore = $this->totalPaid($schoolId, $student->id, $academicYear);
        $balanceBefore = $this->balanceDue($feesDue, $paidBefore);

        $credit = $this->paymentCreditAmount($paymentAmount, $status);
        $paidAfter = round($paidBefore + $credit, 2);
        $balanceAfter = $this->balanceDue($feesDue, $paidAfter);

        return [
            'fees_due' => $feesDue,
            'paid_total_before' => $paidBefore,
            'paid_total_after' => $paidAfter,
            'balance_before' => $balanceBefore,
            'balance_after' => $balanceAfter,
        ];
    }

    /**
     * @return array{
     *     feesDue: float,
     *     paidTotalBefore: float,
     *     paidTotalAfter: float,
     *     balanceBefore: float,
     *     balanceAfter: float,
     *     feeStructureId: int|null,
     *     feeStructureName: string|null
     * }
     */
    public function previewPayment(
        int $schoolId,
        Student $student,
        string $academicYear,
        float $paymentAmount,
        string $status,
        ?int $feeStructureId = null,
    ): array {
        $snapshot = $this->snapshotForPayment(
            $schoolId,
            $student,
            $academicYear,
            $paymentAmount,
            $status,
            $feeStructureId,
        );

        $structure = $this->resolveFeeStructure($schoolId, $student, $academicYear, $feeStructureId);

        return [
            'feesDue' => $snapshot['fees_due'],
            'paidTotalBefore' => $snapshot['paid_total_before'],
            'paidTotalAfter' => $snapshot['paid_total_after'],
            'balanceBefore' => $snapshot['balance_before'],
            'balanceAfter' => $snapshot['balance_after'],
            'feeStructureId' => $structure?->id,
            'feeStructureName' => $structure?->name,
        ];
    }

    public function totalOutstandingForSchool(int $schoolId, string $academicYear): float
    {
        $total = 0.0;

        Student::forSchool($schoolId)
            ->get(['id', 'school_id', 'grade_level'])
            ->each(function (Student $student) use ($schoolId, $academicYear, &$total) {
                $total += $this->currentBalance($schoolId, $student, $academicYear)['balanceDue'];
            });

        return round($total, 2);
    }

    public function resolveStatus(float $paymentAmount, float $balanceBefore, string $requestedStatus): string
    {
        if (in_array($requestedStatus, ['waived', 'overdue'], true)) {
            return $requestedStatus;
        }

        if ($paymentAmount <= 0) {
            return $requestedStatus;
        }

        if ($balanceBefore <= 0) {
            return 'paid';
        }

        return $paymentAmount >= $balanceBefore ? 'paid' : 'partial';
    }

    public function paymentCreditAmount(float $amount, string $status): float
    {
        if (! in_array($status, ['paid', 'partial', 'waived'], true)) {
            return 0.0;
        }

        return round(max(0, $amount), 2);
    }

    public function totalPaid(int $schoolId, int $studentId, string $academicYear, ?int $excludePaymentId = null): float
    {
        return round((float) FeePayment::forSchool($schoolId)
            ->where('student_id', $studentId)
            ->where('academic_year', $academicYear)
            ->when($excludePaymentId, fn ($query) => $query->where('id', '!=', $excludePaymentId))
            ->whereIn('status', ['paid', 'partial', 'waived'])
            ->sum('amount'), 2);
    }

    public function balanceDue(float $feesDue, float $totalPaid): float
    {
        return round(max(0, $feesDue - $totalPaid), 2);
    }

    private function resolveFeeStructure(
        int $schoolId,
        Student $student,
        string $academicYear,
        ?int $feeStructureId = null,
    ): ?FeeStructure {
        if ($feeStructureId) {
            return FeeStructure::forSchool($schoolId)
                ->where('academic_year', $academicYear)
                ->find($feeStructureId);
        }

        if ($student->grade_level) {
            $match = FeeStructure::forSchool($schoolId)
                ->where('academic_year', $academicYear)
                ->where('grade_level', $student->grade_level)
                ->orderByDesc('created_at')
                ->first();

            if ($match) {
                return $match;
            }
        }

        return FeeStructure::forSchool($schoolId)
            ->where('academic_year', $academicYear)
            ->where(function ($query) {
                $query->whereNull('grade_level')->orWhere('grade_level', '');
            })
            ->orderByDesc('created_at')
            ->first();
    }

    private function structureTotalDue(?FeeStructure $structure): float
    {
        if (! $structure) {
            return 0.0;
        }

        $items = collect($structure->items ?? []);
        $requiredTotal = $items
            ->filter(fn ($item) => empty($item['isOptional']))
            ->sum(fn ($item) => (float) ($item['amount'] ?? 0));

        if ($requiredTotal > 0) {
            return round($requiredTotal, 2);
        }

        return round((float) $structure->total_amount, 2);
    }
}
