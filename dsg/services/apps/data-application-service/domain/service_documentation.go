package domain

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"strconv"
	"strings"
	"sync"
	"text/template"
	"time"

	"github.com/jung-kurt/gofpdf"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// sanitizeFileName 将名称中的非法文件名字符替换为下划线
func sanitizeFileName(name string) string {
	if name == "" {
		return "接口文档"
	}
	replacer := strings.NewReplacer(
		"\\", "_",
		"/", "_",
		":", "_",
		"*", "_",
		"?", "_",
		"\"", "_",
		"<", "_",
		">", "_",
		"|", "_",
	)
	sanitized := replacer.Replace(name)
	// 去除首尾空白
	sanitized = strings.TrimSpace(sanitized)
	if sanitized == "" {
		return "接口文档"
	}
	return sanitized
}

// truncateForFileName 截断名称以适应文件名（只用于文件名，不影响PDF内容）
func truncateForFileName(name string, maxLen int) string {
	if maxLen <= 0 {
		maxLen = 25 // 默认25个字符
	}
	// 使用rune来计算字符数，避免截断UTF-8字符中间的字节
	runes := []rune(name)
	if len(runes) <= maxLen {
		return name
	}
	// 截断到指定长度（字符数，不是字节数）
	return string(runes[:maxLen])
}

// 模板定义
const (
	// Shell模板
	shellTemplate = `#调用接口
curl -X {{.Method}} '{{.ApiUrl}}' -k \
    -H 'Authorization: Bearer {access_token}' 
`

	// Go模板
	goTemplate = `package main

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const (
	// 证服务器地址
	SERVER_URL = "{{.AccessUrl}}"

	API_ENDPOINT    = "{{.ApiUrl}}"
	METHOD          = "{{.Method}}"
)

// HTTPClient 封装HTTP客户端
type HTTPClient struct {
	client *http.Client
}

// NewHTTPClient 创建新的HTTP客户端
func NewHTTPClient() *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
	Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // 仅测试环境使用,生产环境建议使用证书
			},
	    },
	}
}

// APICall 调用业务API
func (c *HTTPClient) APICall(method, accessToken, apiUrl string) ([]byte, error) {
	// 构建请求URL（如果是GET）
	queryValues := url.Values{}
	// queryValues.Set("param", "value") // 示例查询参数
	url := fmt.Sprintf("%s?%s", apiUrl, queryValues.Encode())

	// 构建请求体(如果是POST)
	data := map[string]interface{}{
		// 在此处添加需要发送的数据
	}
	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
	if err != nil {
			return nil, fmt.Errorf("序列化请求数据失败: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return responseBody, fmt.Errorf("API调用失败，状态码: %d, 响应: %s", resp.StatusCode, string(responseBody))
	}

	return responseBody, nil
}

func main() {


	// 创建HTTP客户端
	httpClient := NewHTTPClient()

	// 调用API
	fmt.Println("正在调用API...")
	response, err := httpClient.APICall(METHOD, accessToken, API_ENDPOINT)
	if err != nil {
		fmt.Printf("API调用失败: %v\n", err)
		return
	}

	fmt.Printf("API响应: %s\n", string(response))
}`

	// Python模板
	pythonTemplate = `import requests
import base64
import json
from urllib.parse import urlencode

# 配置常量
SERVER_URL = "{{.AccessUrl}}"
API_ENDPOINT = "{{.ApiUrl}}"
METHOD = "{{.Method}}"

# 禁用SSL警告（仅用于测试环境）
requests.packages.urllib3.disable_warnings()

class HTTPClient:
    def __init__(self):
        self.session = requests.Session()
        # 仅测试环境使用，生产环境建议使用证书验证
        self.session.verify = False
    
    def api_call(self, method, access_token, api_url):
        """
        调用业务API
        """
        try:
            # 构建请求头
            headers = {
                'Authorization': f"Bearer {access_token}",
                'Content-Type': 'application/json'
            }
            
            # 构建请求体数据
            data = {
                # 在此处添加需要发送的数据
            }
            
            # 发送请求
            if method.upper() == "GET":
                response = self.session.get(api_url, headers=headers, params={})
            elif method.upper() == "POST":
                response = self.session.post(api_url, headers=headers, json=data)
            else:
                raise Exception(f"不支持的HTTP方法: {method}")
            
            # 检查响应状态
            if not (200 <= response.status_code < 300):
                raise Exception(f"API调用失败，状态码: {response.status_code}, 响应: {response.text}")
            
            return response.text
            
        except Exception as e:
            raise Exception(f"API调用过程中发生错误: {str(e)}")

def main():
    
    # 创建HTTP客户端
    http_client = HTTPClient()

    try:

        # 调用API
        print("正在调用API...")
        response = http_client.api_call(METHOD, access_token, API_ENDPOINT)
        print(f"API响应: {response}")
        
    except Exception as e:
        print(f"发生错误: {str(e)}")

if __name__ == "__main__":
    main()`

	// Java模板
	javaTemplate = `import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.cert.X509Certificate;
import java.util.*;
import javax.net.ssl.*;
import java.util.Base64;

public class AuthClient {
    private static final String SERVER_URL = "{{.AccessUrl}}";
    private static final String API_ENDPOINT = "{{.ApiUrl}}";
    private static final String METHOD = "{{.Method}}";

    private final HttpClient client;

    public AuthClient() {
        this.client = new HttpClient();
    }

    public static void main(String[] args) {

        AuthClient authClient = new AuthClient();
        
       try {
           System.out.println("正在调用API...");
           String response = authClient.apiCall(METHOD, accessToken, API_ENDPOINT);
           System.out.println("API响应: " + response);
       } finally {
            System.out.println("操作失败: " + e.getMessage());
            e.printStackTrace();
       }
    }

    // 调用业务API
    public String apiCall(String method, String accessToken, String apiUrl) throws Exception {
        URL url = new URL(apiUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        // 处理HTTPS
        if (conn instanceof HttpsURLConnection) {
            trustAllCertificates((HttpsURLConnection) conn);
        }

        conn.setRequestMethod(method);
        conn.setRequestProperty("Authorization", "Bearer " + accessToken);
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        // 发送POST数据
        Map<String, Object> data = new HashMap<>(); // 添加需要发送的数据
        if (!data.isEmpty()) {
            String jsonData = toJson(data);
            try (OutputStream os = conn.getOutputStream()) {
                byte[] input = jsonData.getBytes(StandardCharsets.UTF_8);
                os.write(input, 0, input.length);
            }
        }

        int responseCode = conn.getResponseCode();
        InputStream inputStream = (responseCode >= 200 && responseCode < 300) 
            ? conn.getInputStream() 
            : conn.getErrorStream();

        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
        }

        if (responseCode < 200 || responseCode >= 300) {
            throw new Exception("API调用失败，状态码: " + responseCode + ", 响应: " + response.toString());
        }

        return response.toString();
    }

    // 简单的JSON解析方法
    private Map<String, Object> parseJson(String json) {
        Map<String, Object> result = new HashMap<>();
        // 这里简化处理，实际项目中建议使用Jackson或Gson库
        json = json.replaceAll("[{}\"]", "");
        String[] pairs = json.split(",");
        for (String pair : pairs) {
            String[] keyValue = pair.split(":");
            if (keyValue.length == 2) {
                result.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return result;
    }

    // 简单的JSON序列化方法
    private String toJson(Map<String, Object> data) {
        StringBuilder json = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            if (!first) json.append(",");
            json.append("\"").append(entry.getKey()).append("\":\"").append(entry.getValue()).append("\"");
            first = false;
        }
        json.append("}");
        return json.toString();
    }

    // 信任所有证书（仅用于测试环境）
    private void trustAllCertificates(HttpsURLConnection connection) {
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                public void checkServerTrusted(X509Certificate[] certs, String authType) { }
            }}, new java.security.SecureRandom());
            connection.setSSLSocketFactory(sc.getSocketFactory());
            connection.setHostnameVerifier((hostname, session) -> true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

class HttpClient {
    // 发送HTTP请求
    public String sendRequest(String endpoint, String method, Map<String, String> formData, 
                              String userId, String password) throws Exception {
        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        
        // 处理HTTPS
        if (conn instanceof HttpsURLConnection) {
            trustAllCertificates((HttpsURLConnection) conn);
        }

        conn.setRequestMethod(method);
        
        // 设置认证头
        String auth = userId + ":" + password;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        conn.setRequestProperty("Authorization", "Basic " + encodedAuth);
        conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
        conn.setDoOutput(true);

        // 构建表单数据
        StringBuilder formBody = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> entry : formData.entrySet()) {
            if (!first) formBody.append("&");
            formBody.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            formBody.append("=");
            formBody.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
            first = false;
        }

        // 发送请求体
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = formBody.toString().getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        int responseCode = conn.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            throw new Exception("请求失败，状态码: " + responseCode);
        }

        // 读取响应
        StringBuilder response = new StringBuilder();
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
        }

        return response.toString();
    }

    // 信任所有证书（仅用于测试环境）
    private void trustAllCertificates(HttpsURLConnection connection) {
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, new TrustManager[]{new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) { }
                public void checkServerTrusted(X509Certificate[] certs, String authType) { }
            }}, new java.security.SecureRandom());
            connection.setSSLSocketFactory(sc.getSocketFactory());
            connection.setHostnameVerifier((hostname, session) -> true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`
)

