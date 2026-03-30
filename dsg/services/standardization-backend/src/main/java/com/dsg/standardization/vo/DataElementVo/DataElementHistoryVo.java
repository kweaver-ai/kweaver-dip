package com.dsg.standardization.vo.DataElementVo;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/17 0:53
 */
@Data
public class DataElementHistoryVo {
    /**
     * 更新用户
     */
    @ApiModelProperty(value="更新用户",dataType = "java.lang.String")
    private String updateUser;

    /**
     * 更新时间
     */
    @ApiModelProperty(value="更新时间",dataType = "java.lang.String")
    private LocalDateTime updateTime;

    /**
     * 版本号
     */
    @ApiModelProperty(value="版本号")
    private String versionOut;

    /**
     * 更新内容
     */
    @ApiModelProperty(value="更新内容",dataType = "java.lang.String")
    private Map<String, List<Object>> updateContent;
}
