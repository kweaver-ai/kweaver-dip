package com.dsg.standardization.controller;

import com.dsg.standardization.common.annotation.AuditLog;
import com.dsg.standardization.common.enums.AuditLogEnum;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CheckErrorUtil;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.PageUtil;
import com.dsg.standardization.common.util.StringUtil;
import com.dsg.standardization.dto.CatalogMoveDto;
import com.dsg.standardization.dto.IdArrayDto;
import com.dsg.standardization.dto.StateUpdateDto;
import com.dsg.standardization.dto.StdFileRealtionDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.service.StdFileMgrService;
import com.dsg.standardization.vo.*;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import io.swagger.annotations.ApiImplicitParam;
import io.swagger.annotations.ApiImplicitParams;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import javax.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * 标准文件管理
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
//@Api(tags = "标准文件管理")
@ApiSort(4)
@RestController
@RequestMapping("/v1/std-file")
public class StdFileMgrController {
    @Autowired
    private StdFileMgrService stdFileMgrService;

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录ID，默认全部目录ID为44",example = "44",paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "number", value = "标准编号", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "name", value = "标准文件名称", paramType = "query", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99", required = true),
            @ApiImplicitParam(name = "act_date", value = "实施日期，格式YYYY-MM-DD", paramType = "query", dataType = "java.lang.String",example = "2025-04-09" ),
            @ApiImplicitParam(name = "publish_date", value = "发布日期，格式YYYY-MM-DD", paramType = "query", dataType = "java.lang.String",example = "2025-04-09" ),
            @ApiImplicitParam(name = "description", value = "说明,最大长度300", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "attachment_type", value = "标准文件附件类型：URL-外置连接，FILE-文件附件,可用值:FILE,URL",example = "FILE",paramType = "query", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "attachment_url", value = "链接地址，attachment_type值为URL时该字段必填", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "state", value = "启用enable、停用disable", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "department_ids", value = "部门ID", paramType = "query", dataType = "java.lang.String",example = "a/ab"),
    })
    @ApiOperation(value = "新增标准文件管理",  notes = "上传标准文件，支持文件附件或外置链接", consumes = "multipart/form-data",tags = "open标准文件管理")
    @ApiOperationSupport(order = 1)
    @AuditLog(AuditLogEnum.STD_CREATE_FILE_API)
    @PostMapping()
    public Result<StdFileMgrVo> add(@ApiParam(value = "上传的文件（attachment_type为FILE时必填）,最大文件30M,文件后缀支持doc、pdf、docx、txt、ppt、pptx、xls、xlsx", required = false)@RequestPart(name = "file", required = false) MultipartFile file,
                                    @RequestParam(value = "number", required = false) String number,
                                    @RequestParam("name") String name,
                                    @RequestParam(name="catalog_id",defaultValue="44", required = false) Long catalog_id,
                                    @RequestParam("org_type") Integer org_type,
                                    @RequestParam(name = "act_date", required = false) String act_date,
                                    @RequestParam(name = "publish_date", required = false) String publish_date,
                                    @RequestParam(name = "description", required = false) String description,
                                    @RequestParam("attachment_type") String attachment_type,
                                    @RequestParam(name = "attachment_url", required = false) String attachment_url,
                                    @RequestParam(value = "state", required = false) String state, @RequestParam(value = "department_ids", required = false)  String departmentIds) {
        number = CustomUtil.isEmpty(number) ? null : number;
        return stdFileMgrService.create(number, StringUtil.XssEscape(name), catalog_id, org_type, act_date, description, attachment_type, attachment_url,state,publish_date,departmentIds, file);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "主键ID", paramType = "path", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "catalog_id", value = "目录ID", paramType = "query", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "number", value = "标准编号", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "name", value = "标准文件名称", paramType = "query", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99", required = true),
            @ApiImplicitParam(name = "act_date", value = "实施日期", paramType = "query", dataType = "java.lang.String",example = "2025-04-09"),
            @ApiImplicitParam(name = "publish_date", value = "发布日期，格式YYYY-MM-DD", paramType = "query", dataType = "java.lang.String",example = "2025-04-09" ),
            @ApiImplicitParam(name = "description", value = "说明,最大长度300", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "attachment_type", value = "标准文件附件类型：URL-外置连接，FILE-文件附件,可用值:FILE,URL",example = "FILE", paramType = "query", dataType = "java.lang.String", required = true),
            @ApiImplicitParam(name = "attachment_url", value = "链接地址，attachment_type值为URL时该字段必填", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "state", value = "启用enable、停用disable", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "department_ids", value = "部门ID", paramType = "query", dataType = "java.lang.String",example = "a/ab")
    })
    @ApiOperation(value = "根据ID修改标准文件",  notes = "上传标准文件，支持文件附件或外置链接", consumes = "multipart/form-data",tags = "open标准文件管理")
    @ApiOperationSupport(order = 2)
    @AuditLog(AuditLogEnum.STD_UPDATE_FILE_API)
    @PutMapping("/{id}")
    public Result<StdFileMgrVo> update(@PathVariable("id") Long id,
                         @ApiParam(value = "上传的文件（attachment_type为FILE时必填）,最大文件30M,文件后缀支持doc、pdf、docx、txt、ppt、pptx、xls、xlsx", required = false) @RequestPart(name = "file", required = false) MultipartFile file,
                         @RequestParam(value = "number", required = false) String number,
                         @RequestParam("name") String name,
                         @RequestParam("catalog_id") Long catalog_id,
                         @RequestParam("org_type") int org_type,
                         @RequestParam(name = "act_date", required = false) String act_date,
                         @RequestParam(name = "publish_date", required = false) String publish_date,
                         @RequestParam(name = "description", required = false) String description,
                         @RequestParam("attachment_type") String attachment_type,
                         @RequestParam(name = "attachment_url", required = false) String attachment_url,
                                       @RequestParam(value = "state", required = false) String state,@RequestParam(value = "department_ids", required = false)  String departmentIds) {

        number = CustomUtil.isEmpty(number) ? null : number;
        return stdFileMgrService.update(id, number, StringUtil.XssEscape(name), catalog_id, org_type, act_date, description, attachment_type, attachment_url,state,publish_date,departmentIds, file);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "catalog_id", value = "目录ID", required = false, paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "keyword", value = "查询关键字", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "state", value = "启用停用", paramType = "query", dataType = "java.lang.String", allowableValues = "enable,disable"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20"),
            @ApiImplicitParam(name = "sort", value = "排序字段", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "direction", value = "排序方向", paramType = "query", dataType = "java.lang.String", allowableValues = "asc,desc"),
            @ApiImplicitParam(name = "department_id", value = "部门id", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "分页列表查询", notes = "分页列表查询",tags = "open标准文件管理")
    @ApiOperationSupport(order = 3)
    @GetMapping()
    public Result<List<StdFileMgrVo>> list(@RequestParam(value = "catalog_id",required = false) Long catalogId,
                                           @RequestParam(value = "keyword", required = false) String keyword,
                                           @RequestParam(value = "org_type", required = false) Integer orgType,
                                           @RequestParam(value = "state", required = false) String state,
                                           @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                           @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
                                           @RequestParam(value = "sort", required = false, defaultValue = "update_time") String sort,
                                           @RequestParam(value = "direction", required = false, defaultValue = "desc") String direction,
                                           @RequestParam(value = "department_id", required = false) String departmentId) {
        PageVo page = PageUtil.getPage(offset, limit);
        EnableDisableStatusEnum statusEnum = CustomUtil.isEmpty(state) ? null : EnableDisableStatusEnum.getByMessage(state);
        return stdFileMgrService.queryList(catalogId,  StringUtil.XssEscape(keyword), orgType, statusEnum, page.getOffset(), page.getLimit(), sort, direction,departmentId);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "文件唯一标识id", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据ID查询详情", notes = "详情查询",tags = "open标准文件管理")
    @ApiOperationSupport(order = 4)
    @GetMapping("/{id}")
    public Result<StdFileMgrVo> info(@PathVariable("id") Long id) {
        StdFileMgrVo rlt = stdFileMgrService.queryById(id);
        return Result.success(rlt);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "ids", value = "唯一标识，多个逗号分隔", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "标准文件管理-批量删除", notes = "批量删除",tags = "标准文件管理")
    @ApiOperationSupport(order = 5)
    @AuditLog(AuditLogEnum.BATCH_STD_DELETE_FILE_API)
    @DeleteMapping("/delete/{ids}")
    public Result<?> delete(@PathVariable("ids") String ids) {
        return stdFileMgrService.batchDelete(ids);
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "ids", value = "唯一标识，多个逗号分隔", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "标准文件管理-批量删除（内部）", notes = "批量删除（内部调用）",tags = "标准文件管理")
    @ApiOperationSupport(order = 5)
    @AuditLog(AuditLogEnum.BATCH_STD_DELETE_FILE_API)
    @DeleteMapping("/internal/delete/{ids}")
    public Result<?> internalDelete(@PathVariable("ids") String ids) {
        return stdFileMgrService.batchInternalDelete(ids);
    }


    @ApiOperation(value = "根据id集合查询列表", notes = "查询",tags = "open标准文件管理")
    @ApiOperationSupport(order = 6)
    @PostMapping("/queryByIds")
    public Result<List<StdFileMgrVo>> queryByIds(@Validated @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return stdFileMgrService.queryByIds(idArrayDto.getIds());
    }
    @ApiOperation(value = "根据id集合查询列表(内部接口)", notes = "查询",tags = "标准文件管理")
    @ApiOperationSupport(order = 6)
    @PostMapping("/internal/queryByIds")
    public Result<List<StdFileMgrVo>> queryInternalByIds(@Validated @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        return stdFileMgrService.queryByIds(idArrayDto.getIds());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "文件id", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据文件ID启用/停用", notes = "查询",tags = "open标准文件管理")
    @ApiOperationSupport(order = 7)
    @AuditLog(AuditLogEnum.STATE_STD_FILE_API)
    @PutMapping("/state/{id}")
    public Result<?> updateState(@PathVariable("id") Long id, @RequestBody StateUpdateDto requestBody) {
        if (requestBody.getState().equals(EnableDisableStatusEnum.DISABLE)) {
            if (CustomUtil.isEmpty(requestBody.getReason())) {
                throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("disable_reason", "停用必须填写停用原因"));
            }
            if (CustomUtil.isNotEmpty(requestBody.getReason()) && requestBody.getReason().length() > 800) {
                throw new CustomException(ErrorCodeEnum.InvalidParameter, CheckErrorUtil.createError("disable_reason", "长度超过800"));
            }
        }
        return stdFileMgrService.updateState(id, requestBody.getState(), requestBody.getReason());
    }


    @ApiOperation(value = "移动到指定目录-目录移动",tags = "标准文件管理")
    @ApiOperationSupport(order = 8)
    @AuditLog(AuditLogEnum.MOVE_STD_CATALOG_FILE_API)
    @PostMapping(value = "/catalog/remove")
    public Result<Integer> removeCatalog(@Valid @RequestBody CatalogMoveDto catalogMoveDto) {
        return stdFileMgrService.removeCatalog(catalogMoveDto.getIds(), catalogMoveDto.getCatalogId());
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据文件ID下载标准文件附件",tags = "open标准文件管理")
    @ApiOperationSupport(order = 9)
    @AuditLog(AuditLogEnum.STD_DOWN_FILE_API)
    @GetMapping(value = "/download/{id}")
    public void download(HttpServletResponse response, @PathVariable("id") Long id) {
        stdFileMgrService.download(response, id);
    }


    @ApiOperation(value = "标准文件附件下载（批量）",tags = "标准文件管理")
    @ApiOperationSupport(order = 10)
    @AuditLog(AuditLogEnum.STD_BATCH_DOWN_FILE_API)
    @PostMapping(value = "/downloadBatch")
    public void downloadBatch(HttpServletResponse response,@Validated  @RequestBody IdArrayDto idArrayDto) {
        if (idArrayDto == null || CustomUtil.isEmpty(idArrayDto.getIds())) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_EMPTY, CheckErrorUtil.createError("ids", "ids 不能为空"));
        }
        stdFileMgrService.downloadBatch(response, idArrayDto.getIds());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20")
    })
    @ApiOperation(value = "查询关联数据元", notes = "查询关联数据元",tags = "open标准文件管理")
    @ApiOperationSupport(order = 11)
    @GetMapping("/relation/de/{id}")
    public Result<List<DataElementInfo>> queryRelationDataElements(@PathVariable("id") Long id,
                                                                   @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                                   @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return stdFileMgrService.queryRelationDataElements(id, page.getOffset(), page.getLimit());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20")
    })
    @ApiOperation(value = "查询关联的码表", notes = "查询关联的码表",tags = "open标准文件管理")
    @ApiOperationSupport(order = 12)
    @GetMapping("/relation/dict/{id}")
    public Result<List<DictVo>> queryRelationDicts(@PathVariable("id") Long id,
                                                   @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                   @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return stdFileMgrService.queryRelationDicts(id, page.getOffset(), page.getLimit());
    }

    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "编码规则唯一Id", required = true, paramType = "path", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "offset", value = "分页页码，默认1", paramType = "query", dataType = "java.lang.Integer", defaultValue = "1"),
            @ApiImplicitParam(name = "limit", value = "条数，默认20", paramType = "query", dataType = "java.lang.Integer", defaultValue = "20")
    })
    @ApiOperation(value = "查询关联编码规则", notes = "查询关联编码规则",tags = "open标准文件管理")
    @ApiOperationSupport(order = 13)
    @GetMapping("/relation/rule/{id}")
    public Result<List<RuleVo>> queryRelationRules(@PathVariable("id") Long id,
                                                   @RequestParam(value = "offset", required = false, defaultValue = "1") Integer offset,
                                                   @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
        PageVo page = PageUtil.getPage(offset, limit);
        return stdFileMgrService.queryRelationRules(id, page.getOffset(), page.getLimit());
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "根据标准文件ID添加与数据元&码表&编码规则的关联", notes = "添加标准文件和数据元&码表&编码规则的关联",tags = "open标准文件管理")
    @ApiOperationSupport(order = 14)
    @AuditLog(AuditLogEnum.STD_DICT_RULE_RELATION_FILE_API)
    @PutMapping("/relation/{id}")
    public Result<?> addRelation(@PathVariable("id") Long id, @RequestBody StdFileRealtionDto realtionDto) {
        return stdFileMgrService.addRelation(id, realtionDto);
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "id", value = "唯一标识", required = true, paramType = "path", dataType = "java.lang.String")
    })
    @ApiOperation(value = "标准文件关联关系查询", notes = "标准文件关联关系查询",tags = "open标准文件管理")
    @ApiOperationSupport(order = 15)
    @GetMapping("/relation/{id}")
    public Result<Map<String, Object>> queryRelations(@PathVariable("id") Long id) {
        return stdFileMgrService.queryRelations(id);
    }


    @ApiImplicitParams({
            @ApiImplicitParam(name = "number", value = "标准编号", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "name", value = "标准文件名称", paramType = "query", dataType = "java.lang.String"),
            @ApiImplicitParam(name = "org_type", value = "标准分类,0-团体标准 1-企业标准 2-行业标准 3-地方标准 4-国家标准 5-国际标准 6-国外标准 99-其他标准",example = "0",paramType = "query", dataType = "java.lang.Integer", allowableValues = "0,1,2,3,4,5,6,99"),
            @ApiImplicitParam(name = "filter_id", value = "需要过滤的ID，修改校验名称重复时需要携带当前的主键标识", paramType = "query", dataType = "java.lang.String")
    })
    @ApiOperation(value = "查询数据是否存在", notes = "查询数据是否存在",tags = "标准文件管理")
    @ApiOperationSupport(order = 16)
    @GetMapping("/queryDataExists")
    public Result<Boolean> queryDataExists(@RequestParam(value = "number", required = false) String number,
                                           @RequestParam(value = "org_type", required = false) Integer orgType,
                                           @RequestParam(value = "name", required = false) String name,
                                           @RequestParam(value = "filter_id", required = false) Long filterId,@RequestParam(value = "department_ids", required = false) String departmentIds) {
        return stdFileMgrService.queryDataExists(filterId, number, orgType, name,departmentIds);
    }

}
