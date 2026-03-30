package com.dsg.standardization.controller;

import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.constant.MqTopic;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.producer.KafkaProducerService;
import com.dsg.standardization.common.util.CheckErrorUtil;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.PageUtil;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.service.DictExcelImportService;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.IDictService;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import com.google.common.collect.Lists;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import kong.unirest.json.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
/**
 * 码表管理
 * @author Wang ZiYu
 * @since 2022-11-22
 */
//@Api(tags = "码表管理")
@ApiSort(2)
@RestController
@RequestMapping("/v1/dataelement")
@Slf4j
public class DictController {


    @Autowired
    private IDictService dictService;

    @Autowired
    private DictExcelImportService dictExcelImportService;

    @Autowired
    private IDataElementInfoService dataelementInfoService;
    @Autowired
    private KafkaProducerService kafkaProducerService;

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录ID", required = false, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准", example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-列表查询", notes = "列表查询",tags = "open码表管理")
    @ApiOperationSupport(order = 1)
    @GetMapping(value = "/dict")
    public Result<List<DictVo>> list(
            @RequestParam(value = "catalog_id", required = false) Long catalogId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
            @RequestParam(value = "department_id", required = false) String departmentId
    ) {
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        PageVo page = PageUtil.getPage(offset, limit);
        keyword = StringUtil.XssEscape(keyword);
        return dictService.queryList(catalogId, keyword, orgType, statusEnum, page.getOffset(), page.getLimit(), sort, direction,departmentId);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录ID", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准", example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-列表查询（内部接口）", notes = "列表查询",tags = "码表管理")
    @ApiOperationSupport(order = 1)
    @GetMapping(value = "/dict/internal/list")
    public Result<List<DictVo>> queryInternalList(
            @RequestParam(value = "catalog_id") Long catalogId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "100") Integer limit,
            @RequestParam(value = "sort", required = false) String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
            @RequestParam(value = "department_id", required = false) String departmentId
    ) {
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        PageVo page = PageUtil.getPage(offset, limit);
        keyword =StringUtil.XssEscape(keyword);
        return dictService.queryList(catalogId, keyword, orgType, statusEnum, page.getOffset(), page.getLimit(), sort, direction,departmentId);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "主键ID", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-详情查询（根据唯一标识）", notes = "通过唯一标识查询码表详情",tags = "open码表管理")
    @ApiOperationSupport(order = 2)
    @GetMapping(value = "/dict/{id}")
    public Result<DictVo> info(@PathVariable(name = "id") Long id) {
        DictVo rlt = dictService.queryById(id);
        if (rlt == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("id", String.format("找不到id[%s]对应的记录", id)), "该记录不存在，请刷新页面");
        }
        return Result.success(rlt);

    }

