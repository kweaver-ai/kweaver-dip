package com.dsg.standardization.common.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.*;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import com.dsg.standardization.vo.HttpResponseVo;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;


@Slf4j
public class HttpUtil {


    public static HttpResponseVo httpPostFromData(String url, Map<String, String> params, Header[] headers) throws Exception {
        HttpPost post = new HttpPost(url);
        if (null != headers) {
            post.setHeaders(headers);
        }
        post.addHeader("Content-Type", "application/x-www-form-urlencoded");

        //拼接参数体
        List<NameValuePair> paramList = new ArrayList<NameValuePair>();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            paramList.add(new BasicNameValuePair(entry.getKey(), entry.getValue()));
        }
        post.setEntity(new UrlEncodedFormEntity(paramList, "UTF-8"));
        return dopost(url, post);
    }

    /**
     * post
     *
     * @param url
     * @param params
     * @param headers
     * @return
     * @throws Exception
     */
    public static HttpResponseVo httpPost(String url, String params, Header[] headers) throws Exception {
        return httpPost(url, params, headers, null);
    }

    public static HttpResponseVo httpPost(String url, String params, Header[] headers, RequestConfig config) throws Exception {
        log.debug("httpPost url:{},headers:{},config:{},parans:{}", url, headers, config, params);
        HttpPost post = new HttpPost(url);
        if (null != headers) {
            post.setHeaders(headers);
        }
        post.addHeader("Content-Type", "application/json;charset=" + REQ_ENCODEING_UTF8);
        // 设置传输编码格式
        StringEntity stringEntity = new StringEntity(params, REQ_ENCODEING_UTF8);
        post.setEntity(stringEntity);

        if (config == null) {
            config = RequestConfig.custom()
                    //设置从connect Manager获取Connection 超时时间
                    .setConnectionRequestTimeout(1000)
                    // socketTimeOut是指链接建立成功后,数据包传输之间时间超时限制.
                    // 此处有个需要注意点是socketTimeOut所处理的超时时间是指相邻两个数据包传输之间所经历的时间
                    .setSocketTimeout(60000)
                    // connectTimeOut就是指在进行tcp三次握手行为时所设置的超时
                    .setConnectTimeout(5000)
                    .build();
        }
        post.setConfig(config);
        return dopost(url, post);
    }

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

    private static HttpResponseVo dopost(String url, HttpUriRequest httpUriRequest) {


        HttpResponse httpresponse = null;
        int code = -1;
        try (CloseableHttpClient httpClient = declareHttpClientSSL(url)) {
            httpresponse = httpClient.execute(httpUriRequest);
            HttpEntity httpEntity = httpresponse.getEntity();
            code = httpresponse.getStatusLine().getStatusCode();
            String result = EntityUtils.toString(httpEntity, REQ_ENCODEING_UTF8);
            return new HttpResponseVo(code, result);
        } catch (Exception e) {
            log.error(String.format("http请求失败，uri{%s},exception{%s}", new Object[]{url, e}));
        }
        return null;
    }


    private static CloseableHttpClient declareHttpClientSSL(String url) {
        if (url.startsWith("https://")) {
            return sslClient();
        } else {
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
//			SSLConnectionSocketFactory sslConnectionSocketFactory = SSLConnectionSocketFactory.getSocketFactory();
            return HttpClients.custom().setSSLSocketFactory(sslConnectionSocketFactory).build();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        } catch (KeyManagementException e) {
            throw new RuntimeException(e);
        }
    }

    // this is config
    private static final String REQ_ENCODEING_UTF8 = "utf-8";
    private static PoolingHttpClientConnectionManager httpClientConnectionManager;

    public HttpUtil() {
        httpClientConnectionManager = new PoolingHttpClientConnectionManager();
        httpClientConnectionManager.setMaxTotal(100);
        httpClientConnectionManager.setDefaultMaxPerRoute(20);
    }

//    private static HttpResponseVo dopost(String url, HttpPost post) throws Exception {
//        try (CloseableHttpClient httpClient = declareHttpClientSSL(url)) {
//            HttpResponse httpresponse = httpClient.execute(post);
//            HttpEntity httpEntity = httpresponse.getEntity();
//            int code = httpresponse.getStatusLine().getStatusCode();
//            String result = EntityUtils.toString(httpEntity, REQ_ENCODEING_UTF8);
//            return new HttpResponseVo(code, result);
//        } catch (Exception e) {
//            log.error("http请求失败，url:{}", url, e);
//            throw e;
//        }
//    }

    public static HttpResponseVo httpPost(String url, UrlEncodedFormEntity ue, Header[] headers) throws Exception {
        HttpPost post = new HttpPost(url);
        if (null != headers) {
            post.setHeaders(headers);
        } else {
            post.addHeader("Content-Type", "application/json;charset=" + REQ_ENCODEING_UTF8);
        }
        post.setEntity(ue);
        return dopost(url, post);
    }

}