// 模板定义(cssjj)
const (
	// Shell模板
	cssjjShellTemplate = `#调用接口
curl -X {{.Method}} '{{.ApiUrl}}' -k \
    -H 'Content-Type: application/json' \
    -H 'x-tif-paasid: {x-tif-paasid}' \
    -H 'x-tif-timestamp: {x-tif-timestamp}' \
    -H 'x-tif-nonce: {x-tif-nonce}' \
    -H 'x-tif-signature: {x-tif-signature}'`

	// Go模板
	cssjjGoTemplate = `package main

import (
	"bytes"
	"crypto/sha256"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/url"
	"time"
)

const (
	// API端点
	API_ENDPOINT = "{{.ApiUrl}}"
	METHOD       = "{{.Method}}"

	// 认证信息，应用Token和Passid, 咨询接口提供方获取
	TOKEN  = ""
	PASSID = ""
)

// HTTPClient 封装HTTP客户端
type HTTPClient struct {
	client *http.Client
}

// NewHTTPClient 创建新的HTTP客户端
func NewHTTPClient() *HTTPClient {
	return &HTTPClient{
		client: &http.Client{
			Transport: &http.Transport{
				TLSClientConfig: &tls.Config{InsecureSkipVerify: true}, // 仅测试环境使用,生产环境建议使用证书
			},
		},
	}
}

// APICall 调用业务API
func (c *HTTPClient) APICall(method, timestamp, nonce, signature, passid, apiUrl string) ([]byte, error) {
	// 构建请求URL（如果是GET）
	queryValues := url.Values{}
	// queryValues.Set("param", "value") // 示例查询参数
	url := fmt.Sprintf("%s?%s", apiUrl, queryValues.Encode())

	// 构建请求体(如果是POST)
	data := map[string]interface{}{
		// 在此处添加需要发送的数据
	}
	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("序列化请求数据失败: %w", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, body)
	if err != nil {
		return nil, fmt.Errorf("创建请求失败: %w", err)
	}

	req.Header.Set("x-tif-timestamp", timestamp)
	req.Header.Set("x-tif-nonce", nonce)
	req.Header.Set("x-tif-signature", signature)
	req.Header.Set("x-tif-paasid", passid)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("发送请求失败: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("读取响应失败: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return responseBody, fmt.Errorf("API调用失败，状态码: %d, 响应: %s", resp.StatusCode, string(responseBody))
	}

	return responseBody, nil
}

// generateNonce generates a random nonce string
func generateNonce() string {
	const charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, 8)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

// generateSignature generates the signature for authentication
func generateSignature(timestamp, token, nonce string) string {
	data := timestamp + token + nonce + timestamp
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func main() {
	if TOKEN == "" || PASSID == "" {
		fmt.Println("请输入应用Token和Passid")
		return
	}

	// 创建HTTP客户端
	httpClient := NewHTTPClient()

	timestamp := fmt.Sprintf("%d", time.Now().Unix())
	nonce := generateNonce()
	signature := generateSignature(timestamp, TOKEN, nonce)

	fmt.Println("API调用头部:")
	fmt.Printf("x-tif-paasid:%s\n", PASSID)
	fmt.Printf("x-tif-timestamp:%s\n", timestamp)
	fmt.Printf("x-tif-nonce:%s\n", nonce)
	fmt.Printf("x-tif-signature:%s\n", signature)
	fmt.Printf("Content-Type:%s\n", "application/json")

	// 调用API
	fmt.Println("正在调用API...")
	apiUrl := fmt.Sprintf(API_ENDPOINT, PASSID)
	response, err := httpClient.APICall(METHOD, timestamp, nonce, signature, PASSID, apiUrl)
	if err != nil {
		fmt.Printf("API调用失败: %v\n", err)
		return
	}
	fmt.Printf("API响应: %s\n", string(response))
}`

	// Python模板
	cssjjPythonTemplate = `import hashlib
import json
import random
import string
import time
import requests
import urllib.parse

# API端点
API_ENDPOINT = "{{.ApiUrl}}"
METHOD       = "{{.Method}}"

# 认证信息，应用Token和Passid, 咨询接口提供方获取
TOKEN = ""
PASSID = ""

def generate_nonce():
    """生成随机nonce字符串"""
    charset = "abcdefghijklmnopqrstuvwxyz0123456789"
    return ''.join(random.choice(charset) for _ in range(8))

def generate_signature(timestamp, token, nonce):
    """生成认证签名"""
    data = timestamp + token + nonce + timestamp
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def api_call(method, timestamp, nonce, signature, passid, api_url):
    """调用业务API"""
    # 构建请求URL
    query_params = {}
    full_url = f"{api_url}?{urllib.parse.urlencode(query_params)}"
    
    # 设置请求头
    headers = {
        "x-tif-timestamp": timestamp,
        "x-tif-nonce": nonce,
        "x-tif-signature": signature,
        "x-tif-paasid": passid,
        "Content-Type": "application/json"
    }
    
    # 发送请求
    response = requests.get(full_url, headers=headers, verify=False)
    
    if not (200 <= response.status_code < 300):
        raise Exception(f"API调用失败，状态码: {response.status_code}, 响应: {response.text}")
    
    return response.text

def main():
    """主函数"""
    # 检查认证信息
    if not TOKEN or not PASSID:
        print("请输入账号ID和密码")
        return

    # 生成认证参数
    timestamp = str(int(time.time()))
    nonce = generate_nonce()
    signature = generate_signature(timestamp, TOKEN, nonce)
    
    # 打印API调用头部信息
    print("API调用头部:")
    print(f"x-tif-paasid:{PASSID}")
    print(f"x-tif-timestamp:{timestamp}")
    print(f"x-tif-nonce:{nonce}")
    print(f"x-tif-signature:{signature}")
    print(f"Content-Type:application/json")
    
    # 构建API URL
    api_url = API_ENDPOINT % PASSID
    print(f"API URL: {api_url}")
    
    try:
        # 调用API
        print("正在调用API...")
        response = api_call(METHOD, timestamp, nonce, signature, PASSID, api_url)
        print(f"API响应: {response}")
    except Exception as e:
        print(f"API调用失败: {str(e)}")

if __name__ == "__main__":
    # 初始化随机数种子
    random.seed(time.time())
    main()`

	// Java模板
	cssjjJavaTemplate = `import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import javax.net.ssl.*;

public class ApiClient {
    private static final String API_ENDPOINT = "{{.ApiUrl}}";
    private static final String METHOD = "{{.Method}}";
    
    // 认证信息，应用Token和Passid, 咨询接口提供方获取
    private static final String TOKEN = "";
    private static final String PASSID = "";

    public static void main(String[] args) {
        try {
			if (TOKEN.isEmpty() || PASSID.isEmpty()) {
				System.out.println("请输入账号ID和密码");
				return;
			}
            // 生成认证参数
            String timestamp = String.valueOf(System.currentTimeMillis() / 1000);
            String nonce = generateNonce();
            String signature = generateSignature(timestamp, TOKEN, nonce);
            
            // 打印API调用头部信息
            System.out.println("API调用头部:");
            System.out.println("x-tif-paasid:" + PASSID);
            System.out.println("x-tif-timestamp:" + timestamp);
            System.out.println("x-tif-nonce:" + nonce);
            System.out.println("x-tif-signature:" + signature);
            System.out.println("Content-Type:application/json");
            
            // 构建API URL
            String apiUrl = String.format(API_ENDPOINT, PASSID);
            System.out.println("API URL: " + apiUrl);
            
            // 调用API
            System.out.println("正在调用API...");
            String response = apiCall(METHOD, timestamp, nonce, signature, PASSID, apiUrl);
            System.out.println("API响应: " + response);
            
        } catch (Exception e) {
            System.out.println("API调用失败: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    // 生成随机nonce字符串
    private static String generateNonce() {
        String charset = "abcdefghijklmnopqrstuvwxyz0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(charset.charAt(random.nextInt(charset.length())));
        }
        return sb.toString();
    }
    
    // 生成认证签名
    private static String generateSignature(String timestamp, String token, String nonce) {
        try {
            String data = timestamp + token + nonce + timestamp;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256算法不可用", e);
        }
    }
    
    // 字节数组转十六进制字符串
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
    
    // 调用业务API
    private static String apiCall(String method, String timestamp, String nonce, 
                                 String signature, String passid, String apiUrl) throws Exception {
        URL url = new URL(apiUrl);
        HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
        
        // 跳过SSL证书验证（仅测试环境使用）
        trustAllCertificates(conn);
        
        conn.setRequestMethod(method);
        conn.setRequestProperty("x-tif-timestamp", timestamp);
        conn.setRequestProperty("x-tif-nonce", nonce);
        conn.setRequestProperty("x-tif-signature", signature);
        conn.setRequestProperty("x-tif-paasid", passid);
        conn.setRequestProperty("Content-Type", "application/json");
        
        int responseCode = conn.getResponseCode();
        InputStream inputStream = (responseCode >= 200 && responseCode < 300) 
            ? conn.getInputStream() 
            : conn.getErrorStream();
            
        StringBuilder response = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
        }
        
        if (responseCode < 200 || responseCode >= 300) {
            throw new Exception("API调用失败，状态码: " + responseCode + ", 响应: " + response.toString());
        }
        
        return response.toString();
    }
    
    // 跳过SSL证书验证（仅测试环境使用）
    private static void trustAllCertificates(HttpsURLConnection connection) {
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, new TrustManager[]{new X509TrustManager() {
                public java.security.cert.X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) { }
                public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) { }
            }}, new java.security.SecureRandom());
            connection.setSSLSocketFactory(sc.getSocketFactory());
            connection.setHostnameVerifier((hostname, session) -> true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}`
)

