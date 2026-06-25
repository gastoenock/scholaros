<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        foreach (DB::table('staff')->select('id')->cursor() as $row) {
            DB::table('staff')->where('id', $row->id)->update(['uuid' => (string) Str::uuid()]);
        }

        foreach (DB::table('classes')->select('id')->cursor() as $row) {
            DB::table('classes')->where('id', $row->id)->update(['uuid' => (string) Str::uuid()]);
        }
    }

    public function down(): void
    {
        Schema::table('staff', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropUnique(['uuid']);
            $table->dropColumn('uuid');
        });
    }
};
