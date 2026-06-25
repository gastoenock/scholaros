<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_subject', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['class_id', 'subject_id']);
        });

        Schema::create('student_report_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('academic_semester_id')->nullable()->constrained('academic_semesters')->nullOnDelete();
            $table->foreignId('academic_term_id')->nullable()->constrained('academic_terms')->nullOnDelete();
            $table->foreignId('class_teacher_id')->nullable()->constrained('staff')->nullOnDelete();
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(
                ['student_id', 'academic_year_id', 'academic_semester_id', 'academic_term_id'],
                'student_report_comment_period',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_report_comments');
        Schema::dropIfExists('class_subject');
    }
};