// 模板数据
type TemplateData struct {
	Method    string
	ApiUrl    string
	AccessUrl string
}

func (u *ServiceDomain) ServiceGetDocumentationData(ctx context.Context, cssjj bool, serviceIds ...string) (res []*dto.ServiceGetDocumentationResp, err error) {
	var accessUrl, apiUrl string
	if !cssjj {
		getHostRes, err := u.deployMgmRepo.GetHost(ctx)
		if err != nil {
			log.Info("deployMgm GetHost error", zap.Error(err))
			return nil, err
		}
		accessUrl = fmt.Sprintf("%s://%s:%s", getHostRes.Scheme, getHostRes.Host, getHostRes.Port)
	}

	for _, serviceId := range serviceIds {
		serviceRes, err := u.serviceRepo.ServiceGet(ctx, serviceId)
		if err != nil {
			return nil, err
		}
		apiResp := &dto.ServiceGetDocumentationResp{}
		apiResp.ServiceID = serviceId
		apiResp.ServiceName = serviceRes.ServiceInfo.ServiceName
		apiResp.AccessUrl = accessUrl
		// 请求方式
		apiResp.HTTPMethod = serviceRes.ServiceInfo.HTTPMethod
		// API路径
		if cssjj {
			// https://smartgate.changsha.gov.cn/ebus/{发布服务的应用ID}/data-application-gateway/{AF接口路径}
			apiUrl = "https://smartgate.changsha.gov.cn/ebus/" + "%s" + "/data-application-gateway" + serviceRes.ServiceInfo.ServicePath
		} else {
			apiUrl = accessUrl + "/data-application-gateway" + serviceRes.ServiceInfo.ServicePath
		}
		apiResp.ApiUrl = apiUrl
		// 超时时间
		apiResp.Timeout = serviceRes.ServiceInfo.Timeout

		// 请求参数
		for _, param := range serviceRes.ServiceParam.DataTableRequestParams {
			fmt.Printf("%s, %s, %s, %s, %s\n", param.EnName, param.DataType, param.Description, param.Required, param.DefaultValue)
			apiResp.ServiceParam.DataTableRequestParams = append(apiResp.ServiceParam.DataTableRequestParams, dto.DataTableRequestParam{
				EnName:       param.EnName,
				DataType:     param.DataType,
				Description:  param.Description,
				Required:     param.Required,
				DefaultValue: param.DefaultValue,
			})
		}
		// 返回响应
		for _, param := range serviceRes.ServiceParam.DataTableResponseParams {
			fmt.Printf("%s, %s, %s\n", param.EnName, param.DataType, param.Description)
			apiResp.ServiceParam.DataTableResponseParams = append(apiResp.ServiceParam.DataTableResponseParams, dto.DataTableResponseParam{
				EnName:      param.EnName,
				DataType:    param.DataType,
				Description: param.Description,
			})
		}
		// 响应示例
		apiResp.ServiceTest.ResponseExample = serviceRes.ServiceTest.ResponseExample

		data := TemplateData{
			Method:    strings.ToUpper(apiResp.HTTPMethod),
			ApiUrl:    apiUrl,
			AccessUrl: accessUrl,
		}
		// 示例代码
		apiResp.ExampleCode.ShellExampleCode = generateShellExample(data, cssjj)
		apiResp.ExampleCode.GoExampleCode = generateGoExample(data, cssjj)
		apiResp.ExampleCode.PythonExampleCode = generatePythonExample(data, cssjj)
		apiResp.ExampleCode.JavaExampleCode = generateJavaExample(data, cssjj)

		res = append(res, apiResp)
	}

	return res, nil
}

func (u *ServiceDomain) ServiceGetExampleCode(ctx context.Context, serviceId string) (res *dto.ExampleCode, err error) {
	var accessUrl, apiUrl string

	serviceRes, err := u.serviceRepo.ServiceGet(ctx, serviceId)
	if err != nil {
		return nil, err
	}

	// 判断是否为长沙数据局项目
	cssjj, err := u.IsCSSJJ(ctx)
	if err != nil {
		return nil, err
	}

	if cssjj {
		// https://smartgate.changsha.gov.cn/ebus/{发布服务的应用ID}/data-application-gateway/{AF接口路径}
		apiUrl = "https://smartgate.changsha.gov.cn/ebus/" + "%s" + "/data-application-gateway" + serviceRes.ServiceInfo.ServicePath

	} else {
		getHostRes, err := u.deployMgmRepo.GetHost(ctx)
		if err != nil {
			log.Info("deployMgm GetHost error", zap.Error(err))
			return nil, err
		}
		accessUrl = fmt.Sprintf("%s://%s:%s", getHostRes.Scheme, getHostRes.Host, getHostRes.Port)
		apiUrl = accessUrl + "/data-application-gateway" + serviceRes.ServiceInfo.ServicePath
	}

	res = &dto.ExampleCode{}
	data := TemplateData{
		Method:    strings.ToUpper(serviceRes.ServiceInfo.HTTPMethod),
		ApiUrl:    apiUrl,
		AccessUrl: accessUrl,
	}

	res.ShellExampleCode = generateShellExample(data, cssjj)
	res.GoExampleCode = generateGoExample(data, cssjj)
	res.PythonExampleCode = generatePythonExample(data, cssjj)
	res.JavaExampleCode = generateJavaExample(data, cssjj)
	return res, nil
}

// generateShellExample 生成Shell示例
func generateShellExample(data TemplateData, cssjj bool) string {
	var err error
	var tmpl = &template.Template{}
	if cssjj {
		data.ApiUrl = fmt.Sprintf(data.ApiUrl, "{x-tif-paasid}")
		tmpl, err = template.New("shell").Parse(cssjjShellTemplate)
		if err != nil {
			return ""
		}
	} else {
		tmpl, err = template.New("shell").Parse(shellTemplate)
		if err != nil {
			return ""
		}
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		fmt.Println(err)
		return ""
	}

	return buf.String()
}

// generateGoExample 生成Go示例
func generateGoExample(data TemplateData, cssjj bool) string {
	var err error
	var tmpl = &template.Template{}
	if cssjj {
		tmpl, err = template.New("go").Parse(cssjjGoTemplate)
		if err != nil {
			return ""
		}
	} else {
		tmpl, err = template.New("go").Parse(goTemplate)
		if err != nil {
			return ""
		}
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return ""
	}

	return buf.String()
}

// generatePythonExample 生成Python示例
func generatePythonExample(data TemplateData, cssjj bool) string {
	var err error
	var tmpl = &template.Template{}
	if cssjj {
		tmpl, err = template.New("python").Parse(cssjjPythonTemplate)
		if err != nil {
			return ""
		}
	} else {
		tmpl, err = template.New("python").Parse(pythonTemplate)
		if err != nil {
			return ""
		}
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return ""
	}

	return buf.String()
}

// generateJavaExample 生成Java示例
func generateJavaExample(data TemplateData, cssjj bool) string {
	// Java模板需要特殊处理POST请求体
	javaTemplateWithBody := javaTemplate
	// if data.BodyData != "" {
	// 	// 转义JSON字符串
	// 	escapedBody := strings.ReplaceAll(data.BodyData, `"`, `\"`)
	// 	javaTemplateWithBody += fmt.Sprintf(`
	//         .%s(HttpRequest.BodyPublishers.ofString("%s"))`,
	// 		strings.ToUpper(data.Method), escapedBody)
	// } else {
	javaTemplateWithBody += fmt.Sprintf(`
            .%s()`, strings.ToUpper(data.Method))
	// }

	javaTemplateWithBody += `;

        HttpRequest request = requestBuilder.build();

        HttpResponse<String> response = client.send(request,
            HttpResponse.BodyHandlers.ofString());

        System.out.println(response.body());
    }
}`
	var err error
	var tmpl = &template.Template{}
	if cssjj {
		tmpl, err = template.New("java").Parse(cssjjJavaTemplate)
		if err != nil {
			return ""
		}
	} else {
		tmpl, err = template.New("java").Parse(javaTemplate)
		if err != nil {
			return ""
		}
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, data)
	if err != nil {
		return ""
	}

	return buf.String()
}

