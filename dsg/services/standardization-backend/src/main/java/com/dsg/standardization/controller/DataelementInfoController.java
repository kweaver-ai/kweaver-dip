package com.dsg.standardization.controller;

import cn.hutool.core.collection.CollectionUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.constant.MqTopic;
import com.dsg.standardization.common.enums.*;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.producer.KafkaProducerService;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.dto.DeStateDto;
import com.dsg.standardization.dto.LabelDetailDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.DeCatalogInfo;
import com.dsg.standardization.entity.RelationDeFileEntity;
import com.dsg.standardization.entity.StdFileMgrEntity;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.IDeCatalogInfoService;
import com.dsg.standardization.service.IRelationDeFileService;
import com.dsg.standardization.service.StdFileMgrService;
import com.dsg.standardization.vo.CatalogVo.CatalogMoveVo;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.vo.DataElementVo.*;
import com.fasterxml.jackson.annotation.JsonView;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import com.google.common.collect.Lists;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 数据元管理
 * @author Wang ZiYu
 * @since 2022-11-22
 */
//@Api(tags = "数据元管理")
@ApiSort(1)
@RestController
@RequestMapping("/v1")
@Slf4j
public class DataelementInfoController {
    @Autowired
    private IDataElementInfoService dataelementInfoService;

    @Autowired
    private IDeCatalogInfoService deCatalogInfoService;

    @Autowired
    private IRelationDeFileService relationDeFileService;

    @Autowired
    private StdFileMgrService stdFileMgrService;

//    @Autowired
//    DeUpdateProducer deUpdateProducer;
//
//    @Autowired
//    DeDeleteProducer deDeleteProducer;

    @Autowired
    KafkaProducerService kafkaProducerService;

    @Value("${configuration.center:http://configuration-center:8133}")
    String labelInfoById_url;

    /**
     * 创建数据元
     *
     * @param dataElementPostVo
     * @return 返回消息
     */
    @ApiOperation(value = "创建数据元", notes = "ID由雪花算法生成",tags = "open数据元管理")
    @ApiOperationSupport(order = 1)
    @PostMapping(value = "/dataelement")
    @Transactional(rollbackFor = Exception.class)
    @AuditLog(AuditLogEnum.CREATE_DATAELEMENT_API)
    public Result<DataElementInfo> create(@Validated @RequestBody DataElementPostVo dataElementPostVo) {

        //数据元部分
        DataElementInfo dataElementInfo = dataElementPostVo.convertToDataElementInfo();
        Department department = TokenUtil.getDeptPathIds(dataElementPostVo.getDepartmentIds());
        dataElementInfo.setDepartmentIds(department.getPathId());
        dataElementInfo.setThirdDeptId(department.getThirdDeptId());

        //校验结果
        CheckVo<DataElementInfo> checkVo = dataelementInfoService.checkPost(dataElementInfo, 0);
        dataElementInfo = checkVo.getCheckData();
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "数据元创建失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }

        UserInfo userInfo = CustomUtil.getUser();
        //使用MybatisPlus自动生成雪花算法的关联标识
        dataElementInfo.setId(IdWorker.getId());
        dataElementInfo.setCode(IdWorker.getId());
        dataElementInfo.setAuthorityId(userInfo.getUserId());
        dataElementInfo.setCreateTime(new Date());
        dataElementInfo.setCreateUser(userInfo.getUserName());
        dataElementInfo.setUpdateTime(dataElementInfo.getCreateTime());
        dataElementInfo.setUpdateUser(userInfo.getUserName());

        dataElementInfo.setVersion(1);
        if (!dataelementInfoService.save(dataElementInfo)) {
            String description = "数据元创建失败 - 数据库创建数据元失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }

        //文件部分
        if (CustomUtil.isNotEmpty(dataElementPostVo.getStd_files())) {
            //存储文件关系
            //校验集合
            Integer fileCount = dataElementPostVo.getStd_files().size();
            LambdaQueryWrapper<StdFileMgrEntity> fileWrapper = new LambdaQueryWrapper<>();
            fileWrapper.in(StdFileMgrEntity::getId, dataElementPostVo.getStd_files());
            List<StdFileMgrEntity> filelist = stdFileMgrService.list(fileWrapper);
            if (CustomUtil.isEmpty(filelist) || !fileCount.equals(filelist.size())) {
                List<CheckErrorVo> checkErrors = Lists.newLinkedList();
                String description = "文件id集合验证失败";
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.DATA_NOT_EXIST.getErrorCode(), "一个或多个文件id不存在"));
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST.getErrorCode(), description, checkErrors);
            }
            //存储文件和数据元的关系
            DataElementInfo finalDataElementInfo = dataElementInfo;
            List<RelationDeFileEntity> relationList = filelist.stream().map(file -> {
                RelationDeFileEntity relation = new RelationDeFileEntity();
                relation.setFileId(file.getId());
                relation.setDeId(finalDataElementInfo.getId());
                return relation;
            }).collect(Collectors.toList());
            if (!relationDeFileService.saveBatch(relationList)) {
                String description = "数据元-文件关系创建失败 - 数据库创建数据元失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, relationList);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }

        }

