package com.dsg.standardization.vo.DataElementVo;


import com.dsg.standardization.entity.DataElementHistoryEntity;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.List;
import java.util.Set;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/17 1:00
 */
@Data
public class DataElementHistoryDetailVo extends DataElementHistoryEntity {
    /**
     * 编码规则列表
     */
    @ApiModelProperty(value="编码规则列表")
    private Set<DataElementFileVo> ruleList;

    /**
     * 历史版本记录列表
     */
    @ApiModelProperty(value="历史版本记录列表")
    private List<DataElementHistoryVo> historyVoList;

    /**
     * 码表中文名称
     */
    @ApiModelProperty(value="码表中文名称")
    @JsonProperty(value = "dict_name")
    private String chName;

    /**
     * 码表id
     */
    @ApiModelProperty(value="码表id")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long dictId;

    /**
     * 目录名称
     */
    @ApiModelProperty(value="目录名称")
    private String catalogName;

    /**
     * 文件名称
     */
    @ApiModelProperty(value="文件名称")
    private String fileName;

    /**
     * 版本号
     */
    @ApiModelProperty(value="版本号")
    private String versionOut;

    public String getVersionOut(){
        return "V"+this.getVersion();
    }

}
