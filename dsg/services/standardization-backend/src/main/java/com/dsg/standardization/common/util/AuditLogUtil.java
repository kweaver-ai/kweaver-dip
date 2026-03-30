package com.dsg.standardization.common.util;


import cn.hutool.core.util.URLUtil;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.dto.AuditLogDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.RuleEntity;
import com.dsg.standardization.vo.*;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

/**
 * 系统日志工具类
 *
 * @author L.cm
 */
@UtilityClass
public class AuditLogUtil {

    public AuditLogDto getAuditLog() {
        HttpServletRequest request = ((ServletRequestAttributes) Objects
                .requireNonNull(RequestContextHolder.getRequestAttributes())).getRequest();
        AuditLogDto auditLog = new AuditLogDto();
//        auditLog.setDescription(null);
//        auditLog.setOperation(null);
        auditLog.setTimestamp(getTimeStampToRfc3339());
        AuditLogDto.Operator operator = auditLog.new Operator();
        UserInfo userInfo = CustomUtil.getUser();
        operator.setId(userInfo.getUserId());
        operator.setName(userInfo.getUserName());
        operator.setDepartment(userInfo.getDeptList());
        auditLog.setOperator(operator);

        AuditLogDto.Agent agent = auditLog.new Agent();
        agent.setIp(getIpAddr(request));
        agent.setType("web");
        operator.setAgent(agent);

        AuditLogDto.Detail detail = auditLog.new Detail();
        detail.setRequestUri(URLUtil.getPath(request.getRequestURI()));
//        detail.setParams(HttpUtil.toParams(request.getParameterMap()));
        auditLog.setDetail(detail);
        return auditLog;
    }

    /**
     * 获取客户端IP地址
     * 由于客户端的IP地址可能通过多个代理层转发，因此需要检查多个HTTP头字段以获取真实IP。
     * 此方法首先检查“x-forwarded-for”头，这是最常用的代理头，然后尝试其他不那么常见的头字段。
     * 如果所有尝试都失败，则回退到使用请求的远程地址。
     * @param request HttpServletRequest对象，用于获取客户端IP地址。
     * @return 客户端的IP地址字符串。如果无法确定客户端IP，则返回请求的远程地址。
     */
    protected String getIpAddr(HttpServletRequest request) {
        // 尝试获取“x-forwarded-for”头，这是最常用的代理头字段。
        String ip = request.getHeader("x-forwarded-for");
        // 检查“x-forwarded-for”头是否有效，并提取第一个IP地址。
        if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
            // 多次反向代理后会有多个ip值，第一个ip才是真实ip
            if (ip.indexOf(",") != -1) {
                ip = ip.split(",")[0];
            }
        }
        // 如果“x-forwarded-for”头无效，尝试其他不那么常见的代理头字段。
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        // 如果所有代理头字段都无效，回退到使用请求的远程地址作为客户端IP。
        if (ip == null || ip.length() == 0 || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 返回获取到的IP地址，无论它是通过代理头还是直接从请求中获取。
        return ip;
    }


    /**
     * 获取参数日志和响应日志
     */
    public  static AuditLogDto.Detail getDetail(Object[] args, AuditLogDto.Detail detail, Result result, String operationType){
        if (StringUtils.isEmpty(detail.getName())){
            return detail;
        }
        if (operationType.equals(AuditLogEnum.CREATE_DICT_API.getKey()) || operationType.equals(AuditLogEnum.UPDATE_DICT_API.getKey())){
            try {
                DictVo vo = (DictVo) result.getData();
                detail.setName(vo.getChName());
                detail.setId(String.valueOf(vo.getId()));
            }catch (ClassCastException ignored){

            }
        }else if (operationType.equals(AuditLogEnum.DELETE_DICT_API.getKey()) || operationType.equals(AuditLogEnum.BATCH_DELETE_DICT_API.getKey())){
            detail.setId(String.valueOf(args[0]));
            String str = (String) result.getData();
            detail.setName(str);
        }else if (operationType.equals(AuditLogEnum.CREATE_DATAELEMENT_API.getKey()) || operationType.equals(AuditLogEnum.UPDATE_DATAELEMENT_API.getKey())){
            DataElementInfo dto = (DataElementInfo) result.getData();
            detail.setName(dto.getNameCn());
            detail.setId(String.valueOf(dto.getId()));
        }else if (operationType.equals(AuditLogEnum.BATCH_DELETE_DATAELEMENT_API.getKey())){
            detail.setId(String.valueOf(args[0]));
        }else if (operationType.equals(AuditLogEnum.CREATE_RULE_API.getKey()) || operationType.equals(AuditLogEnum.UPDATE_RULE_API.getKey())){
            Object object = result.getData();
            if (object instanceof RuleVo) {
                RuleVo vo = (RuleVo) result.getData();
                detail.setName(vo.getName());
                detail.setId(String.valueOf(vo.getId()));
            }else{
                RuleEntity vo = (RuleEntity) result.getData();
                detail.setName(vo.getName());
                detail.setId(String.valueOf(vo.getId()));
            }
        }else if (operationType.equals(AuditLogEnum.BATCH_DELETE_RULE_API.getKey())){
            detail.setId(String.valueOf(args[0]));
        }else if (operationType.equals(AuditLogEnum.STD_CREATE_FILE_API.getKey()) || (operationType.equals(AuditLogEnum.STD_UPDATE_FILE_API.getKey()))){
            StdFileMgrVo vo = (StdFileMgrVo) result.getData();
            detail.setId(String.valueOf(vo.getId()));
            detail.setName(vo.getName());
        }else if (operationType.equals(AuditLogEnum.BATCH_STD_DELETE_FILE_API.getKey())){
            detail.setId(String.valueOf(args[0]));
        }
        return detail;
    }

    public static String getTimeStampToRfc3339() {
        ZonedDateTime now = ZonedDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
        return now.format(formatter);
    }
}