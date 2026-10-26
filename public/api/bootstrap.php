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
    $token=tp_token();$cfg=tp_config();$headers=['apikey: '.$cfg['supabase_publishable_key'],'Authorization: Bearer '.$token];
    $user=tp_http(rtrim($cfg['supabase_url'],'/').'/auth/v1/user','GET',$headers);if($user['status']!==200||empty($user['json']['id']))tp_json(['ok'=>false,'error'=>'Please sign in again.'],401);$id=$user['json']['id'];
    $profile=tp_http(rtrim($cfg['supabase_url'],'/').'/rest/v1/profiles?id=eq.'.rawurlencode($id).'&select=id,full_name,email,is_active','GET',$headers);$row=$profile['json'][0]??null;if(!$row||empty($row['is_active']))tp_json(['ok'=>false,'error'=>'This account is inactive.'],403);
    $roles=tp_http(rtrim($cfg['supabase_url'],'/').'/rest/v1/user_roles?user_id=eq.'.rawurlencode($id).'&select=role','GET',$headers);$names=array_column($roles['json'],'role');
    return ['token'=>$token,'headers'=>$headers,'actor'=>['id'=>$id,'email'=>$row['email']??($user['json']['email']??''),'name'=>$row['full_name']?:($row['email']??'Team member'),'active'=>true,'canEdit'=>in_array('admin',$names,true)||in_array('member',$names,true)]];
}
function tp_crm(array $body): array {$cfg=tp_config();return tp_http($cfg['crm_api_url'],'POST',['Content-Type: application/json','X-Bolide-Api-Secret: '.$cfg['crm_api_secret']],$body);}
function tp_supabase_rows(string $table,array $headers): array {
    $cfg=tp_config();$all=[];for($page=0;$page<100;$page++){$from=$page*1000;$result=tp_http(rtrim($cfg['supabase_url'],'/').'/rest/v1/'.$table.'?select=*','GET',array_merge($headers,['Range: '.$from.'-'.($from+999)]));if($result['status']>=400)throw new RuntimeException('Could not read existing '.$table.'.');$rows=$result['json'];$all=array_merge($all,$rows);if(count($rows)<1000)break;}return $all;
}
