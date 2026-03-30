package com.dsg.standardization.common.util;


import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.handler.GlobalExceptionHandler;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.Header;
import org.apache.http.message.BasicHeader;
import com.dsg.standardization.vo.HttpResponseVo;

import java.util.Map;

@Slf4j
public class UrlCallUtil {

    public static HttpResponseVo getResponseVoForGet(String url) {
        Header headers = new BasicHeader(Constants.HTTP_HEADER_TOKEN_KEY, CustomUtil.getToken());
        HttpResponseVo responseVo;
        try {
            log.info("getResponseVoForGet,url:{},headers:{}",url,headers);
            responseVo = HttpUtil.httpGet(url, null, new Header[]{headers});
        } catch (Exception e) {
            throw GlobalExceptionHandler.getNewCustomException(ErrorCodeEnum.Invalid, e.toString());
        }
        if(isSuccess(responseVo)) {
            return responseVo;
        } else {
            throw GlobalExceptionHandler.getNewCustomException(ErrorCodeEnum.Invalid, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private static Boolean isSuccess(HttpResponseVo responseVo) {
        if (CustomUtil.isEmpty(responseVo)) {
            return false;
        }
        String respData = responseVo.getResult();
        Map<String, Object> respDataMap = JsonUtils.json2Obj(respData, Map.class);
        if (responseVo.getCode() < 200 || responseVo.getCode() > 300 || (CustomUtil.isNotEmpty(respDataMap) && CustomUtil.isNotEmpty(respDataMap.get("code")))) {
            String code = String.valueOf(respDataMap.get("code"));
            String description = String.valueOf(respDataMap.get("description"));
            String detail = String.valueOf(respDataMap.get("detail"));
            String solution = String.valueOf(respDataMap.get("solution"));
            throw GlobalExceptionHandler.getNewCustomException(code, description, detail, solution);
        }
        return true;
    }

}
