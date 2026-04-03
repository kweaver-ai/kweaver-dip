<#
.SYNOPSIS
  调用 department_duty_query（部门职责）assistant 工具接口。

.DESCRIPTION
  与 skills/smart-search-tables/references/department-duty-query.md 一致：
  请求体为直传 JSON：`auth`、`query`、`kn_id`；HTTP 头含 Authorization、x-business-domain、x-trace-id。

.PARAMETER Query
  自然语言问题（写入 body.query）。

.PARAMETER Token
  访问令牌，须与 body.auth.token、Authorization 头一致。

.PARAMETER KnId
  职责知识网络 kn_id，默认 duty（与 smart-search-tables config 中 tools.department_duty_query.kn_id 一致）。

.PARAMETER BaseUrl
  网关根地址，默认与 config.base_url 一致。

.PARAMETER XBusinessDomain
  HTTP 头 x-business-domain，默认 bd_public。

.PARAMETER TraceId
  HTTP 头 x-trace-id；未传时自动生成 GUID。

.PARAMETER SkipCertCheck
  忽略 TLS 证书校验（内网 / 测试环境）。

.PARAMETER Utf8Console
  临时将控制台编码设为 UTF-8（无 BOM），脚本结束还原。

.PARAMETER OutFile
  将完整响应 JSON 以 UTF-8（无 BOM）写入该路径。

.EXAMPLE
  $tok = (kweaver token).Trim(); .\department_duty_query_request_example.ps1 -Token $tok -Query "信息技术部在数据资产目录管理中的职责？" -Utf8Console -SkipCertCheck
#>
[CmdletBinding()]
param(
    [string] $Query = "信息技术部在企业数据资产目录与指标口径管理中的职责是什么？与采购订单类宽表治理有何关系？",
    [string] $Token = "{token}",
    [string] $KnId = "duty",
    [string] $BaseUrl = "https://dip-poc.aishu.cn",
    [string] $XBusinessDomain = "bd_public",
    [string] $TraceId = "",
    [switch] $SkipCertCheck,
    [switch] $Utf8Console,
    [string] $OutFile = ""
)

$ErrorActionPreference = "Stop"

$UrlPath = "/api/af-sailor-agent/v1/assistant/tools/department_duty_query"
$Uri = "$BaseUrl$UrlPath"

if (-not $TraceId) {
    $TraceId = [guid]::NewGuid().ToString()
}

if ($SkipCertCheck) {
    if ($PSVersionTable.PSVersion.Major -lt 6) {
        Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class DdqTrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@
        [System.Net.ServicePointManager]::CertificatePolicy = New-Object DdqTrustAllCertsPolicy
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    }
}

if ($Utf8Console) {
    $script:_ddqPrevConsoleOut = [Console]::OutputEncoding
    $script:_ddqPrevConsoleIn = [Console]::InputEncoding
    $script:_ddqPrevOutputEncoding = $OutputEncoding
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = $utf8NoBom
    [Console]::InputEncoding = $utf8NoBom
    $OutputEncoding = $utf8NoBom
}

try {
    $payload = [ordered]@{
        auth   = @{ token = $Token }
        query  = $Query
        kn_id  = $KnId
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
    Write-Host "=== REQUEST BODY ===" -ForegroundColor Cyan
    Write-Host $jsonBody
    Write-Host "=== RESPONSE ===" -ForegroundColor Cyan

    $headers = @{
        "x-business-domain" = $XBusinessDomain
        "Authorization"     = $Token
        "x-trace-id"        = $TraceId
    }

    $irmParams = @{
        Uri             = $Uri
        Method          = "Post"
        Body            = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        ContentType     = "application/json; charset=utf-8"
        Headers         = $headers
        TimeoutSec      = 600
    }

    if ($PSVersionTable.PSVersion.Major -ge 6) {
        if ($SkipCertCheck) {
            $irmParams["SkipCertificateCheck"] = $true
        }
        $response = Invoke-RestMethod @irmParams
    }
    else {
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
        [Console]::OutputEncoding = $script:_ddqPrevConsoleOut
        [Console]::InputEncoding = $script:_ddqPrevConsoleIn
        $OutputEncoding = $script:_ddqPrevOutputEncoding
    }
}
