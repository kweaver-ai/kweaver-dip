<#
.SYNOPSIS
  调用 query_object_instance（元数据 / 找表）tool-box 调试接口。

.DESCRIPTION
  与 scripts/query_object_instance_request.py 及
  skills/smart-search-tables/references/query-object-instance.md 一致：
  三层结构 body + query + header；HTTP 头含 Authorization、x-business-domain。

.PARAMETER Search
  写入 match/knn 的检索词（对应 condition.sub_conditions[*].value）。

.PARAMETER Token
  访问令牌，须与 body.auth.token、Authorization 头一致。默认占位，请替换或传参。

.PARAMETER KnId
  元数据知识网络 kn_id，默认 idrm_metadata_kn_object_lbb。

.PARAMETER AccountId
  JSON 根级 header.x-account-id，默认与 smart-search-tables config defaults.user_id 一致。

.PARAMETER Limit
  body.limit

.PARAMETER KnnLimitValue
  knn 子条件的 limit_value（默认 1000）。

.PARAMETER SkipCertCheck
  忽略 TLS 证书校验（便于内网 / 测试环境；等价于 Python requests verify=False）。

.PARAMETER Utf8Console
  将当前会话控制台与 $OutputEncoding 临时设为 UTF-8（无 BOM），脚本结束时还原。
  终端里中文检索词或响应显示乱码时可加此开关。

.PARAMETER OutFile
  若指定路径，将完整响应 JSON 以 UTF-8（无 BOM）写入该文件。
  注意：HTTP 请求体始终为 UTF-8；与落盘编码一致。

.EXAMPLE
  .\query_object_instance_request.ps1 -Search "绿色食品" -Token "ory_at_xxx..."

.EXAMPLE
  $env:KWEAVER_TOKEN = "ory_at_xxx..."
  .\query_object_instance_request.ps1 -Search "订单" -Token $env:KWEAVER_TOKEN

.EXAMPLE
  .\query_object_instance_request.ps1 -Search "订单" -Token $tok -Utf8Console -OutFile .\resp.json

.EXAMPLE
  在本脚本所在目录：$token = (kweaver token).Trim(); .\query_object_instance_request_example.ps1 -Token $token -Search "企业" -Utf8Console -SkipCertCheck
#>
[CmdletBinding()]
param(
    [string] $Search = "企业",
    [string] $Token = "{token}",
    [string] $KnId = "idrm_metadata_kn_object_lbb",
    [string] $AccountId = "f6713976-1cf6-11f1-b2cd-d6e9efdbcbb2",
    [int] $Limit = 100,
    [int] $KnnLimitValue = 1000,
    [switch] $SkipCertCheck,
    [switch] $Utf8Console,
    [string] $OutFile = ""
)

$ErrorActionPreference = "Stop"

$BaseUrl = "https://dip-poc.aishu.cn"
$UrlPath = "/api/agent-operator-integration/v1/tool-box/db4da399-af91-4214-afd9-1762d07c942d/tool/0f2b2b86-8af3-4fcc-9d8f-810a4f3fa6ce/debug"
$Uri = "$BaseUrl$UrlPath"
$XBusinessDomain = "bd_public"

if ($SkipCertCheck) {
    if ($PSVersionTable.PSVersion.Major -lt 6) {
        Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class QoiTrustAllCertsPolicy : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int problem) { return true; }
}
"@
        [System.Net.ServicePointManager]::CertificatePolicy = New-Object QoiTrustAllCertsPolicy
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    }
    # PowerShell 7+ 在下方 Invoke-RestMethod 使用 -SkipCertificateCheck
}

if ($Utf8Console) {
    $script:_qoiPrevConsoleOut = [Console]::OutputEncoding
    $script:_qoiPrevConsoleIn = [Console]::InputEncoding
    $script:_qoiPrevOutputEncoding = $OutputEncoding
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [Console]::OutputEncoding = $utf8NoBom
    [Console]::InputEncoding = $utf8NoBom
    $OutputEncoding = $utf8NoBom
}

try {
    $payload = [ordered]@{
        body = [ordered]@{
            auth         = @{ token = $Token }
            limit        = $Limit
            need_total   = $true
            properties   = @("embeddings_text")
            sort         = @(@{ direction = ""; field = "" })
            condition    = @{
                operation      = "or"
                sub_conditions = @(
                    @{
                        field     = "embeddings_text"
                        operation = "match"
                        value     = $Search
                    },
                    @{
                        limit_value = $KnnLimitValue
                        field       = "embeddings_text"
                        operation   = "knn"
                        value       = $Search
                        limit_key   = "k"
                    }
                )
            }
        }
        query = [ordered]@{
            kn_id                = $KnId
            ot_id                = "metadata"
            include_logic_params = $false
            include_type_info    = $false
        }
        header = [ordered]@{
            "x-account-id"   = $AccountId
            "x-account-type" = "user"
        }
    }

    # -Depth 避免嵌套被截断。PS 7.3+ 可用 EscapeHandling 减少 \uXXXX 转义，便于阅读中文。
    # 勿对哈希表/OrderedDictionary 使用管道：会被枚举为多个条目导致 ConvertTo-Json 绑定失败。
    if ((Get-Command ConvertTo-Json).Parameters.ContainsKey("EscapeHandling")) {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20 -EscapeHandling Default
    } else {
        $jsonBody = ConvertTo-Json -InputObject $payload -Depth 20
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) {
        Add-Type -AssemblyName System.Web.Extensions -ErrorAction Stop
        $jsSerializer = New-Object System.Web.Script.Serialization.JavaScriptSerializer
        $jsSerializer.MaxJsonLength = 67108864
        $jsonBody = $jsSerializer.Serialize($payload)
    }
    if ([string]::IsNullOrWhiteSpace($jsonBody)) {
        throw "无法将请求体序列化为 JSON（ConvertTo-Json 与 JavaScriptSerializer 均失败）。"
    }

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
        TimeoutSec      = 600
    }

    if ($PSVersionTable.PSVersion.Major -ge 6) {
        if ($SkipCertCheck) {
            $irmParams["SkipCertificateCheck"] = $true
        }
        $response = Invoke-RestMethod @irmParams
    }
    else {
        # Windows PowerShell 5.1：Body 用字节数组 + ContentType，避免编码问题
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
        [Console]::OutputEncoding = $script:_qoiPrevConsoleOut
        [Console]::InputEncoding = $script:_qoiPrevConsoleIn
        $OutputEncoding = $script:_qoiPrevOutputEncoding
    }
}