        String mqInfo = dataelementInfoService.packageMqInfo(Arrays.asList(dataElementInfo), "insert");
        log.info("创建数据元：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success(dataElementInfo);

    }

//    private List<RuleEntity> getRuleList(List<Long> ruleIDList, Integer status) {
//        LambdaQueryWrapper<RuleEntity> ruleEntityLambdaQueryWrapper = new LambdaQueryWrapper<>();
//        ruleEntityLambdaQueryWrapper.in(RuleEntity::getId, ruleIDList);
//        ruleEntityLambdaQueryWrapper.eq(RuleEntity::getStatus, status);
//        return ruleService.list(ruleEntityLambdaQueryWrapper);
//    }


    /**
     * 批量导入数据元
     *
     * @param file
     * @return 返回消息
     */
    @ApiOperation(value = "批量导入数据元", notes = "ID由雪花算法生成",tags = "数据元管理")
    @ApiOperationSupport(order = 2)
    @PostMapping(value = "/dataelement/import")
    public Result<List<DEImportSuccessVo>> importList(HttpServletResponse response, @RequestPart MultipartFile file, @RequestParam("catalog_id") Long catalogId) throws IOException {
//        EasyExcel.read(file.getInputStream(), DataElementInfo.class, new PageReadListener<DataElementInfo>(dataList -> {
//            List<DataElementInfo> resultList = dataList.stream().map(dataElementInfo -> {
//                dataElementInfo.setCode(IdWorker.getId());
//                dataElementInfo.setCreateTime(LocalDateTime.now());
//                dataElementInfo.setUpdateTime(LocalDateTime.now());
//                return  dataElementInfo;
//            }).collect(Collectors.toList());
////            for (DataElementInfo demoData : resultList) {
////                log.info("读取到一条数，默认20据{}", demoData);
////            }
//            dataelementInfoService.saveBatch(resultList);
//
//        })).sheet().doRead();
        //目录校验结果
        CheckVo<DeCatalogInfo> catalogCheckVo = deCatalogInfoService.checkID(catalogId);
        if (!StringUtils.isBlank(catalogCheckVo.getCheckCode())) {
            String description = "获取目录失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, catalogId);
            throw new CustomException(catalogCheckVo.getCheckCode(), description, catalogCheckVo.getCheckErrors());
        }
        //文件校验结果
        CheckVo<String> fileCheckVo = dataelementInfoService.checkFile(file);
        if (!StringUtils.isBlank(fileCheckVo.getCheckCode())) {
            String description = "上传失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, file.getOriginalFilename());
            throw new CustomException(fileCheckVo.getCheckCode(), description, fileCheckVo.getCheckErrors());
        }
        List<DEImportSuccessVo> lists = dataelementInfoService.importExcelReturnMsg(response, file, DataElementExcelVo.class, catalogId);
        if(CollectionUtil.isNotEmpty(lists)){
            List<DataElementInfo> list = new ArrayList<>();
            for (DEImportSuccessVo vo: lists) {
                DataElementInfo info = new DataElementInfo();
                info.setId(vo.getId());
                info.setNameCn(vo.getName());
                list.add(info);
            }
            String mqInfo = dataelementInfoService.packageMqInfo(list, "insert");
            log.info("导入数据元：mqInfo:{}",mqInfo);
            kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        }
        //处理逻辑
        return Result.success(lists);
    }