// ExportAPIDoc 生成接口文档 PDF（增强错误处理）
func (d *ServiceDomain) ExportAPIDoc(ctx context.Context, req *dto.ExportAPIDocReq) (*dto.ExportAPIDocResp, error) {
	// 判断是否为长沙数据局项目
	cssjj, err := d.IsCSSJJ(ctx)
	if err != nil {
		return nil, err
	}

	// 验证请求参数
	if req == nil {
		return nil, fmt.Errorf("请求参数不能为空")
	}

	// 单个PDF导出必须指定具体的接口ID
	if len(req.ExportAPIDocReqBody.ServiceIDs) == 0 {
		return nil, fmt.Errorf("service_ids 参数不能为空，单个PDF导出必须指定具体的接口ID")
	}

	// 单个PDF导出只支持一个接口ID
	if len(req.ExportAPIDocReqBody.ServiceIDs) > 1 {
		return nil, fmt.Errorf("单个PDF导出只支持一个接口ID，当前传入了 %d 个", len(req.ExportAPIDocReqBody.ServiceIDs))
	}

	// 验证service_id格式（如果传了的话）
	for i, serviceID := range req.ExportAPIDocReqBody.ServiceIDs {
		if serviceID == "" {
			return nil, fmt.Errorf("service_ids[%d] 不能为空", i)
		}
		// UUID格式验证（简单验证长度和格式）
		if len(serviceID) != 36 || !strings.Contains(serviceID, "-") {
			return nil, fmt.Errorf("service_ids[%d] 格式不正确，应为UUID格式", i)
		}
	}

	// 验证app_id格式（如果传了的话）
	if req.AppID != "" {
		if len(req.AppID) != 36 || !strings.Contains(req.AppID, "-") {
			return nil, fmt.Errorf("app_id 格式不正确，应为UUID格式")
		}
	}

	// 根据接口ID批量获取接口信息
	serviceIds := req.ExportAPIDocReqBody.ServiceIDs
	log.Info("开始生成API文档PDF", zap.Strings("service_ids", serviceIds))

	serviceInfos, err := d.ServiceGetDocumentationData(ctx, cssjj, serviceIds...)
	if err != nil {
		log.Error("获取服务文档数据失败", zap.Error(err))
		return nil, fmt.Errorf("获取服务文档数据失败: %w", err)
	}

	if len(serviceInfos) == 0 {
		return nil, fmt.Errorf("未找到指定的服务信息")
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)

	// 设置中文字体（修复路径问题）
	setChineseFontForAPIDoc(pdf)

	// 1) 应用信息（按新模板，含令牌申请/注销示例）
	pdf.AddPage()
	if cssjj {
		pdf.Bookmark("签名信息", 0, 0)
		cssjjCreateAppInfoSectionV2(pdf)
	} else {
		pdf.Bookmark("应用信息", 0, 0)
		createAppInfoSectionV2(pdf, serviceInfos[0].AccessUrl)
	}

	// 2) API 接口信息（按新模板，表格先写死）
	pdf.AddPage()
	pdf.Bookmark("API 接口信息", 0, 0)
	createAPISectionV2(cssjj, pdf, serviceInfos[0])

	// 3) 错误汇总（固定表+固定错误示例）
	pdf.AddPage()
	pdf.Bookmark("错误汇总", 0, 0)
	createErrorSummarySection(pdf)

	// 4) 使用示例（保留原实现与模板化生成）
	pdf.AddPage()
	pdf.Bookmark("使用示例", 0, 0)
	createUsageExamplesChapter(pdf, &serviceInfos[0].ExampleCode)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		log.Error("PDF输出失败", zap.Error(err))
		return nil, fmt.Errorf("PDF生成失败: %w", err)
	}

	// 验证生成的PDF内容
	if buf.Len() == 0 {
		return nil, fmt.Errorf("生成的PDF内容为空")
	}

	// 生成文件名逻辑调整（文件名中的接口名称需要截断到25个字符）
	var fileName string
	//if req.AppID != "" {
	//	// 如果有应用ID，获取应用名称
	//	appName := ""
	//	apps, err := d.configurationCenterDriven.GetApplication(ctx, req.AppID)
	//	if err != nil {
	//		appName = ""
	//	} else {
	//		appName = apps.Name
	//	}
	//	serviceName := truncateForFileName(sanitizeFileName(serviceInfos[0].ServiceName), 25)
	//	appNameForFile := truncateForFileName(sanitizeFileName(appName), 25)
	//	fileName = fmt.Sprintf("%s_%s_%s.pdf", appNameForFile, serviceName, time.Now().Format("20060102150405"))
	//} else {
	// 没有应用ID，维持原来的命名逻辑
	serviceName := truncateForFileName(sanitizeFileName(serviceInfos[0].ServiceName), 25)
	fileName = fmt.Sprintf("%s_%s.pdf", serviceName, time.Now().Format("20060102150405"))
	//}

	log.Info("PDF生成成功", zap.String("filename", fileName), zap.Int("size", buf.Len()))
	return &dto.ExportAPIDocResp{Buffer: &buf, FileName: fileName}, nil
}

// PDFResult PDF生成结果
type PDFResult struct {
	ServiceID string
	Index     int
	Data      *dto.ExportAPIDocResp
	Error     error
}

// ExportAPIDocBatch 批量生成接口文档PDF并打包为ZIP（并行优化版本）
func (d *ServiceDomain) ExportAPIDocBatch(ctx context.Context, req *dto.ExportAPIDocReq) (*dto.ExportAPIDocResp, error) {
	return d.ExportAPIDocBatchWithConcurrency(ctx, req, 0)
}

