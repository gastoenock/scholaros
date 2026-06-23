<?php

namespace App\Http\Controllers;

use App\Models\AcademicSemester;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Services\AcademicCalendarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicCalendarController extends Controller
{
    public function __construct(
        private AcademicCalendarService $calendar,
    ) {}

    public function index(): Response
    {
        $schoolId = $this->requireTenancy();

        return Inertia::render('dashboard/academic-calendar/page', [
            'calendar' => $this->calendar->managementPayload($schoolId),
        ]);
    }

    public function storeYear(Request $request): RedirectResponse
    {
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
            'isCurrent' => ['boolean'],
        ]);

        $year = $this->calendar->createYearWithStructure(
            $schoolId,
            $validated['name'],
            (bool) ($validated['isCurrent'] ?? false),
        );

        if (! empty($validated['startDate']) || ! empty($validated['endDate'])) {
            $year->update([
                'start_date' => $validated['startDate'] ?? null,
                'end_date' => $validated['endDate'] ?? null,
            ]);
        }

        if ($validated['isCurrent'] ?? false) {
            $this->calendar->setCurrentYear($schoolId, $year);
        }

        return back()->with('success', 'Academic year created');
    }

    public function updateYear(Request $request, AcademicYear $year): RedirectResponse
    {
        abort_unless($year->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
        ]);

        $year->update($this->snakeKeys($validated));

        return back()->with('success', 'Academic year updated');
    }

    public function destroyYear(AcademicYear $year): RedirectResponse
    {
        abort_unless($year->school_id === $this->schoolId(), 403);

        $year->delete();

        return back()->with('success', 'Academic year removed');
    }

    public function setCurrentYear(AcademicYear $year): RedirectResponse
    {
        abort_unless($year->school_id === $this->schoolId(), 403);

        $this->calendar->setCurrentYear($this->requireTenancy(), $year);

        return back()->with('success', "{$year->name} set as current year");
    }

    public function storeSemester(Request $request, AcademicYear $year): RedirectResponse
    {
        abort_unless($year->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
        ]);

        AcademicSemester::create([
            ...$this->snakeKeys($validated),
            'school_id' => $year->school_id,
            'academic_year_id' => $year->id,
            'sort_order' => (int) $year->semesters()->max('sort_order') + 1,
        ]);

        return back()->with('success', 'Semester added');
    }

    public function updateSemester(Request $request, AcademicSemester $semester): RedirectResponse
    {
        abort_unless($semester->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
        ]);

        $semester->update($this->snakeKeys($validated));

        return back()->with('success', 'Semester updated');
    }

    public function destroySemester(AcademicSemester $semester): RedirectResponse
    {
        abort_unless($semester->school_id === $this->schoolId(), 403);

        $semester->delete();

        return back()->with('success', 'Semester removed');
    }

    public function setCurrentSemester(AcademicSemester $semester): RedirectResponse
    {
        abort_unless($semester->school_id === $this->schoolId(), 403);

        $this->calendar->setCurrentSemester($this->requireTenancy(), $semester);

        return back()->with('success', "{$semester->name} set as current semester");
    }

    public function storeTerm(Request $request, AcademicSemester $semester): RedirectResponse
    {
        abort_unless($semester->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
        ]);

        AcademicTerm::create([
            ...$this->snakeKeys($validated),
            'school_id' => $semester->school_id,
            'academic_year_id' => $semester->academic_year_id,
            'academic_semester_id' => $semester->id,
            'sort_order' => (int) $semester->terms()->max('sort_order') + 1,
        ]);

        return back()->with('success', 'Term added');
    }

    public function updateTerm(Request $request, AcademicTerm $term): RedirectResponse
    {
        abort_unless($term->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:50'],
            'startDate' => ['nullable', 'string'],
            'endDate' => ['nullable', 'string'],
        ]);

        $term->update($this->snakeKeys($validated));

        return back()->with('success', 'Term updated');
    }

    public function destroyTerm(AcademicTerm $term): RedirectResponse
    {
        abort_unless($term->school_id === $this->schoolId(), 403);

        $term->delete();

        return back()->with('success', 'Term removed');
    }

    public function setCurrentTerm(AcademicTerm $term): RedirectResponse
    {
        abort_unless($term->school_id === $this->schoolId(), 403);

        $this->calendar->setCurrentTerm($this->requireTenancy(), $term);

        return back()->with('success', "{$term->name} set as current term");
    }
}
