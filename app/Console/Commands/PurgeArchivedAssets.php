<?php

namespace App\Console\Commands;

use App\Models\Asset;
use App\Models\School;
use App\Services\AssetAuditLogger;
use Illuminate\Console\Command;

class PurgeArchivedAssets extends Command
{
    protected $signature = 'tenants:purge-archived-assets';

    protected $description = 'Permanently soft-delete archived inventory items older than the retention period';

    public function handle(): int
    {
        $totalPurged = 0;

        tenancy()->runForMultiple(null, function () use (&$totalPurged) {
            $cutoff = now()->subDays(Asset::ARCHIVE_RETENTION_DAYS);

            $assets = Asset::query()
                ->whereNotNull('archived_at')
                ->where('archived_at', '<=', $cutoff)
                ->get();

            foreach ($assets as $asset) {
                AssetAuditLogger::log(
                    $asset,
                    'permanently_deleted',
                    'Permanently removed after '.Asset::ARCHIVE_RETENTION_DAYS.' days in archive',
                    null,
                );

                $asset->delete();
                $totalPurged++;
            }
        });

        $schoolCount = School::query()->count();
        $this->info("Purged {$totalPurged} archived asset(s) across {$schoolCount} tenant(s).");

        return self::SUCCESS;
    }
}