// ExportAPIDocBatchWithConcurrency 支持自定义并发数的批量导出
func (d *ServiceDomain) ExportAPIDocBatchWithConcurrency(ctx context.Context, req *dto.ExportAPIDocReq, customConcurrency int) (*dto.ExportAPIDocResp, error) {
	// 验证请求参数
	if req == nil {
		return nil, fmt.Errorf("请求参数不能为空")
	}

	// 验证service_ids格式（如果传了的话）
	for i, serviceID := range req.ExportAPIDocReqBody.ServiceIDs {
		if serviceID == "" {
			return nil, fmt.Errorf("service_ids[%d] 不能为空", i)
		}
		// UUID格式验证（简单验证长度和格式）
		if len(serviceID) != 36 || !strings.Contains(serviceID, "-") {
			return nil, fmt.Errorf("service_ids[%d] 格式不正确，应为UUID格式", i)
		}
	}

	// 验证app_id格式：只有传入时才校验
	if req.AppID != "" {
		if len(req.AppID) != 36 || !strings.Contains(req.AppID, "-") {
			return nil, fmt.Errorf("app_id 格式不正确，应为UUID格式")
		}
	}

	var err error
	var appsName string

	serviceIds := req.ExportAPIDocReqBody.ServiceIDs
	if len(serviceIds) == 0 && req.AppID != "" {
		serviceIds, err = d.serviceApplyRepo.AvailableServiceIDs(ctx, req.AppID)
		if err != nil {
			return nil, err
		}
		apps, err := d.configurationCenterDriven.GetApplication(ctx, req.AppID)
		if err != nil {
			appsName = ""
		} else {
			appsName = apps.Name
		}
	}
	if len(serviceIds) == 0 {
		return nil, fmt.Errorf("service_ids 参数不能为空")
	}
	fmt.Printf("appsName:%s\n", appsName)

	log.Info("开始并行批量生成API文档PDF", zap.Strings("service_ids", serviceIds), zap.Int("count", len(serviceIds)))

	startTime := time.Now()

	// 创建结果通道和等待组
	resultChan := make(chan PDFResult, len(serviceIds))
	var wg sync.WaitGroup

	// 控制并发数量，避免资源耗尽
	var maxConcurrency int
	if customConcurrency > 0 {
		maxConcurrency = customConcurrency
	} else {
		// 默认并发策略
		maxConcurrency = 5
		if len(serviceIds) < maxConcurrency {
			maxConcurrency = len(serviceIds)
		}

		// 根据服务数量动态调整并发数
		if len(serviceIds) > 20 {
			maxConcurrency = 8
		}
		if len(serviceIds) > 50 {
			maxConcurrency = 10
		}
	}

	// 确保并发数不超过服务数量
	if maxConcurrency > len(serviceIds) {
		maxConcurrency = len(serviceIds)
	}

	log.Info("设置并发参数", zap.Int("max_concurrency", maxConcurrency), zap.Int("total_services", len(serviceIds)))

	// 创建信号量控制并发
	semaphore := make(chan struct{}, maxConcurrency)

	// 启动并行PDF生成
	for i, serviceId := range serviceIds {
		wg.Add(1)
		go func(index int, serviceID string) {
			defer wg.Done()

			// 获取信号量
			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			// 创建单个服务的请求
			singleReq := &dto.ExportAPIDocReq{
				ExportAPIDocReqBody: dto.ExportAPIDocReqBody{
					ServiceIDs: []string{serviceID},
					AppID:      req.AppID, // 传递AppID到单个PDF生成
				},
			}

			// 生成单个PDF
			pdfResp, err := d.ExportAPIDoc(ctx, singleReq)
			result := PDFResult{
				ServiceID: serviceID,
				Index:     index,
				Data:      pdfResp,
				Error:     err,
			}

			if err != nil {
				log.Error("并行生成PDF失败", zap.String("service_id", serviceID), zap.Error(err))
			} else {
				log.Info("并行生成PDF成功", zap.String("service_id", serviceID), zap.Int("size", pdfResp.Buffer.Len()))
			}

			resultChan <- result
		}(i, serviceId)
	}

	// 等待所有goroutine完成
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// 创建ZIP文件缓冲区
	var zipBuffer bytes.Buffer
	zipWriter := zip.NewWriter(&zipBuffer)

	// 收集结果并添加到ZIP
	successCount := 0
	errorCount := 0
	// 统一时间戳，保证压缩包内文件命名一致
	timestamp := time.Now().Format("20060102150405")

	defaultAppPrefix := "用户接口"
	for result := range resultChan {
		if result.Error != nil {
			errorCount++
			continue
		}

		// 创建ZIP文件中的PDF文件（文件名中的接口名称需要截断到25个字符）
		// 根据是否有应用ID决定文件名格式
		var fileName string
		if req.AppID != "" && appsName != "" {
			// 有应用ID，使用应用名称_接口名称_时间戳格式
			svc, svcErr := d.serviceRepo.ServiceGet(ctx, result.ServiceID)
			if svcErr == nil && svc != nil && svc.ServiceInfo.ServiceName != "" {
				serviceName := truncateForFileName(sanitizeFileName(svc.ServiceInfo.ServiceName), 25)
				fileName = fmt.Sprintf("%s_%s_%s.pdf", defaultAppPrefix, serviceName, timestamp)
			} else {
				fileName = fmt.Sprintf("%s_接口文档-%d_%s.pdf", defaultAppPrefix, result.Index+1, timestamp)
			}
		} else {
			// 没有应用ID，维持原来的命名逻辑
			svc, svcErr := d.serviceRepo.ServiceGet(ctx, result.ServiceID)
			if svcErr == nil && svc != nil && svc.ServiceInfo.ServiceName != "" {
				serviceName := truncateForFileName(sanitizeFileName(svc.ServiceInfo.ServiceName), 25)
				fileName = fmt.Sprintf("%s_%s.pdf", serviceName, timestamp)
			} else {
				fileName = fmt.Sprintf("接口文档-%d_%s.pdf", result.Index+1, timestamp)
			}
		}
		// 使用CreateHeader方法创建文件，设置UTF-8标志位，避免中文文件名乱码
		header := &zip.FileHeader{
			Name:   fileName,
			Method: zip.Deflate,
			Flags:  0x800, // 设置UTF-8标志位，避免中文文件名乱码
		}
		file, err := zipWriter.CreateHeader(header)
		if err != nil {
			log.Error("创建ZIP文件失败", zap.String("filename", fileName), zap.Error(err))
			errorCount++
			continue
		}

		// 将PDF内容写入ZIP文件
		_, err = file.Write(result.Data.Buffer.Bytes())
		if err != nil {
			log.Error("写入ZIP文件失败", zap.String("filename", fileName), zap.Error(err))
			errorCount++
			continue
		}

		successCount++
		log.Info("成功添加PDF到ZIP", zap.String("service_id", result.ServiceID), zap.String("filename", fileName))
	}

	// 关闭ZIP写入器
	err = zipWriter.Close()
	if err != nil {
		log.Error("关闭ZIP写入器失败", zap.Error(err))
		return nil, fmt.Errorf("关闭ZIP文件失败: %w", err)
	}

	// 验证生成的ZIP内容
	if zipBuffer.Len() == 0 {
		return nil, fmt.Errorf("生成的ZIP内容为空")
	}

	// 生成ZIP文件名（文件名中的接口名称需要截断到25个字符）
	var zipFileName string
	if req.AppID != "" && appsName != "" {
		zipFileName = fmt.Sprintf("%s接口文档批量导出-%s.zip", defaultAppPrefix, time.Now().Format("20060102"))
	} else {
		// 没有应用ID，维持原来的命名逻辑
		zipFileName = fmt.Sprintf("接口文档批量导出-%s.zip", time.Now().Format("20060102"))
	}

	elapsed := time.Since(startTime)
	log.Info("并行ZIP生成完成",
		zap.String("filename", zipFileName),
		zap.Int("size", zipBuffer.Len()),
		zap.Int("total_count", len(serviceIds)),
		zap.Int("success_count", successCount),
		zap.Int("error_count", errorCount),
		zap.Duration("elapsed", elapsed))

	return &dto.ExportAPIDocResp{Buffer: &zipBuffer, FileName: zipFileName}, nil
}

// ExportAPIDocBatchPerformanceTest 性能测试版本，用于测试不同并发数的性能
func (d *ServiceDomain) ExportAPIDocBatchPerformanceTest(ctx context.Context, req *dto.ExportAPIDocReq, concurrency int) (*dto.ExportAPIDocResp, error) {
	startTime := time.Now()

	log.Info("开始性能测试", zap.Int("concurrency", concurrency), zap.Int("service_count", len(req.ExportAPIDocReqBody.ServiceIDs)))

	resp, err := d.ExportAPIDocBatchWithConcurrency(ctx, req, concurrency)

	elapsed := time.Since(startTime)
	log.Info("性能测试完成",
		zap.Int("concurrency", concurrency),
		zap.Duration("total_elapsed", elapsed),
		zap.Float64("avg_time_per_pdf", float64(elapsed.Nanoseconds())/float64(len(req.ExportAPIDocReqBody.ServiceIDs))/1e6))

	return resp, err
}

type kv struct{ k, v string }

// setChineseFontForAPIDoc 设置中文字体（修复路径问题）
func setChineseFontForAPIDoc(pdf *gofpdf.Fpdf) {
	// 定义多个可能的字体文件路径
	fontPaths := []string{
		"cmd/server/fonts/simfang.ttf",
		"./cmd/server/fonts/simfang.ttf",
		"./fonts/simfang.ttf",
		"fonts/simfang.ttf",
	}

	// 尝试加载仿宋字体
	for _, fontPath := range fontPaths {
		if _, err := os.Stat(fontPath); err == nil {
			fontData, err := ioutil.ReadFile(fontPath)
			if err == nil {
				pdf.AddUTF8FontFromBytes("zh", "", fontData)
				pdf.SetFont("zh", "", 12)
				log.Info("成功加载字体文件", zap.String("path", fontPath))
				break
			} else {
				log.Warn("读取字体文件失败", zap.String("path", fontPath), zap.Error(err))
			}
		}
	}

	// 尝试加载黑体字体
	heitiPaths := []string{
		"cmd/server/fonts/simhei.ttf",
		"./cmd/server/fonts/simhei.ttf",
		"./fonts/simhei.ttf",
		"fonts/simhei.ttf",
	}

	for _, fontPath := range heitiPaths {
		if _, err := os.Stat(fontPath); err == nil {
			fontData, err := ioutil.ReadFile(fontPath)
			if err == nil {
				pdf.AddUTF8FontFromBytes("zh", "B", fontData)
				log.Info("成功加载黑体字体文件", zap.String("path", fontPath))
				break
			} else {
				log.Warn("读取黑体字体文件失败", zap.String("path", fontPath), zap.Error(err))
			}
		}
	}

	// 如果没有找到字体文件，使用默认字体
	ptSize, _ := pdf.GetFontSize()
	if ptSize == 0.0 {
		log.Warn("未找到中文字体文件，使用默认字体")
		pdf.SetFont("Arial", "", 12)
	}
}

func createTitle(pdf *gofpdf.Fpdf, title string) {
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 12, title, "", 1, "L", false, 0, "")
	pdf.Ln(2)
}

