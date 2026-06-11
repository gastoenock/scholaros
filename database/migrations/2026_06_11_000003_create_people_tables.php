<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('branch_id')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('date_of_birth')->nullable();
            $table->string('nationality')->nullable();
            $table->string('photo')->nullable();
            $table->string('gender')->nullable();
            $table->string('staff_id')->index();
            $table->string('department')->nullable();
            $table->string('designation')->nullable();
            $table->string('qualification')->nullable();
            $table->string('role')->index();
            $table->string('join_date')->nullable();
            $table->json('subjects')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->json('emergency_contact')->nullable();
            $table->decimal('salary', 12, 2)->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('branch_id')->nullable();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('date_of_birth')->nullable();
            $table->string('nationality')->nullable();
            $table->string('religion')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('photo')->nullable();
            $table->string('gender')->nullable();
            $table->string('student_id')->index();
            $table->string('grade_level')->nullable();
            $table->string('class_section')->nullable();
            $table->string('enrollment_date')->nullable();
            $table->string('academic_year')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->json('guardians')->nullable();
            $table->string('status')->default('active');
            $table->text('medical_notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'grade_level']);
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('branch_id')->nullable();
            $table->string('name');
            $table->string('grade_level');
            $table->string('section')->nullable();
            $table->string('room')->nullable();
            $table->foreignId('class_teacher_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('academic_year');
            $table->unsignedInteger('capacity')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'grade_level']);
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->nullable();
            $table->string('grade_level')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('teacher_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('students');
        Schema::dropIfExists('staff');
    }
};
