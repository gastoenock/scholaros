<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('call_sessions', function (Blueprint $table) {
            if (! Schema::hasColumn('call_sessions', 'daily_room_name')) {
                $table->string('daily_room_name')->nullable()->after('room_code');
            }
            if (! Schema::hasColumn('call_sessions', 'daily_room_url')) {
                $table->string('daily_room_url')->nullable()->after('daily_room_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('call_sessions', function (Blueprint $table) {
            if (Schema::hasColumn('call_sessions', 'daily_room_url')) {
                $table->dropColumn('daily_room_url');
            }
            if (Schema::hasColumn('call_sessions', 'daily_room_name')) {
                $table->dropColumn('daily_room_name');
            }
        });
    }
};
