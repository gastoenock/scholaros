<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('vendors')) {
            Schema::create('vendors', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id')->index();
                $table->string('name');
                $table->string('contact_person')->nullable();
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('address')->nullable();
                $table->string('category')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'name']);
            });
        }

        if (! Schema::hasColumn('assets', 'vendor_id')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->foreignId('vendor_id')->nullable()->after('location')->constrained('vendors')->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('assets', 'assigned_staff_id')) {
            Schema::table('assets', function (Blueprint $table) {
                $table->foreignId('assigned_staff_id')->nullable()->after('current_value')->constrained('staff')->nullOnDelete();
            });
        }

        $legacyColumns = array_filter([
            Schema::hasColumn('assets', 'vendor') ? 'vendor' : null,
            Schema::hasColumn('assets', 'assigned_to') ? 'assigned_to' : null,
        ]);

        if ($legacyColumns !== []) {
            Schema::table('assets', function (Blueprint $table) use ($legacyColumns) {
                $table->dropColumn($legacyColumns);
            });
        }
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->string('vendor')->nullable();
            $table->string('assigned_to')->nullable();
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropConstrainedForeignId('vendor_id');
            $table->dropConstrainedForeignId('assigned_staff_id');
        });

        Schema::dropIfExists('vendors');
    }
};
