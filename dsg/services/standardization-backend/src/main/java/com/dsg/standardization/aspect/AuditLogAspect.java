package com.dsg.standardization.aspect;


import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.MqTopic;
import com.dsg.standardization.common.producer.KafkaProducerService;
import com.dsg.standardization.common.util.AuditLogUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.dsg.standardization.dto.AuditLogDto;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import com.dsg.standardization.vo.Result;

/**
 * 操作日志
 */
@Aspect
@Component
@Slf4j
public class AuditLogAspect {
    @Autowired
    private KafkaProducerService kafkaProducerService;
    @Pointcut(value = "@annotation(auditLog)")
    public void auditPointcut(AuditLog auditLog) {

    }
    @AfterReturning(pointcut="auditPointcut(auditLog)",argNames = "joinPoint,auditLog,result",returning = "result")
//    @SneakyThrows
    public void afterReturningAdvice(JoinPoint joinPoint, AuditLog auditLog, Result result) throws JsonProcessingException {
//        String strClassName = point.getTarget().getClass().getName();
//        String strMethodName = point.getSignature().getName();
//        log.debug("[类名]:{},[方法]:{}", strClassName, strMethodName);
        Object[] args = joinPoint.getArgs();// 获取方法参数
        AuditLogDto logVo = AuditLogUtil.getAuditLog();
        // 发送异步日志事件
        Long startTime = System.currentTimeMillis();
        Long endTime = System.currentTimeMillis();
        logVo.setOperation(auditLog.value().getKey());
        logVo.setLevel(auditLog.value().getLevel());
        AuditLogDto.Detail detail = logVo.getDetail();
        detail.setName(auditLog.value().getName());
        detail.setTime(endTime - startTime);
//        detail.setParams(StringUtils.join(args, ","));
        AuditLogDto.Detail resultDetail = AuditLogUtil.getDetail(args,detail,result,auditLog.value().getKey());
        logVo.setDetail(resultDetail);
        logVo.setDescription("用户\""+logVo.getOperator().getName()+"\""+auditLog.value().getMessage());
        if (StringUtils.isNotEmpty(resultDetail.getName()) && !resultDetail.getName().contains("批量删除")){
            logVo.setDescription(logVo.getDescription()+"\""+resultDetail.getName()+"\"");
        }
        ObjectMapper objectMapper = new ObjectMapper();
        String str  = objectMapper.writeValueAsString(logVo);
        //异步发送kafka
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_AUDIT_LOG,str);
    }

}
