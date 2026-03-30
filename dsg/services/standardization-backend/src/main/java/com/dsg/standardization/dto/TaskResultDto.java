package com.dsg.standardization.dto;


import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import java.io.Serializable;

/**
 * 标准创建任务结果表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class TaskResultDto implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @ApiModelProperty(value = "主键", example = "")
    private Long id;
    /**
     * 标准推荐任务id
     */
    @ApiModelProperty(value = "标准推荐任务id", example = "")
    private Long taskId;
    /**
     * 表字段名称
     */
    @NotEmpty(message = "字段[table_field]值不能为空")
    @ApiModelProperty(value = "表字段名称", example = "")
    private String tableField;
    /**
     * 表字段描述
     */
    @ApiModelProperty(value = "表字段描述", example = "")
    private String tableFieldDescription;
    /**
     * 参考标准文件
     */
    @ApiModelProperty(value = "参考标准文件", example = "")
    private String stdRefFile;
    /**
     * 标准编码，多个都逗号分割。
     */
    @ApiModelProperty(value = "用户填写的标准结果的标准编码，多个逗号分割", example = "")
    private String stdCode;

    /**
     * 标准编码，多个都逗号分割。
     */
    @ApiModelProperty(value = "推荐算法结果标准编码，多个逗号分割", example = "")
    private String recStdCode;

}
