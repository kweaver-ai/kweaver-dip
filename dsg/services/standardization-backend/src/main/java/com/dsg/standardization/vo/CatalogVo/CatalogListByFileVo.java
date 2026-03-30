package com.dsg.standardization.vo.CatalogVo;


import com.dsg.standardization.entity.DeCatalogInfo;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import com.dsg.standardization.vo.FileCountVo;

import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo.CatalogVo
 * @Date: 2023/11/16 10:50
 */
@Data
@ApiModel(description = "标准目录和文件列表")
public class CatalogListByFileVo {
    @ApiModelProperty(value = "标准目录列表", dataType = "java.util.List")
    List<DeCatalogInfo> catalogs;
    @ApiModelProperty(value = "标准文件统计列表", dataType = "java.util.List")
    List<FileCountVo> files;
}
