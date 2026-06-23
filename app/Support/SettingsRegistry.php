<?php

namespace App\Support;

class SettingsRegistry
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function platformDefinitions(): array
    {
        return [
            'general.platform_name' => [
                'group' => 'general',
                'label' => 'Platform Name',
                'type' => 'string',
                'default' => 'ScholarOS',
            ],
            'general.support_email' => [
                'group' => 'general',
                'label' => 'Support Email',
                'type' => 'string',
                'default' => 'support@scholaros.test',
            ],
            'general.maintenance_mode' => [
                'group' => 'general',
                'label' => 'Maintenance Mode',
                'type' => 'boolean',
                'default' => false,
                'description' => 'When enabled, only platform admins can access the system.',
            ],
            'registration.allow_applications' => [
                'group' => 'registration',
                'label' => 'Allow School Applications',
                'type' => 'boolean',
                'default' => true,
            ],
            'registration.auto_approve' => [
                'group' => 'registration',
                'label' => 'Auto-approve Applications',
                'type' => 'boolean',
                'default' => false,
            ],
            'registration.default_plan' => [
                'group' => 'registration',
                'label' => 'Default Plan for New Schools',
                'type' => 'select',
                'options' => ['starter', 'standard', 'premium'],
                'default' => 'starter',
            ],
            'email.from_name' => [
                'group' => 'email',
                'label' => 'Email From Name',
                'type' => 'string',
                'default' => 'ScholarOS',
            ],
            'email.from_address' => [
                'group' => 'email',
                'label' => 'Email From Address',
                'type' => 'string',
                'default' => 'noreply@scholaros.test',
            ],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function tenantDefinitions(): array
    {
        return [
            'general.academic_year' => [
                'group' => 'general',
                'label' => 'Current Academic Year',
                'type' => 'string',
                'default' => null,
            ],
            'general.timezone' => [
                'group' => 'general',
                'label' => 'Timezone',
                'type' => 'select',
                'options' => ['Africa/Dar_es_Salaam', 'Africa/Nairobi', 'UTC', 'America/New_York'],
                'default' => 'Africa/Dar_es_Salaam',
            ],
            'general.date_format' => [
                'group' => 'general',
                'label' => 'Date Format',
                'type' => 'select',
                'options' => ['MMM d, yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'],
                'default' => 'MMM d, yyyy',
            ],
            'general.school_motto' => [
                'group' => 'general',
                'label' => 'School Motto',
                'type' => 'string',
                'default' => '',
            ],
            'academics.default_term' => [
                'group' => 'academics',
                'label' => 'Default Term',
                'type' => 'select',
                'options' => ['Term 1', 'Term 2', 'Term 3', 'Term 4'],
                'default' => 'Term 1',
            ],
            'academics.passing_score' => [
                'group' => 'academics',
                'label' => 'Default Passing Score (%)',
                'type' => 'number',
                'default' => 50,
            ],
            'academics.show_grades_to_parents' => [
                'group' => 'academics',
                'label' => 'Show Grades to Parents',
                'type' => 'boolean',
                'default' => true,
            ],
            'academics.allow_late_submissions' => [
                'group' => 'academics',
                'label' => 'Allow Late Assignment Submissions',
                'type' => 'boolean',
                'default' => false,
            ],
            'notifications.send_sms_alerts' => [
                'group' => 'notifications',
                'label' => 'Send SMS Alerts',
                'type' => 'boolean',
                'default' => false,
            ],
            'notifications.send_email_digest' => [
                'group' => 'notifications',
                'label' => 'Send Weekly Email Digest',
                'type' => 'boolean',
                'default' => true,
            ],
            'notifications.attendance_alerts' => [
                'group' => 'notifications',
                'label' => 'Attendance Alert Notifications',
                'type' => 'boolean',
                'default' => true,
            ],
            'finance.currency' => [
                'group' => 'finance',
                'label' => 'Currency Code',
                'type' => 'select',
                'options' => ['TZS', 'USD', 'KES', 'GHS'],
                'default' => 'TZS',
            ],
            'finance.fee_reminder_days' => [
                'group' => 'finance',
                'label' => 'Fee Reminder (days before due)',
                'type' => 'number',
                'default' => 7,
            ],
            'finance.late_fee_percentage' => [
                'group' => 'finance',
                'label' => 'Late Fee (%)',
                'type' => 'number',
                'default' => 5,
            ],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function userPreferenceDefinitions(): array
    {
        return [
            'theme' => [
                'label' => 'Theme',
                'type' => 'select',
                'options' => ['system', 'light', 'dark'],
                'default' => 'system',
            ],
            'locale' => [
                'label' => 'Language',
                'type' => 'select',
                'options' => ['en', 'sw'],
                'default' => 'en',
            ],
            'email_notifications' => [
                'label' => 'Email Notifications',
                'type' => 'boolean',
                'default' => true,
            ],
            'sms_notifications' => [
                'label' => 'SMS Notifications',
                'type' => 'boolean',
                'default' => false,
            ],
            'compact_dashboard' => [
                'label' => 'Compact Dashboard Layout',
                'type' => 'boolean',
                'default' => false,
            ],
        ];
    }

    /**
     * @return list<string>
     */
    public static function platformGroups(): array
    {
        return ['general', 'registration', 'email'];
    }

    /**
     * @return list<string>
     */
    public static function tenantGroups(): array
    {
        return ['general', 'academics', 'notifications', 'finance'];
    }

    /**
     * @param  array<string, array<string, mixed>>  $definitions
     */
    public static function defaultAcademicYear(array $definitions): string
    {
        $year = (int) date('Y');

        return $year.'-'.($year + 1);
    }
}
