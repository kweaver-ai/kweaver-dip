package com.dsg.standardization.common.util;

import cn.hutool.core.io.IoUtil;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;

import com.dsg.standardization.configuration.OssConfigruation;

import lombok.extern.slf4j.Slf4j;
import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;

import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.*;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.entity.BasicHttpEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicHeader;
import org.apache.http.util.EntityUtils;
import org.apache.tomcat.util.http.fileupload.IOUtils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.dsg.standardization.vo.HttpResponseVo;
import com.dsg.standardization.vo.oss.OssObjectStorageInfo;
import com.dsg.standardization.vo.oss.OssUploadDownloadUrlInfo;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.List;
import java.util.Map;


@Slf4j
@Component
public class OssFileUploadDownloadUtil {


    @Autowired
    private OssConfigruation ossConfigruation;


    // this is config
    private static final String REQ_ENCODEING_UTF8 = "utf-8";


    public Boolean uploadFile(MultipartFile file, String fileKey) throws CustomException {
        try {
            OssUploadDownloadUrlInfo ossUploadUrlInfo = getUploadUrl(fileKey);
            HttpEntityEnclosingRequestBase httpRequest = null;
            if ("PUT".equalsIgnoreCase(ossUploadUrlInfo.getMethod())) {
                httpRequest = new HttpPut(ossUploadUrlInfo.getUrl());
            } else if ("POST".equalsIgnoreCase(ossUploadUrlInfo.getMethod())) {
                httpRequest = new HttpPost(ossUploadUrlInfo.getUrl());
            } else {
                throw new CustomException(ErrorCodeEnum.FileUploadFailed, String.format("文件上传失败，暂不支持的方法[%s]类型", ossUploadUrlInfo.getMethod()));
            }
            if (null != ossUploadUrlInfo.getHeaders()) {
                for (Map.Entry<String, String> row : ossUploadUrlInfo.getHeaders().entrySet()) {
                    httpRequest.setHeader(row.getKey(), row.getValue());
                }
            }

            BufferedInputStream clientToProxyBuf = new BufferedInputStream(file.getInputStream());
            BasicHttpEntity basicHttpEntity = new BasicHttpEntity();
            basicHttpEntity.setContent(clientToProxyBuf);
            basicHttpEntity.setContentLength(clientToProxyBuf.available());
            httpRequest.setEntity(basicHttpEntity);

            HttpResponseVo responseVo = dopost(ossUploadUrlInfo.getUrl(), httpRequest);
            if (!responseVo.isSucesss()) {
                log.error("文件[{}]上传失败,httpUrl:{},httpCode:{}", file.getOriginalFilename(), ossUploadUrlInfo.getUrl(), responseVo.getCode());
                throw new CustomException(ErrorCodeEnum.FileUploadFailed, "文件上传失败");
            }
            return true;
        } catch (Exception e) {
            log.error("文件[{}]上传失败", file.getOriginalFilename(), e);
            throw new CustomException(ErrorCodeEnum.FileUploadFailed, String.format("文件[%s]上传失败", file.getOriginalFilename()));
        }

    }

    public void download(String fileKey, OutputStream os) {
        OssUploadDownloadUrlInfo ossUploadUrlInfo = null;
        try {
            ossUploadUrlInfo = getDownloadUrl(fileKey);
        } catch (CustomException e) {
            log.error("文件下载失败", e);
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed);
        }

