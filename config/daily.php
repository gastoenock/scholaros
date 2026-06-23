<?php

return [
    'api_key' => env('DAILY_API_KEY'),
    'api_url' => env('DAILY_API_URL', 'https://api.daily.co/v1'),
    'domain' => env('DAILY_DOMAIN'),
    'room_expiry_hours' => (int) env('DAILY_ROOM_EXPIRY_HOURS', 2),
    // WebRTC requires HTTPS (or localhost). On HTTP dev hosts, the UI opens Daily.co in a new tab.
];
