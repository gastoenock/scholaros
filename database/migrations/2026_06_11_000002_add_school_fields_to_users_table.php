<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->nullable()->index()->after('password');
            $table->foreignId('school_id')->nullable()->after('role')->constrained('schools')->nullOnDelete();
            $table->string('avatar')->nullable()->after('school_id');
            $table->string('phone')->nullable()->after('avatar');
            $table->boolean('is_active')->default(true)->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('school_id');
            $table->dropColumn(['role', 'avatar', 'phone', 'is_active']);
        });
    }
};
