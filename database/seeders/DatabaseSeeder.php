<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Asset;
use App\Models\Assignment;
use App\Models\AttendanceRecord;
use App\Models\Bus;
use App\Models\BusRoute;
use App\Models\DormRoom;
use App\Models\Exam;
use App\Models\ExamResult;
use App\Models\Expense;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\Event;
use App\Models\Meeting;
use App\Models\Message;
use App\Models\LeaveRequest;
use App\Models\LibraryBook;
use App\Models\MaintenanceRequest;
use App\Models\PayrollRecord;
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
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (School::query()->exists()) {
            $this->command->warn('Database already seeded. Run migrate:fresh first.');

            return;
        }

        $academicYear = '2025-2026';

        $school = School::create([
            'name' => 'ABAMA International Schools',
            'slug' => 'abama-international',
            'address' => '15 Education Drive',
            'city' => 'Accra',
            'state' => 'Greater Accra',
            'zip' => '00233',
            'phone' => '+233 302 111 222',
            'email' => 'admin@abama.edu.gh',
            'website' => 'https://abama.edu.gh',
            'is_active' => true,
            'plan' => 'premium',
        ]);

        $branchA = SchoolBranch::create([
            'school_id' => $school->id,
            'code' => 'ABAMA_A',
            'name' => 'ABAMA Campus A',
            'address' => '15 Education Drive, East Legon',
            'phone' => '+233 302 111 333',
            'principal_name' => 'Dr. Kwame Mensah',
        ]);

        $branchB = SchoolBranch::create([
            'school_id' => $school->id,
            'code' => 'ABAMA_B',
            'name' => 'ABAMA Campus B',
            'address' => '42 Academy Road, Cantonments',
            'phone' => '+233 302 111 444',
            'principal_name' => 'Mrs. Ama Darko',
        ]);

        $branchIds = [
            'ABAMA_A' => $branchA->id,
            'ABAMA_B' => $branchB->id,
        ];

        $admin = User::create([
            'name' => 'ABAMA Admin',
            'email' => 'admin@abama.edu.gh',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'school_id' => $school->id,
            'is_active' => true,
        ]);

        $school->update(['admin_id' => $admin->id]);

        User::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@scholaros.test',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        // ─── Staff ───────────────────────────────────────────────
        $staffData = [
            ['Kwame', 'Mensah', 'STF-A001', 'ABAMA_A', 'principal', 'Administration', 'Principal', 'k.mensah@abama.edu.gh', '+233 244 100 001', 12000, 'male', 'PhD Education', null, '2018-01-15'],
            ['Akosua', 'Boateng', 'STF-A002', 'ABAMA_A', 'teacher', 'Mathematics', 'Head of Mathematics', 'a.boateng@abama.edu.gh', '+233 244 100 002', 7500, 'female', 'MSc Mathematics', ['Mathematics', 'Further Mathematics'], '2019-03-01'],
            ['Yaw', 'Owusu', 'STF-A003', 'ABAMA_A', 'teacher', 'Science', 'Physics Teacher', 'y.owusu@abama.edu.gh', '+233 244 100 003', 6800, 'male', 'BSc Physics', ['Physics', 'General Science'], '2020-09-01'],
            ['Abena', 'Asante', 'STF-A004', 'ABAMA_A', 'teacher', 'English', 'English Teacher', 'a.asante@abama.edu.gh', '+233 244 100 004', 6500, 'female', 'MA English Literature', ['English Language', 'Literature'], '2020-09-01'],
            ['Kofi', 'Adjei', 'STF-A005', 'ABAMA_A', 'teacher', 'ICT', 'ICT Coordinator', 'k.adjei@abama.edu.gh', '+233 244 100 005', 7000, 'male', 'BSc Computer Science', ['ICT', 'Computer Science'], '2021-01-10'],
            ['Esi', 'Nyarko', 'STF-A006', 'ABAMA_A', 'admin_staff', 'Administration', 'Registrar', 'e.nyarko@abama.edu.gh', '+233 244 100 006', 5500, 'female', 'BA Administration', null, '2019-06-15'],
            ['Nana', 'Agyeman', 'STF-A007', 'ABAMA_A', 'teacher', 'Social Studies', 'Social Studies Teacher', 'n.agyeman@abama.edu.gh', '+233 244 100 007', 6200, 'male', 'BA Social Studies', ['Social Studies', 'History'], '2022-01-05'],
            ['Ama', 'Darko', 'STF-B001', 'ABAMA_B', 'principal', 'Administration', 'Principal', 'a.darko@abama.edu.gh', '+233 244 200 001', 12000, 'female', 'PhD Educational Leadership', null, '2017-08-01'],
            ['Kwesi', 'Appiah', 'STF-B002', 'ABAMA_B', 'teacher', 'Mathematics', 'Mathematics Teacher', 'k.appiah@abama.edu.gh', '+233 244 200 002', 7200, 'male', 'MSc Applied Mathematics', ['Mathematics', 'Statistics'], '2019-09-01'],
            ['Efua', 'Osei', 'STF-B003', 'ABAMA_B', 'teacher', 'Science', 'Chemistry Teacher', 'e.osei@abama.edu.gh', '+233 244 200 003', 6800, 'female', 'BSc Chemistry', ['Chemistry', 'General Science'], '2020-01-15'],
            ['Kojo', 'Frimpong', 'STF-B004', 'ABAMA_B', 'teacher', 'English', 'English Teacher', 'k.frimpong@abama.edu.gh', '+233 244 200 004', 6500, 'male', 'BA English', ['English Language', 'Creative Writing'], '2021-03-01'],
            ['Adwoa', 'Boateng', 'STF-B005', 'ABAMA_B', 'teacher', 'Science', 'Biology Teacher', 'ad.boateng@abama.edu.gh', '+233 244 200 005', 6600, 'female', 'MSc Biology', ['Biology', 'Health Science'], '2021-09-01'],
            ['Yaa', 'Asantewaa', 'STF-B006', 'ABAMA_B', 'admin_staff', 'Administration', 'Secretary', 'y.asantewaa@abama.edu.gh', '+233 244 200 006', 4800, 'female', 'Diploma Secretarial Studies', null, '2020-06-01'],
            ['Samuel', 'Tetteh', 'STF-B007', 'ABAMA_B', 'support_staff', 'Maintenance', 'Facility Manager', 's.tetteh@abama.edu.gh', '+233 244 200 007', 4200, 'male', 'Certificate Facilities Management', null, '2018-04-01'],
        ];

        $staffIds = [];
        $staffSalaries = [];
        foreach ($staffData as [$first, $last, $staffId, $branch, $role, $dept, $designation, $email, $phone, $salary, $gender, $qualification, $subjects, $joinDate]) {
            $staff = Staff::create([
                'school_id' => $school->id,
                'school_branch_id' => $branchIds[$branch],
                'first_name' => $first,
                'last_name' => $last,
                'staff_id' => $staffId,
                'role' => $role,
                'department' => $dept,
                'designation' => $designation,
                'email' => $email,
                'phone' => $phone,
                'salary' => $salary,
                'gender' => $gender,
                'qualification' => $qualification,
                'subjects' => $subjects,
                'join_date' => $joinDate,
                'status' => 'active',
            ]);
            $staffIds[$staffId] = $staff->id;
            $staffSalaries[$staffId] = $salary;
        }

        $staffUsers = [];
        foreach ([
            ['Akosua Boateng', 'a.boateng@abama.edu.gh', 'teacher'],
            ['Yaw Owusu', 'y.owusu@abama.edu.gh', 'teacher'],
            ['Abena Asante', 'a.asante@abama.edu.gh', 'teacher'],
            ['Kofi Adjei', 'k.adjei@abama.edu.gh', 'teacher'],
            ['Esi Nyarko', 'e.nyarko@abama.edu.gh', 'admin_staff'],
        ] as [$name, $email, $role]) {
            $staffUsers[] = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make('password'),
                'role' => $role,
                'school_id' => $school->id,
                'is_active' => true,
            ]);
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
                'school_id' => $school->id,
                'school_branch_id' => $branchIds[$branch],
                'name' => $name,
                'grade_level' => $grade,
                'section' => $section,
                'class_teacher_id' => $staffIds[$teacherKey],
                'room' => $room,
                'academic_year' => $academicYear,
                'capacity' => $capacity,
            ]);
            $classIds["$branch-$name"] = $class->id;
        }

        // ─── Students ────────────────────────────────────────────
        $studentNames = [
            ['Emmanuel', 'Asare', 'male', 'ABAMA_A', 'Grade 7', 'A', 'STU-A001'],
            ['Grace', 'Ofori', 'female', 'ABAMA_A', 'Grade 7', 'A', 'STU-A002'],
            ['Daniel', 'Kuffour', 'male', 'ABAMA_A', 'Grade 7', 'A', 'STU-A003'],
            ['Abigail', 'Mensah', 'female', 'ABAMA_A', 'Grade 7', 'A', 'STU-A004'],
            ['Samuel', 'Okyere', 'male', 'ABAMA_A', 'Grade 7', 'A', 'STU-A005'],
            ['Priscilla', 'Acheampong', 'female', 'ABAMA_A', 'Grade 7', 'B', 'STU-A006'],
            ['Joseph', 'Mensah', 'male', 'ABAMA_A', 'Grade 7', 'B', 'STU-A007'],
            ['Felicia', 'Owusu', 'female', 'ABAMA_A', 'Grade 7', 'B', 'STU-A008'],
            ['Michael', 'Addo', 'male', 'ABAMA_A', 'Grade 8', 'A', 'STU-A009'],
            ['Naomi', 'Boateng', 'female', 'ABAMA_A', 'Grade 8', 'A', 'STU-A010'],
            ['Isaac', 'Tetteh', 'male', 'ABAMA_A', 'Grade 8', 'A', 'STU-A011'],
            ['Sarah', 'Adjei', 'female', 'ABAMA_A', 'Grade 8', 'A', 'STU-A012'],
            ['Peter', 'Antwi', 'male', 'ABAMA_A', 'Grade 8', 'B', 'STU-A013'],
            ['Esther', 'Darko', 'female', 'ABAMA_A', 'Grade 8', 'B', 'STU-A014'],
            ['Benjamin', 'Quansah', 'male', 'ABAMA_A', 'Grade 8', 'B', 'STU-A015'],
            ['David', 'Agyemang', 'male', 'ABAMA_A', 'Grade 9', 'A', 'STU-A016'],
            ['Millicent', 'Opoku', 'female', 'ABAMA_A', 'Grade 9', 'A', 'STU-A017'],
            ['Patrick', 'Yeboah', 'male', 'ABAMA_A', 'Grade 9', 'A', 'STU-A018'],
            ['Linda', 'Forson', 'female', 'ABAMA_A', 'Grade 9', 'A', 'STU-A019'],
            ['Richard', 'Amponsah', 'male', 'ABAMA_B', 'Grade 7', 'A', 'STU-B001'],
            ['Victoria', 'Ankomah', 'female', 'ABAMA_B', 'Grade 7', 'A', 'STU-B002'],
            ['Francis', 'Boakye', 'male', 'ABAMA_B', 'Grade 7', 'A', 'STU-B003'],
            ['Gloria', 'Adu', 'female', 'ABAMA_B', 'Grade 7', 'A', 'STU-B004'],
            ['Thomas', 'Danso', 'male', 'ABAMA_B', 'Grade 7', 'B', 'STU-B005'],
            ['Rebecca', 'Gyasi', 'female', 'ABAMA_B', 'Grade 7', 'B', 'STU-B006'],
            ['Charles', 'Kumah', 'male', 'ABAMA_B', 'Grade 7', 'B', 'STU-B007'],
            ['Janet', 'Amoah', 'female', 'ABAMA_B', 'Grade 8', 'A', 'STU-B008'],
            ['Stephen', 'Baidoo', 'male', 'ABAMA_B', 'Grade 8', 'A', 'STU-B009'],
            ['Dorothy', 'Ofori-Atta', 'female', 'ABAMA_B', 'Grade 8', 'A', 'STU-B010'],
            ['James', 'Nkrumah', 'male', 'ABAMA_B', 'Grade 8', 'A', 'STU-B011'],
            ['Catherine', 'Sarpong', 'female', 'ABAMA_B', 'Grade 9', 'A', 'STU-B012'],
            ['William', 'Ansah', 'male', 'ABAMA_B', 'Grade 9', 'A', 'STU-B013'],
            ['Mercy', 'Tawiah', 'female', 'ABAMA_B', 'Grade 9', 'A', 'STU-B014'],
            ['Anthony', 'Opare', 'male', 'ABAMA_B', 'Grade 9', 'A', 'STU-B015'],
            ['Comfort', 'Akoto', 'female', 'ABAMA_B', 'Grade 9', 'B', 'STU-B016'],
            ['Raymond', 'Bonsu', 'male', 'ABAMA_B', 'Grade 9', 'B', 'STU-B017'],
            ['Helena', 'Mensah-Williams', 'female', 'ABAMA_B', 'Grade 9', 'B', 'STU-B018'],
        ];

        $studentIds = [];
        foreach ($studentNames as [$first, $last, $gender, $branch, $grade, $section, $sid]) {
            $dob = sprintf('200%d-%02d-%02d', rand(8, 10) % 10, rand(1, 12), rand(1, 28));
            $student = Student::create([
                'school_id' => $school->id,
                'school_branch_id' => $branchIds[$branch],
                'first_name' => $first,
                'last_name' => $last,
                'date_of_birth' => $dob,
                'gender' => $gender,
                'nationality' => 'Ghanaian',
                'student_id' => $sid,
                'grade_level' => $grade,
                'class_section' => $section,
                'enrollment_date' => '2024-09-02',
                'academic_year' => $academicYear,
                'status' => 'active',
                'guardians' => [[
                    'name' => "Mr./Mrs. $last",
                    'relationship' => 'Parent',
                    'phone' => sprintf('+233 24%d %d %d', rand(0, 9), rand(100, 999), rand(100, 999)),
                    'email' => 'parent.'.strtolower($last).'@gmail.com',
                    'occupation' => 'Professional',
                    'isEmergencyContact' => true,
                ]],
            ]);
            $studentIds[$sid] = $student->id;
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
                'school_id' => $school->id,
                'name' => $name,
                'code' => $code,
                'grade_level' => $grade,
                'teacher_id' => $staffIds[$teacherKey],
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
                        'school_id' => $school->id,
                        'class_id' => $cId,
                        'day' => $day,
                        'period' => $period + 1,
                        'subject' => $subjectNames[$code] ?? 'General Science',
                        'start_time' => $start,
                        'end_time' => $end,
                        'academic_year' => $academicYear,
                    ]);
                }
            }
        }

        // ─── Attendance (recent dates) ───────────────────────────
        $recentDates = ['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29', '2026-05-30'];
        $statuses = ['present', 'present', 'present', 'present', 'late', 'absent', 'excused'];
        foreach ($recentDates as $date) {
            foreach (array_slice(array_keys($studentIds), 0, 10) as $sKey) {
                AttendanceRecord::create([
                    'school_id' => $school->id,
                    'date' => $date,
                    'type' => 'student',
                    'person_id' => $sKey,
                    'status' => $statuses[array_rand($statuses)],
                ]);
            }
        }

        // ─── Fee structure + payments ────────────────────────────
        $feeStructure = FeeStructure::create([
            'school_id' => $school->id,
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
        $receipt = 1;
        foreach (array_slice(array_values($studentIds), 0, 20) as $sId) {
            $isPaid = rand(0, 9) > 2;
            FeePayment::create([
                'school_id' => $school->id,
                'student_id' => $sId,
                'fee_structure_id' => $feeStructure->id,
                'receipt_number' => sprintf('RCP-2025-%04d', $receipt++),
                'amount' => $isPaid ? 4750 : rand(1000, 4000),
                'payment_date' => sprintf('2025-09-%02d', rand(1, 20)),
                'method' => $methods[array_rand($methods)],
                'paid_for' => 'Tuition - Full Year',
                'academic_year' => $academicYear,
                'term' => 'Term 1',
                'status' => $isPaid ? 'paid' : 'partial',
                'recorded_by' => $admin->id,
            ]);
        }

        // ─── Expenses ────────────────────────────────────────────
        $expenses = [
            ['Utilities', 'Electricity bill - May 2026', 2800, 'ECG Ghana'],
            ['Supplies', 'Lab equipment - Chemistry department', 4500, 'Scientific Supplies Ltd'],
            ['Maintenance', 'AC repair - Block A', 1200, 'CoolAir Services'],
            ['Transport', 'Bus fuel - May 2026', 3200, 'Shell Ghana'],
            ['Supplies', 'Office stationery', 800, 'Office Mart'],
            ['Technology', 'Projector bulbs replacement', 1500, 'Tech Solutions'],
            ['Events', 'Inter-school debate competition', 2000, 'Event Planners GH'],
        ];
        foreach ($expenses as [$category, $description, $amount, $vendor]) {
            Expense::create([
                'school_id' => $school->id,
                'category' => $category,
                'description' => $description,
                'amount' => $amount,
                'date' => sprintf('2026-05-%02d', rand(1, 28)),
                'vendor' => $vendor,
                'status' => rand(0, 9) > 2 ? 'approved' : 'pending',
            ]);
        }

        // ─── Payroll ─────────────────────────────────────────────
        foreach ($staffIds as $sKey => $sId) {
            $basic = $staffSalaries[$sKey];
            $allowances = (int) floor($basic * 0.2);
            $deductions = (int) floor($basic * 0.08);
            PayrollRecord::create([
                'school_id' => $school->id,
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
                'school_id' => $school->id,
                'title' => $title,
                'author' => $author,
                'isbn' => $isbn,
                'category' => $category,
                'total_copies' => $total,
                'available_copies' => $available,
                'shelf_location' => 'Shelf '.chr(65 + rand(0, 5)).rand(1, 10),
            ]);
        }

        // ─── Transport ───────────────────────────────────────────
        $route1 = BusRoute::create([
            'school_id' => $school->id,
            'route_name' => 'East Legon - Airport Residential',
            'route_number' => 'RT-001',
            'stops' => [
                ['name' => 'East Legon Junction', 'time' => '06:30'],
                ['name' => 'Shiashie', 'time' => '06:40'],
                ['name' => 'Airport Residential', 'time' => '06:55'],
                ['name' => 'ABAMA Campus A', 'time' => '07:15'],
            ],
            'morning_start_time' => '06:30',
            'afternoon_start_time' => '15:30',
            'is_active' => true,
        ]);

        $route2 = BusRoute::create([
            'school_id' => $school->id,
            'route_name' => 'Cantonments - Osu - Labone',
            'route_number' => 'RT-002',
            'stops' => [
                ['name' => 'Cantonments Circle', 'time' => '06:20'],
                ['name' => 'Osu Oxford Street', 'time' => '06:35'],
                ['name' => 'Labone Junction', 'time' => '06:45'],
                ['name' => 'ABAMA Campus B', 'time' => '07:00'],
            ],
            'morning_start_time' => '06:20',
            'afternoon_start_time' => '15:15',
            'is_active' => true,
        ]);

        Bus::create([
            'school_id' => $school->id,
            'bus_number' => 'BUS-001',
            'plate_number' => 'GR-1234-26',
            'capacity' => 45,
            'route_id' => $route1->id,
            'driver_name' => 'Kwaku Mensah',
            'driver_phone' => '+233 244 555 001',
            'driver_license' => 'DL-GH-2023-4567',
            'matron_name' => 'Auntie Akua',
            'matron_phone' => '+233 244 555 002',
            'status' => 'active',
        ]);

        Bus::create([
            'school_id' => $school->id,
            'bus_number' => 'BUS-002',
            'plate_number' => 'GR-5678-26',
            'capacity' => 40,
            'route_id' => $route2->id,
            'driver_name' => 'Yaw Appiah',
            'driver_phone' => '+233 244 555 003',
            'driver_license' => 'DL-GH-2022-8901',
            'matron_name' => 'Auntie Efua',
            'matron_phone' => '+233 244 555 004',
            'status' => 'active',
        ]);

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
                'school_id' => $school->id,
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
                'school_id' => $school->id,
                'school_branch_id' => $branchIds[$branch],
                'first_name' => $first,
                'last_name' => $last,
                'gender' => $gender,
                'applying_for_grade' => $grade,
                'academic_year' => '2026-2027',
                'guardian_name' => $gName,
                'guardian_email' => $gEmail,
                'guardian_phone' => $gPhone,
                'guardian_relationship' => 'Parent',
                'status' => $status,
                'application_id' => $appId,
            ]);
        }

        // ─── Assets ──────────────────────────────────────────────
        $assets = [
            ['Desktop Computer', 'IT Equipment', 'AST-IT-001', 'Computer Lab A', 3500, 25, 'good'],
            ['Projector - Epson EB-X06', 'IT Equipment', 'AST-IT-002', 'Room A201', 2200, 8, 'good'],
            ['Science Lab Microscope', 'Lab Equipment', 'AST-LAB-001', 'Science Lab', 800, 15, 'good'],
            ['Student Desk Set', 'Furniture', 'AST-FUR-001', 'All Classrooms', 150, 300, 'good'],
            ['Whiteboard (Large)', 'Furniture', 'AST-FUR-002', 'All Classrooms', 250, 20, 'good'],
            ['Air Conditioner - 2HP', 'HVAC', 'AST-HV-001', 'Admin Block', 1800, 12, 'fair'],
            ['Generator - 50KVA', 'Power', 'AST-PWR-001', 'Power House', 15000, 2, 'good'],
            ['School Bus - Hyundai County', 'Vehicle', 'AST-VEH-001', 'Parking Lot', 65000, 2, 'good'],
        ];
        foreach ($assets as [$name, $category, $tag, $location, $cost, $qty, $condition]) {
            Asset::create([
                'school_id' => $school->id,
                'name' => $name,
                'category' => $category,
                'asset_tag' => $tag,
                'location' => $location,
                'purchase_date' => '2024-01-15',
                'purchase_cost' => $cost,
                'current_value' => (int) floor($cost * 0.8),
                'quantity' => $qty,
                'condition' => $condition,
                'status' => 'in_use',
            ]);
        }

        // ─── Exams + results ─────────────────────────────────────
        $class7A = $classIds['ABAMA_A-Grade 7A'];

        $exam1 = Exam::create([
            'school_id' => $school->id,
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
            'venue' => 'Exam Hall A',
        ]);

        $exam2 = Exam::create([
            'school_id' => $school->id,
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
            'venue' => 'Exam Hall A',
        ]);

        foreach (['STU-A001', 'STU-A002', 'STU-A003', 'STU-A004', 'STU-A005'] as $sKey) {
            $sId = $studentIds[$sKey];
            $mathScore = rand(55, 95);
            ExamResult::create([
                'exam_id' => $exam1->id,
                'student_id' => $sId,
                'school_id' => $school->id,
                'score' => $mathScore,
                'grade' => $mathScore >= 80 ? 'A' : ($mathScore >= 70 ? 'B' : ($mathScore >= 60 ? 'C' : 'D')),
            ]);
            $engScore = rand(60, 95);
            ExamResult::create([
                'exam_id' => $exam2->id,
                'student_id' => $sId,
                'school_id' => $school->id,
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
                'school_id' => $school->id,
                'class_id' => $class7A,
                'subject_id' => $subjectIds[$code],
                'teacher_id' => $staffIds[$teacherKey],
                'title' => $title,
                'description' => $description,
                'due_date' => $dueDate,
                'max_score' => $maxScore,
                'type' => $type,
            ]);
        }

        // ─── Leave requests ──────────────────────────────────────
        LeaveRequest::create([
            'school_id' => $school->id,
            'staff_id' => $staffIds['STF-A003'],
            'type' => 'sick',
            'start_date' => '2026-06-05',
            'end_date' => '2026-06-06',
            'reason' => 'Feeling unwell - mild flu symptoms',
            'status' => 'approved',
        ]);

        LeaveRequest::create([
            'school_id' => $school->id,
            'staff_id' => $staffIds['STF-B005'],
            'type' => 'annual',
            'start_date' => '2026-06-20',
            'end_date' => '2026-06-27',
            'reason' => 'Family vacation',
            'status' => 'pending',
        ]);

        // ─── Maintenance requests ────────────────────────────────
        MaintenanceRequest::create([
            'school_id' => $school->id,
            'location' => 'Room A201',
            'location_type' => 'campus',
            'title' => 'Broken window',
            'description' => 'Third window from the left has a crack and needs replacement',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        MaintenanceRequest::create([
            'school_id' => $school->id,
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
            'school_id' => $school->id,
            'person_name' => 'Mr. Johnson',
            'person_type' => 'visitor',
            'purpose' => 'Parent meeting',
            'check_in_time' => '2026-06-02T09:30:00Z',
            'host_name' => 'Mrs. Akosua Boateng',
            'id_type' => 'National ID',
            'id_number' => 'GHA-2938475',
        ]);

        SecurityLog::create([
            'school_id' => $school->id,
            'person_name' => 'Delivery Co.',
            'person_type' => 'vendor',
            'purpose' => 'Lab supplies delivery',
            'check_in_time' => '2026-06-02T11:00:00Z',
            'check_out_time' => '2026-06-02T11:45:00Z',
            'id_type' => 'Company Badge',
        ]);

        Event::create([
            'school_id' => $school->id,
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
            'school_id' => $school->id,
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
            'school_id' => $school->id,
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
            'school_id' => $school->id,
            'sender_id' => $akosua->id,
            'receiver_id' => $admin->id,
            'body' => 'Good morning! The Grade 8 math exam papers are ready for review.',
            'is_read' => false,
            'created_at' => now()->subDays(1)->setTime(12, 42),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $admin->id,
            'receiver_id' => $akosua->id,
            'body' => 'Thanks Akosua. Please share them with the exam committee.',
            'is_read' => true,
            'created_at' => now()->subDays(1)->setTime(12, 55),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $akosua->id,
            'receiver_id' => $admin->id,
            'body' => 'Will do. Also, should we reschedule the mock exam?',
            'is_read' => false,
            'created_at' => now()->subDays(1)->setTime(13, 10),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $yaw->id,
            'receiver_id' => $admin->id,
            'body' => 'Lab equipment for the physics practical has arrived.',
            'is_read' => false,
            'created_at' => now()->subHours(5),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $admin->id,
            'receiver_id' => $yaw->id,
            'body' => 'Great news! Let me know if anything is missing.',
            'is_read' => true,
            'created_at' => now()->subHours(4)->subMinutes(30),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $abena->id,
            'receiver_id' => $admin->id,
            'body' => 'Parent-teacher conference slots are filling up fast.',
            'is_read' => true,
            'created_at' => now()->subDays(2)->setTime(9, 15),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $admin->id,
            'receiver_id' => $abena->id,
            'body' => 'Please send me the updated schedule by Friday.',
            'is_read' => true,
            'created_at' => now()->subDays(2)->setTime(10, 0),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $abena->id,
            'receiver_id' => $admin->id,
            'body' => 'Here is the draft schedule. Let me know your thoughts!',
            'is_read' => false,
            'created_at' => now()->subHours(2),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $admin->id,
            'receiver_id' => $kofi->id,
            'body' => 'Can you prepare the ICT lab for the coding workshop next week?',
            'is_read' => true,
            'created_at' => now()->subDays(3)->setTime(14, 30),
        ]);

        Message::create([
            'school_id' => $school->id,
            'sender_id' => $kofi->id,
            'receiver_id' => $admin->id,
            'body' => 'Already on it! 💻✨',
            'is_read' => true,
            'created_at' => now()->subDays(3)->setTime(15, 0),
        ]);

        $accounting = app(AccountingService::class);
        $accounting->ensureChartOfAccounts($school->id);
        $accounting->ensurePettyCashFund($school->id, $admin->id);
        FeePayment::forSchool($school->id)->each(fn (FeePayment $p) => $accounting->postFeePayment($p));
        Expense::forSchool($school->id)->where('status', 'approved')->each(fn (Expense $e) => $accounting->postExpense($e));

        $this->command->info('Seeded ABAMA International Schools demo data.');
        $this->command->info('Login: admin@abama.edu.gh / password (admin) or superadmin@scholaros.test / password (superadmin)');
    }
}