        if (null == ossUploadUrlInfo) {
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed);
        }

        HttpGet httpGet = new HttpGet(ossUploadUrlInfo.getUrl());
        setHttpHeader(ossUploadUrlInfo, httpGet);

        HttpResponse httpresponse = null;
        int code = -1;
        try (CloseableHttpClient httpClient = declareHttpClientSSL(ossUploadUrlInfo.getUrl())) {
            httpresponse = httpClient.execute(httpGet);
            HttpEntity httpEntity = httpresponse.getEntity();
            code = httpresponse.getStatusLine().getStatusCode();
            if (200 >= code && code < 300) {
                InputStream is = httpEntity.getContent();
                IOUtils.copy(is, os);
            } else {
                throw new RuntimeException("文件下载失败");
            }
        } catch (Exception e) {
            log.error(String.format("文件下载失败，url{%s}", ossUploadUrlInfo.getUrl()), e);
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed, String.format("文件下载失败，url{%s}", ossUploadUrlInfo.getUrl()));
        }
    }


    public byte[] download(String fileKey) {
        ByteArrayOutputStream outputStream = null;
        OssUploadDownloadUrlInfo ossUploadUrlInfo = getDownloadUrl(fileKey);
        HttpGet httpGet = new HttpGet(ossUploadUrlInfo.getUrl());
        setHttpHeader(ossUploadUrlInfo, httpGet);
        CloseableHttpClient httpClient = null;
        int code = -1;
        try {
            httpClient = declareHttpClientSSL(ossUploadUrlInfo.getUrl());
            HttpResponse httpresponse = httpClient.execute(httpGet);
            HttpEntity httpEntity = httpresponse.getEntity();
            code = httpresponse.getStatusLine().getStatusCode();
            if (200 >= code && code < 300) {
                outputStream = new ByteArrayOutputStream();
                InputStream inputStream = httpEntity.getContent();
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                outputStream.flush();
                IoUtil.close(inputStream);
                return outputStream.toByteArray();
            } else {
                throw new CustomException(ErrorCodeEnum.FileDownloadFailed, String.format("文件下载失败，url{%s}", ossUploadUrlInfo.getUrl()));
            }
        } catch (Exception e) {
            String msg = String.format("文件下载失败，url: {%s},httpCode: {%s}", ossUploadUrlInfo.getUrl(), code == -1 ? "" : code);
            log.error(msg, e);
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed, msg, ossUploadUrlInfo.getUrl());
        } finally {
            IoUtil.close(outputStream);
            IoUtil.close(httpClient);
        }
    }

    private static void setHttpHeader(OssUploadDownloadUrlInfo ossUploadUrlInfo, HttpGet httpGet) {
        if (null != ossUploadUrlInfo.getHeaders()) {
            for (Map.Entry<String, String> row : ossUploadUrlInfo.getHeaders().entrySet()) {
                httpGet.setHeader(row.getKey(), row.getValue());
            }
        }
    }


    private OssUploadDownloadUrlInfo getDownloadUrl(String fileKey) throws CustomException {
        String storageId = getStorageId();
        return getDownloadUrl(fileKey, storageId);
    }

    private OssUploadDownloadUrlInfo getDownloadUrl(String fileKey, String storageId) {
        String downloadUrlGetURI = "%s://%s/api/ossgateway/v1/download/%s/%s";
        String url = String.format(downloadUrlGetURI, ossConfigruation.getOssProtocol(), ossConfigruation.getOssHost(), storageId, fileKey);
        try {
            HttpResponseVo responseVo = httpGet(url, null, createHttpHeader());
            if (responseVo.isSucesss()) {
                OssUploadDownloadUrlInfo uploadUrlInfo = JsonUtils.json2Obj(responseVo.getResult(), OssUploadDownloadUrlInfo.class);
                return uploadUrlInfo;
            } else {
                log.error("获取OSS上传URL失败，http url：{}， http code：{}", url, responseVo.getCode());
                throw new CustomException(ErrorCodeEnum.RemoteServiceAcccessFailed, "获取OSS上传URL失败");
            }
        } catch (Exception e) {
            log.error("获取OSS上传URL失败，http url：{}", url, e);
            throw new CustomException(ErrorCodeEnum.RemoteServiceAcccessFailed, "获取OSS上传URL失败");
        }
    }


    private OssUploadDownloadUrlInfo getUploadUrl(String fileKey) throws CustomException {

        try {
            String storageId = getStorageId();
            String uploadUrlGetURI = "%s://%s/api/ossgateway/v1/upload/%s/%s?request_method=PUT";
            String url = String.format(uploadUrlGetURI, ossConfigruation.getOssProtocol(), ossConfigruation.getOssHost(), storageId, fileKey);
            HttpResponseVo responseVo = httpGet(url, null, createHttpHeader());
            if (responseVo.isSucesss()) {
                OssUploadDownloadUrlInfo uploadUrlInfo = JsonUtils.json2Obj(responseVo.getResult(), OssUploadDownloadUrlInfo.class);
                return uploadUrlInfo;
            } else {
                log.error("获取OSS上传URL失败，http url：{}， http code：{}", url, responseVo.getCode());
                throw new CustomException(ErrorCodeEnum.RemoteServiceAcccessFailed, "获取OSS上传URL失败");
            }
        } catch (Exception e) {
            log.error("获取OSS上传URL失败:", e);
            throw new CustomException(ErrorCodeEnum.RemoteServiceAcccessFailed, "获取OSS上传URL失败");
        }
    }

    private String getStorageId() throws CustomException {
        String storageIdGetURI = "%s://%s/api/ossgateway/v1/objectstorageinfo?isCache=false";
        String url = String.format(storageIdGetURI, ossConfigruation.getOssProtocol(), ossConfigruation.getOssHost());
        try {
//            log.info("==查询StorageId的请求地址=={}",url);
            HttpResponseVo responseVo = httpGet(url, null, createHttpHeader());
            log.info("==获取StorageId==状态码={}==响应结果=={}",responseVo.getCode(),responseVo.getResult());
            if (responseVo.isSucesss()) {
                List<OssObjectStorageInfo> storageInfoList = JsonUtils.json2List(responseVo.getResult(), OssObjectStorageInfo.class);
                for (OssObjectStorageInfo row : storageInfoList) {
                    if (ossConfigruation.getOssApp().equals(row.getApp())
//                            && ossConfigruation.getOssBucket().equals(row.getBucketInfo().getName())
                            ) {
                        return row.getStorageId();
                    }
                }
            } else {
                log.error("获取OSS StorageId 失败，http url：{}， http code：{}", url, responseVo.getCode());
            }
        } catch (Exception e) {
            log.error("获取OSS StorageId 失败，http url：{}", url, e);
        }
        throw new CustomException(ErrorCodeEnum.RemoteServiceAcccessFailed, "获取OSS StorageId 失败");
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


    private HttpResponseVo httpGet(String url, Map<String, String> params, Header[] headers) throws Exception {
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

    private HttpResponseVo dopost(String url, HttpRequestBase httpUriRequest) {
        log.info("==上传oss=====url=={}===http=={}",url,httpUriRequest.getAllHeaders());

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


    private CloseableHttpClient declareHttpClientSSL(String url) {
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
    private CloseableHttpClient sslClient() {
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

    private Header[] createHttpHeader() {
        if (ossConfigruation.getDebug()) {
            String token = TokenUtil.getToken();
//            log.info("===获取oss对象地址传入token=={}",token);
            return new Header[]{new BasicHeader("Authorization", String.format("Bearer %s", token))};
        }
        return null;
    }

}
