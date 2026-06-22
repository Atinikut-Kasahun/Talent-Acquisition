<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$application = App\Models\JobApplication::where('first_name', 'Abenezer')->first();
$media = $application->getMedia('certifications');
$application->certifications_list = $media->map(fn($m) => ['url' => $m->getUrl()]);

echo json_encode($application);
