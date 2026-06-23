<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\AssetAuditLog;

class AssetAuditLogger
{
    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public static function log(
        Asset $asset,
        string $action,
        string $summary,
        ?int $userId = null,
        ?array $metadata = null,
    ): AssetAuditLog {
        return AssetAuditLog::create([
            'school_id' => $asset->school_id,
            'asset_id' => $asset->id,
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'summary' => $summary,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
