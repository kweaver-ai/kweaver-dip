package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.webfilter.XssFilterDeserializer;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;
import java.io.Serializable;

/**
 * <p>
 * 数据元基本信息表
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
@Data
@TableName("t_data_element_info")
@ApiModel(description = "数据元信息")
public class DataElementInfo extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识、雪花算法
     */
    @TableId(value = "f_de_id", type = IdType.ASSIGN_ID)
    @ApiModelProperty(value = "唯一标识", dataType = "java.lang.String",example = "123")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long id;

    /**
     * 关联标识、雪花算法
     */
    @ApiModelProperty(value = "关联标识、雪花算法", dataType = "java.lang.String",example = "123")
    @TableField(value = "f_de_code")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long code;

    /**
     * 英文名称
     */
    @ApiModelProperty(value = "英文名称", dataType = "java.lang.String", required = true,example = "abc")
    @TableField(value = "f_name_en")
    @Pattern(regexp = Constants.REGEX_ENGLISH_UNDERLINE_BAR_128, message = "英文名称" + Message.MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_128)
    @NotBlank(message = "英文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
    private String nameEn;

    /**
     * 中文名称
     */
    @ApiModelProperty(value = "中文名称", dataType = "java.lang.String", required = true,example = "中文名称")
    @TableField(value = "f_name_cn")
    @Pattern(regexp = Constants.REGEX_LENGTH_128, message = "中文名称" + Message.MESSAGE_128)
    @NotBlank(message = "中文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String nameCn;

    /**
     * 同义词
     */
    @ApiModelProperty(value = "同义词", dataType = "java.lang.String",example = "数字化")
    @TableField(value = "f_synonym")
    @JsonDeserialize(using = XssFilterDeserializer.class)
    @JsonProperty("synonym")
    private String synonyms;


    /**
     * 标准分类
     */
    @ApiModelProperty(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",
            example = "0", allowableValues = "0,1,2,3,4,5,6,99", dataType = "java.lang.Integer", required = true)
    @TableField(value = "f_std_type")
    private OrgTypeEnum stdType;

    /**
     * 数据类型
     */
    @ApiModelProperty(value = "数据类型,0数字型、1字符型、2日期型、3日期时间型、5布尔型、7高精度型、8小数型、9时间型、10整数型", example = "1", allowableValues = "0,1,2,3,5,7,8,9,10", dataType = "java.lang.Integer", required = true)
    @TableField(value = "f_data_type")
    private DataTypeEnum dataType;

    /**
     * 数据长度
     */
    @ApiModelProperty(value = "数据长度,高精度型和字符型才有数据长度", dataType = "java.lang.Integer" ,example = "11")
    @TableField(value = "f_data_length")
    private Integer dataLength;

    /**
     * 数据精度
     */
    @ApiModelProperty(value = "数据精度,高精度型才有数据精度", dataType = "java.lang.Integer",example = "2")
    @TableField(value = "f_data_precision", updateStrategy = FieldStrategy.IGNORED)
//    @Pattern(regexp = Constants.REGEX_NO_SPACE)
    private Integer dataPrecision;

    /**
     * 码表关联标识
     */
    @ApiModelProperty(value = "码表关联标识，relation_type为codeTable时该字段必填", dataType = "java.lang.String" ,example = "111")
    @TableField(value = "f_dict_code")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long dictCode;

    /**
     * 数据元说明
     */
    @ApiModelProperty(value = "数据元说明", dataType = "java.lang.String" ,example = "说明")
    @TableField(value = "f_description")
    @JsonDeserialize(using = XssFilterDeserializer.class)
    private String description;


    /**
     * 目录关联标识
     */
    @ApiModelProperty(value = "目录ID，默认全部目录ID为11", dataType = "java.lang.String"  ,example ="11")
    @TableField(value = "f_catalog_id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonProperty(defaultValue = "11")
    @JsonSetter(nulls = Nulls.SKIP)
    private Long catalogId=11L;

    /**
     * 编码规则唯一标识
     */
    @ApiModelProperty(value = "编码规则唯一标识，relation_type为codeRule时该字段必填", dataType = "java.lang.String" ,example ="122")
    @TableField(value = "f_rule_id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long ruleId;

    /**
     * 数据分级标签ID
     */
    @ApiModelProperty(value="数据分级标签",dataType = "java.lang.String"  ,example ="22")
//    @TableField(value ="f_label_id",updateStrategy = FieldStrategy.IGNORED)
    @TableField(value ="f_label_id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long labelId;

    @ApiModelProperty(value="数据元关联类型no无限制、codeTable码表、codeRule编码规则;默认no无限制",example = "no",dataType = "java.lang.String",required = true)
    @TableField(value ="f_relation_type")
    @NotEmpty(message = "关联类型" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @JsonProperty(defaultValue = "no")
    @JsonSetter(nulls = Nulls.SKIP)
    private String relationType="no";

    @ApiModelProperty(value = "是否为空值标记，1是、0否，默认否", dataType = "java.lang.Integer",example = "1")
    @TableField(value = "f_isempty_flag")
    @JsonProperty(defaultValue = "0")
    @JsonSetter(nulls = Nulls.SKIP)
    private Integer empty_flag=0;
    @ApiModelProperty(value="部门IDs",example = "a/ab",dataType = "java.lang.String")
    @TableField(value = "f_department_ids")
    private String departmentIds;

    @ApiModelProperty(value="第三方部门ID",example = "1",dataType = "java.lang.String")
    @TableField(value = "f_third_dept_id")
    private String thirdDeptId;

    public interface DataList {
    }

    public interface NoShow {
    }

    public interface Details extends DataList {
    }

}
