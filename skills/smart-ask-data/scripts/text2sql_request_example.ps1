<#
.SYNOPSIS
  调用 text2sql（show_ds / gen_exec）assistant 工具接口。

.DESCRIPTION
  与 skills/smart-ask-data/references/text2sql.md 一致：
  直传 JSON：config、data_source、inner_llm、input、action、timeout、auth；
  HTTP 头含 Authorization、x-business-domain。
  sessionId 用于状态/缓存对齐；是否复用前一步会话由平台约定决定。
  data_source.kn 不得为 config 中 forbidden_ask_data_kn_ids（元数据 KN 等）。
  推荐入口为同目录 text2sql_request_example.py（跨平台、无 PowerShell 编码问题）；本文件仅作 Invoke-RestMethod 对照。

.PARAMETER Action
  show_ds（发现候选表）或 gen_exec（生成并执行 SQL）。

.PARAMETER UserQuery
  中文问题（写入 body.input）：show_ds 为发现意图；gen_exec 为完整问句。勿使用参数名 Input，以免与 PowerShell 语言元素冲突。

.PARAMETER Background
  gen_exec 必填，承接 show_ds 摘要；show_ds 通常传空字符串。

.PARAMETER Token
  访问令牌，须与 body.auth.token、Authorization 头一致。

.PARAMETER KnId
  第 1 步 kn_select 得到的 kn_id，写入 data_source.kn[0]。

.PARAMETER UserId
  与 config defaults.user_id 一致。

.PARAMETER SessionId
  sessionId 可按需复用或分别填写。

.PARAMETER BaseUrl
  网关根地址。

.PARAMETER XBusinessDomain
  HTTP 头 x-business-domain。

.PARAMETER ReturnDataLimit
  config.return_data_limit

.PARAMETER ReturnRecordLimit
  config.return_record_limit

.PARAMETER TimeoutSec
  body.timeout（秒）

.PARAMETER SkipCertCheck
  忽略 TLS 证书校验。

.PARAMETER Utf8Console
  临时 UTF-8 控制台。

.PARAMETER OutFile
  响应落盘 UTF-8 无 BOM。

.EXAMPLE
  $env:TEXT2SQL_TOKEN = (kweaver token).Trim(); $sid = [guid]::NewGuid().ToString()
  python .\text2sql_request_example.py -a show_ds -S $sid --insecure -i "销售域里区域、月份统计可能用到哪些表"

.EXAMPLE
  python .\text2sql_request_example.py -a gen_exec -S $sid --insecure -i "按区域汇总上月订单金额" -g "候选表：fact_sales_order..."
  # 遗留：.\text2sql_request_example.ps1 -Token $tok -Action show_ds ...
#>
[CmdletBinding()]
param(
    [ValidateSet("show_ds", "gen_exec")]
    [string] $Action = "show_ds",

    [string] $UserQuery = "销售域里做区域、月份统计可能用到哪些事实表和维度字段，列出表名与关键列",

    [string] $Background = "",

    [string] $Token = '{token}',

    [string] $KnId = "d71o5e1e8q1nr9l7mb80",

    [string] $UserId = "f6713976-1cf6-11f1-b2cd-d6e9efdbcbb2",

    [string] $SessionId = "550e8400-e29b-41d4-a716-446655440000",

    [string] $BaseUrl = "https://dip-poc.aishu.cn",

    [string] $XBusinessDomain = "bd_public",

    [int] $ReturnDataLimit = 2000,

    [int] $ReturnRecordLimit = 20,

    [int] $TimeoutSec = 120,

    [switch] $SkipCertCheck,

    [switch] $Utf8Console,

    [string] $OutFile = ""
)

$ErrorActionPreference = "Stop"
$DefaultGenExecBackgroundTemplate = "候选表：{tables}。关键字段：{key_fields}。过滤与口径：{filters_and_caliber}。统计目标：{target_metric}。"

if ($Action -eq "gen_exec" -and [string]::IsNullOrWhiteSpace($Background)) {
    $Background = $DefaultGenExecBackgroundTemplate
    Write-Warning "gen_exec 未传 -Background，已回退为默认模板（请按实际 show_ds 结果替换占位符）。"
}

