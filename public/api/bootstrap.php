<?php
declare(strict_types=1);

function tp_config(): array {
    $path=__DIR__.'/config.php';if(!is_file($path))$path=__DIR__.'/config.example.php';return require $path;
}
function tp_json(array $value,int $status=200): never {http_response_code($status);header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');echo json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);exit;}
function tp_input(): array {$value=json_decode(file_get_contents('php://input')?:'',true);if(!is_array($value))tp_json(['ok'=>false,'error'=>'Invalid request body.'],400);return $value;}
function tp_http(string $url,string $method,array $headers=[],?array $body=null): array {
    $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_RETURNTRANSFER=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>10,CURLOPT_TIMEOUT=>40,CURLOPT_HTTPHEADER=>array_merge(['Accept: application/json'],$headers)]);if($body!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));$text=curl_exec($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);$error=curl_error($ch);curl_close($ch);if($text===false)throw new RuntimeException($error?:'Network request failed.');$json=json_decode($text,true);return ['status'=>$status,'json'=>is_array($json)?$json:['ok'=>false,'error'=>'Invalid service response.'],'text'=>$text];
}
function tp_token(): string {$header=(string)($_SERVER['HTTP_AUTHORIZATION']??'');if(!preg_match('/^Bearer\s+(.+)$/i',$header,$m))tp_json(['ok'=>false,'error'=>'Please sign in again.'],401);return $m[1];}
function tp_auth(): array {
    $cfg=tp_config();$cookie=(string)($_SERVER['HTTP_COOKIE']??'');
    $auth=tp_http($cfg['crm_auth_url']??'https://bolide.co.za/crm/api/auth.php','GET',$cookie!==''?['Cookie: '.$cookie]:[]);
    $user=$auth['json']['user']??null;
    if($auth['status']!==200||!is_array($user)||empty($user['id']))tp_json(['ok'=>false,'error'=>'Please sign in again.'],401);
    return ['actor'=>['id'=>(string)$user['id'],'email'=>(string)($user['email']??''),'name'=>(string)($user['name']??$user['email']??'Team member'),'active'=>true,'canEdit'=>in_array(($user['role']??''),['admin','rep'],true)]];
}
function tp_crm(array $body): array {$cfg=tp_config();return tp_http($cfg['crm_api_url'],'POST',['Content-Type: application/json','X-Bolide-Api-Secret: '.$cfg['crm_api_secret']],$body);}
function tp_supabase_rows(string $table,array $headers): array {
    $cfg=tp_config();$all=[];for($page=0;$page<100;$page++){$from=$page*1000;$result=tp_http(rtrim($cfg['supabase_url'],'/').'/rest/v1/'.$table.'?select=*','GET',array_merge($headers,['Range: '.$from.'-'.($from+999)]));if($result['status']>=400)throw new RuntimeException('Could not read existing '.$table.'.');$rows=$result['json'];$all=array_merge($all,$rows);if(count($rows)<1000)break;}return $all;
}
