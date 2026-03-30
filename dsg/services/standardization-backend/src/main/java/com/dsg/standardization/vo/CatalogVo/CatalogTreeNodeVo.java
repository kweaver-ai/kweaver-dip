package com.dsg.standardization.vo.CatalogVo;


import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.entity.DeCatalogInfo;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import com.dsg.standardization.vo.TreeNode;

import java.util.ArrayList;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/9 17:32
 */
@Data
@ApiModel(description = "数据元标准目录树")
public class CatalogTreeNodeVo implements TreeNode<Long> {
    /**
     * 目录唯一标识
     */
    @ApiModelProperty(value = "目录唯一标识",dataType = "java.lang.Long")
    private Long id;

    /**
     * 目录名称
     */
    @ApiModelProperty(value = "目录名称",dataType = "java.lang.String")
    private String catalogName;

    /**
     * 目录说明
     */
    @ApiModelProperty(value = "目录说明",dataType = "java.lang.String")
    private String description;

    /**
     * 目录级别
     */
    @ApiModelProperty(value = "目录级别",dataType = "java.lang.Integer")
    private Integer level;

    /**
     * 父级标识
     */
    @ApiModelProperty(value = "父级标识",dataType = "java.lang.Long")
    private Long parentId;

    /**
     *目录类型
     */
    @ApiModelProperty(value = "目录类型",dataType = "java.lang.Integer")
    private Integer type;

    /**
     * 权限域（目前为预留字段）
     */
    @ApiModelProperty(value = "权限域（目前为预留字段）",dataType = "java.lang.Long")
    private Long authorityId;

    /**
     * 目录下的数据量
     */
    @ApiModelProperty(value = "目录下的数据量",dataType = "java.lang.Integer")
    private Integer count;

    /**
     * 子目录节点
     */
    @ApiModelProperty(value = "子目录节点",dataType = "java.util.List")
    private List<CatalogTreeNodeVo> children;

    private Boolean haveChildren = false;

    @Override
    public Long id() {
        return this.id;
    }

    @Override
    public Long parentId() {
        return this.parentId;
    }

    public Boolean root() {
        if(this.level <= 1) {
            return true;
        }else {
            return false;
        }
    }

    public Boolean root(Integer level) {
        if(this.level <= level) {
            return true;
        }else {
            return false;
        }
    }

    @Override
    public void setChildren(List<? extends TreeNode<Long>> children) {
        this.children = (List<CatalogTreeNodeVo>) children;
    }

    @Override
    public List<? extends TreeNode<Long>> getChildren() {
        return this.children;
    }

    public  static List<CatalogTreeNodeVo> convertList(List<DeCatalogInfo> list){
        List<CatalogTreeNodeVo> resultList = new ArrayList<>();
        if(!CustomUtil.isEmpty(list)){
            list.forEach(item -> {
                CatalogTreeNodeVo treeNode = new CatalogTreeNodeVo();
                CustomUtil.copyProperties(item,treeNode);
                resultList.add(treeNode);
            });
        }
        return resultList;
    }
}