    @ApiOperation(value = "码表-根据id详情查询（内部）", notes = "码表-根据id详情查询",tags = "码表管理")
    @GetMapping(value = "/dict/internal/getId/{id}")
    public Result<DictVo> getId(@PathVariable(name = "id") Long id) {
        DictVo rlt = dictService.queryById(id);
        if (rlt == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("id", String.format("找不到id[%s]对应的记录", id)), "该记录不存在，请刷新页面");
        }
        return Result.success(rlt);

    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "code", value = "码表唯一标识code", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表详情查询（根据编码code）", notes = "根据编码查询状态为显示的码表记录详情",tags = "open码表管理")
    @ApiOperationSupport(order = 3)
    @GetMapping(value = "/dict/code/{code}")
    public Result<DictVo> queryByCode(@PathVariable(name = "code") Long code) {
        DictVo rlt = dictService.queryDetailByCode(code);
        if (rlt == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("code", String.format("code[%s]对应的记录", code)), "该记录不存在，请刷新页面");
        }
        return Result.success(rlt);
    }


    @ApiOperation(value = "新增码表", notes = "新增码表",tags = "open码表管理")
    @ApiOperationSupport(order = 4)
    @PostMapping(value = "/dict")
    @AuditLog(AuditLogEnum.CREATE_DICT_API)
    public Result<DictVo> create(@Validated @RequestBody DictDto insertDto) {
        return dictService.create(insertDto);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "主键ID", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据id修改码表", notes = "根据id修改码表",tags = "open码表管理")
    @AuditLog(AuditLogEnum.UPDATE_DICT_API)
    @ApiOperationSupport(order = 5)
    @PutMapping(value = "/dict/{id}")
    public Result<DictVo> update(@PathVariable("id") Long id, @Validated @RequestBody DictDto updateDto) {
        updateDto.setId(id);
        Result<DictVo> result = dictService.update(updateDto);
        String msg =convertDictMsg(id);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,msg);
        return result;
    }

    private String convertDictMsg(Long id){
        List<Long> list = new ArrayList<>();
        list.add(id);
        return this.convertDictMsg(list);
    }

    private String convertDictMsg(List<Long> ids) {
        List<Long> lists = dataelementInfoService.queryDictIdByDataCodes(ids);
        DictMqDto dto = new DictMqDto();
        dto.setDictRuleIds(ids);
        dto.setDataCodes(lists);
        dto.setType(1);
        return JSONObject.valueToString(dto);
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "主键ID", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @AuditLog(AuditLogEnum.DELETE_DICT_API)
    @ApiOperation(value = "码表-根据id删除码表", notes = "根据唯一标识批量删除码表记录",tags = "码表管理")
    @ApiOperationSupport(order = 6)
    @DeleteMapping(value = "/dict/{id}")
    public Result<String> delete(@PathVariable("id") Long id) {
        Result<String> result =  dictService.delete(id);
        kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,convertDictMsg(id));
        return result;
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "ids", value = "唯一标识，多个逗号分隔", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-根据码表id批量删除", notes = "根据唯一标识批量删除码表记录，多个id采用英文逗号分割",tags = "码表管理")
    @AuditLog(AuditLogEnum.BATCH_DELETE_DICT_API)
    @ApiOperationSupport(order = 7)
    @DeleteMapping(value = "/dict/batch/{ids}")
    public Result<String> deleteBatch(@PathVariable("ids") String ids) {
        Result<String> result= dictService.deleteBatch(ids);
        List<Long> list = Arrays.stream(Arrays.stream(Arrays.stream(ids.split(",")).mapToLong(Long::parseLong).toArray()).boxed().toArray(Long[]::new)).collect(Collectors.toList());
            kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,convertDictMsg(list));
        return result;
    }

    @ApiOperation(value = "码表-导出", notes = "根据所选码表ID导出码表记录",tags = "码表管理")
    @AuditLog(AuditLogEnum.EXPORT_DICT_API)
    @ApiOperationSupport(order = 8)
    @PostMapping(value = "/dict/export")
    public void exportExcel(HttpServletResponse response, @RequestBody DictSearchDto search) {
        if (CustomUtil.isEmpty(search)) {
            String description = "码表-导出失败";
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("body", "请求体参数不能为空！"));
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY.getErrorCode(), description, errorList);
        }

        if (CustomUtil.isEmpty(search.getIds()) && CustomUtil.isEmpty(search.getCatalogId())) {
            String description = "码表-导出失败";
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("ids,catalog_id", "参数不能同时为空！"));
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY.getErrorCode(), description, errorList);
        }
        dictService.export(response, search);
    }

    @ApiOperation(value = "码表-模板导出", notes = "模板导出",tags = "码表管理")
    @ApiOperationSupport(order = 9)
    @PostMapping(value = "/dict/export/template")
    public void exportExcel(HttpServletResponse response) {
        dictService.exportTemplate(response);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录Id", required = true, paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-导入", notes = "根据模板导入",tags = "码表管理")
    @ApiOperationSupport(order = 10)
    @PostMapping(value = "/dict/import")
    public Result<List<DictVo>> importExcel(HttpServletResponse response, @RequestPart MultipartFile file, @RequestParam("catalog_id") Long catalogId) {
        CheckVo<String> fileCheckVo = dataelementInfoService.checkFile(file);
        if (fileCheckVo.getCheckErrors().size() > 0) {
            throw new CustomException(ErrorCodeEnum.ExcelImportError, fileCheckVo.getCheckErrors(), Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
        return dictExcelImportService.importExcel(response, catalogId, file);
    }

    @ApiOperation(value = "码表-目录移动",tags = "码表管理")
    @AuditLog(AuditLogEnum.MOVE_CATALOG_DICT_API)
    @ApiOperationSupport(order = 11)
    @PostMapping(value = "/dict/catalog/remove")
    public Result removeCatalog(@Valid @RequestBody CatalogMoveDto catalogMoveDto) {
        dictService.removeCatalog(catalogMoveDto.getIds(), catalogMoveDto.getCatalogId());
        return Result.success();
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "dict_id", value = "码表主键ID", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "搜索关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20")
    })
    @ApiOperation(value = "码表-码值和码值分页查询接口", notes = "码值和码值分页查询接口",tags = "open码表管理")
    @ApiOperationSupport(order = 13)
    @GetMapping(value = "/dict/enum")
    public Result<List<DictEnumVo>> listDictEnums(
            @RequestParam(value = "dict_id", required = false) Long dictId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit
    ) {
        if (null == dictId) {
            String description = "码表-码值和码值查询失败";
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("dict_id", "参数不能为空！"));
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY.getErrorCode(), description, errorList);
        }
        PageVo page = PageUtil.getPage(offset, limit);
        keyword = StringUtil.XssEscape(keyword);
        return dictService.queryDictEnums(dictId, keyword, page.getOffset(), page.getLimit());

    }

    @ApiOperation(value = "码表-码值列表查询接口", notes = "码值列表查询接口",tags = "open码表管理")
    @ApiImplicitParams({
            @ApiImplicitParam(name = "dict_id", value = "码表主键ID", required = true, paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperationSupport(order = 13)
    @GetMapping(value = "/dict/enum/getList")
    public Result<List<DictEnumVo>> getDictEnumList(@RequestParam(value = "dict_id", required = true) Long dictId) {
        if (null == dictId) {
            String description = "码表-码值列表查询失败";
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("dict_id", "参数不能为空！"));
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY.getErrorCode(), description, errorList);
        }

        return dictService.getDictEnumList(dictId);

    }
    @ApiOperation(value = "码表-码值列表查询接口（内部）", notes = "码值列表查询接口",tags = "码表管理")
    @GetMapping(value = "/dict/internal/enum/getList")
    public Result<List<DictEnumVo>> getDictInternalEnumList(@RequestParam(value = "dict_id", required = true) Long dictId) {
        if (null == dictId) {
            String description = "码表-码值列表查询失败";
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("dict_id", "参数不能为空！"));
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY.getErrorCode(), description, errorList);
        }
        return dictService.getDictEnumList(dictId);

    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "码表主键ID", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20")
    })
    @ApiOperation(value = "码表-查询引用码表的标准数据元列表", notes = "查询引用码表的标准数据元列表",tags = "open码表管理")
    @ApiOperationSupport(order = 14)
    @GetMapping(value = "/dict/dataelement/{id}")
    public Result<List<DataElementInfo>> queryUsedDataElement(@PathVariable("id") Long id,
                                                              @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                              @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return dictService.queryUsedDataElementByDictId(id, page.getOffset(), page.getLimit());
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "标准文件目录ID", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准", example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-根据标准文件目录结构查询", notes = "查询",tags = "open码表管理")
    @ApiOperationSupport(order = 15)
    @GetMapping("/dict/queryByStdFileCatalog")
    public Result<List<DictVo>> queryByStdFileCatalog(
            @RequestParam(value = "catalog_id") Long stdFileCatalogId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
            @RequestParam(value = "department_id", required = false) String departmentId) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        keyword = StringUtil.XssEscape(keyword);
        return dictService.queryByStdFileCatalog(stdFileCatalogId,keyword, orgType, statusEnum, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId);
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "file_id", value = "标准文件ID", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-根据标准文件分页查询", notes = "分页查询",tags = "open码表管理")
    @ApiOperationSupport(order = 16)
    @GetMapping("/dict/queryByStdFile")
    public Result<List<DictVo>> queryByStdFile(
            @RequestParam(value = "file_id") Long fileId,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
            @RequestParam(value = "department_id", required = false) String departmentId) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        keyword = StringUtil.XssEscape(keyword);
        return dictService.queryByStdFile(fileId,keyword, orgType, statusEnum, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "码表主键ID", required = true, paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据码表id停用/启用", notes = "",tags = "open码表管理")
    @AuditLog(AuditLogEnum.STATE_DICT_API)
    @ApiOperationSupport(order = 17)
    @PutMapping("/dict/state/{id}")
    public Result updateState(@PathVariable("id") Long id, @RequestBody StateUpdateDto requestBody) {
        if (requestBody.getState().equals(EnableDisableStatusEnum.DISABLE) && CustomUtil.isEmpty(requestBody.getReason())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("disable_reason", "停用必须填写停用原因"));
        }
        if (CustomUtil.isNotEmpty(requestBody.getReason()) && requestBody.getReason().length() > 800) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, CheckErrorUtil.createError("disable_reason", "长度超过800"));
        }
        return dictService.updateState(id, requestBody.getState(), requestBody.getReason());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "ch_name", value = "中文名称", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "en_name", value = "英文名称", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "filter_id", value = "需要过滤的ID，修改校验名称重复时需要携带当前的主键标识", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "码表-查询数据是否存在", notes = "查询数据是否存在",tags = "码表管理")
    @ApiOperationSupport(order = 18)
    @GetMapping("/dict/queryDataExists")
    public Result<Boolean> queryDataExists(@RequestParam(value = "org_type", required = false) Integer orgType,
                                           @RequestParam(value = "ch_name", required = false) String chName,
                                           @RequestParam(value = "en_name", required = false) String enName,
                                           @RequestParam(value = "filter_id", required = false) Long filterId,@RequestParam(value = "departmentIds", required = false) String departmentIds) {
        return dictService.queryDataExists(filterId, orgType, chName, enName,departmentIds);
    }

    @ApiOperation(value = "根据ID查询列表", notes = "",tags = "open码表管理")
    @ApiOperationSupport(order = 19)
    @PostMapping(value = "/dict/queryByIds")
    public Result<List<DictVo>> queryUsedDataElement(@Validated @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return dictService.queryByIds(idArrayDto.getIds());
    }

    @ApiOperation(value = "根据ID查询列表(内部)", notes = "",tags = "码表管理")
    @PostMapping(value = "/dict/internal/queryByIds")
    public Result<List<DictVo>> queryInternalUsedDataElement(@RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return dictService.queryByIds(idArrayDto.getIds());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识id", required = true, paramType = "path", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer")
    })
    @ApiOperation(value = "码表-分页查询码表关联的标准文件", notes = "",tags = "open码表管理")
    @ApiOperationSupport(order = 20)
    @GetMapping(value = "/dict/relation/stdfile/{id}")
    public Result<List<StdFileMgrVo>> queryStdFilesById(@PathVariable("id") Long id,
                                                        @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                        @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return dictService.queryStdFilesById(id, page.getOffset(), page.getLimit());
    }


}
