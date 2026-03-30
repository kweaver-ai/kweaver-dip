package com.dsg.standardization.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.common.enums.CatalogTypeEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.ConvertUtil;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.entity.DeCatalogInfo;
import com.dsg.standardization.entity.StdFileMgrEntity;
import com.dsg.standardization.mapper.RelationDictFileMapper;
import com.dsg.standardization.mapper.RelationRuleFileMapper;
import com.dsg.standardization.service.*;
import com.dsg.standardization.vo.CatalogVo.CatalogInfoVo;
import com.dsg.standardization.vo.CatalogVo.CatalogListByFileVo;
import com.dsg.standardization.vo.CatalogVo.CatalogTreeNodeVo;
import com.dsg.standardization.vo.CatalogVo.CatalogWithFileVo;
import com.dsg.standardization.vo.CheckVo;
import com.dsg.standardization.vo.FileCountVo;
import com.dsg.standardization.vo.Result;
import com.fasterxml.jackson.annotation.JsonView;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 标准管理-目录功能
 * @author WZY
 * @since 2022-11-12
 */
//@Api(tags = "标准管理-目录功能")
@ApiSort(0)
@RestController
@RequestMapping("/v1/catalog")
@Slf4j
public class DeCatalogInfoController {
    @Autowired
    private IDeCatalogInfoService deCatalogInfoService;

    @Autowired
    private IDataElementInfoService dataElementInfoService;

    @Autowired
    private IDictService dictService;

    @Autowired
    private RuleService ruleService;

    @Autowired
    private StdFileMgrService stdFileMgrService;

    @Autowired
    private IRelationDeFileService relationDeFileService;

    @Autowired
    private RelationDictFileMapper relationDictFileMapper;

    @Autowired
    private RelationRuleFileMapper relationRuleFileMapper;

    /**
     * 通过id递归获取自身及全部子集
     * @param id
     * @return 自身及全部子集
     */
    @ApiOperation(value = "通过类型或id查询目录树", notes = "通过类型或id查询目录树（包括全部目录的目录树结构）",tags = "open标准管理-目录功能")
    @ApiOperationSupport(order = 1)
    @GetMapping(value = "/query_tree")
    @JsonView(DeCatalogInfo.SonTree.class)
    @ApiImplicitParam(name = "type", value = "1-数据元，2-码表，3-编码规则，4-文件", dataType = "Integer", required = true)
    public Result<?> querySonTree(@RequestParam(value = "type") Integer type, @RequestParam(value = "id", required = false) Long id) {
        if (!CustomUtil.isEmpty(id)) {
            //校验结果
            CheckVo<DeCatalogInfo> checkIDVo = deCatalogInfoService.checkID(id);
            //处理逻辑
            if (!StringUtils.isBlank(checkIDVo.getCheckCode())) {
                String description = "获取目录及其子集失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkIDVo.getCheckData());
                throw new CustomException(checkIDVo.getCheckCode(), description, checkIDVo.getCheckErrors());
            }
            CatalogTreeNodeVo vo = deCatalogInfoService.getChildrenNoCount(checkIDVo.getCheckData());

            return Result.success(vo);
        } else {
            //校验结果
            CheckVo<Integer> checkTypeVo = deCatalogInfoService.checkType(type);
            //处理逻辑
            if (!StringUtils.isBlank(checkTypeVo.getCheckCode())) {
                String description = "获取目录及其子集失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkTypeVo.getCheckData());
                throw new CustomException(checkTypeVo.getCheckCode(), description, checkTypeVo.getCheckErrors());
            }
            LambdaQueryWrapper<DeCatalogInfo> lambdaQueryWrapper = new LambdaQueryWrapper<>();
            lambdaQueryWrapper.eq(DeCatalogInfo::getType, type);

            List<DeCatalogInfo> resultList = deCatalogInfoService.list(lambdaQueryWrapper);
            Integer level = CustomUtil.isEmpty(resultList)? Integer.valueOf(1) :resultList.stream().map(DeCatalogInfo::getLevel).min(Integer::compareTo).orElse(null);
            Integer levelInt =  ConvertUtil.toInt(level, 1);

            List<CatalogTreeNodeVo> currentNode = deCatalogInfoService.getParentTree(resultList, levelInt);
            return Result.success(currentNode);
        }
    }

