<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$email = 'freshk@droga.com';
$user = User::where('email', $email)->first();
if (!$user) {
    echo "user not found\n";
    exit(1);
}
$user->password = bcrypt('password');
$user->save();
echo "password updated for {$email}\n";
