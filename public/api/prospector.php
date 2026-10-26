<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
try {
    if($_SERVER['REQUEST_METHOD']!=='POST')tp_json(['ok'=>false,'error'=>'Method not allowed.'],405);
    $auth=tp_auth();$input=tp_input();$result=tp_crm(array_merge($input,['actor'=>$auth['actor']]));
    if(($input['action']??'')==='list'&&$result['status']===200&&empty($result['json']['leads'])&&!empty($auth['actor']['canEdit'])){
        $leads=tp_supabase_rows('leads',$auth['headers']);if($leads)$result=tp_crm(['action'=>'bootstrap','actor'=>$auth['actor'],'leads'=>$leads,'activity'=>tp_supabase_rows('lead_activity',$auth['headers']),'photos'=>tp_supabase_rows('lead_photos',$auth['headers'])]);
    }
    tp_json($result['json'],$result['status']);
}catch(Throwable $e){error_log((string)$e);tp_json(['ok'=>false,'error'=>'The shared CRM database is unavailable.'],502);}
