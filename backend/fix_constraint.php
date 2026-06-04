<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");
    DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role::text = ANY (ARRAY['superadmin'::text, 'admin'::text, 'hr'::text, 'viewer'::text, 'managing director'::text, 'general Manager'::text, 'HR manager'::text]))");
    
    $u = App\Models\User::where('email', 'Tesfish@droga.com')->first();
    if ($u) {
        $u->role = 'general Manager';
        $u->save();
        echo "Role updated successfully after fixing constraint!\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
