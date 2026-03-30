package com.dsg.standardization.vo.DataElementVo;

import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.constant.FileConstants;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/17 10:23
 */
@Data
@TableName
@ApiModel(description = "数据元标准文件")
public class DataElementFileVo {
    /**
     * 主键
     */
    @ApiModelProperty(value="数据元标准文件ID",dataType = "java.lang.Long")
    private Long fileId;

    /**
     * 文件名称
     */
    @ApiModelProperty(value="文件名称",dataType = "java.lang.String")
    private String fileName;

    /**
     * 文件元数据名称
     */
    @ApiModelProperty(value="文件元数据名称",dataType = "java.lang.String")
    private String name;

    /**
     * 文件类型
     */
    @ApiModelProperty(value="文件类型",dataType = "java.lang.Boolean")
    private Boolean isUrl;

    /**
     * 文件启停状态
     */
    @ApiModelProperty(value="文件启用和停用状态")
    private EnableDisableStatusEnum fileState;

    /**
     * 文件删除状态
     */
    @ApiModelProperty(value="文件删除状态，0未删除",dataType = "java.lang.Boolean")
    private Boolean fileDeleted;


    public String getAttachmentType() {
        if (isUrl) {
            return FileConstants.Attachment_Type_URL;
        } else {
            return FileConstants.Attachment_Type_File;
        }

    }
}
