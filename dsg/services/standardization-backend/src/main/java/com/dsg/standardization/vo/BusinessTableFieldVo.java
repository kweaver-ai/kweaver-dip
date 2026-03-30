package com.dsg.standardization.vo;


import com.dsg.standardization.common.enums.BusinessTableStdCreatePoolStateEnum;
import com.dsg.standardization.common.util.CustomUtil;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.apache.commons.lang3.StringUtils;


/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.db.entity
 * @Date: 2024/1/16 16:32
 */

@Data
@ApiModel(description = "业务表字段信息")
public class BusinessTableFieldVo {
    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @ApiModelProperty(value = "唯一标识")
    private Long id;

    /**
     * 业务表字段ID
     */
    @ApiModelProperty(value = "业务表字段ID")
    private String businessTableFieldId;


    /**
     * 业务表字段当前名称
     */
    @ApiModelProperty(value = "业务表字段当前名称")
    private String businessTableFieldCurrentName;

    /**
     * 业务表字段原始名称
     */
    @ApiModelProperty(value = "业务表字段原始名称")
    private String businessTableFieldOriginName;

    /**
     * 业务表字段当前英文名称
     */
    @ApiModelProperty(value = "业务表字段当前英文名称 ")
    private String businessTableFieldCurrentNameEn ;


    /**
     * 业务表字段原始英文名称
     */
    @ApiModelProperty(value = "业务表字段原始英文名称")
    private String businessTableFieldOriginNameEn;

    /**
     * 业务表字段当前标准分类
     */
    @ApiModelProperty(value = "业务表字段当前标准分类")
    private String businessTableFieldCurrentStdType;

    /**
     * 业务表字段原始标准分类
     */
    @ApiModelProperty(value = "业务表字段原始标准分类")
    private String businessTableFieldOriginStdType;

    /**
     * 数据类型
     */
    @ApiModelProperty(value = "数据类型")
    private String businessTableFieldDataType;


    /**
     * 数据长度
     */
    @ApiModelProperty(value = "数据长度")
    private Integer businessTableFieldDataLength;


    /**
     * 数据精度
     */
    @ApiModelProperty(value = "数据精度")
    private Integer businessTableFieldDataPrecision;


    /**
     * 码表名称
     */
    @ApiModelProperty(value = "码表名称")
    private String businessTableFieldDictName;

    /**
     * 编码规则名称
     */
    @ApiModelProperty(value = "编码规则名称")
    private String businessTableFieldRuleName;

    /**
     * 业务表字段描述
     */
    @ApiModelProperty(value = "业务表字段描述 ")
    private String businessTableFieldDescription ;

    /**
     * 状态：waiting-待发起，creating-进行中，created-已完成未采纳，adopted-已采纳
     */
    @ApiModelProperty(value = "状态：waiting-待发起，creating-进行中，created-已完成未采纳，adopted-已采纳")
    private String state;

    /**
     * 任务ID
     */
    @ApiModelProperty(value = "任务ID", example = "xxx")
    private String taskId;

    @ApiModelProperty(value = "任务名称", example = "xxx")
    String taskName;

    @ApiModelProperty(value = "任务状态", example = "xxx")
    String taskStatus;


    /**
     * 数据元ID
     */
    @ApiModelProperty(value = "数据元ID", example = "xxx")
    private Long dataElementId;


    /**
     * 数据元结构体
     */
    @ApiModelProperty(value = "数据元结构体", example = "xxx")
    DataElement dataElement;


    /**
     * 请求开始时间
     */
    @ApiModelProperty(value = "请求开始时间")
    private Long createStartTime;

    /**
     * 创建用户（ID）
     */
    @ApiModelProperty(value = "创建用户")
    private String createUser;

    /**
     * 请求结束时间
     */
    @ApiModelProperty(value = "请求结束时间")
    private Long createEndTime;

    /**
     * 修改用户（ID）
     */
    @ApiModelProperty(value = "修改用户")
    private String updateUser;


    @Data
    @ApiModel
    public static class DataElement {
        @ApiModelProperty(value = "数据元英文名", example = "xxx")
        String nameEn;

        @ApiModelProperty(value = "数据元中文名", example = "xxx")
        String nameCn;

        @ApiModelProperty(value = "标准类型", example = "1")
        Integer stdType;
    }

    public Long getCreateStartTime() {
        if (CustomUtil.isNotEmpty(this.state) && !this.state.equals(StringUtils.lowerCase(BusinessTableStdCreatePoolStateEnum.WAITING.name()))) {
            return this.createStartTime;
        } else {
            return null;
        }
    }

    public Long getCreateEndTime() {
        if (CustomUtil.isNotEmpty(this.state)
                && !this.state.equals(StringUtils.lowerCase(BusinessTableStdCreatePoolStateEnum.WAITING.name()))
                && !this.state.equals(StringUtils.lowerCase(BusinessTableStdCreatePoolStateEnum.CREATING.name()))) {
            return this.createEndTime;
        } else {
            return null;
        }
    }

}
