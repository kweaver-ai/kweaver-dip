package com.dsg.standardization.common.util;


import lombok.extern.slf4j.Slf4j;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.util.EntityUtils;
import com.dsg.standardization.vo.HttpResponseVo;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.Map;


@Slf4j
public class HttpUtils {

    private static final String REQ_ENCODEING_UTF8 = "utf-8";

    /**
     * post
     * @param url
     * @param params
     * @param headers
     * @return
     * @throws Exception
     */
    public static HttpResponseVo httpGet(String url, Map<String, String> params, Header[] headers) throws Exception {
        StringBuffer param = new StringBuffer();
        if (params != null && !params.isEmpty()) {
            int i = 0;
            for (Map.Entry<String, String> entry : params.entrySet()) {
                if (i == 0) {
                    param.append("?");
                } else {
                    param.append("&");
                }
                param.append(entry.getKey()).append("=").append(entry.getValue());
                i++;
            }
        }
        url += param;
        HttpGet httpGet = new HttpGet(url);
        if (null != headers) {
            httpGet.setHeaders(headers);
        }
        httpGet.addHeader("Content-Type", "application/json;charset=" + REQ_ENCODEING_UTF8);
        return dopost(url, httpGet);
    }

    public static HttpResponseVo dopost(String url, HttpRequestBase httpUriRequest) {
        HttpResponse httpresponse = null;
        int code = -1;
        try (CloseableHttpClient httpClient = declareHttpClientSSL(url)) {
            //设置超时时间,未设置默认是2分钟
            RequestConfig requestConfig = RequestConfig.custom()
                    .setSocketTimeout(60 * 1000)
                    .setConnectionRequestTimeout(60 * 1000)
                    .setConnectTimeout(60 * 1000)
                    .build();
            httpUriRequest.setConfig(requestConfig);

            httpresponse = httpClient.execute(httpUriRequest);
            HttpEntity httpEntity = httpresponse.getEntity();
            code = httpresponse.getStatusLine().getStatusCode();
            String result = EntityUtils.toString(httpEntity, REQ_ENCODEING_UTF8);
            return new HttpResponseVo(code, result);
        } catch (Exception e) {
            log.error("http请求失败，url:{}", url, e);
        }
        return new HttpResponseVo(-1, null);
    }

    private static CloseableHttpClient declareHttpClientSSL(String url) {
        if (url.startsWith("https://")) {
            return sslClient();
        } else {
            PoolingHttpClientConnectionManager httpClientConnectionManager = new PoolingHttpClientConnectionManager();
            httpClientConnectionManager.setMaxTotal(100);
            httpClientConnectionManager.setDefaultMaxPerRoute(20);
            return HttpClientBuilder.create().setConnectionManager(httpClientConnectionManager).build();
        }
    }

    /**
     * 设置SSL请求处理
     */
    private static CloseableHttpClient sslClient() {
        try {
            SSLContext ctx = SSLContext.getInstance("TLS");
            X509TrustManager tm = new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() {
                    return null;
                }

                public void checkClientTrusted(X509Certificate[] xcs, String str) {
                }

                public void checkServerTrusted(X509Certificate[] xcs, String str) {
                }
            };
            ctx.init(null, new TrustManager[]{tm}, null);
            SSLConnectionSocketFactory sslConnectionSocketFactory = new SSLConnectionSocketFactory(ctx,
                    NoopHostnameVerifier.INSTANCE);
            return HttpClients.custom().setSSLSocketFactory(sslConnectionSocketFactory).build();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        } catch (KeyManagementException e) {
            throw new RuntimeException(e);
        }
    }
}
