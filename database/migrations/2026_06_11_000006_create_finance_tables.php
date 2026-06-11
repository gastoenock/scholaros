<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('library_books', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('title');
            $table->string('author');
            $table->string('isbn')->nullable();
            $table->string('category')->nullable();
            $table->string('publisher')->nullable();
            $table->string('publish_year')->nullable();
            $table->string('shelf_location')->nullable();
            $table->string('cover_url')->nullable();
            $table->text('description')->nullable();
            $table->unsignedInteger('total_copies')->default(1);
            $table->unsignedInteger('available_copies')->default(1);
            $table->timestamps();
        });

        Schema::create('library_issuances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('book_id')->constrained('library_books')->cascadeOnDelete();
            $table->string('borrower_id');
            $table->string('borrower_type');
            $table->string('borrower_name');
            $table->string('issued_at');
            $table->string('due_date');
            $table->string('returned_at')->nullable();
            $table->string('status')->default('issued');
            $table->timestamps();
        });

        Schema::create('fee_structures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('grade_level')->nullable();
            $table->string('academic_year');
            $table->json('items');
            $table->decimal('total_amount', 12, 2);
            $table->timestamps();

            $table->index(['school_id', 'academic_year']);
        });

        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('fee_structure_id')->nullable()->constrained('fee_structures')->nullOnDelete();
            $table->string('receipt_number');
            $table->decimal('amount', 12, 2);
            $table->string('payment_date');
            $table->string('method')->default('cash');
            $table->string('paid_for');
            $table->string('academic_year');
            $table->string('term')->nullable();
            $table->string('status')->default('paid');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'academic_year']);
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('category');
            $table->text('description');
            $table->decimal('amount', 12, 2);
            $table->string('date');
            $table->string('vendor')->nullable();
            $table->string('receipt_url')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->index(['school_id', 'date']);
        });

        Schema::create('payroll_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('allowances', 12, 2)->default(0);
            $table->decimal('deductions', 12, 2)->default(0);
            $table->decimal('net_salary', 12, 2);
            $table->string('payment_date')->nullable();
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'year', 'month']);
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->string('type');
            $table->string('start_date');
            $table->string('end_date');
            $table->text('reason');
            $table->string('status')->default('pending')->index();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('payroll_records');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('fee_payments');
        Schema::dropIfExists('fee_structures');
        Schema::dropIfExists('library_issuances');
        Schema::dropIfExists('library_books');
    }
};
