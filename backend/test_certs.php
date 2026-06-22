<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$apps = App\Models\JobApplication::all();
foreach($apps as $application) {
    echo $application->first_name . ":\n";
    $certs = $application->getMedia('certifications');
    foreach($certs as $c) {
        echo " - " . $c->file_name . "\n";
    }
}
