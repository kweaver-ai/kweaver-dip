package com.dsg.standardization.vo.DataElementVo;

import com.baomidou.mybatisplus.annotation.TableField;
import com.dsg.standardization.entity.DataElementInfo;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/11/26 14:42
 */
@Data
@ApiModel(description = "数据元信息集合列表")
public class DataElementListVo extends DataElementInfo {

    /**
     * 码表ID
     */
    @ApiModelProperty(value="码表ID")
    private Long dictId;


    /**
     * 码表中文名称
     */
    @TableField(value = "f_ch_name")
    @JsonProperty(value = "dict_name")
    @ApiModelProperty(value="码表中文名称")
    private String chName;

    /**
     * 编码规则名称
     */
    @ApiModelProperty(value="编码规则名称")
    private String ruleName;

    @ApiModelProperty(value="编码规则和码表删除标记，true删除、false未删除、null没有关联")
    @JsonProperty(value = "rule_dict_deleted")
    private Boolean ruleDictDeleted;

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

    public String getStdTypeName(){
        return this.getStdType().getMessage();
    }

}