func createKeyValueTable(pdf *gofpdf.Fpdf, rows []kv) {
	keyW, valW := 50.0, 140.0
	pdf.SetFont("zh", "", 11)

	for _, row := range rows {
		// 保存起始位置
		startX, startY := pdf.GetX(), pdf.GetY()

		// 计算值的高度（支持多行文本）
		lines := wrapTextByWidth(pdf, row.v, valW-4) // 留2mm边距
		numLines := len(lines)
		if numLines < 1 {
			numLines = 1
		}
		// 最小高度9mm，如果换行则增加高度
		minHeight := 9.0
		textHeight := float64(numLines) * 5.4
		cellHeight := minHeight
		if textHeight > minHeight {
			cellHeight = textHeight + 2 // 增加2mm的上下边距
		}

		// 绘制整个表格单元格边框（包括左侧键列和右侧值列）
		// 先绘制左列（键列）
		pdf.SetXY(startX, startY)
		pdf.SetFillColor(245, 245, 245)
		pdf.Rect(startX, startY, keyW, cellHeight, "FD")
		pdf.SetXY(startX+2, startY+(cellHeight-minHeight)/2)
		pdf.CellFormat(keyW-4, minHeight, row.k, "", 0, "L", false, 0, "")

		// 再绘制右列（值列）
		pdf.SetXY(startX+keyW, startY)
		pdf.SetFillColor(255, 255, 255)
		pdf.Rect(startX+keyW, startY, valW, cellHeight, "FD")

		// 输出文本（支持换行）
		pdf.SetXY(startX+keyW+2, startY+2) // 留2mm边距
		pdf.MultiCell(valW-4, 5.4, row.v, "", "L", false)

		// 移动到下一行的起始位置（X坐标回到左边距，Y坐标下移一个单元格的高度）
		pdf.SetXY(startX, startY+cellHeight)
	}
}

// treeName 生成树形字段前缀，例如：├─ Name、└─ Code；支持多层级前缀：│  、├─、└─
func treeName(level int, isLast bool, name string) string {
	if level <= 0 {
		return name
	}
	prefix := ""
	// 中间层使用竖线占位，增强层级感
	for i := 0; i < level-1; i++ {
		prefix += "│  "
	}
	if isLast {
		prefix += "└─ "
	} else {
		prefix += "├─ "
	}
	return prefix + name
}

func createSimpleTable(pdf *gofpdf.Fpdf, headers []string, data [][]string) {
	// 动态计算列宽
	numCols := len(headers)
	colWidth := 190.0 / float64(numCols) // 总宽度190mm，平均分配

	cols := make([]float64, numCols)
	for i := range cols {
		cols[i] = colWidth
	}

	pdf.SetFont("zh", "B", 10)
	pdf.SetFillColor(220, 220, 220)
	for i, h := range headers {
		pdf.CellFormat(cols[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)
	pdf.SetFont("zh", "", 9)
	for _, r := range data {
		startX, y := pdf.GetXY()
		x := startX
		for i, t := range r {
			if i < len(cols) {
				pdf.CellFormat(cols[i], 8, t, "1", 0, "L", false, 0, "")
				x += cols[i]
			}
		}
		pdf.SetXY(startX, y+8)
	}
}

func createJSONBlock(pdf *gofpdf.Fpdf, content string) {
	pdf.SetFillColor(250, 250, 250)
	pdf.SetFont("zh", "", 9)

	// 分行显示JSON（按原始工程实现，去CR并必要时分页后重置样式）
	lines := splitJSONContent(content)
	for _, line := range lines {
		if checkPageBreak(pdf, 5) {
			pdf.SetFont("zh", "", 9)
			pdf.SetFillColor(250, 250, 250)
		}
		// 转换缩进为普通空格，避免特殊字符显示为方框
		displayLine := convertIndentToSpaces(line)
		pdf.CellFormat(0, 5, displayLine, "", 1, "L", true, 0, "")
	}
}

func createCodeBlock(pdf *gofpdf.Fpdf, lang, code string) {
	pdf.SetFont("zh", "B", 12)
	pdf.CellFormat(0, 8, lang, "", 1, "L", false, 0, "")
	pdf.Ln(2)
	pdf.SetFillColor(248, 249, 250)
	pdf.SetFont("zh", "", 9)

	// 按行输出代码，去除行尾CR并在分页后恢复样式
	for _, line := range splitLines(code) {
		if checkPageBreak(pdf, 5) {
			pdf.SetFont("zh", "", 9)
			pdf.SetFillColor(248, 249, 250)
		}
		// 转换缩进为普通空格，避免特殊字符显示为方框
		displayLine := convertIndentToSpaces(line)
		pdf.CellFormat(0, 5, displayLine, "", 1, "L", true, 0, "")
	}
}

func splitLines(s string) []string {
	// 先按换行符分割，再移除行尾的回车符，并把制表符替换为普通空格
	raw := strings.Split(s, "\n")
	lines := make([]string, 0, len(raw))
	for _, line := range raw {
		// 移除行尾CR
		line = strings.TrimRight(line, "\r")
		// 将行内所有\t替换为两个空格，避免出现方框
		line = strings.ReplaceAll(line, "\t", "  ")
		// 规范化不间断空格为普通空格
		line = strings.ReplaceAll(line, "\u00A0", " ")
		lines = append(lines, line)
	}
	return lines
}

// 按原始程序实现：长行JSON分割并去CR
func splitJSONContent(content string) []string {
	var lines []string
	rawLines := strings.Split(content, "\n")
	for _, line := range rawLines {
		line = strings.TrimRight(line, "\r")
		// 将行内所有\t替换为两个空格
		line = strings.ReplaceAll(line, "\t", "  ")
		// 如过长则按字符数分段，避免超出页面造成异常渲染
		runes := []rune(line)
		if len(runes) > 85 {
			for i := 0; i < len(runes); i += 85 {
				end := i + 85
				if end > len(runes) {
					end = len(runes)
				}
				lines = append(lines, string(runes[i:end]))
			}
		} else {
			lines = append(lines, line)
		}
	}
	return lines
}

// 页面空间不足时主动分页，并返回是否分页
func checkPageBreak(pdf *gofpdf.Fpdf, nextHeight float64) bool {
	// 经验值：A4 高度297mm，底部边距20（在 SetAutoPageBreak 中设置），安全阈值 277
	if pdf.GetY()+nextHeight > 277 {
		pdf.AddPage()
		return true
	}
	return false
}

// calculateLinesNeeded 计算给定宽度下文本需要的行数
func calculateLinesNeeded(pdf *gofpdf.Fpdf, text string, maxWidth float64) int {
	if text == "" {
		return 1
	}
	lines := wrapTextByWidth(pdf, text, maxWidth)
	return len(lines)
}

// drawCellWithWrap 绘制带自动换行的单元格（对齐原始实现）
func drawCellWithWrap(pdf *gofpdf.Fpdf, text string, x, y, width, height, margin, lineHeight float64, align string) {
	// 单元格边框
	pdf.Rect(x, y, width, height, "D")

	// 可用宽度（两侧留白）
	availableWidth := width - margin*2

	// 自动分行（宽度优先）
	lines := wrapTextByWidth(pdf, text, availableWidth)

	// 顶部对齐（避免估算误差导致触碰边框）
	currentY := y + margin
	for _, line := range lines {
		pdf.SetXY(x+margin, currentY)
		pdf.CellFormat(availableWidth, lineHeight, line, "", 0, align, false, 0, "")
		currentY += lineHeight
	}

	// 重置位置到该格末尾
	pdf.SetXY(x+width, y)
}

// wrapTextByWidth 基于字符串宽度进行稳健换行，兼容无空格的长中文/JSON片段
func wrapTextByWidth(pdf *gofpdf.Fpdf, text string, maxWidth float64) []string {
	if text == "" {
		return []string{""}
	}
	// 先按空白进行拆分
	prelim := pdf.SplitText(text, maxWidth)
	result := make([]string, 0, len(prelim))
	for _, seg := range prelim {
		if pdf.GetStringWidth(seg) <= maxWidth {
			result = append(result, seg)
			continue
		}
		runes := []rune(seg)
		start := 0
		acc := 0.0
		for i := 0; i < len(runes); i++ {
			w := pdf.GetStringWidth(string(runes[i : i+1]))
			if acc+w > maxWidth {
				if i > start {
					result = append(result, string(runes[start:i]))
				} else {
					result = append(result, string(runes[i:i+1]))
					i++
				}
				start = i
				acc = 0
				i--
				continue
			}
			acc += w
		}
		if start < len(runes) {
			result = append(result, string(runes[start:]))
		}
	}
	if len(result) == 0 {
		return []string{""}
	}
	return result
}

// convertIndentToSpaces 将缩进转换为普通空格，避免特殊字符显示为方框（完全参考 data-view 实现）
func convertIndentToSpaces(line string) string {
	// 计算前导空格/制表符的数量
	indent := 0
	for _, ch := range line {
		if ch == ' ' {
			indent++
		} else if ch == '\t' {
			indent += 2 // 制表符转为2个空格
		} else {
			break
		}
	}

	// 移除前导空格/制表符
	trimmed := strings.TrimLeft(line, " \t")

	// 用普通ASCII空格重新构建缩进（确保字体支持）
	if indent > 0 {
		return strings.Repeat(" ", indent) + trimmed
	}
	return trimmed
}

// ========================= 完整章节实现 =========================

// createAppInfoSectionV2 按新模板渲染应用信息与令牌获取
func createAppInfoSectionV2(pdf *gofpdf.Fpdf, accessUrl string) {
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 15, "应用信息", "", 1, "L", false, 0, "")
	pdf.Ln(4)
	// 1. 基本信息（写死占位）
	pdf.SetFont("zh", "B", 16)
	pdf.CellFormat(0, 10, "1. 基本信息", "", 1, "L", false, 0, "")
	createKeyValueTable(pdf, []kv{
		{"access_token", "咨询接口提供方获取"},
		//{"密码", "咨询接口提供方获取"},
	})
	pdf.Ln(6)

	// 2. 认证方式-获取令牌
	//	pdf.SetFont("zh", "B", 16)
	//	pdf.CellFormat(0, 10, "2. 认证方式-获取令牌", "", 1, "L", false, 0, "")
	//
	//	// 2.1 功能说明
	//	pdf.SetFont("zh", "B", 14)
	//	pdf.CellFormat(0, 8, "2.1 功能说明", "", 1, "L", false, 0, "")
	//	pdf.SetFont("zh", "", 11)
	//	pdf.MultiCell(0, 6, "使用账号 ID 和密码申请令牌", "", "L", false)
	//	pdf.Ln(4)
	//
	//	// 2.2 申请令牌（cURL）
	//	pdf.SetFont("zh", "B", 14)
	//	pdf.CellFormat(0, 8, "2.2 申请令牌", "", 1, "L", false, 0, "")
	//	reqCurl := `curl -X POST -d "grant_type=client_credentials&scope=all" \
	//-H "Content-Type: application/x-www-form-urlencoded" \
	//-u "{账号ID}:{密码}" https://%s/oauth2/token`
	//	reqCurl = fmt.Sprintf(reqCurl, accessUrl)
	//	createCodeBlock(pdf, "Shell (cURL)", reqCurl)
	//	pdf.Ln(2)
	//
	//	// 响应示例
	//	pdf.SetFont("zh", "B", 12)
	//	pdf.CellFormat(0, 8, "响应示例", "", 1, "L", false, 0, "")
	//	tokenResp := `{
	//  "access_token": "ory_at_RsbcNUAJQ-...",
	//  "expires_in": 3599,
	//  "scope": "all",
	//  "token_type": "bearer"
	//}`
	//	createJSONBlock(pdf, tokenResp)
	//	pdf.Ln(1)
	//	pdf.MultiCell(0, 6, "access_token为获取的令牌，效期为3600s，过期后需要重新申请", "", "L", false)
	//	pdf.Ln(2)
	//
	//	// 2.3 注销令牌
	//	pdf.SetFont("zh", "B", 14)
	//	pdf.CellFormat(0, 8, "2.3 注销令牌", "", 1, "L", false, 0, "")
	//	revokeCurl := `curl -X POST -d "token={access_token}" \
	//-H "Content-Type: application/x-www-form-urlencoded" \
	//-u "{账号ID}:{密码}" https://%s/oauth2/revoke`
	//	revokeCurl = fmt.Sprintf(revokeCurl, accessUrl)
	//	createCodeBlock(pdf, "Shell (cURL)", revokeCurl)
	//	pdf.Ln(1)
	//	pdf.MultiCell(0, 6, "access_token为上一步获取的令牌，响应200 ok", "", "L", false)
}

// createAppInfoSectionV2 按新模板渲染应用信息与令牌获取
func cssjjCreateAppInfoSectionV2(pdf *gofpdf.Fpdf) {
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 15, "签名信息", "", 1, "L", false, 0, "")
	pdf.Ln(4)
	// 1. 基本信息（写死占位）
	pdf.SetFont("zh", "B", 16)
	pdf.CellFormat(0, 10, "1. 基本字段", "", 1, "L", false, 0, "")
	pdf.Ln(4)
	createKeyValueTable(pdf, []kv{
		{"x-tif-paasid", "调用者应用的PaaSID"},
		{"x-tif-timestamp", "当前unix时间戳（ 秒 ）：x-tif-timestamp=(Date.now()/1000).toFixed()"},
		{"x-tif-nonce", "调用者生成的非重复的随机字符串（十分钟内不能重复），用于结合时间戳防止重放：x-tif-nonce=Math.random().toString(36).substr(2)"},
		{"x-tif-signature", "调用者生成的签名字符串，详细算法见“签名算法”"},
		{"Token", "创建应用时分配的加密密钥"},
	})
	pdf.Ln(6)

	// 2. 签名算法
	pdf.SetFont("zh", "B", 16)
	pdf.CellFormat(0, 10, "2. 签名算法", "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// 2.1 签名算法字段
	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "2.1 签名算法主要使用以下几个字段", "", 1, "L", false, 0, "")
	reqMessage := `a) x-tif-timestamp：当前时间unix 时间戳，精确到秒
b) x-tif-nonce：调用者生成的非重复的随机字符串（十分钟内不能重复）
c) Token：创建应用时分配的加密密钥`
	createCodeBlock(pdf, "字段", reqMessage)
	pdf.Ln(4)

	// 2.2 签名算法
	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "2.3 签名算法", "", 1, "L", false, 0, "")
	reqMessage = `x-tif-signature = sha256(x-tif-timestamp + Token + x-tif-nonce + x-tif-timestamp)`
	createCodeBlock(pdf, "签名算法", reqMessage)
}

