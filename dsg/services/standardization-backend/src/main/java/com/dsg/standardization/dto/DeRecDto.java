package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import java.io.Serializable;
import java.util.List;

/**
 * 调用推荐算法服务的请求体
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "推荐表、字段和标准信息")
public class DeRecDto implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 业务表名称
     */
    @ApiModelProperty(value = "业务表名称",dataType = "java.lang.String")
    @JsonProperty("table_name")
    private String tableName;
    @ApiModelProperty(value = "部门id", example = "11111")
    @JsonProperty("department_id")
    private String departmentId;

    @ApiModelProperty(value = "表字段列表",dataType = "java.util.List")
    @NotEmpty(message = "表字段信息" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    @JsonProperty("table_fields")
    List<Field> tableFields;


    @Data
    @ApiModel("推荐字段信息")
    public static class Field {
        @ApiModelProperty(value = "字段名",dataType = "java.lang.String")
        @JsonProperty("table_field_name")
        private String tableFieldName;

        @ApiModelProperty(value = "字段类型",dataType = "java.lang.String")
        @JsonProperty("table_field_type")
        private String tableFieldType;

        @ApiModelProperty(value = "推荐结果",dataType = "java.util.List")
        @JsonProperty("rec_stds")
        private List<Std> recStds;
    }

    @Data
    @ApiModel("推荐标准信息")
    public static class Std {
        private String info;
        @ApiModelProperty(value = "原因",dataType = "java.lang.String")
        @JsonProperty("rec_reason")
        private String recReason;

        @ApiModelProperty(value = "标准中文名称",dataType = "java.lang.String")
        @JsonProperty("std_ch_name")
        private String stdChName;

        @ApiModelProperty(value = "标准编号",dataType = "java.lang.String")
        @JsonProperty("std_code")
        private Long stdCode;
    }


}