$UrlPath = "/api/af-sailor-agent/v1/assistant/tools/text2sql"
$Uri = "$BaseUrl$UrlPath"

if ($SkipCertCheck) {
    if ($PSVersionTable.PSVersion.Major -lt 6) {
        # 不用 Add-Type @"..."@（结束符须顶格，易被缩进/弯引号破坏）；用回调等效忽略证书校验
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
        [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {
            param($sender, $certificate, $chain, $sslPolicyErrors)
            $true
        }
    }
}

if ($Utf8Console) {
    $script:_t2sPrevConsoleOut = [Console]::OutputEncoding
    $script:_t2sPrevConsoleIn = [Console]::InputEncoding
    $script:_t2sPrevOutputEncoding = $OutputEncoding
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = $utf8NoBom
    [Console]::InputEncoding = $utf8NoBom
    $OutputEncoding = $utf8NoBom
}

try {
    $innerLlm = [ordered]@{
        id                 = "1951511743712858112"
        name               = "deepseek_v3"
        temperature        = 0.1
        top_k              = 1
        top_p              = 1
        frequency_penalty  = 0
        presence_penalty   = 0
        max_tokens         = 20000
    }

    $payload = [ordered]@{
        config       = [ordered]@{
            background           = $Background
            return_data_limit    = $ReturnDataLimit
            return_record_limit  = $ReturnRecordLimit
            session_id           = $SessionId
            session_type         = "redis"
        }
        data_source  = [ordered]@{
            kn      = @($KnId)
            user_id = $UserId
        }
        inner_llm    = $innerLlm
        input        = $UserQuery
        action       = $Action
        timeout      = $TimeoutSec
        auth         = @{ token = $Token }
    }

    if ((Get-Command ConvertTo-Json).Parameters.ContainsKey("EscapeHandling")) {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20 -Compress:$false -EscapeHandling Default
    } else {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20 -Compress:$false
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) {
        Add-Type -AssemblyName System.Web.Extensions -ErrorAction Stop
        $jsSerializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $jsSerializer.MaxJsonLength = 67108864
        $jsonBody = $jsSerializer.Serialize($payload)
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) { $jsonBody = "{}" }

    Write-Host "=== REQUEST URL ===" -ForegroundColor Cyan
    Write-Host $Uri
    Write-Host "=== REQUEST BODY (preview) ===" -ForegroundColor Cyan
    Write-Host $jsonBody
    Write-Host "=== RESPONSE ===" -ForegroundColor Cyan

    $headers = @{
        "x-business-domain" = $XBusinessDomain
        "Authorization"     = $Token
    }

    $irmParams = @{
        Uri             = $Uri
        Method          = "Post"
        Body            = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        ContentType     = "application/json; charset=utf-8"
        Headers         = $headers
        TimeoutSec      = [Math]::Min([Math]::Max($TimeoutSec + 30, 45), 600)
    }

    if ($PSVersionTable.PSVersion.Major -ge 6) {
        if ($SkipCertCheck) {
            $irmParams["SkipCertificateCheck"] = $true
        }
        $response = Invoke-RestMethod @irmParams
    } else {
        $response = Invoke-RestMethod @irmParams
    }

    $responseJsonParams = @{ Depth = 30 }
    if ((Get-Command ConvertTo-Json).Parameters.ContainsKey("EscapeHandling")) {
        $responseJsonParams["EscapeHandling"] = "Default"
    }
    $responseText = $response | ConvertTo-Json @responseJsonParams

    if ($OutFile) {
        $outPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutFile)
        [System.IO.File]::WriteAllText($outPath, $responseText, [System.Text.UTF8Encoding]::new($false))
        Write-Host "=== WROTE UTF-8 (no BOM) ===" -ForegroundColor Green
        Write-Host $outPath
    }

    Write-Output $responseText
}
finally {
    if ($Utf8Console) {
        [Console]::OutputEncoding = $script:_t2sPrevConsoleOut
        [Console]::InputEncoding = $script:_t2sPrevConsoleIn
        $OutputEncoding = $script:_t2sPrevOutputEncoding
    }
}
