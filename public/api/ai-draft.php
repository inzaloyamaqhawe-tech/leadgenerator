<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
try {
    if($_SERVER['REQUEST_METHOD']!=='POST')tp_json(['ok'=>false,'error'=>'Method not allowed.'],405);$auth=tp_auth();$input=tp_input();
    if(empty($input['leadId'])||empty($input['channel'])||empty($input['language']))tp_json(['ok'=>false,'error'=>'Missing draft details.'],400);
    $leadResult=tp_crm(['action'=>'get','actor'=>$auth['actor'],'leadId'=>$input['leadId']]);$lead=$leadResult['json']['lead']??null;if(!$lead)tp_json(['ok'=>false,'error'=>'Lead not found.'],404);
    $cfg=tp_config();if(empty($cfg['lovable_api_key']))tp_json(['ok'=>false,'error'=>'AI drafting is not configured on this server.'],503);
    $consent=!empty($lead['marketing_consent'])?'':' The business has not consented to marketing. Make a written message a single consent request with an easy opt-out.';
    $prompt='Write a short, respectful '.$input['channel'].' in '.$input['language'].' for Bolide to '.$lead['business_name'].'. Industry: '.$lead['industry'].'. Area: '.($lead['suburb']??'').' '.$lead['township'].'. Electricity supplier: '.($lead['electricity_provider']??'unknown').'. Energy profile: '.($lead['energy_profile']??'unknown').'. Contact: '.($lead['contact_person']??'unknown').'. Mention a relevant benefit of rooftop solar or battery storage without inventing savings, prices or facts. Ask for a short site visit.'.$consent.' Sign off as The Bolide team. Keep messages under 120 words.';
    $ai=tp_http('https://ai.gateway.lovable.dev/v1/chat/completions','POST',['Content-Type: application/json','Authorization: Bearer '.$cfg['lovable_api_key']],['model'=>'google/gemini-3-flash-preview','stream'=>false,'messages'=>[['role'=>'user','content'=>$prompt]]]);if($ai['status']>=400)tp_json(['ok'=>false,'error'=>'AI drafting is temporarily unavailable.'],502);$text=$ai['json']['choices'][0]['message']['content']??'';if(!$text)tp_json(['ok'=>false,'error'=>'No draft was returned.'],502);tp_json(['ok'=>true,'text'=>$text]);
}catch(Throwable $e){error_log((string)$e);tp_json(['ok'=>false,'error'=>'The draft could not be generated.'],502);}
