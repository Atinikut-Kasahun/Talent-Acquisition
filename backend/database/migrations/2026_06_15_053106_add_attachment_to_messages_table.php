<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('attachment_url')->nullable();
            $table->string('attachment_type')->nullable();
            $table->string('attachment_name')->nullable();
            // allow body to be nullable if we only send an attachment
            $table->text('body')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['attachment_url', 'attachment_type', 'attachment_name']);
            $table->text('body')->nullable(false)->change();
        });
    }
};
