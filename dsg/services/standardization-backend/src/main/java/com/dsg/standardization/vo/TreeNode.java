package com.dsg.standardization.vo;

import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.api
 * @Date: 2022/12/8 23:28
 */
public interface TreeNode<T> {

    /**
     * 树节点id
     *
     * @return
     */
    T id();

    /**
     * 获取该节点的父节点id
     *
     * @return
     */
    T parentId();

    /**
     * 是否是根节点
     *
     * @return
     */
    Boolean root();

    /**
     * 设置节点的子节点列表
     *
     * @param children
     */
    void setChildren(List<? extends TreeNode<T>> children);

    /**
     * 获取所有子节点
     *
     * @return
     */
    List<? extends TreeNode<T>> getChildren();
}

