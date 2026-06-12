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
            $table->foreignId('parent_id')->nullable()->constrained('users')->nullOnDelete();
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
            $table->softDeletes();
        });

        Schema::create('meeting_staff', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['meeting_id', 'staff_id']);
        });

        Schema::create('meeting_student', function (Blueprint $table) {
            $table->id();
            $table->foreignId('meeting_id')->constrained('meetings')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['meeting_id', 'student_id']);
        });

        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('school_branch_id')->nullable()->constrained('school_branches')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('start_at');
            $table->string('end_at')->nullable();
            $table->string('location')->nullable();
            $table->string('event_type')->default('general');
            $table->string('status')->default('scheduled');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'start_at']);
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
            $table->softDeletes();

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
            $table->softDeletes();
        });

        Schema::create('call_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
            $table->foreignId('initiator_id')->constrained('users')->cascadeOnDelete();
            $table->string('call_type');
            $table->string('room_code')->unique();
            $table->string('title')->nullable();
            $table->string('status')->default('ringing');
            $table->string('started_at')->nullable();
            $table->string('ended_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'status']);
        });

        Schema::create('call_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_session_id')->constrained('call_sessions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status')->default('invited');
            $table->string('joined_at')->nullable();
            $table->string('left_at')->nullable();
            $table->timestamps();

            $table->unique(['call_session_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_participants');
        Schema::dropIfExists('call_sessions');
        Schema::dropIfExists('parent_student_links');
        Schema::dropIfExists('assets');
        Schema::dropIfExists('events');
        Schema::dropIfExists('meeting_student');
        Schema::dropIfExists('meeting_staff');
        Schema::dropIfExists('meetings');
    }
};
