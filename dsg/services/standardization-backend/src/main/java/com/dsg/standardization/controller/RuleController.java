package com.dsg.standardization.controller;

import cn.hutool.core.collection.CollectionUtil;
import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.constant.MqTopic;
import com.dsg.standardization.common.constant.RuleConstants;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.RuleTypeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.producer.KafkaProducerService;
import com.dsg.standardization.common.util.CheckErrorUtil;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.PageUtil;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.RuleService;
import com.dsg.standardization.vo.PageVo;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.RuleVo;
import com.dsg.standardization.vo.StdFileMgrVo;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import kong.unirest.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


/**
 * 编码规则管理
 * @author xxx.cn
 * @email jie.xu@xxx.cn
 * @date 2022-11-30 15:50:03
 */
//@Api(tags = "编码规则管理")
@ApiSort(3)
@RestController
@RequestMapping("/v1/rule")
public class RuleController {
    @Autowired
    private RuleService ruleService;
    @Autowired
    private KafkaProducerService kafkaProducerService;
    @Autowired
    private IDataElementInfoService dataelementInfoService;
    @ApiOperation(value = "新增编码规则", notes = "新增",tags = "open编码规则管理")
    @AuditLog(AuditLogEnum.CREATE_RULE_API)
    @ApiOperationSupport(order = 1)
    @PostMapping()
    public Result<RuleVo> create(@Validated @RequestBody RuleDto insertDto) {

        return ruleService.create(insertDto);
    }

