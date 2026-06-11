<?php

namespace App\Http\Controllers;

use App\Models\Student;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $students = $schoolId
            ? Student::forSchool($schoolId)->get(['id', 'status', 'grade_level'])
            : collect();

        $studentStats = [
            'total' => $students->count(),
            'active' => $students->where('status', 'active')->count(),
            'byGrade' => $students->countBy(fn ($s) => $s->grade_level ?? 'Unassigned'),
        ];

        return Inertia::render('dashboard/analytics/page', [
            'studentStats' => $studentStats,
        ]);
    }
}
