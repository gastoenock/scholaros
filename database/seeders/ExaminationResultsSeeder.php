<?php

namespace Database\Seeders;

use Database\Seeders\Concerns\SeedsExaminationResults;
use Illuminate\Database\Seeder;

class ExaminationResultsSeeder extends Seeder
{
    use SeedsExaminationResults;

    public function run(): void
    {
        $schoolId = (int) tenant('id');

        if ($schoolId === 0) {
            $this->command?->error('ExaminationResultsSeeder must run inside a tenant context.');

            return;
        }

        $stats = $this->seedExaminationResults($schoolId);

        $this->command?->info(sprintf(
            'Seeded examinations: %d new exam(s), %d new result(s) across %d class(es) and %d subject(s).',
            $stats['exams'],
            $stats['results'],
            $stats['classes'],
            $stats['subjects'],
        ));
    }
}
