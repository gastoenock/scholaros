<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id')->index();
            $table->string('key');
            $table->json('value')->nullable();
            $table->string('group')->default('general')->index();
            $table->timestamps();

            $table->unique(['school_id', 'key']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->json('preferences')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('preferences');
        });

        Schema::dropIfExists('settings');
    }
};
