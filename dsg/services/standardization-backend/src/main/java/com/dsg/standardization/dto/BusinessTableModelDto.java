package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Message;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.dto
 * @Date: 2024/1/18 10:32
 */

@Data
@ApiModel
public class BusinessTableModelDto {

    /**
     * 业务表模型id
     */
    @NotNull(message = "业务表模型id" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @ApiModelProperty(value = "业务表模型id", example = "")
    @Length(message = "格式为36位UUID", min = 36, max = 36)
    private String businessTableModelId;


    /**
     * 业务表字段数组Dto
     */
    @ApiModelProperty(value = "业务表字段数组", example = "")
    @NotEmpty(message = "业务表字段数组" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    List<BusinessTableFields> businessTableFields;

    @Data
    public static class BusinessTableFields {
        @ApiModelProperty(value = "业务表名称", example = "")
        @NotBlank(message = "业务表名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        String businessTableName;

        @ApiModelProperty(value = "业务表ID", example = "")
        @NotBlank(message = "业务表ID" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "格式为36位UUID", min = 36, max = 36)
        String businessTableId;

        @ApiModelProperty(value = "业务表类型", example = "")
        @NotBlank(message = "业务表类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
        String businessTableType;

        @ApiModelProperty(value = "发起请求人", example = "")
        @NotBlank(message = "发起请求人" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        String createUser;

        @ApiModelProperty(value = "业务表字段ID", example = "")
        @NotBlank(message = "业务表字段ID" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "格式为36位UUID", min = 36, max = 36)
        String businessTableFieldId;

        /**
         * 业务表字段当前名称
         */
        @ApiModelProperty(value = "f_business_table_field_current_name")
        @NotBlank(message = "业务表字段当前名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldCurrentName;

        /**
         * 业务表字段原始名称
         */
        @ApiModelProperty(value = "f_business_table_field_origin_name")
        @NotBlank(message = "业务表字段原始名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldOriginName;

        /**
         * 业务表字段当前英文名称
         */
        @ApiModelProperty(value = "f_business_table_field_current_name_en ")
        @NotBlank(message = "业务表字段当前英文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldCurrentNameEn ;


        /**
         * 业务表字段原始英文名称
         */
        @ApiModelProperty(value = "f_business_table_field_origin_name_en")
        @NotBlank(message = "业务表字段原始英文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldOriginNameEn;

        /**
         * 业务表字段当前标准分类
         */
        @ApiModelProperty(value = "f_business_table_field_current_std_type")
        private String businessTableFieldCurrentStdType;

        /**
         * 业务表字段原始标准分类
         */
        @ApiModelProperty(value = "f_business_table_field_origin_std_type")
        private String businessTableFieldOriginStdType;

        /**
         * 数据类型
         */
        @ApiModelProperty(value = "f_business_table_field_data_type")
        @NotBlank(message = "数据类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
        private String businessTableFieldDataType;


        /**
         * 数据长度
         */
        @ApiModelProperty(value = "f_business_table_field_data_length")
        private Integer businessTableFieldDataLength;


        /**
         * 数据精度
         */
        @ApiModelProperty(value = "f_business_table_field_data_precision")
        private Integer businessTableFieldDataPrecision;


        /**
         * 码表名称
         */
        @ApiModelProperty(value = "f_business_table_field_dict_name")
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldDictName;

        /**
         * 编码规则名称
         */
        @ApiModelProperty(value = "f_business_table_field_rule_name")
        @Length(message = "长度不能超过128位", max = 128)
        private String businessTableFieldRuleName;

        /**
         * 业务表字段描述
         */
        @ApiModelProperty(value = "f_business_table_field_description ")
        @Length(message = "长度不能超过255位", max = 255)
        private String businessTableFieldDescription ;
    }
}
