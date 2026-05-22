<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('department');
            $table->enum('employment_type', ['Full Time', 'Part Time', 'Contract', 'Internship'])->default('Full Time');
            $table->longText('about');
            $table->json('what_you_do');
            $table->json('about_you');
            $table->json('bonus')->nullable();
            $table->string('salary_range')->nullable();
            $table->enum('status', ['draft', 'published', 'closed'])->default('draft');
            $table->integer('views')->default(0);
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        
        Schema::create('job_posting_branch', function (Blueprint $table) {
            $table->foreignUuid('job_posting_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('branch_id')->constrained()->cascadeOnDelete();
            $table->primary(['job_posting_id', 'branch_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_posting_branch');
        Schema::dropIfExists('job_postings');
    }
};