// createAPISectionV2 按新模板渲染 API 信息（写死版式与字段）
func createAPISectionV2(cssjj bool, pdf *gofpdf.Fpdf, serviceInfo *dto.ServiceGetDocumentationResp) {
	// 标题
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 12, "API 接口信息", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	// [接口名称] - 支持自动换行
	pdf.SetFont("zh", "B", 16)
	pdf.MultiCell(0, 10, serviceInfo.ServiceName, "", "L", false)
	pdf.Ln(2)

	// 1. 基本信息
	apiUrl := serviceInfo.ApiUrl
	if cssjj {
		apiUrl = fmt.Sprintf(serviceInfo.ApiUrl, "{x-tif-paasid}")
	}
	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "1. 基本信息", "", 1, "L", false, 0, "")
	createKeyValueTable(pdf, []kv{
		{"请求方式", strings.ToUpper(serviceInfo.HTTPMethod)},
		{"API 路径", apiUrl},
		{"超时时间", strconv.Itoa(int(serviceInfo.Timeout))},
	})
	pdf.Ln(4)

	// 2. 请求参数（Header）
	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "2. 请求参数（Header）", "", 1, "L", false, 0, "")
	headers := [][]string{
		{"头部", "值", "描述", "必填"},
		{"Authorization", "Bearer <access_token>", "提供身份验证信息，access_token是通过应用申请的令牌", "是"},
	}
	if cssjj {
		headers = [][]string{
			{"头部", "值", "描述", "必填"},
			{"Content-Type", "application/json", "json(text/json)", "是"},
			{"x-tif-paasid", "{x-tif-paasid}", "应用的PaaSID", "是"},
			{"x-tif-timestamp", "{x-tif-timestamp}", "当前unix时间戳(秒)", "是"},
			{"x-tif-nonce", "{x-tif-nonce}", "随机字符串", "是"},
			{"x-tif-signature", "{x-tif-signature}", "签名字符串", "是"},
		}
	}
	// 使用自动换行表格，避免长描述或值顶出边框
	createWrappedTableWithWidths(pdf, headers[0], headers[1:], []float64{35, 70, 65, 20})
	pdf.Ln(4)

	// 3. 请求参数
	pdf.SetFont("zh", "B", 14)
	switch strings.ToUpper(serviceInfo.HTTPMethod) {
	case "GET":
		pdf.CellFormat(0, 8, "3. 请求参数（Query）", "", 1, "L", false, 0, "")
	case "POST":
		pdf.CellFormat(0, 8, "3. 请求参数（Body）", "", 1, "L", false, 0, "")
	default:
		pdf.CellFormat(0, 8, "3. 请求参数（Body）", "", 1, "L", false, 0, "")
	}

	query := [][]string{
		{"参数", "类型", "描述", "必填", "默认值"},
		{"offset", "数值", "分页-页编号（最小为1）", "是", "1"},
		{"limit", "数值", "分页-单页大小", "是", "20"},
	}
	for _, param := range serviceInfo.ServiceParam.DataTableRequestParams {
		tmpParam := []string{param.EnName, param.DataType, param.Description, param.Required, param.DefaultValue}
		query = append(query, tmpParam)
	}
	createSimpleTable(pdf, query[0], query[1:])
	pdf.Ln(4)

	// 4. 返回响应
	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "4. 返回响应", "", 1, "L", false, 0, "")
	resp := [][]string{
		{"参数", "值类型", "描述"},
		{"total_count", "数值", "SQL 查询总数量"},
		{"data", "数组", "SQL 查询的数据"},
		// {treeName(1, false, "Name"), "字符串", "名称"},
		// {treeName(1, false, "Code"), "数值", "编码"},
	}
	for i, param := range serviceInfo.ServiceParam.DataTableResponseParams {
		tmpParam := []string{treeName(1, false, param.EnName), param.DataType, param.Description}
		if i == len(serviceInfo.ServiceParam.DataTableResponseParams)-1 {
			tmpParam = []string{treeName(1, true, param.EnName), param.DataType, param.Description}
		}
		resp = append(resp, tmpParam)
	}
	// 使用支持自动换行和更合理列宽的表格渲染，避免文字贴边/越界
	createWrappedTable(pdf, resp[0], resp[1:])
	pdf.Ln(2)

	// 响应示例
	pdf.SetFont("zh", "B", 12)
	pdf.CellFormat(0, 8, "响应示例", "", 1, "L", false, 0, "")
	// 	example := `{
	//   "total_count": 2,
	//   "data": [
	//     { "Name": "aggregation-order-1", "Code": 1001 },
	//     { "Name": "aggregation-order-2", "Code": 1002 }
	//   ]
	// }`

	example := &bytes.Buffer{}
	err := json.Indent(example, []byte(serviceInfo.ServiceTest.ResponseExample), "", "  ")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	createJSONBlock(pdf, example.String())
}

