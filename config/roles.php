<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tenant user roles (users table on tenant DB)
    |--------------------------------------------------------------------------
    */
    'tenant' => [
        'admin',
        'teacher',
        'student',
        'parent',
        'admin_staff',
        'principal',
        'vice_principal',
    ],

    /*
    | Allowed roles for the main /dashboard home (not parent portal).
    */
    'dashboard' => [
        'admin',
        'admin_staff',
        'principal',
        'vice_principal',
    ],

    'teacher_dashboard' => ['teacher'],

    'student_dashboard' => ['student'],

    /*
    | Module route files => allowed tenant roles. null = any authenticated tenant user.
    | Platform admins managing a school bypass these checks.
    */
    'modules' => [
        'profile.php' => null,
        'parent-portal.php' => ['parent'],
        'students.php' => ['admin', 'teacher'],
        'staff.php' => ['admin'],
        'admissions.php' => ['admin'],
        'classes.php' => ['admin', 'teacher'],
        'rooms.php' => ['admin'],
        'attendance.php' => ['admin', 'teacher'],
        'timetable.php' => ['admin', 'teacher', 'student'],
        'academic-calendar.php' => ['admin'],
        'meetings.php' => ['admin', 'teacher', 'parent'],
        'events.php' => ['admin', 'teacher'],
        'payroll.php' => ['admin'],
        'transport.php' => ['admin', 'parent'],
        'dormitory.php' => ['admin'],
        'assets.php' => ['admin'],
        'analytics.php' => ['admin'],
        'messages.php' => ['admin', 'teacher', 'student', 'parent'],
        'notifications.php' => ['admin', 'teacher', 'student', 'parent', 'admin_staff', 'principal', 'vice_principal'],
        'library.php' => ['admin', 'teacher', 'student'],
        'campus.php' => ['admin'],
        'settings.php' => ['admin'],
    ],

];
