<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_rooms', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->foreignId('school_branch_id')->nullable()->constrained('school_branches')->nullOnDelete();
            $table->string('name');
            $table->string('building')->nullable();
            $table->unsignedInteger('floor')->nullable();
            $table->unsignedInteger('capacity')->nullable();
            $table->string('status')->default('available');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['school_id', 'name', 'building']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('class_room_id')->nullable()->after('section')->constrained('class_rooms')->nullOnDelete();
        });

        $pairs = DB::table('classes')
            ->whereNotNull('room')
            ->where('room', '!=', '')
            ->select('school_id', 'school_branch_id', 'room')
            ->distinct()
            ->get();

        foreach ($pairs as $pair) {
            $classRoomId = DB::table('class_rooms')->insertGetId([
                'school_id' => $pair->school_id,
                'school_branch_id' => $pair->school_branch_id,
                'name' => $pair->room,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('classes')
                ->where('school_id', $pair->school_id)
                ->where('room', $pair->room)
                ->update(['class_room_id' => $classRoomId]);
        }
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropConstrainedForeignId('class_room_id');
        });

        Schema::dropIfExists('class_rooms');
    }
};
