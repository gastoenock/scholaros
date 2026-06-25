<?php

namespace App\Services;

use App\Support\SimpleXlsx;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Http\Request;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AcademicReportExportService
{
    public function __construct(
        private AcademicReportService $reports,
    ) {}

    /**
     * @return array<string, mixed>|null
     */
    public function buildFromRequest(int $schoolId, Request $request): ?array
    {
        $type = $request->string('type', 'student')->toString();
        $yearId = $request->integer('yearId') ?: null;
        $semesterId = $request->integer('semesterId') ?: null;
        $termId = $request->integer('termId') ?: null;

        return match ($type) {
            'class' => $request->integer('classId')
                ? $this->reports->classReport($schoolId, $request->integer('classId'), $yearId, $semesterId, $termId)
                : null,
            'subject' => $request->integer('subjectId')
                ? $this->reports->subjectExamReport($schoolId, $request->integer('subjectId'), $yearId, $semesterId, $termId)
                : null,
            'overall' => $this->reports->overallExamsReport($schoolId, $yearId, $semesterId, $termId),
            default => $request->integer('studentId')
                ? $this->reports->studentReport($schoolId, $request->integer('studentId'), $yearId, $semesterId, $termId)
                : null,
        };
    }

    /**
     * @param  array<string, mixed>  $report
     */
    public function download(array $report, string $format): StreamedResponse
    {
        $filename = $this->filename($report, $format);

        return match ($format) {
            'pdf' => $this->toPdf($report, $filename),
            'docx', 'word' => $this->toWord($report, $filename),
            'xlsx', 'excel' => $this->toExcel($report, $filename),
            default => abort(422, 'Unsupported export format.'),
        };
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function toExcel(array $report, string $filename): StreamedResponse
    {
        $rows = $this->excelRows($report);

        return response()->streamDownload(function () use ($rows) {
            echo SimpleXlsx::write($rows);
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function toPdf(array $report, string $filename): StreamedResponse
    {
        if (! class_exists(Dompdf::class)) {
            abort(500, 'PDF export requires dompdf/dompdf. Run: composer update dompdf/dompdf');
        }

        $html = view('reports.academic', ['report' => $report])->render();

        $options = new Options;
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return response()->streamDownload(function () use ($dompdf) {
            echo $dompdf->output();
        }, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function toWord(array $report, string $filename): StreamedResponse
    {
        if (class_exists(PhpWord::class)) {
            return $this->toWordDocument($report, $filename);
        }

        $html = view('reports.academic', ['report' => $report])->render();

        return response()->streamDownload(function () use ($html) {
            echo $html;
        }, str_replace('.docx', '.doc', $filename), [
            'Content-Type' => 'application/msword',
        ]);
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function toWordDocument(array $report, string $filename): StreamedResponse
    {
        $phpWord = new PhpWord;
        $section = $phpWord->addSection();
        $period = $report['period']['label'] ?? 'Examination Report';

        $section->addTitle($this->reportTitle($report), 1);
        $section->addText($period);
        $section->addTextBreak(1);

        foreach ($this->excelRows($report) as $index => $row) {
            if ($index === 0) {
                continue;
            }

            if (count($row) === 1 && str_starts_with((string) $row[0], '—')) {
                $section->addTextBreak(1);
                $section->addText(substr((string) $row[0], 2), ['bold' => true]);

                continue;
            }

            $section->addText(implode(' | ', array_map(fn ($cell) => (string) ($cell ?? ''), $row)));
        }

        return response()->streamDownload(function () use ($phpWord) {
            $writer = IOFactory::createWriter($phpWord, 'Word2007');
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]);
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<list<mixed>>
     */
    private function excelRows(array $report): array
    {
        $period = $report['period']['label'] ?? '';
        $rows = [[$this->reportTitle($report)], [$period], []];

        return match ($report['type']) {
            'student' => array_merge($rows, $this->studentExcelRows($report)),
            'class' => array_merge($rows, $this->classExcelRows($report)),
            'subject' => array_merge($rows, $this->subjectExcelRows($report)),
            default => array_merge($rows, $this->overallExcelRows($report)),
        };
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<list<mixed>>
     */
    private function studentExcelRows(array $report): array
    {
        $student = $report['student'];
        $summary = $report['summary'] ?? [];

        $rows = [
            ['Student', $student['name'] ?? ''],
            ['Student ID', $student['studentId'] ?? ''],
            ['Grade', trim(($student['gradeLevel'] ?? '').' '.($student['classSection'] ?? ''))],
            ['Class Teacher', $report['classTeacher']['name'] ?? '—'],
            [],
            ['Subjects', $summary['subjectsTotal'] ?? count($report['rows'] ?? [])],
            ['Scored', $summary['examsTaken'] ?? 0],
            ['Average Score', $summary['averageScore'] ?? '—'],
            ['Passed', $summary['passed'] ?? 0],
            ['Failed', $summary['failed'] ?? 0],
            [],
            ['Subject', 'Exam', 'Score', 'Max', 'Grade', 'Status', 'Remarks'],
        ];

        foreach ($report['rows'] as $row) {
            $rows[] = [
                $row['subject'],
                $row['title'] ?? (($row['hasExam'] ?? false) ? '—' : 'No exam scheduled'),
                $row['score'] ?? '—',
                $row['maxScore'] ?? '—',
                $row['grade'] ?? '—',
                $row['passed'] === null ? '—' : ($row['passed'] ? 'Pass' : 'Fail'),
                $row['remarks'] ?? '',
            ];
        }

        if (! empty($report['classTeacherComment'])) {
            $rows[] = [];
            $rows[] = ['Class Teacher Comment', strip_tags($report['classTeacherComment'])];
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<list<mixed>>
     */
    private function classExcelRows(array $report): array
    {
        $cls = $report['class'];
        $summary = $report['summary'] ?? [];
        $subjects = $report['subjects'] ?? [];
        $subjectNames = $summary['subjects'] ?? array_column($subjects, 'name');

        $rows = [
            ['Class', $cls['name'] ?? ''],
            ['Grade Level', $cls['gradeLevel'] ?? ''],
            ['Section', $cls['section'] ?? ''],
            [],
            ['Students', $summary['studentCount'] ?? 0],
            ['Subjects', implode(', ', $subjectNames)],
            ['Class Average', $summary['classAverage'] ?? '—'],
            [],
            array_merge(['Student', 'Student ID'], $subjectNames, ['Average Score']),
        ];

        foreach ($report['students'] as $student) {
            $subjectResults = $student['subjectResults'] ?? $student['results'] ?? [];
            $rows[] = array_merge(
                [$student['name'], $student['studentNumber']],
                array_map(
                    fn ($result) => isset($result['score']) ? $result['score'] : '—',
                    $subjectResults,
                ),
                [$student['averageScore'] ?? '—'],
            );
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<list<mixed>>
     */
    private function subjectExcelRows(array $report): array
    {
        $subject = $report['subject'];
        $rows = [
            ['Subject', $subject['name'] ?? ''],
            ['Code', $subject['code'] ?? ''],
            [],
        ];

        foreach ($report['exams'] as $exam) {
            $rows[] = ['— '.$exam['title'].' · '.($exam['className'] ?? '')];
            $rows[] = ['Average', $exam['summary']['averageScore'] ?? '—', 'Pass Rate', ($exam['summary']['passRate'] ?? '—').'%'];
            $rows[] = ['Student', 'Student ID', 'Score', 'Grade', 'Remarks'];

            foreach ($exam['results'] as $result) {
                $rows[] = [
                    $result['studentName'],
                    $result['studentNumber'],
                    $result['score'],
                    $result['grade'] ?? '—',
                    $result['remarks'] ?? '',
                ];
            }

            $rows[] = [];
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $report
     * @return list<list<mixed>>
     */
    private function overallExcelRows(array $report): array
    {
        $summary = $report['summary'] ?? [];

        $rows = [
            ['Total Subjects', $summary['totalSubjects'] ?? count($report['bySubject'] ?? [])],
            ['Total Exams', $summary['totalExams'] ?? 0],
            ['Total Results', $summary['totalResults'] ?? 0],
            ['School Average', $summary['schoolAverage'] ?? '—'],
            ['Pass Rate', ($summary['passRate'] ?? '—').'%'],
            [],
            ['— By Class'],
            ['Class', 'Exams', 'Results', 'Average'],
        ];

        foreach ($report['byClass'] as $row) {
            $rows[] = [$row['className'], $row['examCount'], $row['resultsCount'], $row['averageScore'] ?? '—'];
        }

        $rows[] = [];
        $rows[] = ['— By Subject'];
        $rows[] = ['Subject', 'Exams', 'Results', 'Average'];

        foreach ($report['bySubject'] as $row) {
            $rows[] = [$row['subjectName'], $row['examCount'], $row['resultsCount'], $row['averageScore'] ?? '—'];
        }

        $rows[] = [];
        $rows[] = ['— By Term'];
        $rows[] = ['Term', 'Semester', 'Exams', 'Results', 'Average'];

        foreach ($report['byTerm'] as $row) {
            $rows[] = [$row['term'], $row['semester'] ?? '—', $row['examCount'], $row['resultsCount'], $row['averageScore'] ?? '—'];
        }

        return $rows;
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function reportTitle(array $report): string
    {
        return match ($report['type']) {
            'student' => 'Student Examination Report — '.($report['student']['name'] ?? ''),
            'class' => 'Class Examination Report — '.($report['class']['name'] ?? ''),
            'subject' => 'Subject Examination Report — '.($report['subject']['name'] ?? ''),
            default => 'Overall Examinations Report',
        };
    }

    /**
     * @param  array<string, mixed>  $report
     */
    private function filename(array $report, string $format): string
    {
        $slug = str($this->reportTitle($report))->slug()->limit(40, '');
        $extension = match ($format) {
            'pdf' => 'pdf',
            'docx', 'word' => 'docx',
            default => 'xlsx',
        };

        return "{$slug}-".now()->format('Y-m-d').".{$extension}";
    }
}
