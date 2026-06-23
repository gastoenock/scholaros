<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Services\AcademicCalendarService;
use App\Models\Bus;
use App\Models\BusRoute;
use App\Models\DormRoom;
use App\Models\Event;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Expense;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\LeaveRequest;
use App\Models\LibraryBook;
use App\Models\MaintenanceRequest;
use App\Models\Meeting;
use App\Models\Message;
use App\Models\PayrollRecord;
use App\Models\PlatformUser;
use App\Models\School;
use App\Models\SchoolBranch;
use App\Models\SchoolClass;
use App\Models\SecurityLog;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\TimetableSlot;
use App\Models\User;
use App\Services\AccountingService;
use App\Support\TenantDatabaseCleaner;
use Database\Seeders\Concerns\SeedsInventory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use SeedsInventory;

    public function run(): void
    {
        if (School::query()->exists()) {
            $this->command->warn('Database already seeded. Syncing tenant databases...');
            $this->syncTenants();

            return;
        }

        $dropped = TenantDatabaseCleaner::dropAll();
        if ($dropped > 0) {
            $this->command->warn("Dropped {$dropped} orphaned tenant database(s) left from a previous install.");
        }

        $academicYear = '2025-2026';

        $school = School::create([
            'name' => 'ABAMA International Schools',
            'slug' => 'abama-international',
            'address' => '15 Education Drive',
            'city' => 'Dar es Salaam',
            'state' => 'Tanzania',
            'zip' => '00233',
            'phone' => '+255 712 345 678',
            'email' => 'admin@abama.edu.tz',
            'website' => 'https://abama.edu.tz',
            'is_active' => true,
            'plan' => 'premium',
        ]);

        PlatformUser::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@scholaros.test',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        PlatformUser::create([
            'name' => 'Platform Landlord',
            'email' => 'landlord@scholaros.test',
            'password' => Hash::make('password'),
            'role' => 'landlord',
            'is_active' => true,
        ]);

        $school->run(function () use ($school, $academicYear) {
            $schoolId = (int) tenant('id');

            $calendar = app(AcademicCalendarService::class);
            $currentYear = $calendar->createYearWithStructure($schoolId, $academicYear, true);
            $nextYear = $calendar->createYearWithStructure($schoolId, '2026-2027', false);
            $semester1 = $currentYear->semesters->firstWhere('name', 'Semester 1');
            $semester2 = $currentYear->semesters->firstWhere('name', 'Semester 2');
            $term1 = $semester1?->terms->firstWhere('name', 'Term 1');
            $term2 = $semester1?->terms->firstWhere('name', 'Term 2');
            $term3 = $semester2?->terms->firstWhere('name', 'Term 3');

            $admin = User::create([
                'name' => 'Hassan Juma Mwinuka',
                'email' => 'admin@abama.edu.tz',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'school_id' => $schoolId,
                'is_active' => true,
            ]);

            $school->update(['admin_id' => $admin->id]);

            $staffUsers = [];
            foreach ([
                ['Amina Fatuma Kimaro', 'a.kimaro@abama.edu.tz', 'teacher'],
                ['Baraka Mwinyi Lyimo', 'b.lyimo@abama.edu.tz', 'teacher'],
                ['Fatuma Hamisi Moshi', 'f.moshi@abama.edu.tz', 'teacher'],
                ['Grace Juma Ngowi', 'g.ngowi@abama.edu.tz', 'teacher'],
                ['Neema Salum Rwiza', 'n.rwiza@abama.edu.tz', 'admin_staff'],
            ] as [$name, $email, $role]) {
                $staffUsers[] = User::create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('password'),
                    'role' => $role,
                    'school_id' => $schoolId,
                    'is_active' => true,
                ]);
            }

            $branchA = SchoolBranch::create([
                'school_id' => $schoolId,
                'code' => 'ABAMA_A',
                'name' => 'ABAMA Campus A',
                'address' => '15 Education Drive, East Legon',
                'phone' => '+233 302 111 333',
                'principal_name' => 'Dr. Juma Hassan Kimaro',
            ]);

            $branchB = SchoolBranch::create([
                'school_id' => $schoolId,
                'code' => 'ABAMA_B',
                'name' => 'ABAMA Campus B',
                'address' => '42 Academy Road, Masaki',
                'phone' => '+255 22 111 444',
                'principal_name' => 'Mrs. Amina Mwinyi Tarimo',
            ]);

            $branchIds = [
                'ABAMA_A' => $branchA->id,
                'ABAMA_B' => $branchB->id,
            ];

            // ─── Staff (30+) ─────────────────────────────────────────
            $staffIds = [];
            $staffSalaries = [];
            $staffProfiles = [
                ['principal', 'Administration', 'Principal', 12000],
                ['teacher', 'Mathematics', 'Head of Mathematics', 7500, ['Mathematics', 'Further Mathematics']],
                ['teacher', 'Science', 'Physics Teacher', 6800, ['Physics', 'General Science']],
                ['teacher', 'English', 'English Teacher', 6500, ['English Language', 'Literature']],
                ['teacher', 'ICT', 'ICT Coordinator', 7000, ['ICT', 'Computer Science']],
                ['admin_staff', 'Administration', 'Registrar', 5500, null],
                ['teacher', 'Social Studies', 'Social Studies Teacher', 6200, ['Social Studies', 'History']],
                ['teacher', 'Science', 'Chemistry Teacher', 6800, ['Chemistry', 'General Science']],
                ['teacher', 'Science', 'Biology Teacher', 6600, ['Biology', 'Health Science']],
                ['teacher', 'Mathematics', 'Mathematics Teacher', 7200, ['Mathematics', 'Statistics']],
                ['teacher', 'English', 'English Teacher', 6500, ['English Language', 'Creative Writing']],
                ['admin_staff', 'Administration', 'Secretary', 4800, null],
                ['support_staff', 'Maintenance', 'Facility Manager', 4200, null],
                ['teacher', 'Kiswahili', 'Kiswahili Teacher', 6100, ['Kiswahili']],
                ['teacher', 'Religious Studies', 'CRE Teacher', 6000, ['CRE']],
            ];

            foreach (['ABAMA_A' => 'A', 'ABAMA_B' => 'B'] as $branchCode => $prefix) {
                foreach ($staffProfiles as $index => $profile) {
                    [$role, $dept, $designation, $salary, $subjects] = array_pad($profile, 5, null);
                    $num = $index + 1;
                    $staffKey = "STF-{$prefix}".str_pad((string) $num, 3, '0', STR_PAD_LEFT);
                    $given = $this->randomTzGivenName();
                    $second = $this->randomTzSecondName();
                    $surname = $this->randomTzSurname();

                    $staff = Staff::create([
                        'school_id' => $schoolId,
                        'school_branch_id' => $branchIds[$branchCode],
                        'first_name' => "{$given} {$second}",
                        'last_name' => $surname,
                        'staff_id' => $staffKey,
                        'role' => $role,
                        'department' => $dept,
                        'designation' => $designation,
                        'email' => strtolower($prefix.$num.'.'.$surname).'@abama.edu.tz',
                        'phone' => sprintf('+255 7%02d %03d %03d', rand(10, 99), rand(100, 999), rand(100, 999)),
                        'salary' => $salary,
                        'gender' => rand(0, 1) ? 'male' : 'female',
                        'qualification' => 'Bachelor of Education',
                        'subjects' => $subjects,
                        'join_date' => sprintf('20%d-%02d-%02d', rand(17, 22), rand(1, 12), rand(1, 28)),
                        'status' => 'active',
                    ]);
                    $staffIds[$staffKey] = $staff->id;
                    $staffSalaries[$staffKey] = $salary;
                }
            }

            // ─── Classes ─────────────────────────────────────────────
            $classesData = [
                ['Grade 7A', 'Grade 7', 'A', 'ABAMA_A', 'Room A101', 35, 'STF-A004'],
                ['Grade 7B', 'Grade 7', 'B', 'ABAMA_A', 'Room A102', 35, 'STF-A007'],
                ['Grade 8A', 'Grade 8', 'A', 'ABAMA_A', 'Room A201', 35, 'STF-A002'],
                ['Grade 8B', 'Grade 8', 'B', 'ABAMA_A', 'Room A202', 35, 'STF-A003'],
                ['Grade 9A', 'Grade 9', 'A', 'ABAMA_A', 'Room A301', 30, 'STF-A005'],
                ['Grade 7A', 'Grade 7', 'A', 'ABAMA_B', 'Room B101', 30, 'STF-B004'],
                ['Grade 7B', 'Grade 7', 'B', 'ABAMA_B', 'Room B102', 30, 'STF-B003'],
                ['Grade 8A', 'Grade 8', 'A', 'ABAMA_B', 'Room B201', 30, 'STF-B002'],
                ['Grade 9A', 'Grade 9', 'A', 'ABAMA_B', 'Room B301', 30, 'STF-B005'],
                ['Grade 9B', 'Grade 9', 'B', 'ABAMA_B', 'Room B302', 30, 'STF-B003'],
            ];

            $classIds = [];
            foreach ($classesData as [$name, $grade, $section, $branch, $room, $capacity, $teacherKey]) {
                $class = SchoolClass::create([
                    'school_id' => $schoolId,
                    'school_branch_id' => $branchIds[$branch],
                    'name' => $name,
                    'grade_level' => $grade,
                    'section' => $section,
                    'class_teacher_id' => $staffIds[$teacherKey],
                    'room' => $room,
                    'academic_year' => $academicYear,
                    'academic_year_id' => $currentYear->id,
                    'capacity' => $capacity,
                ]);
                $classIds["$branch-$name"] = $class->id;
            }

            // ─── Students (45+ per campus) ───────────────────────────
            $studentIds = [];
            $studentRecords = [];
            $gradeSections = [
                ['Grade 7', 'A'],
                ['Grade 7', 'B'],
                ['Grade 8', 'A'],
                ['Grade 8', 'B'],
                ['Grade 9', 'A'],
            ];

            foreach (['ABAMA_A' => 'A', 'ABAMA_B' => 'B'] as $branchCode => $prefix) {
                $counter = 1;
                foreach ($gradeSections as [$grade, $section]) {
                    for ($i = 0; $i < 9; $i++) {
                        $studentKey = sprintf('STU-%s%03d', $prefix, $counter);
                        $given = $this->randomTzGivenName();
                        $second = $this->randomTzSecondName();
                        $surname = $this->randomTzSurname();
                        $gender = rand(0, 1) ? 'male' : 'female';
                        $dob = sprintf('200%d-%02d-%02d', rand(8, 10) % 10, rand(1, 12), rand(1, 28));
                        $areas = [
                            ['city' => 'Dar es Salaam', 'address' => 'Kinondoni, Makumbusho Road'],
                            ['city' => 'Dar es Salaam', 'address' => 'Ilala, Buguruni'],
                            ['city' => 'Dar es Salaam', 'address' => 'Temeke, Mbagala'],
                            ['city' => 'Dar es Salaam', 'address' => 'Ubungo, Kimara'],
                            ['city' => 'Dar es Salaam', 'address' => 'Kijitonyama, Sam Nujoma Road'],
                            ['city' => 'Arusha', 'address' => 'Sokon I, Ngarenaro'],
                            ['city' => 'Mwanza', 'address' => 'Nyamagana, Capri Point'],
                        ];
                        $area = $areas[array_rand($areas)];

                        $student = Student::create([
                            'school_id' => $schoolId,
                            'school_branch_id' => $branchIds[$branchCode],
                            'first_name' => "{$given} {$second}",
                            'last_name' => $surname,
                            'date_of_birth' => $dob,
                            'gender' => $gender,
                            'nationality' => 'Tanzanian',
                            'student_id' => $studentKey,
                            'grade_level' => $grade,
                            'class_section' => $section,
                            'city' => $area['city'],
                            'address' => $area['address'].' #'.rand(1, 200),
                            'enrollment_date' => '2024-09-02',
                            'academic_year' => $academicYear,
                            'academic_year_id' => $currentYear->id,
                            'status' => 'active',
                            'guardians' => [[
                                'name' => "Mr./Mrs. {$surname}",
                                'relationship' => 'Parent',
                                'phone' => sprintf('+255 7%02d %03d %03d', rand(10, 99), rand(100, 999), rand(100, 999)),
                                'email' => 'parent.'.Str::slug($surname).'@gmail.com',
                                'occupation' => 'Professional',
                                'isEmergencyContact' => true,
                            ]],
                        ]);

                        $studentIds[$studentKey] = $student->id;
                        $studentRecords[] = $student;
                        $counter++;
                    }
                }
            }

            // ─── Subjects ────────────────────────────────────────────
            $subjectsData = [
                ['Mathematics', 'MATH', 'Grade 7', 'STF-A002'],
                ['English Language', 'ENG', 'Grade 7', 'STF-A004'],
                ['Physics', 'PHY', 'Grade 8', 'STF-A003'],
                ['General Science', 'SCI', 'Grade 7', 'STF-A003'],
                ['ICT', 'ICT', 'Grade 8', 'STF-A005'],
                ['Social Studies', 'SOC', 'Grade 7', 'STF-A007'],
                ['Chemistry', 'CHEM', 'Grade 9', 'STF-B003'],
                ['Biology', 'BIO', 'Grade 9', 'STF-B005'],
                ['Literature', 'LIT', 'Grade 8', 'STF-A004'],
                ['Statistics', 'STAT', 'Grade 9', 'STF-B002'],
            ];

            $subjectIds = [];
            foreach ($subjectsData as [$name, $code, $grade, $teacherKey]) {
                $subject = Subject::create([
                    'school_id' => $schoolId,
                    'name' => $name,
                    'code' => $code,
                    'grade_level' => $grade,
                    'teacher_id' => $staffIds[$teacherKey],
                    'academic_year_id' => $currentYear->id,
                    'academic_semester_id' => $semester1?->id,
                    'academic_term_id' => $term1?->id,
                ]);
                $subjectIds[$code] = $subject->id;
            }

            // ─── Timetable slots ─────────────────────────────────────
            $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
            $times = [
                ['08:00', '08:45'], ['08:50', '09:35'], ['09:45', '10:30'],
                ['10:40', '11:25'], ['11:30', '12:15'], ['13:00', '13:45'], ['13:50', '14:35'],
            ];
            $subjectCodes = ['MATH', 'ENG', 'SCI', 'ICT', 'SOC', 'PHY', 'LIT'];
            $subjectNames = collect($subjectsData)->mapWithKeys(fn ($s) => [$s[1] => $s[0]]);

            foreach (['ABAMA_A-Grade 7A', 'ABAMA_B-Grade 7A'] as $classKey) {
                $cId = $classIds[$classKey] ?? null;
                if (! $cId) {
                    continue;
                }
                foreach ($days as $dayIdx => $day) {
                    foreach ($times as $period => [$start, $end]) {
                        $code = $subjectCodes[($dayIdx + $period) % count($subjectCodes)];
                        TimetableSlot::create([
                            'school_id' => $schoolId,
                            'class_id' => $cId,
                            'day' => $day,
                            'period' => $period + 1,
                            'subject' => $subjectNames[$code] ?? 'General Science',
                            'start_time' => $start,
                            'end_time' => $end,
                            'academic_year' => $academicYear,
                            'academic_year_id' => $currentYear->id,
                            'academic_semester_id' => $semester1?->id,
                            'academic_term_id' => $term1?->id,
                        ]);
                    }
                }
            }

            // ─── Attendance (recent dates) ───────────────────────────
            $recentDates = ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'];
            $statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'excused'];
            foreach ($recentDates as $date) {
                foreach (array_slice($studentRecords, 0, 25) as $student) {
                    AttendanceRecord::create([
                        'school_id' => $schoolId,
                        'date' => $date,
                        'type' => 'student',
                        'person_id' => $student->student_id,
                        'status' => $statuses[array_rand($statuses)],
                        'academic_year_id' => $currentYear->id,
                        'academic_semester_id' => $semester1?->id,
                        'academic_term_id' => $term2?->id,
                    ]);
                }
            }

            // ─── Fee structure + payments ────────────────────────────
            $feeStructure = FeeStructure::create([
                'school_id' => $schoolId,
                'name' => 'Grade 7-9 Tuition 2025-2026',
                'grade_level' => 'Grade 7',
                'academic_year' => $academicYear,
                'items' => [
                    ['name' => 'Tuition Fee', 'amount' => 3500, 'dueDate' => '2025-09-15', 'isOptional' => false],
                    ['name' => 'Activity Fee', 'amount' => 500, 'dueDate' => '2025-09-15', 'isOptional' => false],
                    ['name' => 'Technology Fee', 'amount' => 300, 'dueDate' => '2025-09-15', 'isOptional' => false],
                    ['name' => 'Library Fee', 'amount' => 200, 'dueDate' => '2025-09-15', 'isOptional' => false],
                    ['name' => 'Sports Fee', 'amount' => 250, 'dueDate' => '2025-10-01', 'isOptional' => true],
                ],
                'total_amount' => 4750,
            ]);

            $methods = ['cash', 'card', 'online', 'bank_transfer'];
            $terms = ['Term 1', 'Term 2', 'Term 3'];
            $paidForOptions = [
                'Tuition - Term 1',
                'Tuition - Term 2',
                'Tuition - Full Year',
                'Activity Fee',
                'Technology Fee',
                'Sports Fee',
            ];
            $receipt = 1;
            $allStudentDbIds = array_values($studentIds);

            for ($i = 0; $i < 55; $i++) {
                $studentDbId = $allStudentDbIds[array_rand($allStudentDbIds)];
                $isPaid = rand(0, 9) > 2;
                $paymentDate = sprintf(
                    '2025-%02d-%02d',
                    rand(9, 12),
                    rand(1, 28),
                );
                if ($i % 3 === 0) {
                    $paymentDate = sprintf('2026-%02d-%02d', rand(1, 6), rand(1, 28));
                }

                FeePayment::create([
                    'school_id' => $schoolId,
                    'student_id' => $studentDbId,
                    'fee_structure_id' => $feeStructure->id,
                    'receipt_number' => sprintf('RCP-2025-%04d', $receipt++),
                    'amount' => $isPaid ? 4750 : rand(1000, 4000),
                    'payment_date' => $paymentDate,
                    'method' => $methods[array_rand($methods)],
                    'paid_for' => $paidForOptions[array_rand($paidForOptions)],
                    'academic_year' => $academicYear,
                    'term' => $terms[array_rand($terms)],
                    'status' => $isPaid ? 'paid' : 'partial',
                    'recorded_by' => $admin->id,
                ]);
            }

            // ─── Expenses (50+, backdated) ───────────────────────────
            $expenseCategories = ['Utilities', 'Supplies', 'Maintenance', 'Transport', 'Technology', 'Events', 'Catering', 'Salaries'];
            $expenseVendors = [
                'Tanesco', 'DAWASCO', 'City Oil Tanzania', 'Quality Supplies Ltd',
                'Dar Tech Solutions', 'Kariakoo Traders', 'Mwanza Logistics', 'Coastal Catering Co.',
                'Upcountry Bus Services', 'Kibo Stationers', 'Simu Plaza', 'Azam Marine Supplies',
            ];
            $expenseDescriptions = [
                'Electricity bill', 'Water utilities', 'Bus fuel allocation', 'Lab consumables',
                'Office stationery order', 'Projector maintenance', 'Sports day catering',
                'Network equipment upgrade', 'Classroom furniture repair', 'Security service fee',
                'Science kit replenishment', 'Library book purchase', 'Generator servicing',
            ];

            for ($i = 0; $i < 55; $i++) {
                $month = rand(1, 12);
                $year = $month >= 9 ? 2025 : 2026;
                Expense::create([
                    'school_id' => $schoolId,
                    'category' => $expenseCategories[array_rand($expenseCategories)],
                    'description' => $expenseDescriptions[array_rand($expenseDescriptions)].' - '.date('F Y', mktime(0, 0, 0, $month, 1, $year)),
                    'amount' => rand(800, 5500),
                    'date' => sprintf('%04d-%02d-%02d', $year, $month, rand(1, 28)),
                    'vendor' => $expenseVendors[array_rand($expenseVendors)],
                    'status' => rand(0, 9) > 2 ? 'approved' : 'pending',
                ]);
            }

            // ─── Payroll ─────────────────────────────────────────────
            foreach ($staffIds as $sKey => $sId) {
                $basic = $staffSalaries[$sKey];
                $allowances = (int) floor($basic * 0.2);
                $deductions = (int) floor($basic * 0.08);
                PayrollRecord::create([
                    'school_id' => $schoolId,
                    'staff_id' => $sId,
                    'month' => 5,
                    'year' => 2026,
                    'basic_salary' => $basic,
                    'allowances' => $allowances,
                    'deductions' => $deductions,
                    'net_salary' => $basic + $allowances - $deductions,
                    'payment_date' => '2026-05-28',
                    'status' => 'paid',
                ]);
            }

            // ─── Library books ───────────────────────────────────────
            $books = [
                ['Things Fall Apart', 'Chinua Achebe', '978-0385474542', 'Literature', 15, 8],
                ['Mathematics for JHS', 'K. Asante-Duah', null, 'Textbook', 40, 12],
                ['Integrated Science Workbook', 'CRDD Ghana', null, 'Textbook', 35, 20],
                ['The Beautiful Ones Are Not Yet Born', 'Ayi Kwei Armah', '978-0435900342', 'Literature', 10, 6],
                ['English Grammar in Use', 'Raymond Murphy', '978-1108457651', 'Reference', 20, 14],
                ['Oxford School Dictionary', 'Oxford Press', '978-0192747105', 'Reference', 25, 22],
                ['ICT for Junior High', 'J. Frimpong', null, 'Textbook', 30, 18],
                ['History of Ghana', 'W.E.F. Ward', null, 'History', 8, 5],
                ['Social Studies Made Easy', 'GES Publishers', null, 'Textbook', 30, 25],
                ['Physics Fundamentals', 'P. Asiedu', null, 'Textbook', 20, 15],
            ];
            foreach ($books as [$title, $author, $isbn, $category, $total, $available]) {
                LibraryBook::create([
                    'school_id' => $schoolId,
                    'title' => $title,
                    'author' => $author,
                    'isbn' => $isbn,
                    'category' => $category,
                    'total_copies' => $total,
                    'available_copies' => $available,
                    'shelf_location' => 'Shelf '.chr(65 + rand(0, 5)).rand(1, 10),
                ]);
            }

            // ─── Transport (12+ buses) ───────────────────────────────
            $routeDefinitions = [
                ['East Legon - Oyster Bay', 'RT-001', '06:30', '15:30', [
                    ['name' => 'Sinza Mori', 'time' => '06:30'],
                    ['name' => 'Mbezi Beach', 'time' => '06:45'],
                    ['name' => 'Oyster Bay', 'time' => '07:00'],
                    ['name' => 'ABAMA Campus A', 'time' => '07:20'],
                ]],
                ['Masaki - City Centre', 'RT-002', '06:20', '15:15', [
                    ['name' => 'Masaki Roundabout', 'time' => '06:20'],
                    ['name' => 'Slipway', 'time' => '06:35'],
                    ['name' => 'Posta', 'time' => '06:50'],
                    ['name' => 'ABAMA Campus B', 'time' => '07:05'],
                ]],
                ['Kinondoni - Mikocheni', 'RT-003', '06:25', '15:20', [
                    ['name' => 'Kinondoni Market', 'time' => '06:25'],
                    ['name' => 'Mwananyamala', 'time' => '06:40'],
                    ['name' => 'Mikocheni', 'time' => '06:55'],
                    ['name' => 'ABAMA Campus A', 'time' => '07:15'],
                ]],
                ['Tabata - Upanga', 'RT-004', '06:15', '15:10', [
                    ['name' => 'Tabata Relini', 'time' => '06:15'],
                    ['name' => 'Buguruni', 'time' => '06:30'],
                    ['name' => 'Upanga', 'time' => '06:45'],
                    ['name' => 'ABAMA Campus B', 'time' => '07:00'],
                ]],
            ];

            $routeIds = [];
            foreach ($routeDefinitions as [$routeName, $routeNumber, $morning, $afternoon, $stops]) {
                $route = BusRoute::create([
                    'school_id' => $schoolId,
                    'route_name' => $routeName,
                    'route_number' => $routeNumber,
                    'stops' => $stops,
                    'morning_start_time' => $morning,
                    'afternoon_start_time' => $afternoon,
                    'is_active' => true,
                ]);
                $routeIds[] = $route->id;
            }

            for ($i = 1; $i <= 12; $i++) {
                $driverSecond = $this->randomTzSecondName();
                $driverSurname = $this->randomTzSurname();
                $matronSecond = $this->randomTzSecondName();
                $matronSurname = $this->randomTzSurname();

                Bus::create([
                    'school_id' => $schoolId,
                    'bus_number' => sprintf('BUS-%03d', $i),
                    'plate_number' => sprintf('T %03d %s', rand(100, 999), strtoupper(Str::random(3))),
                    'capacity' => rand(40, 52),
                    'route_id' => $routeIds[($i - 1) % count($routeIds)],
                    'driver_name' => "Juma {$driverSecond} {$driverSurname}",
                    'driver_phone' => sprintf('+255 7%02d %03d %03d', rand(10, 99), rand(100, 999), rand(100, 999)),
                    'driver_license' => sprintf('DL-TZ-202%d-%04d', rand(0, 4), rand(1000, 9999)),
                    'matron_name' => "Neema {$matronSecond} {$matronSurname}",
                    'matron_phone' => sprintf('+255 7%02d %03d %03d', rand(10, 99), rand(100, 999), rand(100, 999)),
                    'status' => 'active',
                ]);
            }

            // ─── Dormitory ───────────────────────────────────────────
            $dormRooms = [
                ['A-101', 'Block A', 1, 4, 3, 'male'],
                ['A-102', 'Block A', 1, 4, 4, 'male'],
                ['A-201', 'Block A', 2, 4, 2, 'male'],
                ['B-101', 'Block B', 1, 4, 4, 'female'],
                ['B-102', 'Block B', 1, 4, 3, 'female'],
                ['B-201', 'Block B', 2, 4, 1, 'female'],
            ];
            foreach ($dormRooms as [$room, $block, $floor, $capacity, $occupied, $gender]) {
                DormRoom::create([
                    'school_id' => $schoolId,
                    'room_number' => $room,
                    'dorm_block' => $block,
                    'floor' => $floor,
                    'capacity' => $capacity,
                    'occupied_count' => $occupied,
                    'type' => 'dormitory',
                    'gender' => $gender,
                    'amenities' => ['wifi', 'bathroom'],
                    'status' => $occupied >= $capacity ? 'full' : 'available',
                    'monthly_fee' => 800,
                ]);
            }

            // ─── Admissions ──────────────────────────────────────────
            $admissions = [
                ['Kwabena', 'Asante', 'male', 'Grade 7', 'Mr. Asante', 'asante.sr@gmail.com', '+233 244 999 001', 'submitted', 'APP-2026-001', 'ABAMA_A'],
                ['Akua', 'Bempong', 'female', 'Grade 8', 'Mrs. Bempong', 'bempong.family@gmail.com', '+233 244 999 002', 'under_review', 'APP-2026-002', 'ABAMA_A'],
                ['Yaw', 'Mensah-Bonsu', 'male', 'Grade 7', 'Dr. Mensah-Bonsu', 'mensahbonsu@outlook.com', '+233 244 999 003', 'interview_scheduled', 'APP-2026-003', 'ABAMA_B'],
                ['Ama', 'Serwaa', 'female', 'Grade 9', 'Mr. Serwaa', 'serwaa.k@gmail.com', '+233 244 999 004', 'accepted', 'APP-2026-004', 'ABAMA_B'],
                ['Kofi', 'Darkwa', 'male', 'Grade 7', 'Mrs. Darkwa', 'darkwa.mom@gmail.com', '+233 244 999 005', 'submitted', 'APP-2026-005', 'ABAMA_A'],
            ];
            foreach ($admissions as [$first, $last, $gender, $grade, $gName, $gEmail, $gPhone, $status, $appId, $branch]) {
                Admission::create([
                    'school_id' => $schoolId,
                    'school_branch_id' => $branchIds[$branch],
                    'first_name' => $first,
                    'last_name' => $last,
                    'gender' => $gender,
                    'applying_for_grade' => $grade,
                    'academic_year' => '2026-2027',
                    'academic_year_id' => $nextYear->id,
                    'guardian_name' => $gName,
                    'guardian_email' => $gEmail,
                    'guardian_phone' => $gPhone,
                    'guardian_relationship' => 'Parent',
                    'status' => $status,
                    'application_id' => $appId,
                ]);
            }

            // ─── Inventory ───────────────────────────────────────────
            $vendorIds = $this->seedInventoryVendors($schoolId);
            $this->seedInventoryAssets($schoolId, $vendorIds);

            // ─── Exams + results ─────────────────────────────────────
            $class7A = $classIds['ABAMA_A-Grade 7A'];

            $exam1 = Exam::create([
                'school_id' => $schoolId,
                'class_id' => $class7A,
                'subject_id' => $subjectIds['MATH'],
                'title' => 'Mathematics Mid-Term Exam',
                'exam_date' => '2026-06-15',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'max_score' => 100,
                'passing_score' => 50,
                'term' => 'Term 2',
                'academic_year' => $academicYear,
                'academic_year_id' => $currentYear->id,
                'academic_semester_id' => $semester1?->id,
                'academic_term_id' => $term2?->id,
                'venue' => 'Exam Hall A',
            ]);

            $exam2 = Exam::create([
                'school_id' => $schoolId,
                'class_id' => $class7A,
                'subject_id' => $subjectIds['ENG'],
                'title' => 'English Language Mid-Term Exam',
                'exam_date' => '2026-06-16',
                'start_time' => '09:00',
                'end_time' => '11:00',
                'max_score' => 100,
                'passing_score' => 50,
                'term' => 'Term 2',
                'academic_year' => $academicYear,
                'academic_year_id' => $currentYear->id,
                'academic_semester_id' => $semester1?->id,
                'academic_term_id' => $term2?->id,
                'venue' => 'Exam Hall A',
            ]);

            foreach (array_slice($studentRecords, 0, 5) as $student) {
                $sId = $student->id;
                $mathScore = rand(55, 95);
                ExamResult::create([
                    'exam_id' => $exam1->id,
                    'student_id' => $sId,
                    'school_id' => $schoolId,
                    'score' => $mathScore,
                    'grade' => $mathScore >= 80 ? 'A' : ($mathScore >= 70 ? 'B' : ($mathScore >= 60 ? 'C' : 'D')),
                ]);
                $engScore = rand(60, 95);
                ExamResult::create([
                    'exam_id' => $exam2->id,
                    'student_id' => $sId,
                    'school_id' => $schoolId,
                    'score' => $engScore,
                    'grade' => $engScore >= 80 ? 'A' : ($engScore >= 70 ? 'B' : ($engScore >= 60 ? 'C' : 'D')),
                ]);
            }

            // ─── Assignments ─────────────────────────────────────────
            $assignmentsData = [
                ['MATH', 'STF-A002', 'Algebraic Expressions Practice', 'Complete exercises 1-20 on page 45 of your textbook', '2026-06-10', 20, 'homework'],
                ['ENG', 'STF-A004', 'Essay Writing - My Community', 'Write a 500-word essay about the importance of community service', '2026-06-12', 30, 'homework'],
                ['SCI', 'STF-A003', 'Photosynthesis Lab Report', 'Document the results of our in-class experiment on photosynthesis', '2026-06-14', 25, 'project'],
            ];
            foreach ($assignmentsData as [$code, $teacherKey, $title, $description, $dueDate, $maxScore, $type]) {
                Assignment::create([
                    'school_id' => $schoolId,
                    'class_id' => $class7A,
                    'subject_id' => $subjectIds[$code],
                    'teacher_id' => $staffIds[$teacherKey],
                    'title' => $title,
                    'description' => $description,
                    'due_date' => $dueDate,
                    'max_score' => $maxScore,
                    'type' => $type,
                    'academic_year_id' => $currentYear->id,
                    'academic_semester_id' => $semester1?->id,
                    'academic_term_id' => $term2?->id,
                ]);
            }

            // ─── Leave requests ──────────────────────────────────────
            LeaveRequest::create([
                'school_id' => $schoolId,
                'staff_id' => $staffIds['STF-A003'],
                'type' => 'sick',
                'start_date' => '2026-06-05',
                'end_date' => '2026-06-06',
                'reason' => 'Feeling unwell - mild flu symptoms',
                'status' => 'approved',
            ]);

            LeaveRequest::create([
                'school_id' => $schoolId,
                'staff_id' => $staffIds['STF-B005'],
                'type' => 'annual',
                'start_date' => '2026-06-20',
                'end_date' => '2026-06-27',
                'reason' => 'Family vacation',
                'status' => 'pending',
            ]);

            // ─── Maintenance requests ────────────────────────────────
            MaintenanceRequest::create([
                'school_id' => $schoolId,
                'location' => 'Room A201',
                'location_type' => 'campus',
                'title' => 'Broken window',
                'description' => 'Third window from the left has a crack and needs replacement',
                'priority' => 'medium',
                'status' => 'open',
            ]);

            MaintenanceRequest::create([
                'school_id' => $schoolId,
                'location' => 'Block B - Boys Dormitory',
                'location_type' => 'dorm',
                'title' => 'Plumbing issue',
                'description' => 'Bathroom sink on 2nd floor is leaking',
                'priority' => 'high',
                'status' => 'in_progress',
                'assigned_to' => 'Samuel Tetteh',
            ]);

            // ─── Security logs ───────────────────────────────────────
            SecurityLog::create([
                'school_id' => $schoolId,
                'person_name' => 'Mr. Johnson',
                'person_type' => 'visitor',
                'purpose' => 'Parent meeting',
                'check_in_time' => '2026-06-02T09:30:00Z',
                'host_name' => 'Mrs. Akosua Boateng',
                'id_type' => 'National ID',
                'id_number' => 'GHA-2938475',
            ]);

            SecurityLog::create([
                'school_id' => $schoolId,
                'person_name' => 'Delivery Co.',
                'person_type' => 'vendor',
                'purpose' => 'Lab supplies delivery',
                'check_in_time' => '2026-06-02T11:00:00Z',
                'check_out_time' => '2026-06-02T11:45:00Z',
                'id_type' => 'Company Badge',
            ]);

            Event::create([
                'school_id' => $schoolId,
                'school_branch_id' => $branchA->id,
                'title' => 'Inter-House Sports Day',
                'description' => 'Annual sports competition for all grade levels',
                'start_at' => '2026-06-15T08:00:00Z',
                'end_at' => '2026-06-15T16:00:00Z',
                'location' => 'ABAMA Campus A Sports Field',
                'event_type' => 'sports',
                'status' => 'scheduled',
                'created_by' => $admin->id,
            ]);

            Event::create([
                'school_id' => $schoolId,
                'school_branch_id' => $branchB->id,
                'title' => 'Science Fair',
                'description' => 'Student science projects exhibition',
                'start_at' => '2026-07-02T09:00:00Z',
                'end_at' => '2026-07-02T14:00:00Z',
                'location' => 'ABAMA Campus B Auditorium',
                'event_type' => 'academic',
                'status' => 'scheduled',
                'created_by' => $admin->id,
            ]);

            $sampleMeeting = Meeting::create([
                'school_id' => $schoolId,
                'parent_id' => $admin->id,
                'title' => 'End of Term Progress Review',
                'description' => 'Discuss academic performance and next term goals',
                'scheduled_at' => '2026-06-20T10:00:00Z',
                'duration_minutes' => 45,
                'status' => 'requested',
                'meeting_type' => 'in_person',
                'location' => 'Room A201',
            ]);
            $sampleMeeting->staff()->attach([$staffIds['STF-A002'], $staffIds['STF-A004']]);
            $sampleMeeting->students()->attach(array_slice(array_values($studentIds), 0, 2));

            // ─── Messages ────────────────────────────────────────────
            $akosua = $staffUsers[0];
            $yaw = $staffUsers[1];
            $abena = $staffUsers[2];
            $kofi = $staffUsers[3];

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $akosua->id,
                'receiver_id' => $admin->id,
                'body' => 'Good morning! The Grade 8 math exam papers are ready for review.',
                'is_read' => false,
                'created_at' => now()->subDays(1)->setTime(12, 42),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $admin->id,
                'receiver_id' => $akosua->id,
                'body' => 'Thanks Akosua. Please share them with the exam committee.',
                'is_read' => true,
                'created_at' => now()->subDays(1)->setTime(12, 55),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $akosua->id,
                'receiver_id' => $admin->id,
                'body' => 'Will do. Also, should we reschedule the mock exam?',
                'is_read' => false,
                'created_at' => now()->subDays(1)->setTime(13, 10),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $yaw->id,
                'receiver_id' => $admin->id,
                'body' => 'Lab equipment for the physics practical has arrived.',
                'is_read' => false,
                'created_at' => now()->subHours(5),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $admin->id,
                'receiver_id' => $yaw->id,
                'body' => 'Great news! Let me know if anything is missing.',
                'is_read' => true,
                'created_at' => now()->subHours(4)->subMinutes(30),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $abena->id,
                'receiver_id' => $admin->id,
                'body' => 'Parent-teacher conference slots are filling up fast.',
                'is_read' => true,
                'created_at' => now()->subDays(2)->setTime(9, 15),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $admin->id,
                'receiver_id' => $abena->id,
                'body' => 'Please send me the updated schedule by Friday.',
                'is_read' => true,
                'created_at' => now()->subDays(2)->setTime(10, 0),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $abena->id,
                'receiver_id' => $admin->id,
                'body' => 'Here is the draft schedule. Let me know your thoughts!',
                'is_read' => false,
                'created_at' => now()->subHours(2),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $admin->id,
                'receiver_id' => $kofi->id,
                'body' => 'Can you prepare the ICT lab for the coding workshop next week?',
                'is_read' => true,
                'created_at' => now()->subDays(3)->setTime(14, 30),
            ]);

            Message::create([
                'school_id' => $schoolId,
                'sender_id' => $kofi->id,
                'receiver_id' => $admin->id,
                'body' => 'Already on it! 💻✨',
                'is_read' => true,
                'created_at' => now()->subDays(3)->setTime(15, 0),
            ]);

            $accounting = app(AccountingService::class);
            $accounting->ensureChartOfAccounts($schoolId);
            $accounting->ensurePettyCashFund($schoolId, $admin->id);
            FeePayment::forSchool($schoolId)->each(fn (FeePayment $p) => $accounting->postFeePayment($p));
            Expense::forSchool($schoolId)->where('status', 'approved')->each(fn (Expense $e) => $accounting->postExpense($e));

        });

        $this->syncTenants();

        $this->command->info('Seeded ABAMA International Schools demo data.');
        $this->command->info('Platform: http://'.config('tenancy.central_domain').'/login/platform');
        $this->command->info('School: http://abama-international.'.config('tenancy.central_domain').'/login — admin@abama.edu.tz / password');
    }

    private function tzGivenNames(): array
    {
        return [
            'Amina', 'Baraka', 'Fatuma', 'Grace', 'Hassan', 'Juma', 'Kamala', 'Luka',
            'Mariam', 'Neema', 'Omar', 'Pendo', 'Rajab', 'Salima', 'Tatu', 'Upendo',
            'Yusuf', 'Zawadi', 'John', 'Mary', 'Peter', 'Sarah', 'Daniel', 'Esther',
        ];
    }

    private function tzSecondNames(): array
    {
        return [
            'Mwinyi', 'Juma', 'Hassan', 'Hamisi', 'Abdallah', 'Bakari', 'Faraji', 'Halima',
            'Issa', 'Kombo', 'Lulu', 'Mgeni', 'Ndege', 'Omari', 'Pili', 'Rashidi',
            'Salum', 'Shomari', 'Tiba', 'Vumilia', 'Wambura', 'Yona', 'Zuberi', 'Chausiku',
            'Manka', 'Ndugu', 'Mrema', 'Mganga', 'Mushi', 'Senkoro', 'Kiboko', 'Mtoto',
        ];
    }

    private function tzSurnames(): array
    {
        return [
            'Kimaro', 'Lyimo', 'Moshi', 'Mwinuka', 'Ngowi', 'Rwiza', 'Shayo', 'Tarimo',
            'Urassa', 'Mganga', 'Mrema', 'Msuya', 'Mushi', 'Ndile', 'Olomi', 'Pallangyo',
            'Ryoba', 'Semkiwa', 'Tewele', 'Mwakatobe', 'Kipojo', 'Mbise', 'Mwambene', 'Ngassapa',
        ];
    }

    private function randomTzGivenName(): string
    {
        $names = $this->tzGivenNames();

        return $names[array_rand($names)];
    }

    private function randomTzSecondName(): string
    {
        $names = $this->tzSecondNames();

        return $names[array_rand($names)];
    }

    private function randomTzSurname(): string
    {
        $names = $this->tzSurnames();

        return $names[array_rand($names)];
    }

    private function syncTenants(): void
    {
        if (! School::query()->exists()) {
            return;
        }

        Artisan::call('tenants:migrate', ['--force' => true]);
        $this->printArtisanOutput();

        Artisan::call('tenants:seed', ['--force' => true]);
        $this->printArtisanOutput();
    }

    private function printArtisanOutput(): void
    {
        $output = trim(Artisan::output());

        if ($output !== '') {
            $this->command->line($output);
        }
    }
}
