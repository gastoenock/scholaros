<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('teacher_id')->constrained('staff')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('scheduled_at');
            $table->unsignedInteger('duration_minutes')->default(30);
            $table->string('status')->default('requested');
            $table->string('meeting_type')->default('in_person');
            $table->string('location')->nullable();
            $table->string('meeting_link')->nullable();
            $table->text('notes')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->string('name');
            $table->string('category');
            $table->string('asset_tag');
            $table->text('description')->nullable();
            $table->string('location')->nullable();
            $table->string('vendor')->nullable();
            $table->string('purchase_date')->nullable();
            $table->string('warranty_expiry')->nullable();
            $table->decimal('purchase_cost', 12, 2)->nullable();
            $table->decimal('current_value', 12, 2)->nullable();
            $table->string('assigned_to')->nullable();
            $table->string('condition')->default('good');
            $table->unsignedInteger('quantity')->default(1);
            $table->string('status')->default('in_use');
            $table->timestamps();

            $table->index(['school_id', 'category']);
        });

        Schema::create('parent_student_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('parent_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('relationship');
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parent_student_links');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('meetings');
    }
};
