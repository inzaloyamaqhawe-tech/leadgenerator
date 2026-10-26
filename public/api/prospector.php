<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
try {
    if($_SERVER['REQUEST_METHOD']!=='POST')tp_json(['ok'=>false,'error'=>'Method not allowed.'],405);
    $auth=tp_auth();$input=tp_input();$result=tp_crm(array_merge($input,['actor'=>$auth['actor']]));
    tp_json($result['json'],$result['status']);
}catch(Throwable $e){error_log((string)$e);tp_json(['ok'=>false,'error'=>'The shared CRM database is unavailable.'],502);}
