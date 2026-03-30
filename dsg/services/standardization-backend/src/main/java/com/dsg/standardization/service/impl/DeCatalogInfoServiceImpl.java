package com.dsg.standardization.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.enums.CatalogTypeEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.ConvertUtil;
import com.dsg.standardization.common.util.EnumUtil;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.DeCatalogInfo;
import com.dsg.standardization.mapper.DeCatalogInfoMapper;
import com.dsg.standardization.service.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.service.*;
import com.dsg.standardization.vo.CatalogVo.CatalogTreeNodeVo;
import com.dsg.standardization.vo.CatalogVo.CatalogWithFileVo;
import com.dsg.standardization.vo.*;
import com.google.common.collect.Lists;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.util.*;
import java.util.stream.Collectors;

import static com.dsg.standardization.common.enums.CatalogTypeEnum.Other;


/**
 * <p>
 * 数据元目录基本信息表 服务实现类
 * </p>
 *
 * @author WZY
 * @since 2022-11-12
 */
@Service
public class DeCatalogInfoServiceImpl extends ServiceImpl<DeCatalogInfoMapper, DeCatalogInfo> implements IDeCatalogInfoService {

    @Autowired(required = false)
    DeCatalogInfoMapper deCatalogInfoMapper;

    @Autowired
    @Lazy
    private IDataElementInfoService dataelementInfoService;

    @Autowired
    @Lazy
    private IDictService dictService;

    @Autowired
    @Lazy
    private RuleService ruleService;

    @Autowired
    @Lazy
    private StdFileMgrService stdFileMgrService;

    /**
     * 获取目录子集
     *
     * @param currentNode
     * @return
     */
    @Override
    public CatalogTreeNodeVo getChildren(DeCatalogInfo currentNode) {
//        List<DeCatalogInfo> list = deCatalogInfoMapper.getChildren(currentNode.getId());
//        currentNode.setChildren(list);
        ;
        LambdaQueryWrapper<DeCatalogInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeCatalogInfo::getType, currentNode.getType());
        wrapper.gt(DeCatalogInfo::getLevel, currentNode.getLevel());
        List<DeCatalogInfo> sonList = list(wrapper);
        List<DeCatalogInfo> allList = new ArrayList();
        allList.add(currentNode);
        allList.addAll(sonList);
        List<CatalogTreeNodeVo> treeNodeVoList = CatalogTreeNodeVo.convertList(allList);
        List<CatalogTreeNodeVo> allTree = generateTrees(treeNodeVoList, currentNode.getType().getCode(), ConvertUtil.toInt(currentNode.getLevel()));
        CatalogTreeNodeVo root = CustomUtil.isEmpty(allTree)?null:allTree.get(0);