    @ApiOperation(value = "通过名称检索目录", notes = "按名称查询目录节点并递归至根目录，不包括跟节点顶部的全部目录",tags = "open标准管理-目录功能")
    @ApiOperationSupport(order = 2)
    @GetMapping(value = "/query")
    @JsonView(DeCatalogInfo.SonTree.class)
    @ApiImplicitParam(name = "type", value = "1-数据元，2-码表，3-编码规则，4-文件", dataType = "Integer", required = true)
    public Result<List<CatalogInfoVo>> queryParentTree(@RequestParam(value = "type") Integer type, @RequestParam(value = "catalog_name", required = false) String catalog_name) {
        //校验结果
        catalog_name = StringUtil.escapeSqlSpecialChars(catalog_name);
        CheckVo<Integer> checkTypeVo = deCatalogInfoService.checkType(type);

        //处理逻辑
        if (!StringUtils.isBlank(checkTypeVo.getCheckCode())) {
            String description = "检索失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkTypeVo.getCheckData());
            throw new CustomException(checkTypeVo.getCheckCode(), description, checkTypeVo.getCheckErrors());
        }

        List<DeCatalogInfo> childList = deCatalogInfoService.getByName(catalog_name, type);
//        List<DeCatalogInfo> result = tDeCatalogInfoService.getRootList(childList);
        if (CustomUtil.isEmpty(childList)) {
            childList = new ArrayList<>();
        }

        //按目录分组并计数
//        Map<Long, Integer> countMap = deCatalogInfoService.getCatalogCountMap(type);
        List<CatalogInfoVo> resultList = new ArrayList<>();
        if (CustomUtil.isNotEmpty(childList)) {
            childList.forEach(child -> {
                CatalogInfoVo vo = new CatalogInfoVo();
                CustomUtil.copyProperties(child, vo);
//                vo.setCount(countMap.get(vo.getId()));
                resultList.add(vo);
            });
        }

        return Result.success(resultList);
    }

