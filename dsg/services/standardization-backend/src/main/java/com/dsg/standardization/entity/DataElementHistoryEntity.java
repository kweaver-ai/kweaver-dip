package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.EventStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * <p>
 * 数据元历史信息表
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
@Data
@TableName("t_data_element_his")
public class DataElementHistoryEntity implements Serializable  {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识、雪花算法
     */
    @TableId(value = "f_de_id", type = IdType.ASSIGN_ID)
    @ApiModelProperty(value="唯一标识",dataType = "java.lang.String")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long id;

    /**
     * 关联标识、雪花算法
     */
    @ApiModelProperty(value="关联标识、雪花算法",dataType = "java.lang.String")
    @TableField(value ="f_de_code")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long code;

    /**
     * 英文名称
     */
    @ApiModelProperty(value="英文名称",dataType = "java.lang.String",required = true)
    @TableField(value ="f_name_en")
    private String nameEn;

    /**
     * 中文名称
     */
    @ApiModelProperty(value="中文名称",dataType = "java.lang.String",required = true)
    @TableField(value ="f_name_cn")
    private String nameCn;

    /**
     * 同义词
     */
    @ApiModelProperty(value="同义词",dataType = "java.lang.String")
    @TableField(value ="f_synonym")
    @JsonProperty("synonym")
    private String synonyms;


    /**
     * 标准分类
     */
    @ApiModelProperty(value="标准分类",dataType = "java.lang.Integer",required = true)
    @TableField(value ="f_std_type")
    private OrgTypeEnum stdType;

    /**
     * 数据类型
     */
    @ApiModelProperty(value="数据类型",dataType = "java.lang.Integer",required = true)
    @TableField(value ="f_data_type")
    private DataTypeEnum dataType;

    /**
     * 数据长度
     */
    @ApiModelProperty(value="数据长度",dataType = "java.lang.Integer")
    @TableField(value ="f_data_length")
    private Integer dataLength;

    /**
     * 数据精度
     */
    @ApiModelProperty(value="数据精度",dataType = "java.lang.Integer")
    @TableField(value ="f_data_precision")
    private Integer dataPrecision;

    /**
     * 码表关联标识
     */
    @ApiModelProperty(value="码表关联标识",dataType = "java.lang.String")
    @TableField(value ="f_dict_code")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long dictCode;

    /**
     * 数据元说明
     */
    @ApiModelProperty(value="数据元说明",dataType = "java.lang.String")
    @TableField(value ="f_description")
    private String description;

    /**
     * 版本号
     */
    @ApiModelProperty(value="版本号",dataType = "java.lang.Integer")
    @TableField(value ="f_version")
//    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonIgnore
    private Integer version;

    /**
     * 标准状态
     */
    @ApiModelProperty(value="标准状态",dataType = "java.lang.Integer")
    @TableField(value ="f_status")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private EventStatusEnum status;

    /**
     * 创建用户
     */
    @ApiModelProperty(value="创建用户",dataType = "java.lang.String")
    @TableField(value ="f_create_user")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String createUser;

    /**
     * 创建时间
     */
    @ApiModelProperty(value="创建时间",dataType = "java.lang.String")
    @TableField(value ="f_create_time")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
//    @JsonSerialize(using = LocalDateTimeSerializer.class)
//    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    private LocalDateTime createTime;

    /**
     * 更新用户
     */
    @ApiModelProperty(value="更新用户",dataType = "java.lang.String")
    @TableField(value ="f_update_user")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String updateUser;

    /**
     * 更新时间
     */
    @ApiModelProperty(value="更新时间",dataType = "java.lang.String")
    @TableField(value ="f_update_time")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
//    @JsonSerialize(using = LocalDateTimeSerializer.class)
//    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    private LocalDateTime updateTime;

    /**
     * 标准文件关联标识（目前为预留字段）
     */
    @ApiModelProperty(value="标准文件关联标识（目前为预留字段））",dataType = "java.lang.String")
    @TableField(value ="f_std_file_code")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long stdFileCode;

    /**
     * 权限域（目前为预留字段）
     */
    @ApiModelProperty(value="权限域（目前为预留字段）")
    @TableField(value ="f_authority_id")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonView(NoShow.class)
    private Long authorityId;

    /**
     * 目录关联标识
     */
    @ApiModelProperty(value="目录关联标识",dataType = "java.lang.String")
    @TableField(value ="f_catalog_id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long catalogId;

    @ApiModelProperty(value = "是否为空标记，1是、0否，默认否", dataType = "java.lang.Integer",example = "1")
    @TableField(value = "f_isempty_flag")
    private Integer empty_flag;

    public interface DataList {
    }
    public interface NoShow {
    }
    public interface Details extends DataList {
    }

}
