<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            if (! Schema::hasColumn('fee_payments', 'fees_due')) {
                $table->decimal('fees_due', 12, 2)->nullable()->after('amount');
            }
            if (! Schema::hasColumn('fee_payments', 'paid_total_before')) {
                $table->decimal('paid_total_before', 12, 2)->nullable()->after('fees_due');
            }
            if (! Schema::hasColumn('fee_payments', 'paid_total_after')) {
                $table->decimal('paid_total_after', 12, 2)->nullable()->after('paid_total_before');
            }
            if (! Schema::hasColumn('fee_payments', 'balance_before')) {
                $table->decimal('balance_before', 12, 2)->nullable()->after('paid_total_after');
            }
            if (! Schema::hasColumn('fee_payments', 'balance_after')) {
                $table->decimal('balance_after', 12, 2)->nullable()->after('balance_before');
            }
        });
    }

    public function down(): void
    {
        Schema::table('fee_payments', function (Blueprint $table) {
            foreach (['balance_after', 'balance_before', 'paid_total_after', 'paid_total_before', 'fees_due'] as $column) {
                if (Schema::hasColumn('fee_payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
