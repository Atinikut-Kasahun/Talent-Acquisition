<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Str;

$email = $argv[1] ?? 'Neba@droga.com';
$name = $argv[2] ?? 'Neba';
$pass = $argv[3] ?? 'password';
$role = $argv[4] ?? 'managing director';

$user = User::firstOrCreate([
    'email' => $email
], [
    'name' => $name,
    'password' => bcrypt($pass),
    'role' => $role,
    'is_active' => true,
]);

if ($user->wasRecentlyCreated) {
    echo "Created user: {$user->email}\n";
} else {
    echo "User already exists: {$user->email}\n";
}
