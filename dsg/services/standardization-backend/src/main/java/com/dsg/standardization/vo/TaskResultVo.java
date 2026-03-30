package com.dsg.standardization.vo;


import com.dsg.standardization.dto.TaskResultDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;
import java.util.List;


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
public class TaskResultVo extends TaskResultDto implements Serializable {
    private static final long serialVersionUID = 1L;


    @ApiModelProperty(value = "标准数据元ID", example = "")
    private Long stdId;

    @ApiModelProperty(value = "标准中文名称", example = "")
    private String stdChName;

    @ApiModelProperty(value = "标准英文名称", example = "")
    private String stdEnName;

    @ApiModelProperty(value = "标准删除状态", example = "")
    private Boolean stdDel;

    @ApiModelProperty(value = "错误信息", example = "")
    private String errMsg;


    @ApiModelProperty(value = "推荐的标准列表", example = "")
    private List<RecStdVo> recStds;


}