// createErrorSummarySection 错误汇总（固定表+示例）
func createErrorSummarySection(pdf *gofpdf.Fpdf) {
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 12, "错误汇总", "", 1, "L", false, 0, "")
	pdf.Ln(2)

	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "1. 错误返回信息", "", 1, "L", false, 0, "")

	rows := [][]string{
		{"code", "description", "detail"},
		{"DataApplicationGateway.ServiceApply.ServiceApplyNotPass", "当前接口暂无调用权限，请先申请授权", "-"},
		{"DataApplicationGateway.Public.InvalidParameter", "参数值校验不通过", `[{"key":"name","message":"接口 xx 的请求参数 name 为必填字段"}]`},
		{"Public.AuthenticationFailure", "用户登录已过期", "-"},
		{"DataApplicationGateway.Query.QueryError", "请求错误", "接口请求超时"},
	}
	createWrappedTable(pdf, rows[0], rows[1:])
	pdf.Ln(4)

	pdf.SetFont("zh", "B", 14)
	pdf.CellFormat(0, 8, "2. 示例", "", 1, "L", false, 0, "")
	errJSON := `{
  "code": "DataApplicationGateway.Public.InvalidParameter",
  "description": "参数值校验不通过",
  "solution": "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
  "detail": [
    {"key": "name", "message": "接口 /gd 的请求参数 name 为必填字段"}
  ]
}`
	createJSONBlock(pdf, errJSON)
}

// createWrappedTable 绘制支持自动换行的通用表格（对齐 data-view 的表格实现）
func createWrappedTable(pdf *gofpdf.Fpdf, headers []string, data [][]string) {
	// 列设置：根据列数分配宽度，detail 列更宽一些
	numCols := len(headers)
	if numCols == 0 {
		return
	}
	total := 190.0
	colWidths := make([]float64, numCols)
	margins := make([]float64, numCols)
	for i := range colWidths {
		margins[i] = 4
		colWidths[i] = total / float64(numCols)
	}
	// 如果是3列（参数/值类型/描述），采用更合理的固定列宽，避免贴边
	if numCols == 3 {
		// 参数:58 值类型:35 描述:97  (总宽约 190)
		colWidths[0], colWidths[1], colWidths[2] = 58, 35, 97
		// 参数列左内边距更大，留出树形前缀与边框的安全距离
		margins[0] = 6
	}

	// 表头
	pdf.SetFont("zh", "B", 10)
	pdf.SetFillColor(220, 220, 220)
	for i, h := range headers {
		pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// 内容
	pdf.SetFont("zh", "", 9)
	pdf.SetFillColor(255, 255, 255)
	usableHeight := 277.0 // 与 checkPageBreak 的安全阈值一致

	for _, row := range data {
		// 计算当前行所需最大高度
		maxLines := 1
		for i := range headers {
			var text string
			if i < len(row) {
				text = row[i]
			}
			// 规范化缩进并计算行数
			display := convertIndentToSpaces(text)
			lines := wrapTextByWidth(pdf, display, colWidths[i]-margins[i]*2)
			if ln := len(lines); ln > maxLines {
				maxLines = ln
			}
		}
		lineHeight := 5.4
		rowHeight := float64(maxLines)*lineHeight + 5

		// 分页：若放不下，先翻页并重绘表头
		if pdf.GetY()+rowHeight > usableHeight {
			pdf.AddPage()
			pdf.SetFont("zh", "B", 10)
			pdf.SetFillColor(220, 220, 220)
			for i, h := range headers {
				pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFont("zh", "", 9)
			pdf.SetFillColor(255, 255, 255)
		}

		// 绘制一行（带自动换行）
		startX, startY := pdf.GetXY()
		curX := startX
		for i := range headers {
			var text string
			if i < len(row) {
				text = row[i]
			}
			display := convertIndentToSpaces(text)
			align := "L"
			if numCols == 3 && i == 0 {
				align = "L"
			}
			drawCellWithWrap(pdf, display, curX, startY, colWidths[i], rowHeight, margins[i], lineHeight, align)
			curX += colWidths[i]
		}
		pdf.SetXY(startX, startY+rowHeight)
	}
}

// createWrappedTableWithWidths 同 createWrappedTable，但允许外部指定列宽
func createWrappedTableWithWidths(pdf *gofpdf.Fpdf, headers []string, data [][]string, colWidths []float64) {
	numCols := len(headers)
	if numCols == 0 {
		return
	}
	if len(colWidths) != numCols {
		// 回退到默认逻辑
		createWrappedTable(pdf, headers, data)
		return
	}

	margins := make([]float64, numCols)
	for i := range margins {
		margins[i] = 4
	}
	// 参数列通常需要更大的左内边距
	if numCols >= 1 {
		margins[0] = 6
	}

	// 表头
	pdf.SetFont("zh", "B", 10)
	pdf.SetFillColor(220, 220, 220)
	for i, h := range headers {
		pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// 内容
	pdf.SetFont("zh", "", 9)
	pdf.SetFillColor(255, 255, 255)
	usableHeight := 277.0

	for _, row := range data {
		// 计算当前行所需最大高度
		maxLines := 1
		for i := range headers {
			var text string
			if i < len(row) {
				text = row[i]
			}
			display := convertIndentToSpaces(text)
			lines := wrapTextByWidth(pdf, display, colWidths[i]-margins[i]*2)
			if ln := len(lines); ln > maxLines {
				maxLines = ln
			}
		}
		lineHeight := 5.4
		rowHeight := float64(maxLines)*lineHeight + 5

		// 分页：若放不下，先翻页并重绘表头
		if pdf.GetY()+rowHeight > usableHeight {
			pdf.AddPage()
			pdf.SetFont("zh", "B", 10)
			pdf.SetFillColor(220, 220, 220)
			for i, h := range headers {
				pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFont("zh", "", 9)
			pdf.SetFillColor(255, 255, 255)
		}

		// 绘制一行（带自动换行）
		startX, startY := pdf.GetXY()
		curX := startX
		for i := range headers {
			var text string
			if i < len(row) {
				text = row[i]
			}
			display := convertIndentToSpaces(text)
			drawCellWithWrap(pdf, display, curX, startY, colWidths[i], rowHeight, margins[i], lineHeight, "L")
			curX += colWidths[i]
		}
		pdf.SetXY(startX, startY+rowHeight)
	}
}

// createUsageExamplesChapter 创建独立的使用示例章节
func createUsageExamplesChapter(pdf *gofpdf.Fpdf, data *dto.ExampleCode) {
	// 章节标题
	pdf.SetFont("zh", "B", 20)
	pdf.CellFormat(0, 15, "使用示例", "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// 章节说明
	pdf.SetFont("zh", "", 12)
	pdf.MultiCell(0, 6, "以下示例展示了如何使用不同编程语言调用 API 接口", "", "L", false)
	pdf.Ln(8)

	// Shell示例
	shellExample := data.ShellExampleCode
	pdf.Bookmark("Shell示例", 1, -1)
	createCodeBlock(pdf, "Shell (cURL)", shellExample)
	pdf.Ln(5)

	// Python示例
	pythonExample := data.PythonExampleCode
	pdf.Bookmark("Python示例", 1, -1)
	createCodeBlock(pdf, "Python", pythonExample)
	pdf.Ln(5)

	// Go示例
	goExample := data.GoExampleCode
	pdf.Bookmark("Go示例", 1, -1)
	createCodeBlock(pdf, "Go", goExample)

	// Java示例
	javaExample := data.JavaExampleCode
	pdf.Bookmark("Java示例", 1, -1)
	createCodeBlock(pdf, "Java", javaExample)
}
