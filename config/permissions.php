<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Role → permission keys (used by RoleAccess + frontend usePermissions)
    |--------------------------------------------------------------------------
    */
    'roles' => [
        'admin' => [
            'dashboard.admin',
            'students.manage',
            'staff.manage',
            'classes.manage',
            'finance.manage',
            'finance.view',
            'transport.manage',
            'academics.manage',
            'library.manage',
            'settings.manage',
            'reports.manage',
        ],
        'teacher' => [
            'dashboard.teacher',
            'students.view',
            'classes.manage',
            'attendance.manage',
            'academics.manage',
            'library.manage',
            'reports.view',
        ],
        'student' => [
            'dashboard.student',
            'academics.view',
            'timetable.view',
            'library.view',
        ],
        'parent' => [
            'dashboard.parent',
            'finance.view',
            'academics.view',
            'transport.view',
        ],
        'admin_staff' => [
            'dashboard.staff',
        ],
        'principal' => [
            'dashboard.staff',
            'reports.view',
        ],
        'vice_principal' => [
            'dashboard.staff',
            'reports.view',
        ],
    ],

    /*
    | Platform admins managing a tenant receive all permissions.
    */
    'platform_admin' => ['*'],

];