    @ApiOperation(value = "根据ID修改编码规则", notes = "修改",tags = "open编码规则管理")
    @AuditLog(AuditLogEnum.UPDATE_RULE_API)
    @ApiOperationSupport(order = 2)
    @PutMapping("/{id}")
    public Result<RuleVo> update(@PathVariable("id") Long id, @Validated @RequestBody RuleDto updateDto) {
        Result<RuleVo> result= ruleService.update(id, updateDto);
        String msg = convertDictMsg(id);
        if(StringUtils.isNotEmpty(msg)){
            kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,msg);
        }
        return result;
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "编码规则-详情查看", notes = "详情查看",tags = "open编码规则管理")
    @ApiOperationSupport(order = 3)
    @GetMapping("/{id}")
    public Result<RuleVo> info(@PathVariable("id") Long id) {
        RuleVo rlt = ruleService.queryById(id);
        return Result.success(rlt);
    }
    @ApiOperation(value = "编码规则-根据ID查看详情（内部）", notes = "详情查看",tags = "编码规则管理")
    @GetMapping("/internal/getId/{id}")
    public Result<RuleVo> getId(@PathVariable("id") Long id) {
        RuleVo rlt = ruleService.queryById(id);
        return Result.success(rlt);
    }

    /**
     * 根据标准id获取编码规则详情
     * @param dataId 数据元id
     * @return
     */
    @ApiOperation(value = "编码规则-根据数据元ID查看详情（内部）",tags = "编码规则管理")
    @GetMapping("/internal/getDetailByDataId/{dataId}")
    public Result<RuleVo> getDetailByDataId(@PathVariable("dataId") Long dataId) {
        RuleVo rlt = ruleService.getDetailByDataId(dataId);
        return Result.success(rlt);
    }

    /**
     * 根据标准code获取编码规则详情
     * @param dataCode 数据元code
     * @return
     */
    @ApiOperation(value = "编码规则-根据数据元编码查看详情（内部）",tags = "编码规则管理")
    @GetMapping("/internal/getDetailByDataCode/{dataCode}")
    public Result<RuleVo> getDetailByDataCode(@PathVariable("dataCode") Long dataCode) {
        RuleVo rlt = ruleService.getDetailByDataCode(dataCode);
        return Result.success(rlt);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录ID", required = false, paramType = "query", dataType = "java.lang.String",example = "1"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "rule_type", value = "编码规则类型，REGEX正则、CUSTOM自定义", paramType = "query", dataType = "java.lang.String", allowableValues = "REGEX,CUSTOM"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "编码规则-列表查询", notes = "列表查询",tags = "open编码规则管理")
    @ApiOperationSupport(order = 4)
    @GetMapping()
    public Result<List<RuleVo>> list(@RequestParam(value = "catalog_id", required = false) Long catalogId,
                                     @RequestParam(value = "keyword", required = false) String keyword,
                                     @RequestParam(value = "org_type", required = false) Integer orgType,
                                     @RequestParam(value = "state", required = false) String state,
                                     @RequestParam(value = "rule_type", required = false) String ruleType,
                                     @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                     @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
                                     @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
                                     @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
                                     @RequestParam(value = "department_id", required = false) String departmentId
    ) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        RuleTypeEnum ruleTypeEnum =  CustomUtil.isEmpty(ruleType) ? null : RuleTypeEnum.getByMessage(ruleType);
        keyword = StringUtil.XssEscape(keyword);
        return ruleService.queryList(catalogId, keyword, orgType, statusEnum, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId,ruleTypeEnum);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "ids", value = "唯一标识，多个逗号分隔", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "编码规则-删除&批量删除", notes = "删除",tags = "编码规则管理")
    @AuditLog(AuditLogEnum.BATCH_DELETE_RULE_API)
    @ApiOperationSupport(order = 5)
    @DeleteMapping("/{ids}")
    public Result<?> deleteBatch(@PathVariable("ids") String ids) {
        Result result= ruleService.deleteBatch(ids);
        List<Long> list = Arrays.stream(Arrays.stream(Arrays.stream(ids.split(",")).mapToLong(Long::parseLong).toArray()).boxed().toArray(Long[]::new)).collect(Collectors.toList());
        String msg = convertDictMsg(list);
        if(StringUtils.isNotEmpty(msg)){
            kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,msg);
        }
        return result;
    }


    @ApiOperation(value = "根据编码规则id停用/启用", notes = "停用/启用",tags = "open编码规则管理")
    @AuditLog(AuditLogEnum.STATE_RULE_API)
    @ApiOperationSupport(order = 6)
    @PutMapping("/state/{id}")
    public Result<?> updateState(@PathVariable("id") Long id, @RequestBody StateUpdateDto requestBody) {
        if (requestBody.getState().equals(EnableDisableStatusEnum.DISABLE) && CustomUtil.isEmpty(requestBody.getReason())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("disable_reason", "停用必须填写停用原因"));
        }
        if (CustomUtil.isNotEmpty(requestBody.getReason()) && requestBody.getReason().length() > 800) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, CheckErrorUtil.createError("disable_reason", "长度超过800"));
        }
        return ruleService.updateState(id, requestBody.getState(), requestBody.getReason());
    }

    @ApiOperation(value = "编码规则-移动到指定目录", notes = "编码规则-目录移动",tags = "编码规则管理")
    @AuditLog(AuditLogEnum.MOVE_CATALOG_RULE_API)
    @ApiOperationSupport(order = 7)
    @PostMapping("/catalog/remove")
    public Result<?> removeCatalog(@Validated @RequestBody CatalogMoveDto catalogMoveDto) {
        Result result = ruleService.removeCatalog(catalogMoveDto.getIds(), catalogMoveDto.getCatalogId());
        String msg = convertDictMsg(catalogMoveDto.getIds());
        if(StringUtils.isNotEmpty(msg)){
            kafkaProducerService.sendMessage(MqTopic.MQ_MESSAGE_DICT_CODE,msg);
        }
        return result;
    }

    private String convertDictMsg(Long id){
        List<Long> list = new ArrayList<>();
        list.add(id);
        return this.convertDictMsg(list);
    }

    private String convertDictMsg(List<Long> ids) {
        List<Long> lists = dataelementInfoService.queryRuleIdByDataCodes(ids);
        if(CollectionUtil.isEmpty(lists)){
            return null;
        }
        DictMqDto dto = new DictMqDto();
        dto.setDictRuleIds(ids);
        dto.setDataCodes(lists);
        dto.setType(2);
        return JSONObject.valueToString(dto);
    }


    @ApiOperation(value = "编码规则-分页查询引用编码规则的标准数据元列表", notes = "编码规则-分页查询引用编码规则的标准数据元列表",tags = "编码规则管理")
    @ApiOperationSupport(order = 8)
    @GetMapping("/relation/de/{id}")
    public Result<List<DataElementInfo>> queryUsedDataElement(@PathVariable("id") Long id,
                                                              @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                              @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return ruleService.queryUsedDataElementByRuleId(id, page.getOffset(), page.getLimit());
    }

    @ApiOperation(value = "根据id列表查询", notes = "查询",tags = "open编码规则管理")
    @ApiOperationSupport(order = 9)
    @PostMapping("/queryByIds")
    public Result<List<RuleVo>> queryByIds(@Validated @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return ruleService.queryByIds(idArrayDto.getIds());
    }

    @ApiOperation(value = "根据id列表查询（内部接口）", notes = "查询",tags = "编码规则管理")
    @ApiOperationSupport(order = 9)
    @PostMapping("/internal/queryByIds")
    public Result<List<RuleVo>> queryInternalByIds(@Validated @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return ruleService.queryByIds(idArrayDto.getIds());
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "标准文件所属目录Id", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "rule_type", value = "编码规则类型，REGEX正则、CUSTOM自定义", paramType = "query", dataType = "java.lang.String", allowableValues = "REGEX,CUSTOM"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer",defaultValue="1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer",defaultValue="20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc")
    })
    @ApiOperation(value = "编码规则-根据标准文件目录结构分页查询", notes = "分页查询",tags = "open编码规则管理")
    @ApiOperationSupport(order = 10)
    @GetMapping("/queryByStdFileCatalog")
    public Result<List<RuleVo>> queryByStdFileCatalog(
            @RequestParam(value = "catalog_id") Long stdFileCatalogId,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "rule_type", required = false) String ruleType,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        RuleTypeEnum ruleTypeEnum =  CustomUtil.isEmpty(ruleType) ? null : RuleTypeEnum.getByMessage(ruleType);
        keyword = StringUtil.XssEscape(keyword);
        return ruleService.queryByStdFileCatalog(stdFileCatalogId, keyword, orgType, statusEnum, pageVo.getOffset(), pageVo.getLimit(), sort, direction,ruleTypeEnum);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "file_id", value = "标准文件Id", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "rule_type", value = "编码规则类型，REGEX正则、CUSTOM自定义", paramType = "query", dataType = "java.lang.String", allowableValues = "REGEX,CUSTOM"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer",defaultValue="1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer",defaultValue="20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "编码规则-根据标准文件分页查询", notes = "分页查询",tags = "open编码规则管理")
    @ApiOperationSupport(order = 11)
    @GetMapping("/queryByStdFile")
    public Result<List<RuleVo>> queryByStdFile(
            @RequestParam(value = "file_id") Long stdFileId,
            @RequestParam(value = "org_type", required = false) Integer orgType,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "rule_type", required = false) String ruleType,
            @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "sort", required = false, defaultValue = "create_time") String sort,
            @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
            @RequestParam(value = "department_id", required = false) String departmentId) {
        PageVo pageVo = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        RuleTypeEnum ruleTypeEnum =  CustomUtil.isEmpty(ruleType) ? null : RuleTypeEnum.getByMessage(ruleType);
        keyword = StringUtil.XssEscape(keyword);
        return ruleService.queryByStdFile(stdFileId,keyword, orgType, statusEnum, pageVo.getOffset(), pageVo.getLimit(), sort, direction,departmentId,ruleTypeEnum);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "name", value = "编码规则名称", required = true, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "filter_id", value = "需要过滤的ID，修改校验名称重复时需要携带当前的主键标识", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "编码规则-查询数据是否存在", notes = "查询数据是否存在",tags = "编码规则管理")
    @ApiOperationSupport(order = 12)
    @GetMapping("/queryDataExists")
    public Result<Boolean> queryDataExists(@RequestParam(value = "name") String name,
                                           @RequestParam(value = "filter_id", required = false) Long filterId,@RequestParam(value = "department_ids", required = false) String departmentIds) {
        return ruleService.queryDataExists(filterId, StringUtil.XssEscape(name),departmentIds);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识id", required = true, paramType = "path", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer",defaultValue="1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer",defaultValue="20")
    })
    @ApiOperation(value = "编码规则-根据文件ID分页查询编码规则关联的标准文件", notes = "",tags = "open编码规则管理")
    @ApiOperationSupport(order = 13)
    @GetMapping(value = "/relation/stdfile/{id}")
    public Result<List<StdFileMgrVo>> queryStdFilesById(@PathVariable("id") Long id,
                                                        @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                        @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return ruleService.queryStdFilesById(id, page.getOffset(), page.getLimit());
    }


    @ApiOperation(value = "编码规则-获取自定义规则日期格式化字符串", notes = "",tags = "编码规则管理")
    @ApiOperationSupport(order = 14)
    @GetMapping(value = "/getCustomDateFormat")
    public Result<Set<String>> getCustomDateFormat() {
        return Result.success(RuleConstants.CUSTOM_DATE_FORMAT);
    }

}
