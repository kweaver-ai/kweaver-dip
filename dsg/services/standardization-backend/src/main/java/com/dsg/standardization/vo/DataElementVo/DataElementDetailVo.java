package com.dsg.standardization.vo.DataElementVo;


import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.entity.DataElementInfo;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/17 1:00
 */
@Data
@ApiModel(description = "数据元信息详情")
public class DataElementDetailVo extends DataElementInfo {
    /**
     * 文件列表
     */
    @ApiModelProperty(value="文件列表")
    private List<DataElementFileVo> stdFiles;

    /**
     * 历史版本记录列表
     */
    @ApiModelProperty(value="历史版本记录列表")
    private List<DataElementHistoryVo> historyVoList;

    /**
     * 码表中文名称
     */
    @ApiModelProperty(value="码表中文名称")
    @JsonProperty(value = "dict_name_cn")
    private String chName;

    /**
     * 码表英文名称
     */
    @ApiModelProperty(value="码表英文名称")
    @JsonProperty(value = "dict_name_en")
    private String enName;

    /**
     * 码表id
     */
    @ApiModelProperty(value="码表id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long dictId;

    /**
     * 码表启停状态
     */
    @ApiModelProperty(value="码表启停状态")
    @JsonProperty(value = "dict_state")
    private EnableDisableStatusEnum dictState;

    /**
     * 码表删除状态
     */
    @ApiModelProperty(value="码表删除状态")
    @JsonProperty(value = "dict_deleted")
    private Boolean dictDeleted;

    /**
     * 编码规则id
     */
    @ApiModelProperty(value="编码规则id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long ruleId;

    /**
     * 编码规则中文名称
     */
    @ApiModelProperty(value="编码规则中文名称")
    private String ruleName;

    /**
     * 编码规则启停状态
     */
    @ApiModelProperty(value="编码规则启停状态")
    @JsonProperty(value = "rule_state")
    private EnableDisableStatusEnum ruleState;

    /**
     * 编码规则删除状态
     */
    @ApiModelProperty(value="编码规则删除状态")
    @JsonProperty(value = "rule_deleted")
    private Boolean ruleDeleted;

    /**
     * 目录名称
     */
    @ApiModelProperty(value="目录名称")
    private String catalogName;


    /**
     * 版本号
     */
    @ApiModelProperty(value="版本号")
    private String versionOut;

    public String getVersionOut(){
        return "V"+this.getVersion();
    }

    /**
     *值域
     */
    @ApiModelProperty(value="值域")
    private String dataRange;

    /**
     * 数据类型名称
     */
    @ApiModelProperty(value="数据类型名称")
    private String dataTypeName;

    public String getDataTypeName(){
        return this.getDataType().getMessage();
    }

    /**
     * 标准分类名称
     */
    @ApiModelProperty(value="标准分类名称")
    private String stdTypeName;

    public String getStdTypeName(){
        return this.getStdType().getMessage();
    }

    /**
     *标签名称
     */
    @ApiModelProperty(value="标签名称")
    private String labelName;

    @ApiModelProperty(value="标签icon")
    private String labelIcon;

    @ApiModelProperty(value="标签path")
    private String labelPath;

    @ApiModelProperty(value="部门ID",example = "111",dataType = "java.lang.String")
    private String departmentId;

    @ApiModelProperty(value="部门名称",example = "部门A",dataType = "java.lang.String")
    private String departmentName;
    @ApiModelProperty(value="部门路径名称",example = "部门A/部门B",dataType = "java.lang.String")
    private String departmentPathNames;
}
