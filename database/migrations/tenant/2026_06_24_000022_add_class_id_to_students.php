<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('class_id')->nullable()->after('school_branch_id')->constrained('classes')->nullOnDelete();
        });

        $classes = DB::table('classes')->select('id', 'school_id', 'school_branch_id', 'grade_level', 'section')->get();

        foreach ($classes as $class) {
            $query = DB::table('students')
                ->where('school_id', $class->school_id)
                ->where('grade_level', $class->grade_level);

            if ($class->school_branch_id) {
                $query->where('school_branch_id', $class->school_branch_id);
            }

            if ($class->section) {
                $query->where('class_section', $class->section);
            }

            $query->update(['class_id' => $class->id]);
        }
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropConstrainedForeignId('class_id');
        });
    }
};
