<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Examination Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        h2 { font-size: 16px; margin: 18px 0 8px; }
        h3 { font-size: 14px; margin: 14px 0 6px; }
        .muted { color: #555; margin-bottom: 12px; }
        .stats { margin: 12px 0; }
        .stats span { display: inline-block; margin-right: 18px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; }
        .section { margin-top: 18px; page-break-inside: avoid; }
    </style>
</head>
<body>
@php
    $type = $report['type'] ?? 'overall';
    $period = $report['period']['label'] ?? '';
    $summary = $report['summary'] ?? [];
@endphp

@if ($type === 'student')
    @php $student = $report['student']; @endphp
    <h1>Student Examination Report</h1>
    <p class="muted"><strong>{{ $student['name'] }}</strong> · {{ $student['studentId'] }} · {{ $student['gradeLevel'] }} {{ $student['classSection'] }}<br>{{ $period }}</p>
    <div class="stats">
        <span><strong>Exams Taken:</strong> {{ $summary['examsTaken'] ?? 0 }}</span>
        <span><strong>Average:</strong> {{ $summary['averageScore'] ?? '—' }}%</span>
        <span><strong>Passed:</strong> {{ $summary['passed'] ?? 0 }}</span>
        <span><strong>Failed:</strong> {{ $summary['failed'] ?? 0 }}</span>
    </div>
    <table>
        <thead><tr><th>Exam</th><th>Subject</th><th>Class</th><th>Term</th><th>Score</th><th>Grade</th><th>Status</th></tr></thead>
        <tbody>
        @foreach ($report['rows'] as $row)
            <tr>
                <td>{{ $row['title'] }}</td>
                <td>{{ $row['subject'] ?? '—' }}</td>
                <td>{{ $row['className'] ?? '—' }}</td>
                <td>{{ $row['term'] ?? '—' }}</td>
                <td>{{ isset($row['score']) ? $row['score'].'/'.$row['maxScore'] : '—' }}</td>
                <td>{{ $row['grade'] ?? '—' }}</td>
                <td>{{ $row['passed'] === null ? '—' : ($row['passed'] ? 'Pass' : 'Fail') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

@elseif ($type === 'class')
    @php $class = $report['class']; @endphp
    <h1>Class Examination Report — {{ $class['name'] }}</h1>
    <p class="muted">{{ $period }}</p>
    <div class="stats">
        <span><strong>Students:</strong> {{ $summary['studentCount'] ?? 0 }}</span>
        <span><strong>Exams:</strong> {{ $summary['examCount'] ?? 0 }}</span>
        <span><strong>Class Average:</strong> {{ $summary['classAverage'] ?? '—' }}%</span>
    </div>
    <table>
        <thead><tr><th>Student</th><th>ID</th><th>Exams Taken</th><th>Average</th></tr></thead>
        <tbody>
        @foreach ($report['students'] as $student)
            <tr>
                <td>{{ $student['name'] }}</td>
                <td>{{ $student['studentNumber'] }}</td>
                <td>{{ $student['examsTaken'] ?? 0 }}</td>
                <td>{{ $student['averageScore'] ?? '—' }}%</td>
            </tr>
        @endforeach
        </tbody>
    </table>

@elseif ($type === 'subject')
    @php $subject = $report['subject']; @endphp
    <h1>Subject Examination Report — {{ $subject['name'] }}</h1>
    <p class="muted">{{ $period }}</p>
    @foreach ($report['exams'] as $exam)
        <div class="section">
            <h2>{{ $exam['title'] }} · {{ $exam['className'] ?? '' }}</h2>
            <p class="muted">Avg: {{ $exam['summary']['averageScore'] ?? '—' }}% · Pass rate: {{ $exam['summary']['passRate'] ?? '—' }}%</p>
            <table>
                <thead><tr><th>Student</th><th>Score</th><th>Grade</th><th>Remarks</th></tr></thead>
                <tbody>
                @foreach ($exam['results'] as $result)
                    <tr>
                        <td>{{ $result['studentName'] }}</td>
                        <td>{{ $result['score'] }}</td>
                        <td>{{ $result['grade'] ?? '—' }}</td>
                        <td>{{ $result['remarks'] ?? '' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endforeach

@else
    <h1>Overall Examinations Report</h1>
    <p class="muted">{{ $period }}</p>
    <div class="stats">
        <span><strong>Total Exams:</strong> {{ $summary['totalExams'] ?? 0 }}</span>
        <span><strong>Total Results:</strong> {{ $summary['totalResults'] ?? 0 }}</span>
        <span><strong>School Average:</strong> {{ $summary['schoolAverage'] ?? '—' }}%</span>
        <span><strong>Pass Rate:</strong> {{ $summary['passRate'] ?? '—' }}%</span>
    </div>

    <div class="section">
        <h2>By Class</h2>
        <table>
            <thead><tr><th>Class</th><th>Exams</th><th>Results</th><th>Average</th></tr></thead>
            <tbody>
            @foreach ($report['byClass'] as $row)
                <tr><td>{{ $row['className'] }}</td><td>{{ $row['examCount'] }}</td><td>{{ $row['resultsCount'] }}</td><td>{{ $row['averageScore'] ?? '—' }}</td></tr>
            @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>By Subject</h2>
        <table>
            <thead><tr><th>Subject</th><th>Exams</th><th>Results</th><th>Average</th></tr></thead>
            <tbody>
            @foreach ($report['bySubject'] as $row)
                <tr><td>{{ $row['subjectName'] }}</td><td>{{ $row['examCount'] }}</td><td>{{ $row['resultsCount'] }}</td><td>{{ $row['averageScore'] ?? '—' }}</td></tr>
            @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>By Term</h2>
        <table>
            <thead><tr><th>Term</th><th>Semester</th><th>Exams</th><th>Results</th><th>Average</th></tr></thead>
            <tbody>
            @foreach ($report['byTerm'] as $row)
                <tr><td>{{ $row['term'] }}</td><td>{{ $row['semester'] ?? '—' }}</td><td>{{ $row['examCount'] }}</td><td>{{ $row['resultsCount'] }}</td><td>{{ $row['averageScore'] ?? '—' }}</td></tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endif
</body>
</html>