    /**
     * 通过id查看目录单例属性
     *
     * @param id
     * @return 目录单例属性
     */
    @ApiOperation(value = "查看目录详情", notes = "通过id查看",tags = "标准管理-目录功能")
    @ApiOperationSupport(order = 3)
    @Deprecated
    @GetMapping(value = "/{id}")
    @JsonView(DeCatalogInfo.Details.class)
    public Result<DeCatalogInfo> queryDetails(@PathVariable Long id) {
        //校验结果
        CheckVo<DeCatalogInfo> checkVo = deCatalogInfoService.checkID(id);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "获取目录及其子集失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        } else {
            return Result.success(checkVo.getCheckData());
        }
    }

    /**
     * 创建目录
     *
     * @param deCatalogInfo
     * @return 返回消息
     */
    @ApiOperation(value = "创建目录", notes = "ID由雪花算法生成",tags = "标准管理-目录功能")
    @AuditLog(AuditLogEnum.CREATE_DATA_CATALOG_API)
    @ApiOperationSupport(order = 4)
    @PostMapping()
    public Result<?> create(@RequestBody DeCatalogInfo deCatalogInfo) {
        //校验结果
        CheckVo<DeCatalogInfo> checkVo = deCatalogInfoService.checkPost(deCatalogInfo, 0);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "目录创建失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }
        //通过校验时继承父目录的类型,目录级别+1
        if (!deCatalogInfoService.save(checkVo.getCheckData())) {
            String description = "目录创建失败 - 数据库创建目录失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        } else {
            return Result.success();
        }
    }

    /**
     * 修改目录信息
     * @param deCatalogInfo
     * @param id
     * @return
     */
    @ApiOperation(value = "修改目录信息", notes = "根据id修改目录信息",tags = "标准管理-目录功能")
    @AuditLog(AuditLogEnum.UPDATE_DATA_CATALOG_API)
    @ApiOperationSupport(order = 5)
    @PutMapping(value = "/{id}")
    public Result<?> update(@RequestBody DeCatalogInfo deCatalogInfo, @PathVariable Long id) {
        deCatalogInfo.setId(id);
        //校验结果
        CheckVo<DeCatalogInfo> idCheckData = deCatalogInfoService.checkID(id);
        CheckVo<DeCatalogInfo> postCheckData = deCatalogInfoService.checkPost(deCatalogInfo, 1);
        //校验结果异常处理逻辑
        idCheckData.getCheckErrors().addAll(postCheckData.getCheckErrors());
        if (idCheckData.getCheckErrors().size() > 0) {
            String description = "目录编辑失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, idCheckData.getCheckData());
            throw new CustomException(ErrorCodeEnum.CatalogServiceError.getErrorCode(), description, idCheckData.getCheckErrors());
        }
        //通过校验时修改目录
        if (!deCatalogInfoService.updateById(postCheckData.getCheckData())) {
            String description = "目录编辑失败 - 数据库更新目录失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, postCheckData.getCheckData());
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        } else {
            return Result.success();
        }
    }

    /**
     * 删除单例目录及其子集
     *
     * @param id
     * @return
     */
    @ApiOperation(value = "删除单例目录及其子集", notes = "根据id删除",tags = "标准管理-目录功能")
    @ApiOperationSupport(order = 6)
    @AuditLog(AuditLogEnum.DELETE_DATA_CATALOG_API)
    @DeleteMapping(value = "/{id}")
    public Result<?> delete(@PathVariable Long id) {
        //校验结果
        CheckVo<DeCatalogInfo> checkVo = deCatalogInfoService.checkCatalogDelete(id);

        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "目录删除失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }
        if (!deCatalogInfoService.removeWithChildren(checkVo.getCheckData())) {
            String description = "目录删除失败-数据库删除目录失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
        return Result.success();
    }

    /**
     * 通过文件ID获取目录及其子集、文件并统计文件关联的数据量
     *
     * @param id
     * @return 自身及全部子集
     */
    @ApiOperation(value = "通过文件目录ID获取目录及其子集、文件并统计文件关联的数据量", notes = "通过文件ID获取",tags = "标准管理-目录功能")
    @ApiOperationSupport(order = 7)
    @GetMapping(value = "/query_tree_by_file")
    @Deprecated
    @JsonView(DeCatalogInfo.SonTree.class)
    @ApiImplicitParam(name = "type", value = "1-数据元，2-码表，3-编码规则", dataType = "Integer", required = true)
    public Result<CatalogWithFileVo> querySonTreeByFile(@RequestParam(value = "type") Integer type, @RequestParam(value = "id", required = false) Long id) {
//        CatalogWithFileVo catalogWithFileVo = new CatalogWithFileVo();
        DeCatalogInfo currentNode;
        if (!CustomUtil.isEmpty(id)) {
            //校验结果
            CheckVo<DeCatalogInfo> checkIDVo = deCatalogInfoService.checkID(id);
            //处理逻辑
            if (!StringUtils.isBlank(checkIDVo.getCheckCode())) {
                String description = "获取目录及其子集失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkIDVo.getCheckData());
                throw new CustomException(checkIDVo.getCheckCode(), description, checkIDVo.getCheckErrors());
            }
            currentNode = checkIDVo.getCheckData();
        } else {
            LambdaQueryWrapper<DeCatalogInfo> lambdaQueryWrapper = new LambdaQueryWrapper<>();
            lambdaQueryWrapper.eq(DeCatalogInfo::getType, CatalogTypeEnum.File.getCode());
            lambdaQueryWrapper.eq(DeCatalogInfo::getLevel, 1);
            currentNode = deCatalogInfoService.getOne(lambdaQueryWrapper, false);
        }

//        //拼接子目录
//        CatalogTreeNodeVo vo = deCatalogInfoService.getChildrenNoCount(currentNode);

        //获取文件列表
        LambdaQueryWrapper<StdFileMgrEntity> fileWrapper = new LambdaQueryWrapper<>();
        fileWrapper.eq(StdFileMgrEntity::getDeleted, false);
        List<StdFileMgrEntity> fileList = stdFileMgrService.list(fileWrapper);

        List<FileCountVo> fileCountVoList = new ArrayList<>();

        //拼接文件返回集合
        if (CustomUtil.isNotEmpty(fileList)) {
            //按文件分组
//            Map<Long, Integer> countMap = deCatalogInfoService.getFileCountMap(type);
            fileCountVoList = fileList.stream().map(file -> {
                FileCountVo fileCountVo = new FileCountVo();
                fileCountVo.setFileId(file.getId());
                fileCountVo.setFileName(file.getName());
                fileCountVo.setCatalogId(file.getCatalogId());
//                fileCountVo.setFileCount(countMap.get(file.getId()) == null ? 0 : countMap.get(file.getId()));
                return fileCountVo;
            }).collect(Collectors.toList());
        }

        Map<Long, List<FileCountVo>> fileMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(fileCountVoList)) {
            fileCountVoList.forEach(i ->{
                if (CustomUtil.isEmpty(fileMap.get(i.getCatalogId()))) {
                    List<FileCountVo> voList = new ArrayList<>();
                    voList.add(i);
                    fileMap.put(i.getCatalogId(), voList);
                } else {
                    fileMap.get(i.getCatalogId()).add(i);
                }
            });
        }
        CatalogWithFileVo catalogWithFileVo = deCatalogInfoService.getChildrenWithFile(currentNode, fileMap);

        //拼接未分类目录
        if (catalogWithFileVo.getLevel().intValue() == 1) {
            CatalogWithFileVo noCatalog = new CatalogWithFileVo();
            noCatalog.setCatalogName("未分类");
            noCatalog.setLevel(2);
            noCatalog.setParentId(catalogWithFileVo.getParentId());
            noCatalog.setType(catalogWithFileVo.getType());
            noCatalog.setId(-1l);
            //CatalogTypeEnum typeEnum = EnumUtil.getEnumObject(CatalogTypeEnum.class, s -> s.getCode().equals(type)).orElse(Other);
            //switch (typeEnum) {
            //    case DataElement: {
            //
            //        LambdaQueryWrapper<DataElementInfo> queryWrapper = new LambdaQueryWrapper<>();
            //        queryWrapper.apply("f_de_id NOT IN  (SELECT  f_de_id FROM t_relation_de_file) AND f_deleted = FALSE");
            //        noCatalog.setCount(ConvertUtil.toInt(dataElementInfoService.count(queryWrapper)));
            //        break;
            //    }
            //    case DeDict: {
            //        LambdaQueryWrapper<DictEntity> queryWrapper = new LambdaQueryWrapper<>();
            //        queryWrapper.apply("f_id NOT IN  (SELECT  f_dict_id FROM t_relation_dict_file) AND f_deleted = FALSE");
            //        noCatalog.setCount(ConvertUtil.toInt(dictService.count(queryWrapper)));
            //        break;
            //    }
            //    case ValueRule: {
            //        LambdaQueryWrapper<RuleEntity> queryWrapper = new LambdaQueryWrapper<>();
            //        queryWrapper.apply("f_id NOT IN  (SELECT  f_rule_id FROM t_relation_rule_file) AND f_deleted = FALSE");
            //        noCatalog.setCount(ConvertUtil.toInt(ruleService.count(queryWrapper)));
            //        break;
            //    }
            //}

            if (CustomUtil.isNotEmpty(catalogWithFileVo.getChildren())) {
                List<CatalogWithFileVo> children = catalogWithFileVo.getChildren().stream().map(child -> (CatalogWithFileVo) child).collect(Collectors.toList());
                children.add(noCatalog);
                catalogWithFileVo.setChildren(children);
            } else {
                List<CatalogWithFileVo> children = new ArrayList<>();
                children.add(noCatalog);
                catalogWithFileVo.setChildren(children);
            }
        }

        return Result.success(catalogWithFileVo);
    }

    @ApiOperation(value = "通过目录名称查询文件目录与文件树列表", notes = "平铺列表",tags = "标准管理-目录功能")
    @ApiOperationSupport(order = 8)
    @GetMapping(value = "/query/with_file")
