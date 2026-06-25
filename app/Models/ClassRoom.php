<?php

namespace App\Models;

use App\Models\Concerns\CamelCasesAttributes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClassRoom extends Model
{
    use CamelCasesAttributes;
    use SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'floor' => 'integer',
        'capacity' => 'integer',
    ];

    protected $appends = ['displayName'];

    public function scopeForSchool($query, $schoolId)
    {
        return $query->where('school_id', $schoolId);
    }

    public function schoolBranch(): BelongsTo
    {
        return $this->belongsTo(SchoolBranch::class);
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'class_room_id');
    }

    public function getDisplayNameAttribute(): string
    {
        if ($this->building) {
            return "{$this->building} — {$this->name}";
        }

        return $this->name;
    }
}
