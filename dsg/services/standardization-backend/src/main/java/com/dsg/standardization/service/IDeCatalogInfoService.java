package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.common.enums.CatalogTypeEnum;
import com.dsg.standardization.vo.CatalogVo.CatalogTreeNodeVo;
import com.dsg.standardization.vo.CatalogVo.CatalogWithFileVo;
import com.dsg.standardization.entity.DeCatalogInfo;
import com.dsg.standardization.vo.CheckVo;
import com.dsg.standardization.vo.FileCountVo;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * <p>
 * 数据元目录基本信息表 服务类
 * </p>
 *
 * @author WZY
 * @since 2022-11-12
 */
public interface IDeCatalogInfoService extends IService<DeCatalogInfo> {
    /**
     * 获取目录自身及其子集
     *
     * @param currentNode
     * @return
     */
    CatalogTreeNodeVo getChildren(DeCatalogInfo currentNode);

    /**
     * 获取目录自身及其子集
     *
     * @param currentNode
     * @return
     */
    CatalogTreeNodeVo getChildrenNoCount(DeCatalogInfo currentNode);


    /**
     * 获取目录自身及其子集并附带文件
     *
     * @param currentNode
     * @return
     */
    CatalogWithFileVo getChildrenWithFile(DeCatalogInfo currentNode, Map<Long, List<FileCountVo>> fileMap);

    /**
     * 通过若干子结点，构建根目录开始的目录树
     * @param sonList
     * @return
     */
    List<CatalogTreeNodeVo> getParentTree(List<DeCatalogInfo> sonList, Integer level);

    /**
     * 通过若干子结点，构建根目录开始的目录列表
     * @param sonList
     * @return
     */
    List<DeCatalogInfo> getRootList(List<DeCatalogInfo> sonList);

    /**
     * 目录ID校验
     *
     * @param id
     * @return
     */
    CheckVo checkID(Serializable id);

    /**
     * 删除目录及其子集
     *
     * @param currentNode
     * @return
     */
    boolean removeWithChildren(DeCatalogInfo currentNode);

    /**
     * 判断目录是否可删除
     * @param id 目录id
     * @return
     */
    CheckVo<DeCatalogInfo> checkCatalogDelete(Long id);

    /**
     * 获取当前目录及其子集的ID列表
     *
     * @param currentNode
     * @return
     */
    List<Long> getIDList(DeCatalogInfo currentNode);

    /**
     * 通过名称查询目录列表
     * @param name
     * @return
     */
    List<DeCatalogInfo> getByName(String name,Integer type);

    /**
     * 通过ID获得目录的全路径名
     * @param id
     * @return
     */
    String getAllName(Long id);

    /**
     * 获取当前目录及其子集的ID列表
     *
     * @param parentID 当前目录的父目录ID
     * @return
     */
    List<Long> getIDList(Long parentID);


    /**
     * 校验新建目录的Post的传参
     *
     * @param deCatalogInfo
     * @param type          0:创建，1：修改
     * @return
     */
    CheckVo<DeCatalogInfo> checkPost(DeCatalogInfo deCatalogInfo, Integer type);

    /**
     * 校验目录是否存在
     *
     * @param catalogId
     */
    Boolean checkCatalogIsExist(Long catalogId, CatalogTypeEnum type);

    CheckVo<Integer> checkType(Integer type);
    /**
     * 根据目录类型按目录分组并计数
     * @param type 数据目录类型
     * @return
     */
    Map<Long, Integer> getCatalogCountMap(Integer type);

    /**
     * 根据目录类型按文件分组并计数
     * @param type 数据目录类型
     * @return
     */
    Map<Long, Integer> getFileCountMap(Integer type);
}
