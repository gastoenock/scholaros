<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timetable_slots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('day');
            $table->unsignedInteger('period');
            $table->string('subject');
            $table->foreignId('teacher_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->string('room')->nullable();
            $table->string('start_time');
            $table->string('end_time');
            $table->string('academic_year');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('date');
            $table->string('type');
            $table->string('person_id');
            $table->string('status');
            $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
            $table->unsignedBigInteger('marked_by')->nullable()->index();
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'date']);
            $table->index(['person_id', 'date']);
        });

        Schema::create('admissions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('school_branch_id')->nullable()->constrained('school_branches')->nullOnDelete();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('applying_for_grade');
            $table->string('academic_year');
            $table->string('previous_school')->nullable();
            $table->string('guardian_name');
            $table->string('guardian_email');
            $table->string('guardian_phone');
            $table->string('guardian_relationship');
            $table->json('documents')->nullable();
            $table->string('status')->default('submitted')->index();
            $table->string('application_id')->index();
            $table->text('review_notes')->nullable();
            $table->string('interview_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('title');
            $table->text('message');
            $table->string('type')->default('general');
            $table->boolean('is_read')->default(false);
            $table->string('related_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_read']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->unsignedBigInteger('sender_id')->index();
            $table->unsignedBigInteger('receiver_id')->index();
            $table->string('subject')->nullable();
            $table->text('body');
            $table->boolean('is_read')->default(false);
            $table->foreignId('parent_message_id')->nullable()->constrained('messages')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('admissions');
        Schema::dropIfExists('attendance_records');
        Schema::dropIfExists('timetable_slots');
    }
};