//    @Deprecated
    @JsonView(DeCatalogInfo.SonTree.class)
    public Result<CatalogListByFileVo> queryParentTree(@RequestParam(value = "catalog_name", required = false) String catalog_name) {
        //校验结果
        catalog_name = StringUtil.escapeSqlSpecialChars(catalog_name);

        List<DeCatalogInfo> childList = deCatalogInfoService.getByName(catalog_name, CatalogTypeEnum.File.getCode());
//        List<DeCatalogInfo> result = tDeCatalogInfoService.getRootList(childList);
        //拼接给前端的结果
        CatalogListByFileVo vo = new CatalogListByFileVo();
        if (CustomUtil.isEmpty(childList)) {
            childList = new ArrayList<>();
        }
        vo.setCatalogs(childList);
        //获取文件列表
        List<StdFileMgrEntity> fileList = stdFileMgrService.getByName(catalog_name);
        List<FileCountVo> fileCountVos = new ArrayList<>();
        if (CustomUtil.isNotEmpty(fileList)) {
            fileList.forEach(i ->{
                FileCountVo fileCountVo = new FileCountVo();
                fileCountVo.setCatalogId(i.getCatalogId());
                fileCountVo.setFileId(i.getId());
                fileCountVo.setFileName(i.getName());
                fileCountVos.add(fileCountVo);
            });
        }
        vo.setFiles(fileCountVos);

        return Result.success(vo);
    }

}
