<?php

namespace App\Services;

use App\Models\ChartOfAccount;
use App\Models\Expense;
use App\Models\FeePayment;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use App\Models\PettyCashFund;
use App\Models\PettyCashTransaction;
use Illuminate\Support\Collection;

class AccountingService
{
    /** @var array<int, array{code: string, name: string, type: string, balance: string, ifrs: string}> */
    private const DEFAULT_ACCOUNTS = [
        ['code' => '1000', 'name' => 'Cash and Cash Equivalents', 'type' => 'asset', 'balance' => 'debit', 'ifrs' => 'IAS 7'],
        ['code' => '1010', 'name' => 'Petty Cash', 'type' => 'asset', 'balance' => 'debit', 'ifrs' => 'IAS 7'],
        ['code' => '1100', 'name' => 'Accounts Receivable — Fees', 'type' => 'asset', 'balance' => 'debit', 'ifrs' => 'IFRS 9'],
        ['code' => '1500', 'name' => 'Property, Plant & Equipment', 'type' => 'asset', 'balance' => 'debit', 'ifrs' => 'IAS 16'],
        ['code' => '2000', 'name' => 'Accounts Payable', 'type' => 'liability', 'balance' => 'credit', 'ifrs' => 'IAS 1'],
        ['code' => '2100', 'name' => 'Accrued Expenses', 'type' => 'liability', 'balance' => 'credit', 'ifrs' => 'IAS 1'],
        ['code' => '3000', 'name' => 'Retained Earnings', 'type' => 'equity', 'balance' => 'credit', 'ifrs' => 'IAS 1'],
        ['code' => '3100', 'name' => 'Current Year Surplus', 'type' => 'equity', 'balance' => 'credit', 'ifrs' => 'IAS 1'],
        ['code' => '4000', 'name' => 'Tuition & Fee Revenue', 'type' => 'income', 'balance' => 'credit', 'ifrs' => 'IFRS 15'],
        ['code' => '4100', 'name' => 'Other Operating Income', 'type' => 'income', 'balance' => 'credit', 'ifrs' => 'IFRS 15'],
        ['code' => '5000', 'name' => 'Salaries & Wages', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 19'],
        ['code' => '5100', 'name' => 'Utilities', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
        ['code' => '5200', 'name' => 'Supplies & Materials', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 2'],
        ['code' => '5300', 'name' => 'Maintenance & Repairs', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
        ['code' => '5400', 'name' => 'IT & Technology', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 38'],
        ['code' => '5500', 'name' => 'Food & Cafeteria', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
        ['code' => '5600', 'name' => 'Transport', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
        ['code' => '5700', 'name' => 'Events & Activities', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
        ['code' => '5900', 'name' => 'General & Administrative', 'type' => 'expense', 'balance' => 'debit', 'ifrs' => 'IAS 1'],
    ];

    /** @var array<string, string> */
    private const EXPENSE_CATEGORY_MAP = [
        'Utilities' => '5100',
        'Supplies' => '5200',
        'Maintenance' => '5300',
        'Salaries' => '5000',
        'IT & Technology' => '5400',
        'Food & Cafeteria' => '5500',
        'Transport' => '5600',
        'Events' => '5700',
        'Other' => '5900',
    ];

    public function ensureChartOfAccounts(int $schoolId): void
    {
        if (ChartOfAccount::forSchool($schoolId)->exists()) {
            return;
        }

        foreach (self::DEFAULT_ACCOUNTS as $account) {
            ChartOfAccount::create([
                'school_id' => $schoolId,
                'code' => $account['code'],
                'name' => $account['name'],
                'account_type' => $account['type'],
                'normal_balance' => $account['balance'],
                'ifrs_category' => $account['ifrs'],
                'is_active' => true,
            ]);
        }
    }

    public function ensurePettyCashFund(int $schoolId, ?int $custodianId = null): PettyCashFund
    {
        $fund = PettyCashFund::forSchool($schoolId)->first();

        if ($fund) {
            return $fund;
        }

        return PettyCashFund::create([
            'school_id' => $schoolId,
            'name' => 'Main Petty Cash',
            'custodian_id' => $custodianId,
            'float_amount' => 5000,
            'current_balance' => 5000,
        ]);
    }

    public function postFeePayment(FeePayment $payment): void
    {
        if ($payment->status !== 'paid') {
            return;
        }

        $this->ensureChartOfAccounts($payment->school_id);

        if (JournalEntry::forSchool($payment->school_id)
            ->where('reference_type', 'fee_payment')
            ->where('reference_id', $payment->id)
            ->exists()) {
            return;
        }

        $cash = $this->accountByCode($payment->school_id, '1000');
        $revenue = $this->accountByCode($payment->school_id, '4000');

        $this->createEntry(
            $payment->school_id,
            $payment->payment_date,
            "Fee payment {$payment->receipt_number} — {$payment->paid_for}",
            'fee_payment',
            $payment->id,
            [
                ['account_id' => $cash->id, 'debit' => $payment->amount, 'credit' => 0, 'line_description' => 'Cash received'],
                ['account_id' => $revenue->id, 'debit' => 0, 'credit' => $payment->amount, 'line_description' => 'Tuition revenue'],
            ],
        );
    }

    public function postExpense(Expense $expense): void
    {
        if ($expense->status !== 'approved') {
            return;
        }

        $this->ensureChartOfAccounts($expense->school_id);

        if (JournalEntry::forSchool($expense->school_id)
            ->where('reference_type', 'expense')
            ->where('reference_id', $expense->id)
            ->exists()) {
            return;
        }

        $expenseCode = self::EXPENSE_CATEGORY_MAP[$expense->category] ?? '5900';
        $expenseAccount = $this->accountByCode($expense->school_id, $expenseCode);
        $creditCode = ($expense->payment_method ?? 'cash') === 'petty_cash' ? '1010' : '1000';
        $creditAccount = $this->accountByCode($expense->school_id, $creditCode);

        $this->createEntry(
            $expense->school_id,
            $expense->date,
            "Expense — {$expense->description}",
            'expense',
            $expense->id,
            [
                ['account_id' => $expenseAccount->id, 'debit' => $expense->amount, 'credit' => 0, 'line_description' => $expense->category],
                ['account_id' => $creditAccount->id, 'debit' => 0, 'credit' => $expense->amount, 'line_description' => 'Payment'],
            ],
        );

        if (($expense->payment_method ?? 'cash') === 'petty_cash') {
            $fund = $this->ensurePettyCashFund($expense->school_id);
            $count = PettyCashTransaction::forSchool($expense->school_id)->count();

            PettyCashTransaction::create([
                'school_id' => $expense->school_id,
                'petty_cash_fund_id' => $fund->id,
                'expense_id' => $expense->id,
                'transaction_date' => $expense->date,
                'voucher_number' => sprintf('PCV-%04d', $count + 1),
                'description' => $expense->description,
                'amount' => $expense->amount,
                'transaction_type' => 'disbursement',
                'recorded_by' => auth()->id(),
            ]);

            $fund->update([
                'current_balance' => max(0, (float) $fund->current_balance - (float) $expense->amount),
            ]);
        }
    }

    /**
     * @return array{openingBalance: float, entries: array<int, array<string, mixed>>, closingBalance: float}
     */
    public function cashBook(int $schoolId, ?string $from = null, ?string $to = null): array
    {
        $this->ensureChartOfAccounts($schoolId);
        $cashAccount = $this->accountByCode($schoolId, '1000');
        $lines = $this->postedLinesForAccount($cashAccount->id, $from, $to);

        $running = 0.0;
        $entries = [];

        foreach ($lines as $line) {
            $running += (float) $line->debit - (float) $line->credit;
            $entries[] = [
                'date' => $line->journalEntry->entry_date,
                'entryNumber' => $line->journalEntry->entry_number,
                'description' => $line->line_description ?? $line->journalEntry->description,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'balance' => round($running, 2),
            ];
        }

        return [
            'openingBalance' => 0,
            'entries' => $entries,
            'closingBalance' => round($running, 2),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function pettyCashBook(int $schoolId): array
    {
        $fund = $this->ensurePettyCashFund($schoolId);

        return PettyCashTransaction::forSchool($schoolId)
            ->where('petty_cash_fund_id', $fund->id)
            ->orderBy('transaction_date')
            ->get()
            ->map(fn (PettyCashTransaction $t) => [
                'date' => $t->transaction_date,
                'voucherNumber' => $t->voucher_number,
                'description' => $t->description,
                'type' => $t->transaction_type,
                'amount' => (float) $t->amount,
            ])
            ->all();
    }

    /**
     * @return array{accounts: array<int, array<string, mixed>>, totalDebits: float, totalCredits: float, isBalanced: bool}
     */
    public function trialBalance(int $schoolId, ?string $asOf = null): array
    {
        $this->ensureChartOfAccounts($schoolId);
        $accounts = ChartOfAccount::forSchool($schoolId)->where('is_active', true)->orderBy('code')->get();
        $rows = [];
        $totalDebits = 0.0;
        $totalCredits = 0.0;

        foreach ($accounts as $account) {
            $balance = $this->accountBalance($account, $asOf);
            if (abs($balance) < 0.005) {
                continue;
            }

            $debit = $balance > 0 && $account->normal_balance === 'debit' ? $balance
                : ($balance < 0 && $account->normal_balance === 'credit' ? abs($balance) : 0);
            $credit = $balance > 0 && $account->normal_balance === 'credit' ? $balance
                : ($balance < 0 && $account->normal_balance === 'debit' ? abs($balance) : 0);

            if ($debit === 0.0 && $credit === 0.0) {
                if ($account->normal_balance === 'debit' && $balance > 0) {
                    $debit = $balance;
                } elseif ($account->normal_balance === 'credit' && $balance > 0) {
                    $credit = $balance;
                }
            }

            $totalDebits += $debit;
            $totalCredits += $credit;

            $rows[] = [
                'code' => $account->code,
                'name' => $account->name,
                'accountType' => $account->account_type,
                'ifrsCategory' => $account->ifrs_category,
                'debit' => round($debit, 2),
                'credit' => round($credit, 2),
            ];
        }

        return [
            'accounts' => $rows,
            'totalDebits' => round($totalDebits, 2),
            'totalCredits' => round($totalCredits, 2),
            'isBalanced' => abs($totalDebits - $totalCredits) < 0.01,
        ];
    }

    /**
     * @return array{assets: array<int, array<string, mixed>>, liabilities: array<int, array<string, mixed>>, equity: array<int, array<string, mixed>>, totalAssets: float, totalLiabilities: float, totalEquity: float}
     */
    public function balanceSheet(int $schoolId, ?string $asOf = null): array
    {
        $this->ensureChartOfAccounts($schoolId);
        $accounts = ChartOfAccount::forSchool($schoolId)->where('is_active', true)->orderBy('code')->get();

        $assets = [];
        $liabilities = [];
        $equity = [];
        $totalAssets = 0.0;
        $totalLiabilities = 0.0;
        $totalEquity = 0.0;

        foreach ($accounts as $account) {
            $balance = abs($this->accountBalance($account, $asOf));
            if ($balance < 0.005) {
                continue;
            }

            $row = [
                'code' => $account->code,
                'name' => $account->name,
                'amount' => round($balance, 2),
                'ifrsCategory' => $account->ifrs_category,
            ];

            match ($account->account_type) {
                'asset' => (function () use (&$assets, &$totalAssets, $row, $balance) {
                    $assets[] = $row;
                    $totalAssets += $balance;
                })(),
                'liability' => (function () use (&$liabilities, &$totalLiabilities, $row, $balance) {
                    $liabilities[] = $row;
                    $totalLiabilities += $balance;
                })(),
                'equity' => (function () use (&$equity, &$totalEquity, $row, $balance) {
                    $equity[] = $row;
                    $totalEquity += $balance;
                })(),
                default => null,
            };
        }

        $netIncome = $this->netIncome($schoolId, $asOf);
        if (abs($netIncome) >= 0.005) {
            $equity[] = [
                'code' => '3900',
                'name' => 'Current Period Net Surplus',
                'amount' => round($netIncome, 2),
                'ifrsCategory' => 'IAS 1',
            ];
            $totalEquity += $netIncome;
        }

        return [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'totalAssets' => round($totalAssets, 2),
            'totalLiabilities' => round($totalLiabilities, 2),
            'totalEquity' => round($totalEquity, 2),
        ];
    }

    private function netIncome(int $schoolId, ?string $asOf): float
    {
        $income = 0.0;
        $expenses = 0.0;

        ChartOfAccount::forSchool($schoolId)->whereIn('account_type', ['income', 'expense'])->each(function (ChartOfAccount $account) use ($asOf, &$income, &$expenses) {
            $balance = $this->accountBalance($account, $asOf);
            if ($account->account_type === 'income') {
                $income += $balance;
            } else {
                $expenses += $balance;
            }
        });

        return $income - $expenses;
    }

    private function accountBalance(ChartOfAccount $account, ?string $asOf): float
    {
        $query = JournalEntryLine::query()
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($account, $asOf) {
                $q->where('school_id', $account->school_id)->where('status', 'posted');
                if ($asOf) {
                    $q->where('entry_date', '<=', $asOf);
                }
            });

        $debits = (float) $query->sum('debit');
        $credits = (float) JournalEntryLine::query()
            ->where('account_id', $account->id)
            ->whereHas('journalEntry', function ($q) use ($account, $asOf) {
                $q->where('school_id', $account->school_id)->where('status', 'posted');
                if ($asOf) {
                    $q->where('entry_date', '<=', $asOf);
                }
            })
            ->sum('credit');

        return $account->normal_balance === 'debit'
            ? $debits - $credits
            : $credits - $debits;
    }

    /**
     * @return Collection<int, JournalEntryLine>
     */
    private function postedLinesForAccount(int $accountId, ?string $from, ?string $to): Collection
    {
        return JournalEntryLine::query()
            ->with('journalEntry')
            ->where('account_id', $accountId)
            ->whereHas('journalEntry', function ($q) use ($from, $to) {
                $q->where('status', 'posted');
                if ($from) {
                    $q->where('entry_date', '>=', $from);
                }
                if ($to) {
                    $q->where('entry_date', '<=', $to);
                }
            })
            ->get()
            ->sortBy(fn (JournalEntryLine $line) => $line->journalEntry->entry_date)
            ->values();
    }

    private function accountByCode(int $schoolId, string $code): ChartOfAccount
    {
        return ChartOfAccount::forSchool($schoolId)->where('code', $code)->firstOrFail();
    }

    /**
     * @param  array<int, array{account_id: int, debit: float|int, credit: float|int, line_description?: string}>  $lines
     */
    private function createEntry(
        int $schoolId,
        string $date,
        string $description,
        string $referenceType,
        int $referenceId,
        array $lines,
    ): JournalEntry {
        $count = JournalEntry::forSchool($schoolId)->count();

        $entry = JournalEntry::create([
            'school_id' => $schoolId,
            'entry_number' => sprintf('JE-%s-%04d', now()->format('Y'), $count + 1),
            'entry_date' => $date,
            'description' => $description,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'status' => 'posted',
            'created_by' => auth()->id(),
        ]);

        foreach ($lines as $line) {
            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                ...$line,
            ]);
        }

        return $entry;
    }
}
