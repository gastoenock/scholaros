<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Asset extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    public const ARCHIVE_RETENTION_DAYS = 30;

    protected $table = 'assets';

    protected $guarded = [];

    protected $casts = [
        'purchase_cost' => 'float',
        'current_value' => 'float',
        'quantity' => 'integer',
        'archived_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $asset): void {
            if (empty($asset->public_uuid)) {
                $asset->public_uuid = (string) Str::uuid();
            }
        });
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assigned_staff_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AssetAuditLog::class)->orderByDesc('created_at');
    }

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }

    public function isArchived(): bool
    {
        return $this->archived_at !== null;
    }

    public function daysUntilPermanentDeletion(): ?int
    {
        if (! $this->archived_at) {
            return null;
        }

        $purgeDate = $this->archived_at->copy()->addDays(self::ARCHIVE_RETENTION_DAYS);

        return max(0, (int) now()->diffInDays($purgeDate, false));
    }
}
