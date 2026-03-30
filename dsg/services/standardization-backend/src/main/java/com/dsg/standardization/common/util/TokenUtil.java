package com.dsg.standardization.common.util;

import cn.hutool.core.collection.CollectionUtil;
import com.dsg.standardization.common.constant.Constants;

import com.dsg.standardization.vo.*;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.*;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpUriRequest;
import org.apache.http.conn.ssl.NoopHostnameVerifier;
import org.apache.http.conn.ssl.SSLConnectionSocketFactory;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.message.BasicHeader;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServletRequest;
import java.security.KeyManagementException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.X509Certificate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * token 工具类
 *
 * @author Jie.xu
 */
@Slf4j
public class TokenUtil {

    private final static Logger logger = LoggerFactory.getLogger(TokenUtil.class);

    /**
     * 获取 http请求中的token
     */
    public static String getToken() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                .getRequest();
        return getToken(request);
    }


    public static String getToken(ServletRequest servletRequest) {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        return getToken(request);
    }

    public static String getToken(HttpServletRequest httpServletRequest) {
        String prefix = "Bearer";
        if (null == httpServletRequest) {
            return null;
        }
        String token = httpServletRequest.getHeader(Constants.HTTP_HEADER_TOKEN_KEY);
        if (CustomUtil.isNotEmpty(token)) {
            if (token.startsWith(prefix)) {
                return token.replace(prefix, "").trim();
            } else {
                return token;
            }
        }
        return null;
    }


    public static HydraUser getHydraUser(String tokenCheckUrl, String token, String traceParant) {
        if (CustomUtil.isEmpty(token)) {
            return null;
        }
        Map<String, String> params = new HashMap<>();
        params.put("token", token);
        try {
            HttpResponseVo responseVo = httpPostFromData(tokenCheckUrl, params, null, traceParant);
            if (null == responseVo) {
                return null;
            }

            if (!responseVo.isSucesss()) {
                return null;
            }

            String data = responseVo.getResult();
            if (CustomUtil.isEmpty(data)) {
                return null;
            }
            HydraUser hydraUser = JsonUtils.json2Obj(data, HydraUser.class);
            return hydraUser;
        } catch (Exception e) {
            logger.error("请求令牌内省失败，url={}", tokenCheckUrl, e);
        }
        return null;
    }


    /**
     * 校验token有效性
     *
     * @param tokenCheckUrl
     * @param token
     * @return
     */
    public static boolean checkTokenValid(String tokenCheckUrl, String token, String traceParent) {
        if (CustomUtil.isEmpty(token)) {
            return false;
        }
        Map<String, String> params = new HashMap<>();
        params.put("token", token);
        try {
            HttpResponseVo responseVo = httpPostFromData(tokenCheckUrl, params, null, traceParent);
            if (null == responseVo) {
                return false;
            }
            String data = responseVo.getResult();
            if (CustomUtil.isEmpty(data)) {
                return false;
            }
            Map<String, Object> dataMap = JsonUtils.json2Obj(data, Map.class);
            if (CustomUtil.isNotEmpty(dataMap) && dataMap.containsKey("active")) {
                Boolean active = (Boolean) dataMap.get("active");
                if (active) {
                    return true;
                }
            }
        } catch (Exception e) {
            logger.error("请求令牌内省失败，url={}", tokenCheckUrl, e);
        }
        return false;
    }


    public static boolean checkRoleAccessControl(String url, String token, Map<String, String> params, String traceParant) {
        if (CustomUtil.isEmpty(token)) {
            return false;
        }
        try {
            HttpResponseVo responseVo = httpGet(url, params, createTokenHeader(token), traceParant);
            if (responseVo.getCode() < 200 || responseVo.getCode() > 300) {
                return false;
            }
            String data = responseVo.getResult();
            log.info("===checkRoleAccessControl,data:{},==getCode:{}", data,responseVo.getCode());
            if (CustomUtil.isEmpty(data)) {
                return false;
            }

            if (data.trim().equalsIgnoreCase("true")) {
                return true;
            }

        } catch (Exception e) {
            logger.error("请求失败，url={}", url, e);
        }
        return false;
    }

    private static Header[] createTokenHeader(String token) {
        Header[] headers = new Header[]{new BasicHeader("Authorization", String.format("Bearer %s", token))};
        return headers;
    }

    public static UserInfo getUserInfo(String serssionServicieUrl, String token, String traceParent) {
        UserInfo userInfo = new UserInfo();
        try {
            if (CustomUtil.isNotEmpty(serssionServicieUrl) && CustomUtil.isNotEmpty(token)) {
                HttpResponseVo responseVo = httpGet(serssionServicieUrl, null, createTokenHeader(token), traceParent);
                if (responseVo != null && responseVo.isSucesss()) {
                    Map<String, Object> data = JsonUtils.json2Obj(responseVo.getResult(), Map.class);
                    userInfo.setUserId((String) data.get("ID"));
                    userInfo.setUserName((String) data.get("Account"));
                    userInfo.setNickName((String) data.get("VisionName"));
                } else {
                    logger.error("获取用户信息失败，url:{}", serssionServicieUrl);
                }
            }
        } catch (Exception e) {
            logger.error("请求失败，url={}", serssionServicieUrl, e);
        }
        return userInfo;
    }

    public static UserInfo getUserInfo() {
        UserInfo userInfo = new UserInfo();
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes())
                    .getRequest();
            userInfo.setUserId(request.getHeader("userId"));
            userInfo.setUserName(request.getHeader("userName"));
            userInfo.setNickName(request.getHeader("nickName"));
            String deptJson =  request.getHeader("dept");
            if(StringUtils.isNotEmpty(deptJson)) {
                userInfo.setDeptList(JsonUtils.json2List(deptJson, Department.class));
            }
        } catch (Exception e) {
            logger.error("", e);
        }
        return userInfo;
    }


    private static final String REQ_ENCODEING_UTF8 = "utf-8";


    private static HttpResponseVo httpGet(String url, Map<String, String> params, Header[] headers, String traceparent) throws Exception {
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
        logger.info("=httpGet=请求url==={}==",url);
        return dopost(url, httpGet, traceparent);
    }

    private static HttpResponseVo httpPostFromData(String url, Map<String, String> params, Header[] headers, String traceParent) throws Exception {
//        logger.info("=httpPostFromData=请求url==={}==参数=={}=",url,params);
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
        return dopost(url, post, traceParent);
    }

    private static HttpResponseVo dopost(String url, HttpUriRequest httpUriRequest, String traceParent) {
//        logger.info("=dopost=请求url==={}==",url);
        String builderName = httpUriRequest.getURI().toString();

        HttpResponse httpresponse = null;
        int code = -1;
        try (CloseableHttpClient httpClient = declareHttpClientSSL(url)) {
            httpresponse = httpClient.execute(httpUriRequest);
            HttpEntity httpEntity = httpresponse.getEntity();
            code = httpresponse.getStatusLine().getStatusCode();
            String result = EntityUtils.toString(httpEntity, REQ_ENCODEING_UTF8);
            logger.info("==请求结果==={}==状态=={}=",result,code);
            return new HttpResponseVo(code, result);
        } catch (Exception e) {
            logger.error(String.format("http请求失败，uri{%s},exception{%s}", new Object[]{url, e}));
        }
        return null;
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

    public static ThirdPartyAccount getThirdPartyAccount(String url, String token, Map<String, String> params, String traceParant) {
        if (CustomUtil.isEmpty(token)) {
            return null;
        }
        try {
            HttpResponseVo responseVo = httpGet(url, params, createTokenHeader(token), traceParant);
            if (null == responseVo || !responseVo.isSucesss()) {
                return null;
            }

            String data = responseVo.getResult();
            log.info("===getThirdPartyAccount,data:{},==getCode:{}", data,responseVo.getCode());
            if (CustomUtil.isEmpty(data)) {
                return null;
            }
            ThirdPartyAccount thirdPartyAccount = JsonUtils.json2Obj(data, ThirdPartyAccount.class);
            return thirdPartyAccount;
        } catch (Exception e) {
            logger.error("=getThirdPartyAccount请求失败，url={}", url, e);
        }
        return null;
    }

    public static HydraClientUser getHydraClientUser(String url, String token, Map<String, String> params, String traceParant) {
        if (CustomUtil.isEmpty(token)) {
            return null;
        }
        try {
            HttpResponseVo responseVo = httpGet(url, params, createTokenHeader(token), traceParant);
            if (null == responseVo || !responseVo.isSucesss()) {
                return null;
            }

            String data = responseVo.getResult();
            log.info("===getHydraClientUser,data:{},==getCode:{}", data,responseVo.getCode());
            if (CustomUtil.isEmpty(data)) {
                return null;
            }
            HydraClientUser hydraClientUser = JsonUtils.json2Obj(data, HydraClientUser.class);
            return hydraClientUser;
        } catch (Exception e) {
            logger.error("==getHydraClientUser=请求失败，url={}", url, e);
        }
        return null;
    }

    public static List<Department> getDeptListByUserId(String configurationUrl,String userId) {
        try {
            if (CustomUtil.isNotEmpty(configurationUrl) && CustomUtil.isNotEmpty(userId)) {
                HttpResponseVo responseVo = httpGet(configurationUrl+"/api/internal/configuration-center/v1/user/"+userId+"/departs?parent_deps", null,null, null);
                if (responseVo != null && responseVo.isSucesss() && StringUtils.isNotEmpty(responseVo.getResult())) {
                    List<Department> lists =  JsonUtils.json2List(responseVo.getResult(), Department.class);
                    for (Department dept : lists) {
                       String deptId = StringUtil.PathSplitAfter(dept.getId());
                       HttpResponseVo respDeptVo = httpGet(configurationUrl+"/api/internal/configuration-center/v1/objects/department/"+deptId, null,null, null);
                        if (respDeptVo != null && respDeptVo.isSucesss() && StringUtils.isNotEmpty(respDeptVo.getResult())) {
                            Department department = JsonUtils.json2Obj(respDeptVo.getResult(), Department.class);
                            dept.setThirdDeptId(department.getThirdDeptId());
                            dept.setPathId(department.getPathId());
                            dept.setName(department.getName());
                            dept.setId(department.getId());
                        }
                    }
                    return lists;
                } else {
                    logger.error("获取部门信息失败，url:{}", configurationUrl);
                }
            }
        } catch (Exception e) {
            logger.error("请求部门信息失败，url={}", configurationUrl, e);
        }
        return null;
    }

    /**
     * 获取部门ID的全路径
     * @param departmentIds
     * @return
     */
    public static Department getDeptPathIds(String departmentIds) {
        try {
            if(StringUtils.isNotEmpty(departmentIds)){
                String deptId = StringUtil.PathSplitAfter(departmentIds);
                HttpResponseVo respDeptVo = httpGet("http://configuration-center:8133/api/internal/configuration-center/v1/objects/department/"+deptId, null,null, null);
                if (respDeptVo != null && respDeptVo.isSucesss() && StringUtils.isNotEmpty(respDeptVo.getResult())) {
                    Department department = JsonUtils.json2Obj(respDeptVo.getResult(), Department.class);
                    department.setThirdDeptId(department.getThirdDeptId());
                    department.setPathId(department.getPathId());
                    department.setName(department.getName());
                    department.setId(department.getId());
                    return department;
                }
            } else {
                UserInfo user = CustomUtil.getUser();
                Department department = new Department();
                department.setId(user.getDeptList().get(0).getId());
                department.setPathId(user.getDeptList().get(0).getPathId());
                department.setThirdDeptId(user.getDeptList().get(0).getThirdDeptId());
                department.setName(user.getDeptList().get(0).getName());
                return department;
            }
        } catch (Exception e) {
            logger.error("getDeptInfo请求部门信息失败", e);
        }
        return null;
    }

    public static Map<String,Department> getMapDeptInfo(Collection<String> deptIds) {
        try {
            if(CollectionUtil.isNotEmpty(deptIds)){
                String param = deptIds.stream().map(id -> "ids=" + id).collect(Collectors.joining("&"));
                HttpResponseVo respDeptVo = httpGet("http://configuration-center:8133/api/internal/configuration-center/v1/department/precision?"+param, null,null, null);
                if (respDeptVo != null && respDeptVo.isSucesss() && StringUtils.isNotEmpty(respDeptVo.getResult())) {
                    JsonObject jsonObject = JsonParser.parseString(respDeptVo.getResult()).getAsJsonObject();
                    JsonArray departmentsArray = jsonObject.getAsJsonArray("departments");
                    logger.info("====getMapDeptInfo请求部门信息返回值=={}", departmentsArray);
                    List<Department> lists =  JsonUtils.json2List(departmentsArray.toString(), Department.class);
                    if (CollectionUtil.isNotEmpty(lists)){
                        return lists.stream().collect(Collectors.toMap(Department::getId, Department -> Department));
                    }
                    return new HashMap<>();
                }
            }
        } catch (Exception e) {
            logger.error("getMapDeptInfo请求部门信息失败", e);
        }
        return new HashMap<>();
    }
}
