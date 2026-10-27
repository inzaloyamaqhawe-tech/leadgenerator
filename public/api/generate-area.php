<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';

function area_output_text(array $response): string {
    $text='';foreach(($response['output']??[]) as $item){if(($item['type']??'')!=='message')continue;foreach(($item['content']??[]) as $content)if(($content['type']??'')==='output_text')$text.=(string)($content['text']??'');}return trim($text);
}
try {
    if($_SERVER['REQUEST_METHOD']!=='POST')tp_json(['ok'=>false,'error'=>'Method not allowed.'],405);tp_same_origin();
    $auth=tp_auth();if(empty($auth['actor']['canEdit']))tp_json(['ok'=>false,'error'=>'This account has view-only access.'],403);
    tp_rate_limit('generate-area',(string)$auth['actor']['id'],60);
    $input=tp_input();$area=trim((string)($input['area']??''));$country=trim((string)($input['country']??'South Africa'));$target=(int)($input['target']??25);
    if(mb_strlen($area)<2||mb_strlen($area)>160||mb_strlen($country)<2||mb_strlen($country)>100)tp_json(['ok'=>false,'error'=>'Enter a valid area and country.'],400);
    if(!in_array($target,[25,50],true))$target=25;
    $cfg=tp_config();if(empty($cfg['openai_api_key']))tp_json(['ok'=>false,'error'=>'Area research is not configured on this server.'],503);
    $industries=['Shopping centre / mall','Residential estate / complex','Fuel station','Quick-service restaurant','Butchery / shisanyama','Hair & beauty salon','Tyre fitment','Motor repairs / panel beating','Car wash','Bottle store / liquor','Private clinic / hospital','Beverage distribution depot','Bakery / food production','Cold storage / ice','Laundromat','Other high-energy business'];
    $prompt='Research '.$area.', '.$country.' for rooftop-solar and battery prospects. Find up to '.$target.' real, publicly verifiable malls, shopping centres, retail stores, residential estates/complexes and high-energy businesses. Search broadly across official websites, business listings and maps/listing pages. Do not invent a business, phone, email, address, website, coordinates, utility or source. Unknown values must be null. Prefer exact street addresses and direct source URLs. Classify every result using only the allowed industries. Research the default electricity and water providers for this area, but mark confidence low or medium unless an authoritative utility source confirms it. Existing rooftop solar must be unknown unless a public source explicitly confirms it.';
    $nullableString=['anyOf'=>[['type'=>'string'],['type'=>'null']]];$nullableNumber=['anyOf'=>[['type'=>'number'],['type'=>'null']]];$nullableBoolean=['anyOf'=>[['type'=>'boolean'],['type'=>'null']]];
    $leadProps=['business_name'=>['type'=>'string'],'brand'=>$nullableString,'industry'=>['type'=>'string','enum'=>$industries],'suburb'=>$nullableString,'address'=>$nullableString,'standalone'=>$nullableBoolean,'lat'=>$nullableNumber,'lng'=>$nullableNumber,'phone'=>$nullableString,'email'=>$nullableString,'website'=>$nullableString,'owner_operator'=>$nullableString,'energy_profile'=>$nullableString,'notes'=>$nullableString,'source_url'=>['type'=>'string']];
    $leadSchema=['type'=>'object','additionalProperties'=>false,'properties'=>$leadProps,'required'=>array_keys($leadProps)];
    $schema=['type'=>'object','additionalProperties'=>false,'properties'=>[
        'area'=>['type'=>'string'],'country'=>['type'=>'string'],'electricity_provider'=>$nullableString,'water_provider'=>$nullableString,'utility_confidence'=>['type'=>'string','enum'=>['low','medium','high']],'utility_note'=>$nullableString,'utility_source'=>$nullableString,
        'leads'=>['type'=>'array','items'=>$leadSchema]
    ],'required'=>['area','country','electricity_provider','water_provider','utility_confidence','utility_note','utility_source','leads']];
    $ai=tp_http('https://api.openai.com/v1/responses','POST',['Content-Type: application/json','Authorization: Bearer '.$cfg['openai_api_key']],[
        'model'=>$cfg['openai_research_model']??$cfg['openai_model']??'gpt-4.1-mini','tools'=>[['type'=>'web_search']],
        'instructions'=>'You are Bolide Township Prospector research. Return only verified public business data in the required schema. Never fabricate missing details. Deduplicate results within the batch.',
        'input'=>$prompt,'text'=>['format'=>['type'=>'json_schema','name'=>'area_research','strict'=>true,'schema'=>$schema]],'max_output_tokens'=>20000
    ],150);
    if($ai['status']>=400){$code=(string)($ai['json']['error']['code']??'');error_log('OpenAI area research error '.$ai['status'].' '.$code);if(in_array($code,['credit_balance_exhausted','insufficient_quota'],true))tp_json(['ok'=>false,'error'=>'Area research needs OpenAI API credits. Please contact the system administrator.'],503);tp_json(['ok'=>false,'error'=>'The research service is temporarily unavailable.'],502);}
    $text=area_output_text($ai['json']);$research=json_decode($text,true);if(!is_array($research)||!is_array($research['leads']??null))tp_json(['ok'=>false,'error'=>'The research service returned incomplete area data. Please try again.'],502);
    $result=tp_crm(['action'=>'generateArea','actor'=>$auth['actor'],'requestedArea'=>$area,'country'=>$country,'research'=>$research]);
    tp_json($result['json'],$result['status']);
} catch(Throwable $e){error_log((string)$e);tp_json(['ok'=>false,'error'=>'The area could not be researched and saved.'],502);}
