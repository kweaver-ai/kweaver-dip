package com.dsg.standardization.common.webfilter;

import cn.hutool.core.collection.CollectionUtil;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.exception.UnauthorizedException;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.JsonUtils;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.common.util.TokenUtil;
import com.dsg.standardization.vo.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.HandlerExceptionResolver;


import javax.servlet.*;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class WebTokenFilter extends TokenCheckConfig implements Filter {

    @Autowired
    HandlerExceptionResolver handlerExceptionResolver;

    @Value("${token.check.url}")
    String tokenCheckUrl;

    @Value("${token.check.enable:true}")
    Boolean tokenCheckEnable;

    @Value("${token.access-control.enable:true}")
    Boolean tokenAccessControlEnable;

    @Value("${token.access-control.url:}")
    String tokenAccessControlUrl;

    @Value("${token.access-control.resource-code:-1}")
    Integer tokenAccessControlResourceCode;


    @Value("${session.service.url:http://session:8113/af/api/session/v1/userinfo}")
    String serssionServicieUrl;

    @Value("${configuration.center:http://configuration-center:8133}")
    String configuration_url;

    @Value("${token.third-party-account.url:}")
    String tokenThirdPartyAccountUrl;
    @Value("${token.check.client-url:}")
    String tokenCheckClientUrl;

    @Value("${third-party.department-id:8fd85070-3c6c-11f0-9815-12b58a7f919c/8fdbed3e-3c6c-11f0-9815-12b58a7f919c/9060f92a-3c6c-11f0-9815-12b58a7f919c}")
    String thirdPartyDeptmentId; //第三方同步部门ID
    @Value("${third-party.third-dept-id:zctc6m9par2s4nbg5wxbua}")
    String thirdPartyThirdDeptId;   //第三方同步第三方部门ID

    String URI_REGEX = "^/api/(.+)/v1/.*";

//    private String[] IGNORE_TOKEN_URLS = new String[]{"dataelement/query/list","dataelement/dict/enum/getList","dataelement/dict/queryByIds",
//            "dataelement/detail", "dataelement/dict","dataelement/dict/enum","dataelement/query/stdFile",
//            "dataelement/task/queryTaskState","v1/rule/internal/getId/"};

    private String[] IGNORE_TOKEN_URLS = new String[]{"dataelement/internal/query/list","dataelement/internal/list","dataelement/dict/internal/enum/getList","dataelement/dict/internal/queryByIds",
            "dataelement/internal/detail", "dataelement/dict/internal/getId/","v1/dataelement/dict/internal/list",
            "dataelement/task/internal/queryTaskState","v1/rule/internal/getId/","v1/rule/internal/queryByIds",
            "v1/rule/internal/getDetailByDataId","v1/rule/internal/getDetailByDataCode","v1/std-file/internal/delete/","v1/std-file/internal/queryByIds"
    };


    protected final static Integer RESOURCE_CODE_NULL = -1;


    static Map<String, Integer> accessTypeMap = new HashMap<>();

    static {
        accessTypeMap.put("GET", 1);
        accessTypeMap.put("POST", 2);
        accessTypeMap.put("PUT", 3);
        accessTypeMap.put("DELETE", 4);
    }

    private boolean getIgnoreFilterFlag(String url){
        boolean flag = false;
        for (String str: IGNORE_TOKEN_URLS) {
            if(url.contains(str)){
                flag = true;
                log.info("========过滤的地址===,url:{}", url);
                break;
            }
        }
        return flag;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain) throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String uri = request.getRequestURI();
        String token = TokenUtil.getToken(servletRequest);
        log.info("===请求TOKEN地址=={}",token);
//      String traceparent = (String) request.getAttribute(ARTraceHelper.Keys.KEY_TRACE_PARENT);
        String traceparent = null;
        CustomHttpServletRequest mutableRequest = new CustomHttpServletRequest(request);
        UserInfo userInfo = TokenUtil.getUserInfo(serssionServicieUrl, token, traceparent);
        mutableRequest.addHeader("userId", userInfo.getUserId());
        mutableRequest.addHeader("userName", userInfo.getUserName());
        mutableRequest.addHeader("nickName", userInfo.getNickName());
        // /api/xxxxx/v1的为 controller的接口，这么做是要排除swagger的接口。
        try {
            if (!getIgnoreFilterFlag(uri) && uri.matches(URI_REGEX)) {
                log.info("===请求地址=={}",uri);
                if (tokenCheckEnable) {
                    HydraUser hydraUser = TokenUtil.getHydraUser(tokenCheckUrl, token, traceparent);
                    checkToken(hydraUser);
                    //校验client_id和sub是否相同，不同为web登陆，相同为第三方client登录
                    if(StringUtils.isNotEmpty(hydraUser.getClient_id()) && hydraUser.getClient_id().equals(hydraUser.getSub())){
                        ThirdPartyAccount thirdPartyAccount =  TokenUtil.getThirdPartyAccount(tokenThirdPartyAccountUrl+hydraUser.getSub(), token, null, traceparent);
                        if (null!= thirdPartyAccount && StringUtils.isNotEmpty(thirdPartyAccount.getId())) {
                            mutableRequest.addHeader("userId", thirdPartyAccount.getId());//更改请求头信息为第三方信息
                            mutableRequest.addHeader("userName", thirdPartyAccount.getName());
                            mutableRequest.addHeader("nickName", thirdPartyAccount.getName());
                        }else{
                            //判断是否为proton中添加用户
                            HydraClientUser hydraClientUser =  TokenUtil.getHydraClientUser(tokenCheckClientUrl+hydraUser.getClient_id(), token, null, traceparent);
                            if (null!= hydraClientUser && StringUtils.isNotEmpty(hydraClientUser.getClient_id())) {
                                mutableRequest.addHeader("userId", hydraClientUser.getClient_id());//更改请求头信息为第三方信息
                                mutableRequest.addHeader("userName", hydraClientUser.getClient_name());
                                mutableRequest.addHeader("nickName", hydraClientUser.getClient_name());
                            }else {
                                throw new CustomException(ErrorCodeEnum.AuthenticationError);
                            }
                        }
                    } else if (tokenAccessControlEnable) {
                        checkAccessControl(request, token, hydraUser, traceparent);
                    }
                    // 第三方client登录没有部门
                    if(StringUtils.isEmpty(hydraUser.getClient_id()) || (StringUtils.isNotEmpty(hydraUser.getClient_id()) && !hydraUser.getClient_id().equals(hydraUser.getSub()))) {
                        // 获取用户所在部门
                        List<Department> list = TokenUtil.getDeptListByUserId(configuration_url, mutableRequest.getHeader("userId"));
                        if (CollectionUtil.isNotEmpty(list)) {
                            String str = JsonUtils.obj2json(list);
//                            log.info("====dept=信息数据=={}",str);
                            mutableRequest.addHeader("dept", str);
                        }
                    }else{
                        Department dept = new Department();
                        dept.setId(StringUtil.PathSplitAfter(thirdPartyDeptmentId));
                        dept.setThirdDeptId(thirdPartyThirdDeptId);
                        dept.setPathId(thirdPartyDeptmentId);
                        List<Department> list = new ArrayList<>();
                        list.add(dept);
                        mutableRequest.addHeader("dept", JsonUtils.obj2json(list));
                    }
                }
            }
            chain.doFilter(mutableRequest, servletResponse);
        } catch (CustomException e) {
            log.info("message,message:{}",e.getMessage(),e);
            // token校验不通过，抛出http 401
            handlerExceptionResolver.resolveException((HttpServletRequest) servletRequest, (HttpServletResponse) servletResponse, null, new UnauthorizedException());
        }
    }

    private boolean isClientUser(HydraUser hydraUser) {
        if (null == hydraUser) {
            return false;
        }
        return hydraUser.getClient_id().equals(hydraUser.getSub());
    }

    private void checkToken(HydraUser hydraUser) {
        if (null == hydraUser || !hydraUser.getActive()) {
            log.error("====resourceType==null == hydraUser || !hydraUser.getActive()==这段有错==");
            throw new CustomException(ErrorCodeEnum.AuthenticationError);
        }
    }


    private void checkAccessControl(HttpServletRequest request, String token, HydraUser hydraUser, String traceParant) {

        if (isClientUser(hydraUser)) {
            return;
        }

        Integer resourceType = getDefaultResourceCode(request);
        if (RESOURCE_CODE_NULL == resourceType) {
            log.error("====resourceType==={}",resourceType);
            throw new CustomException(ErrorCodeEnum.AuthenticationError);
        }

        Map<String, String> params = new HashMap<>();
        params.put("access_type", getAccseeType(request));
        params.put("resource", String.valueOf(resourceType));
        params.put("user_id", hydraUser.getSub());
        log.info("====checkAccessControl,params:{},token=={}", params,token);
        if (!TokenUtil.checkRoleAccessControl(tokenAccessControlUrl, token, params, traceParant)) {
            throw new CustomException(ErrorCodeEnum.AuthenticationError);
        }
    }

    private String getAccseeType(HttpServletRequest request) {
        String method = request.getMethod().toUpperCase();
        String type = accessTypeMap.get(method) == null ? "" : String.valueOf(accessTypeMap.get(method));
        if ("POST".equals(method) && CustomUtil.isNotEmpty(httpGetGroupUris)) {
            String uri = request.getRequestURI();
            for (String postUri : httpGetGroupUris) {
                if (postUri.matches(uri)) {
                    return String.valueOf(accessTypeMap.get("GET"));
                }
            }
        }
        return type;
    }


    private Integer getDefaultResourceCode(HttpServletRequest request) {
        Integer resourceCode = getResourceCode(request);
        if (null == resourceCode) {
            return tokenAccessControlResourceCode;
        } else {
            return resourceCode;
        }
    }

    protected Integer getConfiguretionResourceCode() {
        return tokenAccessControlResourceCode;
    }

    // 该方法默认不用实现
    protected abstract Integer getResourceCode(HttpServletRequest request);


}
