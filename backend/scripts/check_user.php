<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

if (isset($argv[1]) && $argv[1] === 'list') {
    $users = User::orderBy('created_at')->get(['email','password','is_active','role']);
    foreach ($users as $u) {
        echo "EMAIL:" . $u->email . " ROLE:" . ($u->role ?? 'NULL') . " PASS:" . $u->password . " ACTIVE:" . ($u->is_active ? '1' : '0') . PHP_EOL;
    }
    exit(0);
}

$email = $argv[1] ?? 'Neba@droga.com';
$user = User::where('email', $email)->first();
if (! $user) {
    echo "NOT_FOUND\n";
    exit(0);
}
echo "EMAIL:" . $user->email . PHP_EOL;
echo "PASS:" . $user->password . PHP_EOL;
echo "ACTIVE:" . ($user->is_active ? '1' : '0') . PHP_EOL;

if (isset($argv[2]) && $argv[2] === 'verify') {
    $plain = $argv[3] ?? 'password';
    $ok = \Illuminate\Support\Facades\Hash::check($plain, $user->password);
    echo "PASSWORD_MATCH:" . ($ok ? '1' : '0') . PHP_EOL;
}
