package com.dsg.standardization.dto;


import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.TaskCreateSourceEnum;
import com.dsg.standardization.vo.TaskResultVo;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.List;

/**
 * 标准创建任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-20 13:39:40
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel(description = "标准任务信息")
public class TaskDto implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @NotNull(message = "主键" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @ApiModelProperty(value = "主键", example = "")
    private Long id;
    /**
     * 任务编号
     */
    @ApiModelProperty(value = "任务编号", example = "")
    private String taskNo;

    /**
     * 业务表名称
     */
    @ApiModelProperty(value = "业务表名称", example = "")
    private String table;
    /**
     * 业务表描述
     */
    @ApiModelProperty(value = "业务表描述", example = "")
    private String tableDescription;


    @ApiModelProperty(value = "任务创建来源", example = "")
    private TaskCreateSourceEnum source;

    /**
     * 任务状态（0-未处理、 1-处理中、2-处理完成）
     */
    @ApiModelProperty(value = "任务状态（0-未处理、1-处理中、 2-处理完成）", example = "")
    private Integer status;


    @ApiModelProperty(value = "表字段", example = "")
    private String tableField;

    @ApiModelProperty(value = "表字段列表", example = "")
    @NotEmpty(message = "表字段信息" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Valid
    List<TaskResultVo> tableFields;

    @ApiModelProperty(value = "创建人", example = "")
    private String createUser;

    @ApiModelProperty(value = "创建人联系方式", example = "")
    private String createUserPhone;


}
