package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.enums
 * @Date: 2022-11-22
 */
@Getter
@AllArgsConstructor
public enum AuditLogEnum {
    CREATE_DATAELEMENT_API("create_dataelement_api", "新建数据元标准","Info","新建数据元"),
    EXPORT_DATAELEMENT_API("export_dataelement_api", null,"Info","通过查询结果批量导出数据元"),
    EXPORT_IDS_DATAELEMENT_API("export_ids_dataelement_api", null,"Info","通过ID集合批量导出数据元"),
    UPDATE_DATAELEMENT_API("update_dataelement_api", "修改数据元","Info","修改数据元"),
    BATCH_DELETE_DATAELEMENT_API("batch_delete_dataelement_api", "批量删除数据元","Warn","批量删除数据元"),
    MOVE_CATALOG_DATAELEMENT_API("move_catalog_dataelement_api", null,"Info","移动数据元目录"),
    DELETE_FJLABEL_DATAELEMENT_API("delete_fjLabel_dataelement_api", null,"Warn","删除数据元分级标签"),
    CREATE_DATA_CATALOG_API("create_data_catalog_api", null,"Info","创建数据标准目录"),
    UPDATE_DATA_CATALOG_API("update_data_catalog_api", null,"Info","修改数据标准目录"),
    DELETE_DATA_CATALOG_API("delete_data_catalog_api", null,"Warn","删除数据标准目录"),
    CREATE_DICT_API("create_dict_api", "新建码表","Info","新建码表"),
    UPDATE_DICT_API("update_dict_api", "修改码表","Info","修改码表"),
    DELETE_DICT_API("delete_dict_api", "删除码表","Warn","删除码表"),
    BATCH_DELETE_DICT_API("batch_delete_dict_api", "批量删除码表","Warn","批量删除码表"),
    EXPORT_DICT_API("export_dict_api", null,"Info","导出码表"),
    MOVE_CATALOG_DICT_API("move_catalog_dict_api", null,"Info","移动码表目录"),
    STATE_DICT_API("state_dict_api", null,"Info","码表停用和启用"),
    CREATE_RULE_API("create_rule_api", "新建编码规则","Info","新建编码规则"),
    UPDATE_RULE_API("update_rule_api", "修改编码规则","Info","修改编码规则"),
    BATCH_DELETE_RULE_API("batch_delete_rule_api","批量删除编码规则", "Warn","批量删除编码规则"),
    STATE_RULE_API("state_rule_api", "Info",null,"编码规则停用和启用"),
    MOVE_CATALOG_RULE_API("move_catalog_rule_api", null,"Info","移动编码规则目录"),
    STD_CREATE_STAGING_API("std_create_staging_api",null, "Info","创建标准任务-关联标准-暂存"),
    STD_CREATE_SUBMIT_API("std_create_submit_api", null,"Info","创建标准任务-关联标准-提交"),
    STD_DELETE_TASK_API("std_delete_task_api", null,"Warn","删除待新建标准"),
    STD_CREATE_TASK_API("std_create_task_api", null,"Info","待新建标准-新建标准任务"),
    STD_CANCEL_TASK_API("std_cancel_task_api", null,"Info","待新建标准-取消标准任务"),
    STD_SUBMIT_TASK_API("std_submit_task_api", null,"Info","标准任务-提交选定的数据元"),
    STD_FINISH_TASK_API("std_finish_task_api", null,"Info","标准任务-完成任务"),
    STD_UPDATE_DESCRIPTION_API("std_update_description_api", null,"Info","待新建标准-修改待新建标准字段说明"),
    STD_ACCEPT_API("std_accept_api", null,"Info","待新建标准-采纳"),
    STD_UPDATE_TABLE_NAME_API("std_update_table_name_api", null,"Info","待新建标准-修改业务标准表名称"),
    STD_CREATE_PINGING_API("std_create_pinging_api", null,"Info","创建标准任务-添加至待新建标准接口"),
    STD_CREATE_FILE_API("std_create_file_api", "新建标准文件","Info","新建标准文件"),
    STD_UPDATE_FILE_API("std_update_file_api", "修改标准文件","Info","修改标准文件"),
    BATCH_STD_DELETE_FILE_API("batch_std_delete_file_api", "批量删除标准文件","Warn","批量删除标准文件"),
    STATE_STD_FILE_API("state_std_file_api", null,"Info","标准文件停用和启用"),
    MOVE_STD_CATALOG_FILE_API("move_std_catalog_file_api", null,"Info","移动标准文件目录"),
    STD_DOWN_FILE_API("std_down_file_api", null,"Warn","下载标准文件附件"),
    STD_BATCH_DOWN_FILE_API("std_batch_down_file_api", null,"Warn","批量下载标准文件附件"),
    STD_DICT_RULE_RELATION_FILE_API("std_dict_rule_relation_file_api", null,"Info","添加标准文件和数据元&码表&编码规则的关联");


    @EnumValue
    @JsonValue
    private String key;
    private String name;
    private String level;
    private String message;


    public static AuditLogEnum getByMessage(String message) {
        AuditLogEnum[] enums = AuditLogEnum.values();
        for (AuditLogEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return null;
    }

    public static AuditLogEnum getByKey(String key) {
        AuditLogEnum[] enums = AuditLogEnum.values();
        for (AuditLogEnum en : enums) {
            if (en.getKey().equals(key)) {
                return en;
            }
        }
        return null;
    }
}
