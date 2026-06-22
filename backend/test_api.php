<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$controller = app()->make(App\Http\Controllers\ApplicationController::class);
$response = $controller->show('019eee77-67bb-7190-9c31-e0d31b349eb8'); // Abenezer's ID from previous test
echo $response->getContent();
