<?php

namespace App\Http\Controllers;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Services\AcademicReportExportService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AcademicReportController extends Controller
{
    public function __construct(
        private AcademicReportExportService $exports,
    ) {}

    public function index(Request $request): Response
    {
        $schoolId = $this->requireTenancy();

        $classes = SchoolClass::forSchool($schoolId)->orderBy('name')->get(['id', 'name', 'grade_level', 'section']);
        $students = Student::forSchool($schoolId)->orderBy('last_name')->get(['id', 'first_name', 'last_name', 'student_id', 'grade_level', 'class_section']);
        $subjects = Subject::forSchool($schoolId)->orderBy('name')->get(['id', 'name', 'code']);

        $reportType = $request->string('type', 'student')->toString();
        $yearId = $request->integer('yearId') ?: null;
        $semesterId = $request->integer('semesterId') ?: null;
        $termId = $request->integer('termId') ?: null;

        $report = $request->boolean('generate')
            ? $this->exports->buildFromRequest($schoolId, $request)
            : null;

        return Inertia::render('dashboard/academics/reports/page', [
            'classes' => $classes,
            'students' => $students,
            'subjects' => $subjects,
            'report' => $report,
            'filters' => [
                'type' => $reportType,
                'yearId' => $yearId,
                'semesterId' => $semesterId,
                'termId' => $termId,
                'studentId' => $request->integer('studentId') ?: null,
                'classId' => $request->integer('classId') ?: null,
                'subjectId' => $request->integer('subjectId') ?: null,
                'examId' => $request->integer('examId') ?: null,
                'generate' => $request->boolean('generate'),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'format' => ['required', Rule::in(['pdf', 'xlsx', 'excel', 'docx', 'word'])],
            'type' => ['required', Rule::in(['student', 'class', 'subject', 'overall'])],
            'yearId' => ['nullable', 'integer'],
            'semesterId' => ['nullable', 'integer'],
            'termId' => ['nullable', 'integer'],
            'studentId' => ['nullable', 'integer', 'exists:students,id'],
            'classId' => ['nullable', 'integer', 'exists:classes,id'],
            'subjectId' => ['nullable', 'integer', 'exists:subjects,id'],
        ]);

        $report = $this->exports->buildFromRequest($schoolId, $request);

        abort_unless($report, 422, 'Could not build report. Check that all required filters are selected.');

        return $this->exports->download($report, $validated['format']);
    }
}