        return root;
    }

    @Override
    public CatalogTreeNodeVo getChildrenNoCount(DeCatalogInfo currentNode) {
        LambdaQueryWrapper<DeCatalogInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeCatalogInfo::getType, currentNode.getType());
        wrapper.gt(DeCatalogInfo::getLevel, currentNode.getLevel());
        List<DeCatalogInfo> sonList = list(wrapper);
        List<DeCatalogInfo> allList = new ArrayList();
        allList.add(currentNode);
        allList.addAll(sonList);
        List<CatalogTreeNodeVo> treeNodeVoList = CatalogTreeNodeVo.convertList(allList);
        List<CatalogTreeNodeVo> allTree = generateTreesNoCount(treeNodeVoList, ConvertUtil.toInt(currentNode.getLevel()));
        CatalogTreeNodeVo root = CustomUtil.isEmpty(allTree)?null:allTree.get(0);

        return root;
    }

    @Override
    public CatalogWithFileVo getChildrenWithFile(DeCatalogInfo currentNode, Map<Long, List<FileCountVo>> fileMap) {
        LambdaQueryWrapper<DeCatalogInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(DeCatalogInfo::getType, currentNode.getType());
        wrapper.gt(DeCatalogInfo::getLevel, currentNode.getLevel());
        List<DeCatalogInfo> sonList = list(wrapper);
        List<DeCatalogInfo> allList = new ArrayList();
        allList.add(currentNode);
        allList.addAll(sonList);
        List<CatalogTreeNodeVo> treeNodeVoList = CatalogTreeNodeVo.convertList(allList);
        List<CatalogWithFileVo> catalogWithFileVos = new ArrayList<>();
        if (CustomUtil.isEmpty(catalogWithFileVos)) {
            catalogWithFileVos = treeNodeVoList.stream().map(i -> {
                CatalogWithFileVo vo = new CatalogWithFileVo();
                CustomUtil.copyProperties(i, vo);
                return vo;
            }).collect(Collectors.toList());
        }

        List<CatalogWithFileVo> allTree = generateTreesWithFile(catalogWithFileVos, ConvertUtil.toInt(currentNode.getLevel()), fileMap);
        CatalogWithFileVo root = CustomUtil.isEmpty(allTree)?null:allTree.get(0);
        return root;
    }


    /**
     * 构建根目录至子目录列表的树型结构
     *
     * @param sonList
     * @return
     */
    @Override
    public List<CatalogTreeNodeVo> getParentTree(List<DeCatalogInfo> sonList, Integer level) {
        List<DeCatalogInfo> allParentList = getRootList(sonList);
        List<CatalogTreeNodeVo> treeNodeVoList = CatalogTreeNodeVo.convertList(allParentList);
        return generateTreesNoCount(treeNodeVoList, level);
    }

    private List<CatalogTreeNodeVo> generateTrees(List<CatalogTreeNodeVo> nodes, Integer type) {
        List<CatalogTreeNodeVo> roots = Lists.newArrayList();
        Iterator item = nodes.iterator();

        while (item.hasNext()) {
            CatalogTreeNodeVo node = (CatalogTreeNodeVo) item.next();
            if (node.root()) {
                roots.add(node);
                item.remove();
            }
        }

        //按目录分组并计数
        Map<Long, Integer> deCountMap = getCatalogCountMap(type);
        roots.forEach((e) -> setChildren(e, nodes, deCountMap));
        return roots;
    }

    private List<CatalogTreeNodeVo> generateTrees(List<CatalogTreeNodeVo> nodes, Integer type, Integer level) {
        List<CatalogTreeNodeVo> roots = Lists.newArrayList();
        Iterator item = nodes.iterator();

        while (item.hasNext()) {
            CatalogTreeNodeVo node = (CatalogTreeNodeVo) item.next();
            if (node.root(level)) {
                roots.add(node);
                item.remove();
            }
        }

        //按目录分组并计数
        Map<Long, Integer> deCountMap = getCatalogCountMap(type);
        roots.forEach((e) -> setChildren(e, nodes, deCountMap));
        return roots;
    }

    private List<CatalogTreeNodeVo> generateTreesNoCount(List<CatalogTreeNodeVo> nodes, Integer level) {
        List<CatalogTreeNodeVo> roots = Lists.newArrayList();
        Iterator item = nodes.iterator();

        while (item.hasNext()) {
            CatalogTreeNodeVo node = (CatalogTreeNodeVo) item.next();
            if (null!=node && node.root(level)) {
                roots.add(node);
                item.remove();
            }
        }

        //按目录分组并计数
        roots.forEach((e) -> setChildren(e, nodes));
        return roots;
    }

    private List<CatalogWithFileVo> generateTreesWithFile(List<CatalogWithFileVo> nodes, Integer level, Map<Long, List<FileCountVo>> fileMap) {
        List<CatalogWithFileVo> roots = Lists.newArrayList();
        Iterator item = nodes.iterator();

        while (item.hasNext()) {
            CatalogWithFileVo node = (CatalogWithFileVo) item.next();
            if (node.root(level)) {
                roots.add(node);
                item.remove();
            }
        }

        //按目录分组
        roots.forEach((e) -> setChildren(e, nodes, fileMap));
        return roots;
    }

    /**
     * 根据目录类型按目录分组并计数
     *
     * @param type 数据目录类型
     * @return
     */
    @Override
    public Map<Long, Integer> getCatalogCountMap(Integer type) {
        Map<Long, Integer> countMap = new HashMap<>();
        CatalogTypeEnum typeEnum = EnumUtil.getEnumObject(CatalogTypeEnum.class, s -> s.getCode().equals(type)).orElse(Other);
        switch (typeEnum) {
            case DataElement: {
                countMap = dataelementInfoService.getCountMapGroupByCatalog();
                break;
            }
            case DeDict: {
                countMap = dictService.getCountMapGroupByCatalog();
                break;
            }
            case ValueRule: {
                countMap = ruleService.getCountMapGroupByCatalog();
                break;
            }
            case File: {
                countMap = stdFileMgrService.getCountMapGroupByCatalog();
                break;
            }
        }
        return countMap;
    }

    /**
     * 根据目录类型按文件分组并计数
     *
     * @param type 数据目录类型
     * @return
     */
    @Override
    public Map<Long, Integer> getFileCountMap(Integer type) {
        Map<Long, Integer> countMap = new HashMap<>();
        CatalogTypeEnum typeEnum = EnumUtil.getEnumObject(CatalogTypeEnum.class, s -> s.getCode().equals(type)).orElse(Other);
        switch (typeEnum) {
            case DataElement: {
                countMap = dataelementInfoService.getCountMapGroupByFile();
                break;
            }
            case DeDict: {
                countMap = dictService.getCountMapGroupByFile();
                break;
            }
            case ValueRule: {
                countMap = ruleService.getCountMapGroupByFile();
                break;
            }
        }
        return countMap;
    }

    private void setChildren(CatalogTreeNodeVo parent, List<CatalogTreeNodeVo> nodes, Map<Long, Integer> deCountMap) {
        List<CatalogTreeNodeVo> children = Lists.newArrayList();
        Object parentId = parent.id();
        Iterator iterator = nodes.iterator();
        parent.setCount(deCountMap.get(parent.getId()));

        while (iterator.hasNext()) {
            CatalogTreeNodeVo node = (CatalogTreeNodeVo) iterator.next();
            if (Objects.equals(node.parentId(), parentId)) {
                node.setCount(deCountMap.get(node.getId()));
                children.add(node);
                iterator.remove();
            }
        }

        if (!children.isEmpty()) {
            parent.setChildren(children);
            parent.setHaveChildren(true);
            children.forEach((e) -> {
                //这种递归统计页不准，还得从底层重新统计
//                parent.setCount(parent.getCount() + e.getCount());
                setChildren(e, nodes, deCountMap);
            });
        }
    }

    private void setChildren(CatalogWithFileVo parent, List<CatalogWithFileVo> nodes, Map<Long, List<FileCountVo>> fileMap) {
        List<CatalogWithFileVo> children = Lists.newArrayList();
        Object parentId = parent.id();
        Iterator iterator = nodes.iterator();
        parent.setFiles(fileMap.get(parent.getId()));

        while (iterator.hasNext()) {
            CatalogWithFileVo node = (CatalogWithFileVo) iterator.next();
            if (Objects.equals(node.parentId(), parentId)) {
                node.setFiles(fileMap.get(node.getId()));
                if (CustomUtil.isNotEmpty(node.getFiles())) {
                    node.setHaveChildren(true);
                }
                children.add(node);
                iterator.remove();
            }
        }

        if (!children.isEmpty()) {
            parent.setChildren(children);
            parent.setHaveChildren(true);
            children.forEach((e) -> {
                setChildren(e, nodes, fileMap);
            });
        }
    }

    private void setChildren(CatalogTreeNodeVo parent, List<CatalogTreeNodeVo> nodes) {
        List<CatalogTreeNodeVo> children = Lists.newArrayList();
        Object parentId = parent.id();
        Iterator iterator = nodes.iterator();

        while (iterator.hasNext()) {
            CatalogTreeNodeVo node = (CatalogTreeNodeVo) iterator.next();
            if (Objects.equals(node.parentId(), parentId)) {
                children.add(node);
                iterator.remove();
            }
        }

        if (!children.isEmpty()) {
            parent.setChildren(children);
            parent.setHaveChildren(true);
            children.forEach((e) -> {
                //这种递归统计页不准，还得从底层重新统计
//                parent.setCount(parent.getCount() + e.getCount());
                setChildren(e, nodes);
            });
        }
    }

    @Override
    public List<DeCatalogInfo> getRootList(List<DeCatalogInfo> sonList) {
        if (CustomUtil.isEmpty(sonList)) {
            return null;
        } else {
            //取最大层数
            Integer maxLevel = 0;
            for (DeCatalogInfo catalogInfo : sonList) {
                maxLevel = Integer.max(maxLevel, catalogInfo.getLevel());
            }
            QueryWrapper queryWrapper = new QueryWrapper();
            queryWrapper.le("f_level", maxLevel);
            List<DeCatalogInfo> allList = deCatalogInfoMapper.selectList(queryWrapper);
            List<DeCatalogInfo> allParentList = getAllParentListByChildren(allList, sonList);
            return allParentList;
        }
    }

    /**
     * 根据总集获得单个节点至根目录的去重节点链
     *
     * @param allList
     * @param currentNode
     * @param parentList
     */
    private void fillParentList(List<DeCatalogInfo> allList, DeCatalogInfo currentNode, List<DeCatalogInfo> parentList) {
        if (CustomUtil.isEmpty(parentList)) {
            parentList.add(currentNode);
        }
        if (currentNode.getLevel() > 1) {
            Optional<DeCatalogInfo> parent = allList.stream().filter(item -> item.getId().equals(currentNode.getParentId())).findAny();
            if (parent.isPresent() && !parentList.contains(parent.get())) {
                parentList.add(parent.get());
                fillParentList(allList, parent.get(), parentList);
            }
        }
    }

    /**
     * 通过ID获得目录的全路径列表
     *
     * @param id
     * @return
     */
    private List<DeCatalogInfo> getParentList(Long id) {
        DeCatalogInfo currentNode = getById(id);
        QueryWrapper queryWrapper = new QueryWrapper();
        queryWrapper.le("f_level", currentNode.getLevel());
        List<DeCatalogInfo> allList = deCatalogInfoMapper.selectList(queryWrapper);
        List<DeCatalogInfo> parentList = new ArrayList<>();
        fillParentList(allList, currentNode, parentList);
        return parentList;
    }

    /**
     * 通过ID获得目录的全路径名
     *
     * @param id
     * @return .分隔的全路径名
     */
    public String getAllName(Long id) {
        List<DeCatalogInfo> parentList = getParentList(id);
        if (!CustomUtil.isEmpty(parentList)) {
            StringBuilder allName = new StringBuilder();
            parentList.forEach(node -> {
                allName.append(node.getCatalogName()).append(".");
            });
            allName.deleteCharAt(allName.length() - 1);
            return allName.toString();
        }
        return null;
    }

    /**
     * 根据总集获得节点集合至根目录的去重节点链
     *
     * @param allList
     * @param children
     * @return
     */
    private List<DeCatalogInfo> getAllParentListByChildren(List<DeCatalogInfo> allList, List<DeCatalogInfo> children) {
        List<DeCatalogInfo> allParentList = new ArrayList<>();
        for (DeCatalogInfo child : children) {
            List<DeCatalogInfo> parentList = new ArrayList<>();
            fillParentList(allList, child, parentList);
            parentList.forEach(parent -> {
                if (!allParentList.contains(parent)) {
                    allParentList.add(parent);
                }
            });
        }
        return allParentList;
    }


    /**
     * 校验目录ID
     *
     * @param id
     * @return
     */
    public CheckVo<DeCatalogInfo> checkID(Serializable id) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        // 校验集合-目录ID参数不能为空
        if (id == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "目录id参数不能为空"));
        }
        // 校验集合-目录ID指向的目录是否存在
        DeCatalogInfo currentNode = getById(id);
        if (currentNode == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.Empty.getErrorCode(), "目录id指向的目录不能为空"));
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.CatalogServiceError.getErrorCode();
        }
        return new CheckVo<DeCatalogInfo>(errorCode, checkErrors, currentNode);
    }

    /**
     * 删除目录及其子集
     *
     * @param currentNode
     * @return
     */
    @Override
    public boolean removeWithChildren(DeCatalogInfo currentNode) {
        return removeBatchByIds(getIDList(currentNode));
    }

    /**
     * 删除时目录校验
     *
     * @param id 目录id
     * @return
     */
    public CheckVo<DeCatalogInfo> checkCatalogDelete(Long id) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        Integer type = Other.getCode();
        //目录校验
        CheckVo<DeCatalogInfo> checkVo = checkID(id);
        checkErrors.addAll(checkVo.getCheckErrors());
        if (CustomUtil.isNotEmpty(checkVo.getCheckData())) {
            type = checkVo.getCheckData().getType().getCode();
        }
        //根目录校验
        if (CustomUtil.isNotEmpty(checkVo.getCheckData()) && checkVo.getCheckData().getLevel() <= 1) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "不允许删除根目录"));
        }

        //数据元校验：目录或子目录下已存在数据元，不允许删除
        if (CatalogTypeEnum.DataElement.getCode().equals(type)) {
            IPage<DataElementInfo> result = dataelementInfoService.getPageList(id, null, null, null, 1, 1, null,null,null);
            if (!CustomUtil.isEmpty(result.getRecords())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.DATA_EXIST.getErrorCode(), "目录或子目录下已存在数据元，不允许删除"));
            }
        }
        //码表校验：目录或子目录下已存在码表，不允许删除
        if (CatalogTypeEnum.DeDict.getCode().equals(type)) {
            Result<List<DictVo>> dictResult = dictService.queryList(id, null, null, null, 1, 1, null, null,null);
            if (!CustomUtil.isEmpty(dictResult.getData())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.DATA_EXIST.getErrorCode(), "目录或子目录下已存在码表，不允许删除"));
            }
        }
        //编码规则校验：目录或子目录下已存在编码规则，不允许删除
        if (CatalogTypeEnum.ValueRule.getCode().equals(type)) {
            Result<List<RuleVo>> ruleResult = ruleService.queryList(id, null, null, null, 1, 1, null, null,null,null);
            if (!CustomUtil.isEmpty(ruleResult.getData())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.DATA_EXIST.getErrorCode(), "目录或子目录下已存在编码规则，不允许删除"));
            }
        }
        //文件校验：目录或子目录下已存在文件，不允许删除
        if (CatalogTypeEnum.File.getCode().equals(type)) {
            Result<List<StdFileMgrVo>> stdFileResult = stdFileMgrService.queryList(id, null, null, null, 1, 1, null, null,null);
            if (CustomUtil.isNotEmpty(stdFileResult.getData())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.DATA_EXIST.getErrorCode(), "目录或子目录下已存在文件，不允许删除"));
            }
        }

        //判断校验是否全部通过
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.CatalogServiceError.getErrorCode();
        }
        return new CheckVo<DeCatalogInfo>(errorCode, checkErrors, checkVo.getCheckData());
    }

    /**
     * 获取当前目录及其子集的ID列表
     *
     * @param currentNode
     * @return
     */
    @Override
    public List<Long> getIDList(DeCatalogInfo currentNode) {
        List<Long> sonlist = new ArrayList<>();
        CatalogTreeNodeVo currentTreeNode = getChildrenNoCount(currentNode);
        getSons(sonlist, currentTreeNode);
        sonlist.add(currentNode.getId());
        return sonlist;
    }

    /**
     * 根据名称检索节点集合
     *
     * @param name
     * @return
     */
    @Override
    public List<DeCatalogInfo> getByName(String name, Integer type) {
        //查询字符串规范化
        name = StringUtils.trim(name);
        name = StringUtils.substring(name, 0, 64);
        if (!StringUtils.isBlank(name)) {
            name = "%" + name.toLowerCase() + "%";
        }
        QueryWrapper queryWrapper = new QueryWrapper();
        queryWrapper.eq("f_type", type);
        queryWrapper.gt("f_level", 1);
//        queryWrapper.like(!StringUtils.isBlank(name), "f_catalog_name", StringUtils.substring(name, 0, 64));
        queryWrapper.apply(!StringUtils.isBlank(name), "(lower(f_catalog_name) like {0})", name);
        List<DeCatalogInfo> result = deCatalogInfoMapper.selectList(queryWrapper);
        return result;
    }

    /**
     * 获取当前目录及其子集的ID列表
     *
     * @param parentID 当前目录的父目录ID
     * @return
     */
    @Override
    public List<Long> getIDList(Long parentID) {
        List<Long> sonlist = new ArrayList<>();
        DeCatalogInfo father = getById(parentID);
        if (father != null) {
            sonlist = getIDList(father);
        }
        return sonlist;
    }

    /**
     * 递归收集子集ID列表
     *
     * @param sonlist
     * @param father
     */
    private void getSons(List<Long> sonlist, CatalogTreeNodeVo father) {
        if (CustomUtil.isNotEmpty(father) && CustomUtil.isNotEmpty(father.getChildren())) {
            for (TreeNode<Long> child : father.getChildren()) {
                sonlist.add(child.id());
                getSons(sonlist, (CatalogTreeNodeVo) child);
            }
        }
    }

    /**
     * 校验新建目录的Post的传参
     *
     * @param deCatalogInfo
     * @param type          0:创建，1：修改
     * @return
     */
    @Override
    public CheckVo<DeCatalogInfo> checkPost(DeCatalogInfo deCatalogInfo, Integer type) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        deCatalogInfo.setCatalogName(StringUtils.trim(deCatalogInfo.getCatalogName()));

        DeCatalogInfo oldNode = getById(deCatalogInfo.getId());
        DeCatalogInfo currentParent = getById(deCatalogInfo.getParentId());


        //目录名称由长度不超过20个字符的中文、英文、数字、符号_-组成,其中_-不能作为首字符
        if (StringUtils.isBlank(deCatalogInfo.getCatalogName())) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                    "目录名称不能为空"));
        } else if (!deCatalogInfo.getCatalogName().matches(Constants.getRegexENOrCNVarL(1, 20))) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                    "目录名称由长度不超过20个字符的中英文、数字、下划线、中划线组成,且不能以下划线和中划线开头"));
        }
        //父目录校验
        if (deCatalogInfo.getParentId() == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                    "父目录ID不能为空"));
        } else {
            if (currentParent == null) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.Empty.getErrorCode(),
                        "无法找到对应的父目录,请检查parent_id参数"));
            } else if (currentParent.getLevel() >= 255) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OutOfRange.getErrorCode(),
                        "目录级别取值范围(1-255)"));
            } else {
                //不能创建或修改根目录
                if ((CustomUtil.isNotEmpty(oldNode) && oldNode.getLevel() <= 1)) {
                    checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                            "不能修改根目录"));
                }



                //赋值父目录、目录级别、目录类型
                deCatalogInfo.setParentId(currentParent.getId());
                deCatalogInfo.setLevel(ConvertUtil.toInt(currentParent.getLevel() + 1));
                deCatalogInfo.setType(currentParent.getType());
                //修改时校验
                if (CustomUtil.isNotEmpty(oldNode)) {
                    if (type.equals(CatalogTypeEnum.DataElement.getCode()) && getIDList(oldNode).contains(currentParent.getId())) {
                        checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                                "新的父目录不能是自身及其子目录"));
                    }
                    if (type.equals(CatalogTypeEnum.DataElement.getCode()) && !currentParent.getType().equals(oldNode.getType())) {
                        checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(),
                                "新的父目录类型不能与当前目录不一致"));
                    }
                }
            }

        }
        //重复校验
        QueryWrapper queryWrapper = new QueryWrapper();
        queryWrapper.eq("f_catalog_name", deCatalogInfo.getCatalogName());
        queryWrapper.eq("f_parent_id", deCatalogInfo.getParentId());
        queryWrapper.eq("f_type", deCatalogInfo.getType());
        DeCatalogInfo repeatOne = getOne(queryWrapper);
        //创建时检验
        if (type.equals(0) && repeatOne != null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(),
                    "同级目录名称不能重复"));
        }
        //修改时检验
        if (type.equals(1) && repeatOne != null && !repeatOne.getId().equals(oldNode.getId())) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(),
                    "同级目录名称不能重复"));
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.CatalogServiceError.getErrorCode();
        }
        return new CheckVo<DeCatalogInfo>(errorCode, checkErrors, deCatalogInfo);
    }


    /**
     * 检查目录是否存在，存在返回，不存在 throw new CustomException；
     *
     * @param catalogId
     */
    @Override
    public Boolean checkCatalogIsExist(Long catalogId, CatalogTypeEnum type) {
        if (catalogId != null) {
            DeCatalogInfo catalogVo = deCatalogInfoMapper.selectById(catalogId);
            if (catalogVo != null) {
                Integer existType = catalogVo.getType().getCode();
                if (type.getCode().equals(existType)) {
                    return true;
                }
            }
        }
        return false;
    }

    @Override
    public CheckVo<Integer> checkType(Integer type) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        if (type == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "类型不能为空"));
        } else {
            if (!EnumUtil.isIncludeCode(CatalogTypeEnum.class, type) || type.equals(CatalogTypeEnum.Root.getCode()) || type.equals(Other.getCode())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "此类型不在有效值范围内"));
            }
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.CatalogServiceError.getErrorCode();
        }
        return new CheckVo<Integer>(errorCode, checkErrors, type);
    }

}
