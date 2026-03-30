package com.dsg.standardization.common.constant;

public class MqTopic {
    //图谱构建
    public final static String MQ_MESSAGE_SAILOR = "af.business-grooming.entity_change";
    //码表和编码规则修改后发送消息
    public final static String MQ_MESSAGE_DICT_CODE = "af.standardization.dictStatus";
    //审计日志
    public final static String MQ_MESSAGE_AUDIT_LOG = "af.audit-log";

}
