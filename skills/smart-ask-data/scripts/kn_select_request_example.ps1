<#
.SYNOPSIS
  kn_select：POST JSON（auth、query、kn_ids）+ 头 x-business-domain、Authorization。详见 references/kn-select.md。

.DESCRIPTION
  推荐入口已改为同目录 kn_select_request_example.py（跨平台、无 UTF-8 BOM 问题）。本文件仅保留作 Invoke-RestMethod / 证书策略对照。

.EXAMPLE
  $env:KN_SELECT_TOKEN = (kweaver token).Trim(); python .\kn_select_request_example.py --insecure -q "销售域上月各区域销售额统计用哪张 KN？"
  # 遗留：$t = (kweaver token).Trim(); .\kn_select_request_example.ps1 -Token $t -Query "..." -Utf8Console -SkipCertCheck
#>
[CmdletBinding()]
param(
    [string] $Query = "",
    [string] $Token = "",
    [string] $KnIdsCsv = "d71o5e1e8q1nr9l7mb80",
    [string] $BaseUrl = "https://dip-poc.aishu.cn",
    [string] $XBusinessDomain = "bd_public",
    [switch] $SkipCertCheck,
    [switch] $Utf8Console,
    [string] $OutFile = ""
)

if ([string]::IsNullOrWhiteSpace($Query)) {
    $Query = "销售域中需要查询上个月各区域销售额与订单量，目标是定位可用于统计的订单明细表与相关维度表"
}
if ([string]::IsNullOrWhiteSpace($Token)) {
    $Token = '{token}'
}

$ErrorActionPreference = "Stop"
$KnIds = @(($KnIdsCsv -split ",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
$Uri = "$BaseUrl/api/af-sailor-agent/v1/assistant/tools/kn_select"

if ($SkipCertCheck -and $PSVersionTable.PSVersion.Major -lt 6) {
    Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class KnSelTrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object KnSelTrustAllCertsPolicy
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
}

if ($Utf8Console) {
    $script:_ksPrevConsoleOut = [Console]::OutputEncoding
    $script:_ksPrevConsoleIn = [Console]::InputEncoding
    $script:_ksPrevOutputEncoding = $OutputEncoding
    $enc = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = $enc
    [Console]::InputEncoding = $enc
    $OutputEncoding = $enc
}

try {
    $payload = [ordered]@{
        auth   = @{ token = $Token }
        query  = $Query
        kn_ids = [string[]]@($KnIds)
    }

    if ((Get-Command ConvertTo-Json).Parameters.ContainsKey("EscapeHandling")) {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20 -Compress:$false -EscapeHandling Default
    } else {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20 -Compress:$false
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) {
        Add-Type -AssemblyName System.Web.Extensions -ErrorAction Stop
        $js = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $js.MaxJsonLength = 67108864
        $jsonBody = $js.Serialize($payload)
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) { $jsonBody = "{}" }

    $headers = @{
        "x-business-domain" = $XBusinessDomain
        "Authorization"     = $Token
    }
    $irmParams = @{
        Uri         = $Uri
        Method      = "Post"
        Body        = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
        ContentType = "application/json; charset=utf-8"
        Headers     = $headers
        TimeoutSec  = 600
    }
    if ($PSVersionTable.PSVersion.Major -ge 6 -and $SkipCertCheck) {
        $irmParams["SkipCertificateCheck"] = $true
    }
    $response = Invoke-RestMethod @irmParams

    $ctj = @{ Depth = 30 }
    if ((Get-Command ConvertTo-Json).Parameters.ContainsKey("EscapeHandling")) {
        $ctj["EscapeHandling"] = "Default"
    }
    $responseText = $response | ConvertTo-Json @ctj

    if ($OutFile) {
        $outPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutFile)
        [System.IO.File]::WriteAllText($outPath, $responseText, [System.Text.UTF8Encoding]::new($false))
    }

    Write-Output $responseText
}
finally {
    if ($Utf8Console) {
        [Console]::OutputEncoding = $script:_ksPrevConsoleOut
        [Console]::InputEncoding = $script:_ksPrevConsoleIn
        $OutputEncoding = $script:_ksPrevOutputEncoding
    }
}