    /**
     * 通过查询结果批量导出数据元
     *
     * @param response
     * @param catalogId
     * @param keyword
     * @param stdType
     * @return
     */
    @ApiOperation(value = "通过查询结果批量导出数据元", notes = "无法找到对应目录或目录类型不对时导出模板",tags = "数据元管理")
    @ApiOperationSupport(order = 3)
    @AuditLog(AuditLogEnum.EXPORT_DATAELEMENT_API)
    @PostMapping(value = "/dataelement/export")
    public void exportList(HttpServletResponse response,
                           @RequestParam(value = "catalog_id", required = false) Long catalogId,
                           @RequestParam(value = "state", required = false) String state,
                           @RequestParam(value = "keyword", required = false) String keyword,
                           @RequestParam(value = "std_type", required = false) Integer stdType) {
        log.info("开始导出数据元,参数组：catalog_id={},keyword={},std_type={}", catalogId, keyword, stdType);
        List<DataElementExcelVo> list;
        keyword = StringUtil.escapeSqlSpecialChars(keyword);
//        String fileName = DataElementInfo.class.getSimpleName()+ DateFormatUtils.format(new Date(),"yyyyMMddHHmmss");
//        String sheet = "数据清单";
        //catalogId为空时导出模板
        if (CustomUtil.isEmpty(catalogId)) {
            dataelementInfoService.exportExcelTemplate(response);
            return;
        }
        //目录校验,无法找到对应目录或目录类型不对时导出模板
        DeCatalogInfo catalogInfo = deCatalogInfoService.getById(catalogId);
        if (catalogInfo == null || !catalogInfo.getType().equals(CatalogTypeEnum.DataElement)) {
//            dataelementInfoService.exportExcel(response, DataElementExcelVo.class, list);
            throw new CustomException(ErrorCodeEnum.Empty, "目录为空或目录类型不正确", null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        } else {
            list = DataElementExcelVo.getListByDeInfo(dataelementInfoService.getNoPageList(catalogId, state, keyword, stdType));
//            ExcelExportHandler.writeKolWithSheet(fileName,sheet,list,DataElementExcelVo.class,response);
            if (CustomUtil.isEmpty(list)) {
                throw new CustomException(ErrorCodeEnum.Empty, "导出的数据不存在", null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            } else {
                dataelementInfoService.exportExcel(response, DataElementExcelVo.class, list);
            }
        }
    }

    /**
     * 通过ID集合批量导出数据元
     *
     * @param response
     * @param ids
     */
    @ApiOperation(value = "通过ID集合批量导出数据元", notes = "通过ID集合导出;多个id用,分隔",tags = "数据元管理")
    @AuditLog(AuditLogEnum.EXPORT_IDS_DATAELEMENT_API)
    @ApiOperationSupport(order = 4)
    @PostMapping(value = "/dataelement/export/{ids}")
    public void exportList(HttpServletResponse response, @PathVariable String ids) {
        List<DataElementExcelVo> resultList;
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
        //校验结果
        CheckVo<String> checkVo = dataelementInfoService.checkID(ids);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "数据元导出失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }
        resultList = DataElementExcelVo.getListByDeInfo(dataelementInfoService.listByIds(idList));
        resultList.stream().forEach(item->{
            if(!Objects.isNull(item.getLabelId())){
                String url = labelInfoById_url + "/api/configuration-center/v1/grade-label/id/"+item.getLabelId();
                LabelDetailDto labelDetailDto = JsonUtils.json2Obj(UrlCallUtil.getResponseVoForGet(url).getResult(), LabelDetailDto.class);
                if(labelDetailDto != null){
                    item.setLabelName(labelDetailDto.getName());
                }
            }
        });
        if (CustomUtil.isEmpty(resultList)) {
            String description = "数据元导出失败 - id指向的数据元不存在";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(ErrorCodeEnum.Empty, description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
        dataelementInfoService.exportExcel(response, DataElementExcelVo.class, resultList);
    }


    /**
     * 分页检索数据元
     * @return
     */
    @ApiOperation(value = "分页检索数据元", notes = "",tags = "open数据元管理")
    @ApiOperationSupport(order = 5)
    @GetMapping(value = "/dataelement")
    @JsonView(DataElementInfo.DataList.class)
    public Result<List<DataElementListVo>> queryPageList(@ApiParam(value = "目录id", required = false,example = "122",type="java.lang.Long") @RequestParam(value = "catalog_id", required = false) Long catalogId,
                                                         @ApiParam(value = "启用/停用状态，enable启用、disable停用",example = "enable",type="java.lang.String") @RequestParam(value = "state", required = false) String state,
                                                         @ApiParam(value = "搜索关键字",example = "122",type="java.lang.String") @RequestParam(value = "keyword", required = false) String keyword,
                                                         @ApiParam(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "122",type="java.lang.Integer") @RequestParam(value = "std_type", required = false) Integer stdType,
                                                         @ApiParam(value = "分页页码，默认1",defaultValue = "1",type="java.lang.Integer") @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset, @ApiParam(value = "条数，默认20",defaultValue = "20",type="java.lang.Integer")   @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
                                                         @ApiParam(value = "排序字段",defaultValue = "create_time",type="java.lang.String") @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
                                                         @ApiParam(value = "排序类型，desc降序、asc升序",type="java.lang.String")  @RequestParam(value = "direction", required = false, defaultValue = "") String direction,
                                                         @ApiParam(value = "部门id",type="java.lang.String")  @RequestParam(value = "department_id", required = false) String departmentId) {
        //起始值最小为0
//        offset = Integer.max(ConvertUtil.toInt(offset,1), 1);
        //单页数据为1-1000
//        limit = Integer.max(ConvertUtil.toInt(limit,20), 1);
//        limit = Integer.min(limit, 1000);
        PageVo pageVo = PageUtil.getPage(offset, limit);
        keyword = StringUtil.escapeSqlSpecialChars(StringUtil.XssEscape(keyword));
        //分页检索
        IPage<DataElementInfo> data = dataelementInfoService.getPageList(catalogId, state, keyword, stdType, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId);
//        //处理数据，码值转成码值含义
//        List<DataElementInfoVo> records = dataelementInfoService.convertToVoList(data.getRecords());
        return Result.success(dataelementInfoService.getVoByEntities(data.getRecords()), data.getTotal());
    }

    @ApiOperation(value = "分页检索数据元(内部接口)", notes = "",tags = "数据元管理")
    @ApiOperationSupport(order = 5)
    @GetMapping(value = "/dataelement/internal/list")
    @JsonView(DataElementInfo.DataList.class)
    public Result<List<DataElementListVo>> queryInternalPageList(@ApiParam(value = "目录id", required = true,example = "122",type="java.lang.Long") @RequestParam(value = "catalog_id") Long catalogId,
                                                         @ApiParam(value = "启用/停用状态，enable启用、disable停用",example = "enable",type="java.lang.String") @RequestParam(value = "state", required = false) String state,
                                                         @ApiParam(value = "搜索关键字",example = "122",type="java.lang.String") @RequestParam(value = "keyword", required = false) String keyword,
                                                         @ApiParam(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "122",type="java.lang.Integer") @RequestParam(value = "std_type", required = false) Integer stdType,
                                                         @ApiParam(value = "分页页码，默认1",defaultValue = "1",type="java.lang.Integer") @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset, @ApiParam(value = "条数，默认20",defaultValue = "100",type="java.lang.Integer")   @RequestParam(value = "limit", required = false, defaultValue = "100") Integer limit,
                                                         @ApiParam(value = "排序字段",defaultValue = "create_time",type="java.lang.String") @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
                                                         @ApiParam(value = "排序类型，desc降序、asc升序",type="java.lang.String")  @RequestParam(value = "direction", required = false, defaultValue = "") String direction,
                                                         @ApiParam(value = "部门id",type="java.lang.String")  @RequestParam(value = "department_id", required = false) String departmentId) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        keyword = StringUtil.escapeSqlSpecialChars(StringUtil.XssEscape(keyword));
        //分页检索
        IPage<DataElementInfo> data = dataelementInfoService.getPageList(catalogId, state, keyword, stdType, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId);
        return Result.success(dataelementInfoService.getVoByEntities(data.getRecords()), data.getTotal());
    }


    /**
     * 查看数据元详情
     *
     * @param type
     * @param value
     * @return
     */
    @ApiOperation(value = "根据id或数据元code查看数据元详情", notes = "type：默认1，id匹配；type:2,code匹配",tags = "open数据元管理")
    @ApiOperationSupport(order = 6)
    @GetMapping(value = "/dataelement/detail")
    @JsonView(DataElementInfo.Details.class)
    public Result<DataElementDetailVo> queryDetails(@ApiParam(value = "类型：1是id匹配、2是code匹配" ,defaultValue = "1",type="java.lang.Integer") @RequestParam(value = "type", defaultValue = "1") Integer type, @ApiParam(value = "值,根据类型传递id值或code值" ,type="java.lang.Long") @RequestParam(value = "value") Long value) {
        //校验结果
        CheckVo<DataElementInfo> checkVo = dataelementInfoService.checkIdOrCode(type, value);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "获取数据元失败";
            log.error("{}-{}：{}[{},{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, type, value);
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        } else {
            DataElementDetailVo detailVo = dataelementInfoService.getDetailVo(checkVo.getCheckData().getId());
            return Result.success(detailVo);
        }
    }

    @ApiOperation(value = "根据id或数据元code查看数据元详情（内部）", notes = "type：默认1，id匹配；type:2,code匹配",tags = "数据元管理")
    @GetMapping(value = "/dataelement/internal/detail")
    @JsonView(DataElementInfo.Details.class)
    public Result<DataElementDetailVo> queryInternalDetails(@RequestParam(value = "type", defaultValue = "1") Integer type, @RequestParam(value = "value") Long value) {
        //校验结果
        CheckVo<DataElementInfo> checkVo = dataelementInfoService.checkIdOrCode(type, value);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "获取数据元失败";
            log.error("{}-{}：{}[{},{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, type, value);
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        } else {
            DataElementDetailVo detailVo = dataelementInfoService.getDetailVo(checkVo.getCheckData().getId());
            return Result.success(detailVo);
        }
    }

    /**
     * 编辑单例数据元属性
     * @param dataElementPostVo
     * @param id
     * @return
     */
    @ApiOperation(value = "根据数据元Id编辑数据元", notes = "根据id修改",tags = "open数据元管理")
    @AuditLog(AuditLogEnum.UPDATE_DATAELEMENT_API)
    @ApiOperationSupport(order = 7)
    @PutMapping(value = "/dataelement/{id}")
    @Transactional(rollbackFor = Exception.class)
    public Result<DataElementInfo> update(@Validated  @RequestBody DataElementPostVo dataElementPostVo, @PathVariable Long id) {
        //数据元部分
        DataElementInfo dataElementInfo = dataElementPostVo.convertToDataElementInfo();
        dataElementInfo.setId(id);
        //校验结果
        CheckVo<DataElementInfo> idCheckData = dataelementInfoService.checkID(id);
        if (idCheckData.getCheckErrors().size() > 0) {
            String description = "数据元编辑失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
            throw new CustomException(ErrorCodeEnum.DataElementServiceError.getErrorCode(), description, idCheckData.getCheckErrors());
        }
        UserInfo user = CustomUtil.getUser();
        Department department = TokenUtil.getDeptPathIds(dataElementPostVo.getDepartmentIds());
        dataElementInfo.setDepartmentIds(department.getPathId());
        dataElementInfo.setThirdDeptId(department.getThirdDeptId());
        CheckVo<DataElementInfo> postCheckData = dataelementInfoService.checkPost(dataElementInfo, 1);
        dataElementInfo = postCheckData.getCheckData();
        //处理逻辑
        postCheckData.getCheckErrors().addAll(idCheckData.getCheckErrors());
        //码表id为null时，数据元置0
        if (CustomUtil.isEmpty(dataElementPostVo.getDict_id())) {
            dataElementInfo.setDictCode(0l);
        }
        dataElementInfo.setUpdateUser(user.getUserName());
        dataElementInfo.setUpdateTime(new Date());
        if (postCheckData.getCheckErrors().size() > 0) {
            String description = "数据元编辑失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
            throw new CustomException(ErrorCodeEnum.DataElementServiceError.getErrorCode(), description, postCheckData.getCheckErrors());
        }

        //TODO:保存老版本，在审核功能完成后需要完善，不能直接换版本，需要通过审核后才可以
        DataElementInfo oldInfo = dataelementInfoService.getById(id);

        //判断版本迭代的变更是否发生，发生则存储新版本
        boolean isVersionChanged = dataelementInfoService.isVersionChanged(oldInfo, dataElementInfo);
        //判断版本不迭代的变更是否发，发生则修改当前版本
        boolean isNoVersionChanged = dataelementInfoService.isNoVersionChanged(oldInfo, dataElementInfo);
        //判断是否发生需要推送的变更，已取消
//        boolean isNeedPushChanged = dataelementInfoService.isNeedPushChanged(oldInfo, dataElementInfo);
        if (isVersionChanged) {
            //保存当前新版本
            dataElementInfo.setVersion(oldInfo.getVersion() + 1);
            if (!dataelementInfoService.updateById(dataElementInfo)) {
                String description = "数据元编辑失败 - 数据库保存新版内容失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }

        } else if (isNoVersionChanged) {
            //保存当前修改版本
            if (!dataelementInfoService.updateById(dataElementInfo)) {
                String description = "数据元编辑失败 - 数据库保存修改内容失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }
        } else {
            if (!dataelementInfoService.updateById(dataElementInfo)) {
                String description = "数据元编辑失败 - 数据库保存修改内容失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, dataElementInfo);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }
        }
        //如果post码表id为null，数据库置空
        if (CustomUtil.isEmpty(dataElementPostVo.getRuleId())) {
            dataelementInfoService.deleteRuleId(dataElementInfo.getId());
        }

        //修改文件
        //新的文件id列表
        List<Long> fileIDList = dataElementPostVo.getStd_files();
        //获取现有文件id列表
        LambdaQueryWrapper<RelationDeFileEntity> relationDeFileWrapper = new LambdaQueryWrapper<>();
        relationDeFileWrapper.eq(RelationDeFileEntity::getDeId, dataElementInfo.getId());
        List<Long> oldFileIDList = relationDeFileService.list(relationDeFileWrapper).stream().map(item -> item.getFileId()).collect(Collectors.toList());

        //处理增加的文件id列表
        List<Long> addFileIDList = new ArrayList<>();
        if (!CustomUtil.isEmpty(fileIDList)) {
            if (!CustomUtil.isEmpty(oldFileIDList)) {
                addFileIDList = fileIDList.stream().filter(file -> !oldFileIDList.contains(file)).collect(Collectors.toList());
            } else {
                addFileIDList = fileIDList;
            }
        }

        if (!CustomUtil.isEmpty(addFileIDList)) {
            //存储文件和数据元的关系
            DataElementInfo finalDataElementInfo = dataElementInfo;
            List<RelationDeFileEntity> relationList = addFileIDList.stream().map(fileId -> {
                RelationDeFileEntity relation = new RelationDeFileEntity();
                relation.setDeId(finalDataElementInfo.getId());
                relation.setFileId(fileId);
                return relation;
            }).collect(Collectors.toList());
            if (!relationDeFileService.saveBatch(relationList)) {
                String description = "数据元编辑失败 - 数据库保存数据元-文件关系创建失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, oldInfo);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }
        }

        //处理减少的文件id列表
        List<Long> removeFileIDList = new ArrayList<>();
        if (!CustomUtil.isEmpty(oldFileIDList)) {
            if (!CustomUtil.isEmpty(fileIDList)) {
                removeFileIDList = oldFileIDList.stream().filter(file -> !fileIDList.contains(file)).collect(Collectors.toList());
            } else {
                removeFileIDList = oldFileIDList;
            }
        }

        if (!CustomUtil.isEmpty(removeFileIDList)) {
            relationDeFileWrapper.clear();
            relationDeFileWrapper.eq(RelationDeFileEntity::getDeId, oldInfo.getId());
            relationDeFileWrapper.in(RelationDeFileEntity::getFileId, removeFileIDList);
            if (!relationDeFileService.remove(relationDeFileWrapper)) {
                String description = "数据元编辑失败 - 数据元-文件规则关系删除失败";
                log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, removeFileIDList);
                throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
            }
        }

        //推送变更消息
//        if (isNeedPushChanged) {
//            DataElementMessageVo deMessageVo = new DataElementMessageVo();
//            deMessageVo.setOperationTime(LocalDateTime.now());
//
//            List<Long> codeList = new ArrayList<>();
//            codeList.add(oldInfo.getCode());
//            deMessageVo.setCodeList(codeList);
//            deMessageVo.setOperationTypeEnum(OperationTypeEnum.Update);
//            deMessageVo.setOperationObject(dataelementInfoService.getPushChangedFields(oldInfo, dataElementInfo).keySet());
//            deMessageVo.setVersion("V" + (dataElementInfo.getVersion() == null ? oldInfo.getVersion() : dataElementInfo.getVersion()));
//            deUpdateProducer.send(deMessageVo);
//        }

        String mqInfo = dataelementInfoService.packageMqInfo(Arrays.asList(dataElementInfo), "update");
        log.info("更新数据元：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success(dataElementInfo);
    }

    @ApiOperation(value = "根据id删除单个或批量数据元", notes = "根据id删除,多个id使用英文逗号分隔",tags = "数据元管理")
    @AuditLog(AuditLogEnum.BATCH_DELETE_DATAELEMENT_API)
    @ApiOperationSupport(order = 8)
    @DeleteMapping(value = "dataelement/{ids}")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> delete(@PathVariable String ids) {

        //校验结果
        CheckVo<String> checkVo = dataelementInfoService.checkID(ids);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "数据元删除失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }

        //ID集合
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
        dataelementInfoService.delete(idList);

        List<DataElementInfo> list = new ArrayList<>();
        String[] split = ids.split(",");
        for(String id : split){
            DataElementInfo temp = new DataElementInfo();
            temp.setId(Long.valueOf(id));
            list.add(temp);
        }

        String mqInfo = dataelementInfoService.packageMqInfo(list, "delete");
        log.info("删除数据元：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);


        return Result.success();
    }

    @ApiOperation(value = "根据id移动单个或批量数据元目录", notes = "根据id移动，多个id通过英文逗号分隔",tags = "数据元管理")
    @AuditLog(AuditLogEnum.MOVE_CATALOG_DATAELEMENT_API)
    @ApiOperationSupport(order = 9)
    @PutMapping(value = "dataelement/move_catalog/{ids}")
    public Result<?> moveCatalog(@RequestBody CatalogMoveVo catalogMoveVo, @PathVariable String ids) {

        //ID校验结果
        CheckVo<String> checkVo = dataelementInfoService.checkID(ids);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "数据元移动失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }
        //目录校验结果
        CheckVo<DeCatalogInfo> checkCatalogVo = deCatalogInfoService.checkID(catalogMoveVo.getCatalog_id());
        //处理逻辑
        if (!StringUtils.isBlank(checkCatalogVo.getCheckCode())) {
            String description = "数据元移动失败 - 移动目录失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, catalogMoveVo);
            throw new CustomException(checkCatalogVo.getCheckCode(), description, checkCatalogVo.getCheckErrors());
        }
        //待移动id集合
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
        List<DataElementInfo> updateList = idList.stream().map(id -> {
            DataElementInfo dataElementInfo = new DataElementInfo();
            dataElementInfo.setId(id);
            dataElementInfo.setUpdateTime(new Date());
            dataElementInfo.setCatalogId(catalogMoveVo.getCatalog_id());
            return dataElementInfo;
        }).collect(Collectors.toList());
        if (!dataelementInfoService.updateBatchById(updateList)) {
            String description = "数据元移动失败 - 数据库更新数据元失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, idList);
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
        return Result.success();
    }

    @ApiOperation(value = "根据数据元id批量启用停用数据元", notes = "根据id启停数据元，多个id采用英文逗号分隔",tags = "open数据元管理")
    @ApiOperationSupport(order = 10)
    @PutMapping(value = "/dataelement/state/{ids}")
    public Result<?> changeState(@RequestBody DeStateDto deStateDto, @PathVariable String ids) {
        //ID校验结果
        CheckVo<String> checkVo = dataelementInfoService.checkID(ids);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            String description = "数据元启用或停用失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, checkVo.getCheckData());
            throw new CustomException(checkVo.getCheckCode(), description, checkVo.getCheckErrors());
        }
        //DeStateDto校验
        if (deStateDto.getState().equals(EnableDisableStatusEnum.DISABLE) && StringUtils.isBlank(deStateDto.getReason())) {
            List<CheckErrorVo> checkErrors = Lists.newLinkedList();
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "停用理由不能为空"));
            throw new CustomException(ErrorCodeEnum.InvalidParameter.getErrorCode(), ErrorCodeEnum.InvalidParameter.getErrorMsg(), checkErrors);
        }
        if (CustomUtil.isNotEmpty(deStateDto.getReason()) && deStateDto.getReason().length() > 800) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, CheckErrorUtil.createError("disable_reason", "长度超过800"));
        }

        //待启停id集合
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
//        List<DataElementInfo> updateList = idList.stream().map(id -> {
//            DataElementInfo dataElementInfo = new DataElementInfo();
//            dataElementInfo.setId(id);
//            dataElementInfo.setUpdateTime(new Date());
//            dataElementInfo.setState(deStateDto.getState());
//            dataElementInfo.setDisableReason(deStateDto.getReason());
//            return dataElementInfo;
//        }).collect(Collectors.toList());
        if (!dataelementInfoService.updateBatchEnable(idList,deStateDto.getState().getCode(),deStateDto.getReason())) {
            String description = "数据元更新失败 - 数据库启停数据元失败";
            log.error("{}-{}：{}[{}]", this.getClass(), Thread.currentThread().getStackTrace()[1].getMethodName(), description, idList);
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), description, null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
        List<DataElementInfo> list = new ArrayList<>();
        String[] split = ids.split(",");
        for(String id : split){
            DataElementInfo temp = new DataElementInfo();
            temp.setId(Long.valueOf(id));
            list.add(temp);
        }
        String mqInfo = dataelementInfoService.packageMqInfo(list, "update");
        log.info("启用或停用数据元：mqInfo:{}",mqInfo);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_SAILOR,mqInfo);
        return Result.success();
    }

    /**
     * 按文件目录分页检索数据元
     *
     * @param fileCatalogId
     * @param keyword
     * @param stdType
     * @param offset
     * @param limit
     * @param sort
     * @param direction
     * @return
     */
    @ApiOperation(value = "按文件目录分页检索数据元", notes = "",tags = "open数据元管理")
    @ApiOperationSupport(order = 11)
    @GetMapping(value = "/dataelement/query/byStdFileCatalog")
    @JsonView(DataElementInfo.DataList.class)
    public Result<List<DataElementListVo>> querybyStdFileCatalog( @ApiParam(value = "文件目录id", required = true,example = "122",type="java.lang.Long") @RequestParam(value = "file_catalog_id") Long fileCatalogId,
                                                                  @ApiParam(value = "启用/停用状态，enable启用、disable停用",example = "enable",type="java.lang.String") @RequestParam(value = "state", required = false) String state,
                                                                  @ApiParam(value = "搜索关键字",example = "122",type="java.lang.String") @RequestParam(value = "keyword", required = false) String keyword,
                                                                  @ApiParam(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",type="java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99") @RequestParam(value = "std_type", required = false) Integer stdType,
                                                                  @ApiParam(value = "分页页码，默认1",defaultValue = "1",type="java.lang.Integer") @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                                  @ApiParam(value = "条数，默认20",defaultValue = "20",type="java.lang.Integer")  @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
                                                                  @ApiParam(value = "排序字段",defaultValue = "create_time",type="java.lang.String") @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
                                                                  @ApiParam(value = "排序类型，desc降序、asc升序",type="java.lang.String") @RequestParam(value = "direction", required = false, defaultValue = "") String direction) {
        //起始值最小为0
//        offset = Integer.max(ConvertUtil.toInt(offset,1), 1);
        //单页数据为1-1000
//        limit = Integer.max(ConvertUtil.toInt(limit,20), 1);
//        limit = Integer.min(limit, 1000);
        PageVo pageVo = PageUtil.getPage(offset, limit);
        keyword = StringUtil.escapeSqlSpecialChars(keyword);
        //分页检索
        IPage<DataElementInfo> data = dataelementInfoService.getPageListByFileCatalog(fileCatalogId, state, keyword, stdType, pageVo.getOffset(), pageVo.getLimit(), sort, direction);

        return Result.success(dataelementInfoService.getVoByEntities(data.getRecords()), data.getTotal());
    }


    /**
     * 按文件分页检索数据元
     *
     * @param fileId
     * @param keyword
     * @param stdType
     * @param offset
     * @param limit
     * @param sort
     * @param direction
     * @return
     */
    @ApiOperation(value = "按文件分页检索数据元", notes = "",tags = "open数据元管理")
    @ApiOperationSupport(order = 12)
    @GetMapping(value = "/dataelement/query/byStdFile")
    @JsonView(DataElementInfo.DataList.class)
    public Result<List<DataElementListVo>> querybyStdFile(@ApiParam(value = "文件id", required = true,example = "122",type="java.lang.Long")@RequestParam(value = "file_id") Long fileId,
                                                          @ApiParam(value = "启用/停用状态，enable启用、disable停用",example = "enable",type="java.lang.String") @RequestParam(value = "state", required = false) String state,
                                                          @ApiParam(value = "搜索关键字",example = "122",type="java.lang.String") @RequestParam(value = "keyword", required = false) String keyword,
                                                          @ApiParam(value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "122",type="java.lang.Integer") @RequestParam(value = "std_type", required = false) Integer stdType,
                                                          @ApiParam(value = "分页页码，默认1",defaultValue = "1",type="java.lang.Integer") @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                          @ApiParam(value = "条数，默认20",defaultValue = "20",type="java.lang.Integer")   @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
                                                          @ApiParam(value = "排序字段",defaultValue = "create_time",type="java.lang.String") @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
                                                          @ApiParam(value = "排序类型，desc降序、asc升序",type="java.lang.String") @RequestParam(value = "direction", required = false, defaultValue = "") String direction) {
        //起始值最小为0
//        offset = Integer.max(ConvertUtil.toInt(offset,1), 1);
        //单页数据为1-1000
//        limit = Integer.max(ConvertUtil.toInt(limit,20), 1);
//        limit = Integer.min(limit, 1000);
        PageVo pageVo = PageUtil.getPage(offset, limit);
        keyword = StringUtil.escapeSqlSpecialChars(keyword);
        //分页检索
        IPage<DataElementInfo> data = dataelementInfoService.getPageListByFile(fileId, state, keyword, stdType, pageVo.getOffset(), pageVo.getLimit(), sort, direction);

        return Result.success(dataelementInfoService.getVoByEntities(data.getRecords()), data.getTotal());
    }


    @ApiOperation(value = "根据数据元id分页检索文件", notes = "",tags = "数据元管理")
    @ApiOperationSupport(order = 13)
    @GetMapping(value = "/dataelement/query/stdFile")
    @JsonView(DataElementInfo.DataList.class)
    public Result<List<DataElementFileVo>> querybyStdFile(@RequestParam(value = "id") Long id,
                                                          @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                          @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        //分页检索
        IPage<DataElementFileVo> data = dataelementInfoService.getPageFileList(id, pageVo.getOffset(), pageVo.getLimit());
        return Result.success(data.getRecords(), data.getTotal());
    }

    @ApiOperation(value = "检查数据元是否重名", notes = "repeat_type={1:中文，2:英文}",tags = "数据元管理")
    @ApiOperationSupport(order = 14)
    @GetMapping(value = "/dataelement/query/isRepeat")
    @JsonView(DataElementInfo.DataList.class)
    public Result<Boolean> queryIsRepeat(@RequestParam(value = "id", required = false) Long filterId,
                                         @RequestParam(value = "name") String name,
                                         @RequestParam(value = "std_type") Integer stdType,
                                         @RequestParam(value = "repeat_type") RepeatTypeEnum repeatType, @RequestParam(value = "departmentIds", required = false) String departmentIds) {
        //分页检索
        OrgTypeEnum type = OrgTypeEnum.getByCode(stdType);
        Boolean data = dataelementInfoService.isRepeat(filterId, StringUtil.XssEscape(name), type, repeatType,departmentIds);
        return Result.success(data);
    }



    @ApiOperation(value = "根据标签ID单个删除或批量数据元标签", notes = "根据发分级标签id删除，多个id采用引文逗号分割",tags = "数据元管理")
    @AuditLog(AuditLogEnum.DELETE_FJLABEL_DATAELEMENT_API)
    @ApiOperationSupport(order = 8)
    @DeleteMapping(value = "dataelement/labelIds/{ids}")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> deleteByIds(@PathVariable String ids) {
        log.info("删除单例或批量数标签ID,ids:{}", ids);
        //校验集合-数据元ID集合参数不能为空
        if (StringUtils.isBlank(ids)) {
            throw new CustomException(ErrorCodeEnum.MissingParameter.getErrorCode(), "标签ID集合ids参数不能为空");
        }
        //校验集合-标签ID集合形式为 1,2,3 等等,长度在1-2000
        if (!ids.matches(Constants.getRegexNumVarL(1, 2000))) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter.getErrorCode(), "标签ID集合ids形式应为 {1,2,3},长度在1-2000");
        }

        //ID集合
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
        dataelementInfoService.deleteByLabelIds(idList);
        return Result.success();
    }
    /**
     * 查询数据元列表
     *
     * @return
     */
    @ApiOperation(value = "查询数据元列表", notes = "",tags = "数据元管理")
    @ApiOperationSupport(order = 11)
    @GetMapping(value = "/dataelement/query/list")
    @JsonView(DataElementDetailVo.DataList.class)
    public Result<List<DataElementDetailVo>> queryByIDOrCode(@RequestParam(value = "ids",required = false) String ids,
                                     @RequestParam(value = "codes", required = false) String codes) {
        List<String> idList = new ArrayList<>();
        List<String> codeList = new ArrayList<>();
        if(!StringUtils.isEmpty(ids)){
            String[] idsArray = ids.split(",");
            idList = Arrays.asList(idsArray);
        }
        if(!StringUtils.isEmpty(codes)){
            String[] codesArray = codes.split(",");
            codeList = Arrays.asList(codesArray);
        }
        List<DataElementDetailVo> result = dataelementInfoService.queryByIDOrCode(idList, codeList);
        return Result.success(result);
    }

    @ApiOperation(value = "查询数据元列表（内部）", notes = "",tags = "数据元管理")
    @GetMapping(value = "/dataelement/internal/query/list")
    @JsonView(DataElementDetailVo.DataList.class)
    public Result<List<DataElementDetailVo>> queryInternalListByIDOrCode(@RequestParam(value = "ids",required = false) String ids,
                                     @RequestParam(value = "codes", required = false) String codes) {
        List<String> idList = new ArrayList<>();
        List<String> codeList = new ArrayList<>();
        if(!StringUtils.isEmpty(ids)){
            String[] idsArray = ids.split(",");
            idList = Arrays.asList(idsArray);
        }
        if(!StringUtils.isEmpty(codes)){
            String[] codesArray = codes.split(",");
            codeList = Arrays.asList(codesArray);
        }
        List<DataElementDetailVo> result = dataelementInfoService.queryByIDOrCode(idList, codeList);
        return Result.success(result);
    }
}
