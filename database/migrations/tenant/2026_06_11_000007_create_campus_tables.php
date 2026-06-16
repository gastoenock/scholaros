<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bus_routes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('route_name');
            $table->string('route_number');
            $table->json('stops');
            $table->string('morning_start_time')->nullable();
            $table->string('afternoon_start_time')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('buses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('bus_number');
            $table->string('plate_number');
            $table->unsignedInteger('capacity');
            $table->foreignId('route_id')->nullable()->constrained('bus_routes')->nullOnDelete();
            $table->string('driver_name');
            $table->string('driver_phone');
            $table->string('driver_license')->nullable();
            $table->string('matron_name')->nullable();
            $table->string('matron_phone')->nullable();
            $table->double('current_lat')->nullable();
            $table->double('current_lng')->nullable();
            $table->string('last_location_update')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('transport_assignments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('bus_id')->constrained('buses')->cascadeOnDelete();
            $table->foreignId('route_id')->constrained('bus_routes')->cascadeOnDelete();
            $table->string('pickup_stop');
            $table->string('drop_stop');
            $table->string('academic_year');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('dorm_rooms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('room_number');
            $table->string('dorm_block')->nullable();
            $table->unsignedInteger('floor')->nullable();
            $table->unsignedInteger('capacity');
            $table->unsignedInteger('occupied_count')->default(0);
            $table->string('type')->default('dormitory');
            $table->string('gender')->default('mixed');
            $table->json('amenities')->nullable();
            $table->string('status')->default('available');
            $table->decimal('monthly_fee', 12, 2)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'status']);
        });

        Schema::create('dorm_allocations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('room_id')->constrained('dorm_rooms')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('academic_year');
            $table->string('check_in_date');
            $table->string('check_out_date')->nullable();
            $table->string('bed_number')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('location');
            $table->string('location_type');
            $table->string('title');
            $table->text('description');
            $table->string('priority')->default('medium');
            $table->unsignedBigInteger('reported_by')->nullable()->index();
            $table->string('assigned_to')->nullable();
            $table->string('status')->default('open');
            $table->string('resolved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'status']);
        });

        Schema::create('security_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('person_name');
            $table->string('person_type');
            $table->string('purpose')->nullable();
            $table->string('check_in_time');
            $table->string('check_out_time')->nullable();
            $table->string('host_name')->nullable();
            $table->string('id_type')->nullable();
            $table->string('id_number')->nullable();
            $table->unsignedBigInteger('logged_by')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['school_id', 'check_in_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_logs');
        Schema::dropIfExists('maintenance_requests');
        Schema::dropIfExists('dorm_allocations');
        Schema::dropIfExists('dorm_rooms');
        Schema::dropIfExists('transport_assignments');
        Schema::dropIfExists('buses');
        Schema::dropIfExists('bus_routes');
    }
};
