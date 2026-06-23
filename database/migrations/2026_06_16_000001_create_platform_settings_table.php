<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('central')->create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->string('group')->default('general')->index();
            $table->timestamps();
        });

        Schema::connection('central')->table('platform_users', function (Blueprint $table) {
            $table->json('preferences')->nullable()->after('phone');
        });
    }

    public function down(): void
    {
        Schema::connection('central')->table('platform_users', function (Blueprint $table) {
            $table->dropColumn('preferences');
        });

        Schema::connection('central')->dropIfExists('platform_settings');
    }
};
