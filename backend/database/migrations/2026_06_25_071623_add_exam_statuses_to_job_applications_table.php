<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // Find and drop the existing CHECK constraint on the status column
            $constraints = DB::select("
                SELECT con.conname
                FROM pg_catalog.pg_constraint con
                INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
                INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
                WHERE rel.relname = 'job_applications'
                AND con.contype = 'c'
                AND con.conname ILIKE '%status%'
            ");

            foreach ($constraints as $constraint) {
                DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS \"{$constraint->conname}\"");
            }

            // Add new CHECK constraint that includes all 9 statuses
            DB::statement("ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (
                status IN ('new','reviewing','shortlisted','written_exam','technical_exam','interviewed','offered','rejected','withdrawn')
            )");

        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM(
                'new','reviewing','shortlisted','written_exam','technical_exam',
                'interviewed','offered','rejected','withdrawn'
            ) NOT NULL DEFAULT 'new'");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check");
            DB::statement("ALTER TABLE job_applications ADD CONSTRAINT job_applications_status_check CHECK (
                status IN ('new','reviewing','shortlisted','interviewed','offered','rejected','withdrawn')
            )");
        } elseif ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement("ALTER TABLE job_applications MODIFY COLUMN status ENUM(
                'new','reviewing','shortlisted','interviewed','offered','rejected','withdrawn'
            ) NOT NULL DEFAULT 'new'");
        }
    }
};
