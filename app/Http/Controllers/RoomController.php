<?php

namespace App\Http\Controllers;

use App\Models\ClassRoom;
use App\Models\DormRoom;
use App\Models\SchoolBranch;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoomController extends Controller
{
    public function index(): Response
    {
        $schoolId = $this->schoolId();

        $classRooms = $schoolId
            ? ClassRoom::forSchool($schoolId)
                ->with(['classes:id,uuid,name,grade_level,section,class_room_id'])
                ->withCount('classes')
                ->orderBy('building')
                ->orderBy('name')
                ->get()
            : collect();

        $hostelRooms = $schoolId
            ? DormRoom::forSchool($schoolId)->orderBy('dorm_block')->orderBy('room_number')->get()
            : collect();

        $branches = $schoolId
            ? SchoolBranch::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name', 'code'])
            : collect();

        $schoolClasses = $schoolId
            ? SchoolClass::forSchool($schoolId)->orderBy('name')->get(['id', 'uuid', 'name', 'grade_level', 'section', 'class_room_id'])
            : collect();

        return Inertia::render('dashboard/rooms/page', [
            'classRooms' => $classRooms,
            'hostelRooms' => $hostelRooms,
            'branches' => $branches,
            'schoolClasses' => $schoolClasses,
        ]);
    }

    public function storeClassRoom(Request $request): RedirectResponse
    {
        $schoolId = $this->requireTenancy();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'in:available,maintenance,occupied'],
            'notes' => ['nullable', 'string'],
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
        ]);

        ClassRoom::create([
            ...$this->snakeKeys($validated),
            'school_id' => $schoolId,
            'status' => $validated['status'] ?? 'available',
        ]);

        return back()->with('success', 'Classroom created');
    }

    public function updateClassRoom(Request $request, ClassRoom $classRoom): RedirectResponse
    {
        abort_unless($classRoom->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:255'],
            'floor' => ['nullable', 'integer'],
            'capacity' => ['nullable', 'integer', 'min:1'],
            'status' => ['sometimes', 'required', 'in:available,maintenance,occupied'],
            'notes' => ['nullable', 'string'],
            'schoolBranchId' => ['nullable', 'integer', 'exists:school_branches,id'],
        ]);

        $classRoom->update($this->snakeKeys($validated));

        if (array_key_exists('name', $validated) || array_key_exists('building', $validated)) {
            $classRoom->classes()->update(['room' => $classRoom->display_name]);
        }

        return back()->with('success', 'Classroom updated');
    }

    public function destroyClassRoom(ClassRoom $classRoom): RedirectResponse
    {
        abort_unless($classRoom->school_id === $this->schoolId(), 403);

        if ($classRoom->classes()->exists()) {
            return back()->withErrors(['classRoom' => 'Cannot delete a classroom assigned to a class. Reassign classes first.']);
        }

        $classRoom->delete();

        return back()->with('success', 'Classroom deleted');
    }

    public function assignClass(Request $request, ClassRoom $classRoom): RedirectResponse
    {
        abort_unless($classRoom->school_id === $this->schoolId(), 403);

        $validated = $request->validate([
            'classId' => ['nullable', 'integer', 'exists:classes,id'],
        ]);

        $classRoom->classes()->update(['class_room_id' => null, 'room' => null]);

        if (! empty($validated['classId'])) {
            $class = SchoolClass::findOrFail($validated['classId']);
            abort_unless($class->school_id === $classRoom->school_id, 403);

            $class->update([
                'class_room_id' => $classRoom->id,
                'room' => $classRoom->display_name,
            ]);
        }

        return back()->with('success', 'Class assignment updated');
    }
}
