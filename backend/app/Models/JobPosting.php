<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class JobPosting extends Model
{
    use HasFactory, HasUuids, SoftDeletes, LogsActivity;

    protected $fillable = [
        'title',
        'slug',
        'department',
        'employment_type',
        'about',
        'what_you_do',
        'about_you',
        'bonus',
        'salary_range',
        'status',
        'views',
        'created_by',
    ];

    protected $casts = [
        'what_you_do' => 'array',
        'about_you' => 'array',
        'bonus' => 'array',
        'views' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'job_posting_branch');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(JobApplication::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['title', 'status', 'department'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
