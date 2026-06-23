<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class DailyService
{
    public function isConfigured(): bool
    {
        return filled(config('daily.api_key'));
    }

    /**
     * @return array{name: string, url: string}
     */
    public function createRoom(int $schoolId, string $callType): array
    {
        $this->ensureConfigured();

        $name = 'scholaros-'.$schoolId.'-'.Str::lower(Str::random(12));
        $exp = now()->addHours((int) config('daily.room_expiry_hours', 2))->timestamp;

        $properties = [
            'exp' => $exp,
            'enable_chat' => true,
            'enable_screenshare' => $callType !== 'audio',
            'start_video_off' => $callType === 'audio',
            'max_participants' => $callType === 'conference' ? 50 : 2,
        ];

        $response = $this->client()->post('/rooms', [
            'name' => $name,
            'privacy' => 'private',
            'properties' => $properties,
        ])->throw();

        $data = $response->json();

        return [
            'name' => (string) ($data['name'] ?? $name),
            'url' => (string) ($data['url'] ?? ''),
        ];
    }

    public function createMeetingToken(
        string $roomName,
        string $userName,
        bool $isOwner,
        string $callType,
    ): string {
        $this->ensureConfigured();

        $exp = now()->addHours((int) config('daily.room_expiry_hours', 2))->timestamp;

        $response = $this->client()->post('/meeting-tokens', [
            'properties' => [
                'room_name' => $roomName,
                'user_name' => $userName,
                'is_owner' => $isOwner,
                'exp' => $exp,
                'start_video_off' => $callType === 'audio',
                'enable_screenshare' => $callType !== 'audio',
            ],
        ])->throw();

        $token = $response->json('token');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('Daily.co did not return a meeting token.');
        }

        return $token;
    }

    public function deleteRoom(?string $roomName): void
    {
        if (! $roomName || ! $this->isConfigured()) {
            return;
        }

        try {
            $this->client()->delete('/rooms/'.urlencode($roomName))->throw();
        } catch (RequestException $exception) {
            if ($exception->response?->status() !== 404) {
                report($exception);
            }
        }
    }

    private function client()
    {
        return Http::baseUrl(rtrim((string) config('daily.api_url'), '/'))
            ->withToken((string) config('daily.api_key'))
            ->acceptJson()
            ->asJson()
            ->timeout(15);
    }

    private function ensureConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Daily.co is not configured. Set DAILY_API_KEY in your environment.');
        }
    }
}
