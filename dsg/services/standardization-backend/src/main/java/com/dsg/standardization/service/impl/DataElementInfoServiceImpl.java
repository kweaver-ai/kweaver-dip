package com.dsg.standardization.service.impl;

import cn.afterturn.easypoi.excel.entity.result.ExcelImportResult;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.toolkit.SimpleQuery;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.FileConstants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.*;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.entity.*;
import com.dsg.standardization.service.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.vo.DataElementVo.*;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.configuration.ExcelImportConfigruation;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.dto.CountGroupByFileDto;
import com.dsg.standardization.dto.DataMqDto;
import com.dsg.standardization.dto.LabelDetailDto;
import com.dsg.standardization.mapper.DataElementInfoMapper;
import com.dsg.standardization.mapper.DictMapper;
import com.dsg.standardization.mapper.RelationDeFileMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.yulichang.query.MPJQueryWrapper;
import com.github.yulichang.wrapper.MPJLambdaWrapper;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.*;
import java.util.stream.Collectors;

/**
 * <p>
 * 数据元基本信息表 服务实现类
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
@Service
@Slf4j
public class DataElementInfoServiceImpl extends CustomImplService<DataElementInfoMapper, DataElementInfo, DataElementExcelVo> implements IDataElementInfoService {
    //public class DataelementInfoServiceImpl extends ServiceImpl<DataElementInfoMapper, DataElementInfo> implements IDataelementInfoService {

    @Value("${configuration.center:http://configuration-center:8133}")
    String labelInfoById_url;

    @Autowired(required = false)
    DataElementInfoMapper dataElementInfoMapper;

    @Autowired(required = false)
    RelationDeFileMapper relationDeFileMapper;

    @Autowired(required = false)
    DictMapper dictMapper;

    @Autowired
    private IDeCatalogInfoService tDeCatalogInfoService;

    @Autowired
    @Lazy
    RuleService ruleService;

    @Autowired
    ExcelImportConfigruation excelImportConfigruation;

    @Autowired
    IDataElementHistoryService iDataElementHistoryService;

    @Autowired
    IRelationDeFileService irelationDeFileService;

    @Lazy
    @Autowired
    IDictService iDictService;

    @Lazy
    @Autowired
    StdFileMgrService stdFileMgrService;


    private static final String[] ORDER_TABLE_FIELDS = new String[]{"f_create_time", "f_update_time", "f_state", "f_org_type", "f_de_id"};

    /**
     * 无分页检索
     *
     * @param catalogId
     * @param keyword
     * @param stdType
     * @return
     */
    @Override
    public List<DataElementInfo> getNoPageList(Long catalogId, String state, String keyword, Integer stdType) {
        return dataElementInfoMapper.selectList(GetByConditions(catalogId, state, keyword, stdType,null));
    }

    /**
     * 分页检索数据元
     *
     * @param catalogId
     * @param keyword
     * @param stdType
     * @param offset
     * @param limit
     * @param sort
     * @param direction
     * @return
     */
    @Override
    public IPage<DataElementInfo> getPageList(Long catalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction,String departmentId) {
        //传入检索条件
        MPJLambdaWrapper<DataElementInfo> queryWrapper = GetByConditions(catalogId, state, keyword, stdType,departmentId);
        //创建分页实体
        Page<DataElementInfo> page = new Page<>(offset, limit);
        sort = "create_time".equalsIgnoreCase(sort) ? "de_id" : sort;
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        return page(page, queryWrapper);
    }

    /**
     * 分页检索前端Vo
     *
     * @param catalogId
     * @param keyword
     * @param stdType
     * @param offset
     * @param limit
     * @param sort
     * @param direction
     * @return
     */
    @Override
    public IPage<DataElementListVo> getPageListVo(Long catalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction) {
        //传入检索条件
        MPJLambdaWrapper<DataElementInfo> queryWrapper = GetVoByConditions(catalogId, state, keyword, stdType);
        //创建分页实体
        Page<DataElementListVo> page = new Page<>(offset, limit);
        sort = "create_time".equalsIgnoreCase(sort) ? "de_id" : sort;
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        return dataElementInfoMapper.selectJoinPage(page, DataElementListVo.class, queryWrapper);
    }


    private List<OrderItem> getOrderItemBySingleColumn(String columnName, Boolean asc) {
        List<OrderItem> orderItemList = new ArrayList<>();
        OrderItem orderIDItem = new OrderItem();
        orderIDItem.setAsc(asc);
        orderIDItem.setColumn(columnName);
        orderItemList.add(orderIDItem);
        return orderItemList;
    }

    @Override
    public DataElementInfo getOneByIdOrCode(Integer type, Long value) {
        return getOne(getByIdOrCode(type, value), false);
    }


    private QueryWrapper<DataElementInfo> getByIdOrCode(Integer type, Long value) {
        QueryWrapper<DataElementInfo> queryWrapper = new QueryWrapper<>();
        if (CustomUtil.isNotEmpty(type) && type == 1) {
            queryWrapper.eq("f_de_id", value);
        } else {
            queryWrapper.eq("f_de_code", value);
        }
        return queryWrapper;
    }

    /**
     * 数据元列表Vo检索条件
     *
     * @param catalogId
     * @param keyword
     * @param stdType
     * @return
     */
    private MPJLambdaWrapper<DataElementInfo> GetVoByConditions(Long catalogId, String state, String keyword, Integer stdType) {
        //条件构造器
        MPJLambdaWrapper<DataElementInfo> queryWrapper = new MPJLambdaWrapper<>();
        //目录检索逻辑开始

        //填充目录及其子集ID列表
        List<Long> ids = tDeCatalogInfoService.getIDList(catalogId);
        if (ids.isEmpty()) {
            //目录不存在则返回f_catalog_id=-1时的查询结果（空集）
//            queryWrapper.eq("f_catalog_id", -1);
            queryWrapper.eq(DataElementInfo::getCatalogId, -1);
        } else {
            //逻辑删除过滤
            queryWrapper.eq(DataElementInfo::getDeleted, 0);
            //根据自身及子集查找
//            queryWrapper.in("f_catalog_id", ids);
            queryWrapper.in(DataElementInfo::getCatalogId, ids);
            //启停状态检索逻辑
            queryWrapper.eq("enable".equals(state), DataElementInfo::getState, EnableDisableStatusEnum.ENABLE);
            //keyword检索逻辑
            addKeyWordCondition(queryWrapper, keyword);
            //标准类型检索逻辑
//            queryWrapper.eq(stdType != null, "f_std_type", stdType);
            queryWrapper.eq(stdType != null, DataElementInfo::getStdType, stdType);
            //标准状态检索逻辑
//            queryWrapper.eq(status != null, "f_status", status);
//            queryWrapper.eq(status != null, DataElementInfo::getStatus, status);
            //join拼装码表
            //Todo去掉getStatus
            queryWrapper.selectAll(DataElementInfo.class);
            queryWrapper.select(DictEntity::getChName);
            queryWrapper.leftJoin(DictEntity.class, on -> on
                    .eq(DictEntity::getCode, DataElementInfo::getDictCode)
            );
            //join拼装编码规则
            queryWrapper.select(RuleEntity::getName);
            queryWrapper.selectAs(RuleEntity::getName, DataElementListVo::getRuleName);
            queryWrapper.leftJoin(RuleEntity.class, on -> on
                    .eq(RuleEntity::getId, DataElementInfo::getRuleId)
            );
        }
        return queryWrapper;
    }

    /**
     * keyword检索逻辑
     *
     * @param queryWrapper
     * @param keyword
     */
    private void addKeyWordCondition(MPJLambdaWrapper<DataElementInfo> queryWrapper, String keyword) {
        if (!StringUtils.isBlank(keyword)) {
            //检索关键字规范化
            keyword = StringUtils.trim(keyword);
            keyword = StringUtils.substring(keyword, 0, 64);
            TreeSet<String> keywords = StringUtil.splitTrimByRegex(keyword, "\\s+");
            if (CustomUtil.isNotEmpty(keywords)) {
                keywords.forEach(word -> {
                    word = StringUtils.trim(word);
                    if (!StringUtils.isBlank(word)) {
                        word = "%" + word.toLowerCase() + "%";
                        queryWrapper.apply("(lower(f_name_en) like {0} or lower(t.f_name_cn) like {1} or lower(t.f_synonym) like {2})", word, word, word);
//                        queryWrapper.and(i -> i.like(DataElementInfo::getNameEn, finalWord).or().like(DataElementInfo::getNameCn, finalWord).or().like(DataElementInfo::getSynonym, finalWord));
                    }
                });
            }
        }
    }

    /**
     * 数据元检索条件
     *
     * @param catalogId
     * @param keyword
     * @param stdType
     * @return
     */
    private MPJLambdaWrapper<DataElementInfo> GetByConditions(Long catalogId, String state, String keyword, Integer stdType,String departmentId) {
        //条件构造器
        MPJLambdaWrapper<DataElementInfo> queryWrapper = new MPJLambdaWrapper<>();
        if (StringUtils.isNotBlank(departmentId) && String.valueOf(DefaultCatalogEnum.DataElement.getCode()).equals(departmentId)) {
            catalogId = Long.valueOf(DefaultCatalogEnum.DataElement.getCode());
            departmentId = null;
        }
        //填充目录及其子集ID列表
        List<Long> ids = tDeCatalogInfoService.getIDList(catalogId);
        if (ids.isEmpty() && StringUtils.isBlank(departmentId)) {
            //目录不存在则返回f_catalog_id=-1时的查询结果为空集
            queryWrapper.eq(DataElementInfo::getCatalogId, -1);
        } else {
            //逻辑删除过滤
            queryWrapper.eq(DataElementInfo::getDeleted, 0);
            if(StringUtils.isBlank(departmentId)){
                //根据自身及子集查找,为根目录时不参与过滤
                queryWrapper.in(tDeCatalogInfoService.getById(catalogId).getLevel().intValue() != 1, DataElementInfo::getCatalogId, ids);
            }
            addConditions(state, keyword, stdType, queryWrapper);
        }
        if (StringUtils.isNotEmpty(departmentId)){
            queryWrapper.like(DataElementInfo::getDepartmentIds,departmentId);
        }

        return queryWrapper;
    }

    private void addConditions(String state, String keyword, Integer stdType, MPJLambdaWrapper<DataElementInfo> queryWrapper) {
        //启停状态检索逻辑
        queryWrapper.eq("enable".equals(state), DataElementInfo::getState, EnableDisableStatusEnum.ENABLE);
        //keyword检索逻辑
        addKeyWordCondition(queryWrapper, keyword);
        //标准类型检索逻辑
        queryWrapper.eq(stdType != null, DataElementInfo::getStdType, stdType);
        //标准状态检索逻辑
//            queryWrapper.eq(status != null, DataElementInfo::getStatus, status);
    }


    /**
     * 接受Post的传参并新建数据元
     *
     * @param dataElementInfo
     * @param type            0:创建，1：修改
     * @return
     */
    @Override
    public CheckVo<DataElementInfo> checkPost(DataElementInfo dataElementInfo, Integer type) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        //目录校验
        if (tDeCatalogInfoService.getById(dataElementInfo.getCatalogId()) == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元对应的目录不存在"));
        } else if (!tDeCatalogInfoService.getById(dataElementInfo.getCatalogId()).getType().equals(CatalogTypeEnum.DataElement)) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元对应的目录类型不正确"));
        }

        if (null!=dataElementInfo.getRelationType()){
            if ("codeRule".equals(dataElementInfo.getRelationType()) && (null == dataElementInfo.getRuleId() || dataElementInfo.getRuleId().equals(0l))){
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元关联编码规则不能为空"));
            }else if ("codeTable".equals(dataElementInfo.getRelationType()) && (CustomUtil.isEmpty(dataElementInfo.getDictCode()) || dataElementInfo.getDictCode() == 0)){
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元关联码表不能为空"));
            }
        }else{
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元关联类型不能为空"));
        }

        //编码规则校验
        if (dataElementInfo.getRuleId() != null
                && !dataElementInfo.getRuleId().equals(0l)
                && CustomUtil.isEmpty(ruleService.queryById(dataElementInfo.getRuleId()))) {
            log.error(String.format("参数rule_id[%s]指向的编码规则不存在", dataElementInfo.getRuleId()));
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "编码规则不存在或已删除"));
        }

        //文字校验
        CheckpPostText(dataElementInfo, checkErrors);

        //重复校验

        QueryWrapper queryWrapper = new QueryWrapper();
        DataElementInfo existData = new DataElementInfo();
        //中文名称+标准分类
        queryWrapper.eq("f_name_cn", dataElementInfo.getNameCn());
        queryWrapper.eq("f_std_type", dataElementInfo.getStdType());
        queryWrapper.eq("f_department_ids", dataElementInfo.getDepartmentIds());
        queryWrapper.eq("f_deleted", false);
        existData = getOne(queryWrapper);
        if (existData != null && !existData.getId().equals(dataElementInfo.getId())) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(), "数据元中文名称、标准分类不能全部重复"));
        }
        //
        //英文名称+标准分类不能重复
//        queryWrapper.clear();
//        queryWrapper.eq("f_name_en", dataElementInfo.getNameEn());
//        queryWrapper.eq("f_std_type", dataElementInfo.getStdType());
//        queryWrapper.eq("f_deleted", false);
//        existData = getOne(queryWrapper);
//        if (existData != null && !existData.getId().equals(dataElementInfo.getId())) {
//            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(), "数据元英文名称、标准分类不能全部重复"));
//        }
        //码表id校验,通过时转化为码表code
        if (!CustomUtil.isEmpty(dataElementInfo.getDictCode()) && dataElementInfo.getDictCode() != 0) {
            DictEntity dictEntity = dictMapper.selectById(dataElementInfo.getDictCode());
            if (CustomUtil.isEmpty(dictEntity)) {
                log.error(String.format("参数dict_id[%s]指向的码表不存在", dataElementInfo.getDictCode()));
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "码表数据不存在或已删除"));
            } else {
                dataElementInfo.setDictCode(dictEntity.getCode());
            }
        }

        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
        }
        return new CheckVo<>(errorCode, checkErrors, dataElementInfo);
    }

    /**
     * 批量校验数据元
     *
     * @param dataElementInfoList
     * @return
     */
    public List<CheckVo<DataElementInfo>> checkPostList(List<DataElementInfo> dataElementInfoList, Long catalogId) {

        //从数据库加载相关map
        Map<Long, DeCatalogInfo> deCatalogInfoMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(DeCatalogInfo.class), DeCatalogInfo::getId);
        Map<Long, StdFileMgrEntity> stdFileMgrEntityMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(StdFileMgrEntity.class).eq(StdFileMgrEntity::getDeleted, false), StdFileMgrEntity::getId);
        Map<String, DataElementInfo> cnMap = new HashMap<>();
        Map<String, DataElementInfo> enMap = new HashMap<>();
        Map<String, String> cnMapExcel = new HashMap<>();
        LambdaQueryWrapper<DataElementInfo> deWrapper = new LambdaQueryWrapper<>();
        deWrapper.eq(DataElementInfo::getDeleted, false);
        list(deWrapper).forEach(dataElementInfo -> {
            String cnkey = dataElementInfo.getNameCn() + dataElementInfo.getStdType();
            cnMap.put(cnkey, dataElementInfo);
            String enkey = dataElementInfo.getNameEn() + dataElementInfo.getStdType();
            enMap.put(enkey, dataElementInfo);
        });
        Map<Long, DictEntity> dictEntityMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(DictEntity.class).eq(DictEntity::getDeleted, false), DictEntity::getId);

        //循环校验单个数据元，输出校验结果集
        List<CheckVo<DataElementInfo>> checkVoList = new ArrayList<>();
        for (DataElementInfo dataElementInfo : dataElementInfoList) {
            dataElementInfo.setCatalogId(catalogId);
            if(!org.springframework.util.StringUtils.isEmpty(dataElementInfo.getNameEn())){
                dataElementInfo.setNameEn(dataElementInfo.getNameEn().trim());
            }
            if(!org.springframework.util.StringUtils.isEmpty(dataElementInfo.getNameCn())){
                dataElementInfo.setNameCn(dataElementInfo.getNameCn().trim());
            }
//            dataElementInfo.setStatus(EventStatusEnum.EFFECT);
            String errorCode = "";
            List<CheckErrorVo> checkErrors = Lists.newLinkedList();
            //目录校验
            if (deCatalogInfoMap.get(dataElementInfo.getCatalogId()) == null) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[目录]:不存在"));
            } else if (!deCatalogInfoMap.get(dataElementInfo.getCatalogId()).getType().equals(CatalogTypeEnum.DataElement)) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[目录]:不存在"));
            }

            //编码规则校验
            if (dataElementInfo.getRuleId() != null && !dataElementInfo.getRuleId().equals(0l) && CustomUtil.isEmpty(stdFileMgrEntityMap.get(dataElementInfo.getRuleId()))) {
                log.error(String.format("参数rule_id[%s]指向的编码规则不存在", dataElementInfo.getRuleId()));
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[编码规则]:不存在"));
            }

            //文字校验
            CheckpPostText(dataElementInfo, checkErrors);
            //重复校验
            DataElementInfo existData;
            //中文名称+标准分类
            String cnKey = dataElementInfo.getNameCn() + dataElementInfo.getStdType();
            existData = cnMap.get(cnKey);
            if (existData != null && !existData.getId().equals(dataElementInfo.getId())) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(), "[中文名称]:"+dataElementInfo.getNameCn()+"和[标准分类]在数据库中已存在"));
            }
            // 校验中文名称+标准分类在导入的excel中是否重复
            if(!cnMapExcel.isEmpty() && cnMapExcel.containsKey(cnKey)){
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(), "[中文名称]:"+dataElementInfo.getNameCn()+"和[标准分类]在excel中重复存在"));
            }else{
                cnMapExcel.put(cnKey,cnKey);
            }
            //英文名称+标准分类不能重复
            //String enKey = dataElementInfo.getNameEn() + dataElementInfo.getStdType();
            //existData = enMap.get(enKey);
//            if (existData != null && !existData.getId().equals(dataElementInfo.getId())) {
//                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.OperationConflict.getErrorCode(), "[英文名称]:已存在"));
//            }
            //码表id校验,通过时转化为码表code
            if (!CustomUtil.isEmpty(dataElementInfo.getDictCode()) && dataElementInfo.getDictCode() != 0) {
                DictEntity dictEntity = dictEntityMap.get(dataElementInfo.getDictCode());
                if (CustomUtil.isEmpty(dictEntity)) {
                    log.error(String.format("参数dict_code[%s]指向的码表不存在", dataElementInfo.getDictCode()));
                    checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[码表]:不存在"));
                } else {
                    dataElementInfo.setDictCode(dictEntity.getCode());
                }
            }


            if (!CustomUtil.isEmpty(dataElementInfo.getLabelId()) && dataElementInfo.getLabelId() == 1L) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.NotExist.getErrorCode(), "[数据分级]:不存在"));
            }

            if (checkErrors.size() > 0) {
                errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
            }
            CheckVo<DataElementInfo> checkVo = new CheckVo<>(errorCode, checkErrors, dataElementInfo);
            checkVoList.add(checkVo);

        }
        return checkVoList;
    }

    private void CheckpPostText(DataElementInfo dataElementInfo, List<CheckErrorVo> checkErrors) {
        //数据元中文名称格式校验:不能为空，由长度不超过128个字符的中英文_-,其中_-不能作为首字母
        if (StringUtils.isBlank(dataElementInfo.getNameCn())) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "[中文名称]:空"));
        } else {
            dataElementInfo.setNameCn(StringUtils.trim(dataElementInfo.getNameCn()));
            if (!dataElementInfo.getNameCn().matches(Constants.REGEX_LENGTH_128)) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[中文名称]:长度超过128"));
            }
        }


        //数据元英文名称格式校验:不能为空，由长度不超过128个字符的英文_-组成,其中_-不能作为首字母
        if (StringUtils.isBlank(dataElementInfo.getNameEn())) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "[英文名称]:空"));
        } else {
            dataElementInfo.setNameEn(StringUtils.trim(dataElementInfo.getNameEn()));
            if (!dataElementInfo.getNameEn().matches(Constants.getRegexENOrNumVarL(1, 128))) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[英文名称]:字符不符合输入要求或长度超过128"));
            }
        }

        //同义词逗号处理
        String synonymStr = dataElementInfo.getSynonyms();
        synonymStr = StringUtils.replace(synonymStr, "，", ",");
        //同义词切分处理
        TreeSet<String> synonyms = StringUtil.splitTrimByRegex(synonymStr, ",");
        StringBuilder synonym = new StringBuilder();

        if (CustomUtil.isNotEmpty(synonyms)) {
            synonyms.forEach(word -> {
                word = StringUtils.trim(word);
                if (!StringUtils.isBlank(word)) {
                    if (!word.matches(Constants.getRegexENOrCNWithComma(1, 20))) {
                        checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), String.format("[同义词:][%s]字符不符合要求或长度超过20", word)));
                    } else {
                        synonym.append(word).append(",");
                    }
                }
            });
            if (synonym.length() > 0) {
                synonym.deleteCharAt(synonym.length() - 1);
            }
        }
        dataElementInfo.setSynonyms(synonym.toString());
        if (!StringUtils.isEmpty(dataElementInfo.getSynonyms()) && !dataElementInfo.getSynonyms().matches(Constants.getRegexENOrCNWithComma(1, 300))) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[同义词:字符不符合要求或总长度超过300"));
            return;
        }
        //标准类型检测枚举有效性
        if (CustomUtil.isEmpty(dataElementInfo.getStdType()) || dataElementInfo.getStdType().equals(OrgTypeEnum.Unknown)) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[标准分类]:输入错误"));
            return;
        }
        //数据类型检测枚举有效性
        if (CustomUtil.isEmpty(dataElementInfo.getDataType()) || dataElementInfo.getDataType().equals(DataTypeEnum.Unknown)) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据类型]:输入错误"));
            return;
        } else {
            //如果检测到二进制型就转为字符型
//            if (dataElementInfo.getDataType().equals(DataTypeEnum.Binary)) {
//                dataElementInfo.setDataType(DataTypeEnum.Char);
//            }
            //数据长度、精度校验
            //数字型长度不超过65位，精度不超过30位,默认为0
            if (CustomUtil.isNotEmpty(dataElementInfo.getDataType()) && (dataElementInfo.getDataType().equals(DataTypeEnum.Number) || dataElementInfo.getDataType().equals(DataTypeEnum.Decimal))
                    && dataElementInfo.getDataLength() != null && (dataElementInfo.getDataLength() > 38 || dataElementInfo.getDataLength() < 1)) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据长度]:输入错误"));
                return;
            }
            if (CustomUtil.isNotEmpty(dataElementInfo.getDataType())  && (dataElementInfo.getDataType().equals(DataTypeEnum.Number) ||  dataElementInfo.getDataType().equals(DataTypeEnum.Decimal))
                    && dataElementInfo.getDataPrecision() != null && (dataElementInfo.getDataPrecision() > 38 || dataElementInfo.getDataPrecision() < 0)) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据精度]:输入错误"));
                return;
            }
            //数字型精度不能大于或等于数据长度
            if (dataElementInfo.getDataLength() != null && dataElementInfo.getDataPrecision() != null
                    && !(dataElementInfo.getDataPrecision() == 0 && dataElementInfo.getDataLength() == 0)
                    && dataElementInfo.getDataPrecision() > dataElementInfo.getDataLength()) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据精度]:输入错误"));
                return;
            }

            //字符型长度不超过65535，默认为0,0表示为空
            if (CustomUtil.isNotEmpty(dataElementInfo.getDataType()) && dataElementInfo.getDataType().equals(DataTypeEnum.Char)
                    && dataElementInfo.getDataLength() != null && (dataElementInfo.getDataLength() > 65535 || dataElementInfo.getDataLength() < 0)) {
                checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据长度]:输入错误"));
                return;
            }



            //判断是否是字符或数字型、二进制型,不是则置null长度
            if (CustomUtil.isNotEmpty(dataElementInfo.getDataType()) && !dataElementInfo.getDataType().equals(DataTypeEnum.Char) && !dataElementInfo.getDataType().equals(DataTypeEnum.Number)
            && !dataElementInfo.getDataType().equals(DataTypeEnum.Decimal)
                    ) {
                dataElementInfo.setDataLength(null);
            }
            //判断是否是高精度型，不是则置空精度
            if (CustomUtil.isNotEmpty(dataElementInfo.getDataType()) && !dataElementInfo.getDataType().equals(DataTypeEnum.Decimal) && !dataElementInfo.getDataType().equals(DataTypeEnum.Number)) {
                dataElementInfo.setDataPrecision(null);
            }

        }
        //数据元说明长度校验
        if (StringUtil.isOverLength(dataElementInfo.getDescription(), 300)) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "[数据元说明]:字符长度超过300"));
            return;
        }
//        String synonym1 = dataElementInfo.getSynonym();
//        if (!org.springframework.util.StringUtils.isEmpty(synonym1)) {
//            dataElementInfo.setSynonym(StringUtils.replace(synonymStr, ",", "，"));
//        }
    }

    @Override
    public CheckVo<DataElementInfo> checkIdOrCode(Integer type, Long value) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        // 校验集合-数据元ID参数不能为空
        if (type == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "查询类型参数type不能为空"));
        } else if (type > 2 || type < 1) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "查询类型参数type只能为1或2"));
        }
        if (value == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "查询标识参数value不能为空"));
        }
        // 校验集合-数据元ID指向的数据元是否存在
        DataElementInfo entity = getOneByIdOrCode(type, value);
        if (ObjectUtils.isEmpty(entity)) {
//            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.Empty.getErrorCode(), String.format("符合查询条件type[%s],value[%s]的数据未找到", type, value)));
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.Empty.getErrorCode(), "数据元不存在或已删除"));
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
        }

        return new CheckVo<DataElementInfo>(errorCode, checkErrors, entity);
    }

    /**
     * 查询数据元ID校验
     *
     * @param id
     * @return
     */

    public CheckVo<DataElementInfo> checkID(Long id) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        //校验集合-数据元ID参数不能为空
        if (id == null) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "数据元ID参数不能为空"));
        }
        //校验集合-目录ID指向的数据元是否存在
        DataElementInfo dataElementInfo = getById(id);
        if (dataElementInfo == null || dataElementInfo.getDeleted()) {
//            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), String.format("ID[%s]指向的数据元不存在", id)));
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), String.format("数据元不存在或已删除", id)));
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
        }
        return new CheckVo<DataElementInfo>(errorCode, checkErrors, dataElementInfo);
    }

    /**
     * 查询数据元ID集合校验
     *
     * @param ids
     * @return
     */
    public CheckVo<String> checkID(String ids) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        //校验集合-数据元ID集合参数不能为空
        if (StringUtils.isBlank(ids)) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.MissingParameter.getErrorCode(), "数据元ID集合ids参数不能为空"));
        }
        //校验集合-数据元ID集合形式为 1,2,3 等等,长度在1-2000
        if (!ids.matches(Constants.getRegexNumVarL(1, 2000))) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "数据元ID集合ids形式应为 {1,2,3},长度在1-2000"));
        }
        //校验集合-单个id
        List<Long> idList = StringUtil.splitNumByRegex(ids, ",");
        if (CustomUtil.isNotEmpty(idList)) {
            idList.forEach(id -> {
                String errRode = checkID(id).getCheckCode();
                if (!StringUtils.isEmpty(errRode)) {
//                    checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), String.format("ID[%s]指向的数据元不存在", id)));
                    checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), String.format("数据元不存在或已删除", id)));
                }
            });
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
        }
        return new CheckVo<String>(errorCode, checkErrors, ids);
    }

    @Override
    public CheckVo<String> checkFile(MultipartFile file) {
        String errorCode = "";
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        //校验集合-文件不能为空或xlsx、xls以外的文件
        if (!CustomUtil.checkFileType(file, ".xlsx") && !CustomUtil.checkFileType(file, ".xls")) {
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "文件不能为空或xlsx、xls以外的文件"));
        } else if (!CustomUtil.checkFileSize(file.getSize(), Constants.FILE_UPLOAD_LIMIT_SIZE, "M")) {
            //校验集合-文件不能超过10M
            checkErrors.add(new CheckErrorVo(ErrorCodeEnum.InvalidParameter.getErrorCode(), "文件不能超过10M"));
        }
        if (checkErrors.size() > 0) {
            errorCode = ErrorCodeEnum.DataElementServiceError.getErrorCode();
        }
        return new CheckVo<String>(errorCode, checkErrors, "");
    }


    @Override
    public boolean dictUsed(Long dictCode) {
        if (dictCode == null) {
            return false;
        }

        List<Long> dictCodes = new ArrayList<>();
        dictCodes.add(dictCode);
        Set<Long> usedDictCodes = dataElementInfoMapper.queryUsedDictCode(dictCodes);
        if (CustomUtil.isNotEmpty(usedDictCodes)) {
            return true;
        }
        return false;
    }

    @Override
    public Set<Long> dictUsed(List<Long> dictCodes) {
        if (CustomUtil.isEmpty(dictCodes)) {
            return new HashSet<>();
        }
        Set<Long> usedDictCodes = dataElementInfoMapper.queryUsedDictCode(dictCodes);
        return usedDictCodes;
    }

    /**
     * 判断是否发生版本迭代的变更
     *
     * @param oldInfo 变更前
     * @param newInfo 变更后
     * @return true：关键属性已变更，版本需要变化，false：关键属性未变更，无需变化
     */
    @Override
    public boolean isVersionChanged(DataElementInfo oldInfo, DataElementInfo newInfo) {
        DataElementCompareVo oldVo = new DataElementCompareVo();
        CustomUtil.copyProperties(oldInfo, oldVo);
        DataElementCompareVo newVo = new DataElementCompareVo();
        CustomUtil.copyProperties(newInfo, newVo);
        return !CustomUtil.compareObject(oldVo, newVo);
    }

    /**
     * 判断是否发生版本不迭代的变更
     *
     * @param oldInfo
     * @param newInfo
     * @return
     */
    @Override
    public boolean isNoVersionChanged(DataElementInfo oldInfo, DataElementInfo newInfo) {
        if (newInfo.getCatalogId() != null && !newInfo.getCatalogId().equals(oldInfo.getCatalogId())) {
            return true;
        }
        if (newInfo.getDictCode() != null && !newInfo.getDictCode().equals(oldInfo.getDictCode())) {
            return true;
        }
        if (newInfo.getDictCode() == null && !oldInfo.getDictCode().equals(0l)) {
            return true;
        }
        return false;
    }

    /**
     * 判断是否发生需要推送消息的变更
     *
     * @param oldInfo
     * @param newInfo
     * @return
     */
    @Override
    public boolean isNeedPushChanged(DataElementInfo oldInfo, DataElementInfo newInfo) {
        newInfo.setRuleId(newInfo.getRuleId() == null ? 0 : newInfo.getRuleId());
        DataElementComparePushVo oldVo = new DataElementComparePushVo();
        CustomUtil.copyProperties(oldInfo, oldVo);
        DataElementComparePushVo newVo = new DataElementComparePushVo();
        CustomUtil.copyProperties(newInfo, newVo);
        return !CustomUtil.compareObject(oldVo, newVo);
    }

    @Override
    public Map<String, List<Object>> getPushChangedFields(DataElementInfo oldInfo, DataElementInfo newInfo) {
        newInfo.setRuleId(newInfo.getRuleId() == null ? 0 : newInfo.getRuleId());
        DataElementComparePushVo oldVo = new DataElementComparePushVo();
        CustomUtil.copyProperties(oldInfo, oldVo);
        DataElementComparePushVo newVo = new DataElementComparePushVo();
        CustomUtil.copyProperties(newInfo, newVo);
        return CustomUtil.compareFields(oldVo, newVo, null);
    }

    @Override
    public List<DEImportSuccessVo> importExcelReturnMsg(HttpServletResponse response, MultipartFile file, Class<DataElementExcelVo> cls, Long catalogId) {
        ExcelImportResult<DataElementExcelVo> result = ExcelUtil.importExcel(file, cls);
        if (CustomUtil.isEmpty(result) || CustomUtil.isEmpty(result.getList())) {
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, "导入的数据为空或者格式不正确");
        }
        if (result.getList().size() > 5000) {
            throw new CustomException(ErrorCodeEnum.ExcelImportError, String.format("[数据元]导入失败：%s", FileConstants.Import_Excel_OverNum));
        }

        List<DataElementInfo> successList = null;
        List<DEImportSuccessVo> successVoList = new ArrayList<>();

        try {
            successList = saveData(result.getList(), result.getFailList(), catalogId);
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }

        if (CustomUtil.isNotEmpty(successList)) {
            successList.forEach(item -> {
                        DEImportSuccessVo vo = new DEImportSuccessVo();
                        vo.setId(item.getId());
                        vo.setName(item.getNameCn());
                        successVoList.add(vo);
                    }
            );
        }
        return successVoList;
    }

    @Override
    public void exportExcelTemplate(HttpServletResponse response) {
        ExcelUtil.downLoadTemplateFile(response, excelImportConfigruation.getDe(), ExcelNameEnum.DataElement.getMessage() + "导入模板.xlsx");
    }

    //校验导入时单行数据，通过时导入，不通过则抛异常进入错误列表等待导出
    @Override
    public void saveRow(DataElementExcelVo excelVo, Long catalogId) throws JsonProcessingException {
        //失败时抛出错误对象和错误码
        ObjectMapper mapper = new ObjectMapper();
        DataElementInfo dataElementInfo = excelVo.getDataElementInfo();
        dataElementInfo.setCatalogId(catalogId);
//        dataElementInfo.setStatus(EventStatusEnum.EFFECT);
        //校验结果
        CheckVo<DataElementInfo> checkVo = checkPost(dataElementInfo, 0);
        //处理逻辑
        if (!StringUtils.isBlank(checkVo.getCheckCode())) {
            excelVo.setErrorMsg(checkVo.getCheckErrorsString(checkVo.getCheckErrors()));
            mapper.writeValueAsString(excelVo);
            throw new CustomException(checkVo.getCheckCode(), "数据元创建失败", checkVo.getCheckErrorsString(checkVo.getCheckErrors()));
        }
        UserInfo userInfo = CustomUtil.getUser();
        Date now = new Date();
        //使用MybatisPlus自动生成雪花算法的关联标识
        dataElementInfo.setCode(IdWorker.getId());
        dataElementInfo.setAuthorityId(userInfo.getUserId());
        dataElementInfo.setCreateTime(now);
        dataElementInfo.setCreateUser(userInfo.getUserName());
        dataElementInfo.setUpdateTime(now);
        dataElementInfo.setUpdateUser(userInfo.getUserName());
        dataElementInfo.setVersion(1);
        if (dataElementInfoMapper.insert(dataElementInfo) == -1) {
            excelVo.setErrorMsg(ErrorCodeEnum.InternalError.getErrorMsg());
            mapper.writeValueAsString(excelVo);
            throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), "数据元创建失败", null, Message.MESSAGE_DATABASE_ERROR_SOLUTION);
        }
    }

    //导入时校验多行数据，通过时导入，不通过则抛异常进入错误列表等待导出
    @Override
    public void checkVoList(List<DataElementExcelVo> successVoList, List<DataElementInfo> successList, List<DataElementExcelVo> errorList, Long catalogId) {
        UserInfo userInfo = CustomUtil.getUser();
        String deptIds = userInfo.getDeptList().get(0).getPathId();
        String thirdDeptId = userInfo.getDeptList().get(0).getThirdDeptId();
        //失败时抛出错误对象和错误码
        List<DataElementInfo> dataElementInfoList = DataElementExcelVo.convertToDeInfoList(successVoList, labelInfoById_url);
        List<CheckVo<DataElementInfo>> checkVoList = checkPostList(dataElementInfoList, catalogId);
        if (CustomUtil.isNotEmpty(checkVoList)) {
            for (int i = 0; i < checkVoList.size(); i++) {
                //处理逻辑
                if (StringUtils.isBlank(checkVoList.get(i).getCheckCode())) {
                    DataElementInfo dataElementInfo = checkVoList.get(i).getCheckData();
                    Date now = new Date();
                    dataElementInfo.setCode(IdWorker.getId());
                    dataElementInfo.setAuthorityId(userInfo.getUserId());
                    dataElementInfo.setCreateTime(now);
                    dataElementInfo.setCreateUser(userInfo.getUserName());
                    dataElementInfo.setUpdateTime(now);
                    dataElementInfo.setUpdateUser(userInfo.getUserName());
                    dataElementInfo.setVersion(1);
                    dataElementInfo.setDescription(StringUtil.XssEscape(dataElementInfo.getDescription()));
                    dataElementInfo.setNameCn(StringUtil.XssEscape(dataElementInfo.getNameCn()));
                    dataElementInfo.setNameEn(dataElementInfo.getNameEn().trim());
                    dataElementInfo.setSynonyms(StringUtil.XssEscape(dataElementInfo.getSynonyms()));
                    dataElementInfo.setDepartmentIds(deptIds);
                    dataElementInfo.setThirdDeptId(thirdDeptId);
                    successList.add(dataElementInfo);
                } else {
                    try {
                        errorList.add(getErrorObject(successVoList.get(i), checkVoList.get(i).getCheckErrorsString(checkVoList.get(i).getCheckErrors()) == null ? "" : checkVoList.get(i).getCheckErrorsString(checkVoList.get(i).getCheckErrors())));
                    } catch (JsonProcessingException e) {
                        e.printStackTrace();
                        throw new CustomException(ErrorCodeEnum.InternalError.getErrorCode(), "数据元导入失败", null, "校验不通过数据json转为excel单元值失败");
                    }
                }
            }
        }
    }

    //处理导入异常
    @Override
    public void errorHandle(List<DataElementExcelVo> errorList) {
        errorList.forEach(error -> {
            String messageTempValueError = String.format("导入[数据元]第[%s]条数，默认20据，%s",
                    error.getRowNum(), error.getErrorMsg());
            throw new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, messageTempValueError);
        });
    }

    @Override
    public DataElementExcelVo getErrorObject(DataElementExcelVo excelVo, String errorObject) throws JsonProcessingException {
        excelVo.setErrorMsg(errorObject);

        return excelVo;
    }

    @Override
    public String getExcelExportTitle() {
        return ExcelUtil.getFillingGuideFromTemplate(excelImportConfigruation.getDe());
    }

    @Override
    public DataElementDetailVo getDetailVo(Long id) {
        MPJLambdaWrapper<DataElementInfo> wrapper = new MPJLambdaWrapper<>();
        //获取数据元
        wrapper.eq(DataElementInfo::getId, id);
        wrapper.selectAll(DataElementInfo.class);

        //获取关联码表
        wrapper.select(DictEntity::getChName);
        wrapper.select(DictEntity::getEnName);
        wrapper.selectAs(DictEntity::getState, DataElementDetailVo::getDictState);
        wrapper.selectAs(DictEntity::getDeleted, DataElementDetailVo::getDictDeleted);
        wrapper.selectAs(DictEntity::getId, DataElementDetailVo::getDictId);
        wrapper.leftJoin(DictEntity.class, on -> on
                .eq(DictEntity::getCode, DataElementInfo::getDictCode)
        );

        //获取关联目录
        wrapper.select(DeCatalogInfo::getCatalogName);
        wrapper.leftJoin(DeCatalogInfo.class, on -> on
                .eq(DeCatalogInfo::getId, DataElementInfo::getCatalogId)
        );

        //获取编码规则
        wrapper.selectAs(RuleEntity::getName, DataElementDetailVo::getRuleName);
        wrapper.selectAs(RuleEntity::getState, DataElementDetailVo::getRuleState);
        wrapper.selectAs(RuleEntity::getDeleted, DataElementDetailVo::getRuleDeleted);
        wrapper.leftJoin(RuleEntity.class, on -> on
                .eq(RuleEntity::getId, DataElementInfo::getRuleId)
        );

        DataElementDetailVo detailVo = selectJoinOne(DataElementDetailVo.class, wrapper);

        //拼接值域
        DataElementInfo dataElementInfo = detailVo;
        detailVo.setDataRange(getDataRange(dataElementInfo));
        //处理部门
        String deptId = StringUtil.PathSplitAfter(detailVo.getDepartmentIds());
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(Arrays.asList(deptId));
        detailVo.setDepartmentId(deptId);
        detailVo.setDepartmentName(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getName());
        detailVo.setDepartmentPathNames(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getPathName());
        if (!Objects.isNull(detailVo.getLabelId())) {
            String url = labelInfoById_url + "/api/configuration-center/v1/grade-label/id/" + detailVo.getLabelId();
            LabelDetailDto labelDetailDto = JsonUtils.json2Obj(UrlCallUtil.getResponseVoForGet(url).getResult(), LabelDetailDto.class);
            if (labelDetailDto != null) {
                detailVo.setLabelName(labelDetailDto.getName());
                detailVo.setLabelIcon(labelDetailDto.getIcon());
                detailVo.setLabelPath(labelDetailDto.getName_display());
            }
        }
        //处理长度和精度页面显示0为空
        if (null!=detailVo.getDataLength() && 0 == detailVo.getDataLength()){
            detailVo.setDataLength(null);
        }
        return detailVo;
    }



    @Override
    public List<DataElementInfo> queryByCodes(Set<Long> stdCodes) {
        if (CustomUtil.isEmpty(stdCodes)) {
            return new ArrayList<>();
        }

        List<DataElementInfo> list = dataElementInfoMapper.queryByCodes(stdCodes);
        return list;
    }

    @Override
    public IPage<DataElementInfo> queryByRuleId(Long ruleId, Integer offset, Integer limit) {
        Page page = new Page<>(offset, limit);
        return dataElementInfoMapper.queryByRuleId(page, ruleId);
    }

    @Override
    public IPage<DataElementInfo> queryByDictCode(Long dictCode, Integer offset, Integer limit) {
        Page page = new Page<>(offset, limit);
        return dataElementInfoMapper.queryByDictCode(page, dictCode);
    }


    /**
     * 值域获取逻辑
     * 如果码表如果存在，值域使用码表的值，否则根据类型为数值型的，取长度和精度计算。
     *
     * @param dataElementInfo
     * @return
     */
    @Override
    public String getDataRange(DataElementInfo dataElementInfo) {
        DictVo dictVo = iDictService.queryDetailByCode(dataElementInfo.getDictCode());
        return getDataRange(dataElementInfo, dictVo);
    }

    @Override
    public String getDataRange(DataElementInfo dataElementInfo, DictVo dictVo) {
        if (CustomUtil.isNotEmpty(dictVo)) {
            List<String> codeSet = new ArrayList<>();
            for (DictEnumVo row : dictVo.getEnums()) {
                codeSet.add(row.getCode());
            }
            return String.format("[%s]", StringUtils.join(codeSet, ","));
        }

        if (DataTypeEnum.Number.equals(dataElementInfo.getDataType())) {
            int dataLength = dataElementInfo.getDataLength()==null?0:dataElementInfo.getDataLength();
            int dataPrecision = dataElementInfo.getDataPrecision() == null ? 0 : dataElementInfo.getDataPrecision();
            dataPrecision = dataLength - dataPrecision <= 0 ? dataLength : dataPrecision;

            int intLength = dataLength - dataPrecision;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < intLength; i++) {
                sb.append("9");
            }
            if (dataPrecision > 0) {
                sb.append(".");
                for (int i = 0; i < dataPrecision; i++) {
                    sb.append("9");
                }
            }
            return String.format("(-%s,%s)", sb, sb);
        }
        return null;
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByCatalog() {
        MPJQueryWrapper<DataElementInfo> wrapper = new MPJQueryWrapper<>();
        wrapper.eq("f_deleted", 0);
        Map<Long, Integer> countMap = new HashMap<>();
        wrapper.select("COUNT(f_catalog_id) AS count,  f_catalog_id AS catalogId");
        wrapper.groupBy("f_catalog_id");
        List<CountGroupByCatalogDto> countList = selectJoinList(CountGroupByCatalogDto.class, wrapper);
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getCatalogId(), item.getCount());
            });
        }
        return countMap;
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByFile() {
        List<CountGroupByFileDto> countList = dataElementInfoMapper.selectFileCountList();
        Map<Long, Integer> countMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getFileId(), item.getCount());
            });
        }
        return countMap;
    }

    /**
     * 按文件目录分页检索
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
    @Override
    public IPage<DataElementInfo> getPageListByFileCatalog(Long fileCatalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction) {
        //如果传-1，也就是查不关联file的数据元
        MPJLambdaWrapper<DataElementInfo> queryWrapper = new MPJLambdaWrapper<>();
        if (fileCatalogId.equals(-1l)) {
            //传入检索条件
            MPJLambdaWrapper<DeCatalogInfo> catalogLambdaWrapper = new MPJLambdaWrapper<>();
            catalogLambdaWrapper.eq(DeCatalogInfo::getLevel, 1);
            catalogLambdaWrapper.eq(DeCatalogInfo::getType, 1);
            Long catalogId = tDeCatalogInfoService.getOne(catalogLambdaWrapper).getId();
            queryWrapper = GetByConditions(catalogId, state, keyword, stdType,null);
            //排除在文件目录列表中的数据元
            List<RelationDeFileEntity> relationDeFileEntities = irelationDeFileService.list();
            if (CustomUtil.isNotEmpty(relationDeFileEntities)) {
                List<Long> deIdWithFileList = relationDeFileEntities.stream().map(relation -> relation.getDeId()).distinct().collect(Collectors.toList());
                queryWrapper.notIn(CustomUtil.isNotEmpty(deIdWithFileList), DataElementInfo::getId, deIdWithFileList);
            }
        } else {
            //如果传具体的fileCatalogId, 通过关联表查询相应的数据

            //填充文件目录及其子集ID列表
            List<Long> ids = tDeCatalogInfoService.getIDList(fileCatalogId);
            if (ids.isEmpty()) {
                //文件目录不存在则返回空集
                queryWrapper.eq(DataElementInfo::getId, -1);
            } else {
                //如果传根目录,目录不参与过滤，等同于按目录查询的情况
                if (tDeCatalogInfoService.getById(fileCatalogId).getLevel().intValue() == 1) {
                    return getPageList(fileCatalogId, state, keyword, stdType, offset, limit, sort, direction,null);
                }
                //逻辑删除过滤
                queryWrapper.eq(DataElementInfo::getDeleted, 0);
                //其他检索条件
                addConditions(state, keyword, stdType, queryWrapper);
                //查找相关目录下的文件实体集合
                MPJLambdaWrapper<StdFileMgrEntity> fileLambdaWrapper = new MPJLambdaWrapper<>();
                fileLambdaWrapper.in(StdFileMgrEntity::getCatalogId, ids);
                List<StdFileMgrEntity> fileList = stdFileMgrService.list(fileLambdaWrapper);
                if (CustomUtil.isNotEmpty(fileList)) {
                    List<Long> fileIdList = fileList.stream().map(file -> file.getId()).collect(Collectors.toList());
                    MPJLambdaWrapper<RelationDeFileEntity> relationDeFileLambdaWrapper = new MPJLambdaWrapper<>();
                    relationDeFileLambdaWrapper.in(RelationDeFileEntity::getFileId, fileIdList);
                    //查找对应的数据元关系集合
                    List<RelationDeFileEntity> relationDeFileEntities = irelationDeFileService.list(relationDeFileLambdaWrapper);
                    //根据数据元关系集合查找对应的数据元集合
                    List<Long> deIdWithFileList = relationDeFileEntities.stream().map(relation -> relation.getDeId()).distinct().collect(Collectors.toList());
                    if (CustomUtil.isEmpty(deIdWithFileList)) {
                        queryWrapper.eq(DataElementInfo::getId, -1);
                    } else {
                        queryWrapper.in(DataElementInfo::getId, deIdWithFileList);
                    }
                }
            }
        }
        //创建分页实体
        Page<DataElementInfo> page = new Page<>(offset, limit);
        sort = "create_time".equalsIgnoreCase(sort) ? "de_id" : sort;
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        return page(page, queryWrapper);
    }

    @Override
    public List<DataElementDetailVo> queryByIDOrCode(List<String> ids, List<String> codes) {

        MPJLambdaWrapper<DataElementInfo> wrapper = new MPJLambdaWrapper<>();
        //获取数据元
        if (!CollectionUtils.isEmpty(ids) && !CollectionUtils.isEmpty(codes)) {
            wrapper.in(DataElementInfo::getCode, codes).or().in(DataElementInfo::getId, ids);
        } else if (!CollectionUtils.isEmpty(ids)) {
            wrapper.in(DataElementInfo::getId, ids);
        } else if (!CollectionUtils.isEmpty(codes)) {
            wrapper.in(DataElementInfo::getCode, codes);
        }
        wrapper.selectAll(DataElementInfo.class);

        //获取关联码表
        wrapper.select(DictEntity::getChName);
        wrapper.select(DictEntity::getEnName);
        wrapper.selectAs(DictEntity::getState, DataElementDetailVo::getDictState);
        wrapper.selectAs(DictEntity::getDeleted, DataElementDetailVo::getDictDeleted);
        wrapper.selectAs(DictEntity::getId, DataElementDetailVo::getDictId);
        wrapper.leftJoin(DictEntity.class, on -> on
                .eq(DictEntity::getCode, DataElementInfo::getDictCode)
        );

        //获取关联目录
        wrapper.select(DeCatalogInfo::getCatalogName);
        wrapper.leftJoin(DeCatalogInfo.class, on -> on
                .eq(DeCatalogInfo::getId, DataElementInfo::getCatalogId)
        );

        //获取编码规则
        wrapper.selectAs(RuleEntity::getName, DataElementDetailVo::getRuleName);
        wrapper.selectAs(RuleEntity::getState, DataElementDetailVo::getRuleState);
        wrapper.selectAs(RuleEntity::getDeleted, DataElementDetailVo::getRuleDeleted);
        wrapper.leftJoin(RuleEntity.class, on -> on
                .eq(RuleEntity::getId, DataElementInfo::getRuleId)
        );

        List<DataElementDetailVo> result = selectJoinList(DataElementDetailVo.class, wrapper);
        //拼接值域
        result.stream().forEach(item -> item.setDataRange(getDataRange(item)));
        return result;
    }

    /**
     * 按文件分页检索
     *
     * @param fileId
     * @param state
     * @param keyword
     * @param stdType
     * @param offset
     * @param limit
     * @param sort
     * @param direction
     * @return
     */
    @Override
    public IPage<DataElementInfo> getPageListByFile(Long fileId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction) {
        //创建分页实体
        Page<DataElementInfo> page = new Page<>(offset, limit);
        sort = "create_time".equalsIgnoreCase(sort) ? "de_id" : sort;
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);

        StdFileMgrEntity file = stdFileMgrService.getById(fileId);
        MPJLambdaWrapper<DataElementInfo> queryWrapper = new MPJLambdaWrapper<>();
        if (CustomUtil.isEmpty(file)) {
            queryWrapper.eq(DataElementInfo::getId, -1);
            return page(page, queryWrapper);
        }

        //逻辑删除过滤
        queryWrapper.eq(DataElementInfo::getDeleted, 0);
        //其他检索条件
        addConditions(state, keyword, stdType, queryWrapper);
        //查找文件实体
        MPJLambdaWrapper<RelationDeFileEntity> relationDeFileLambdaWrapper = new MPJLambdaWrapper<>();
        relationDeFileLambdaWrapper.eq(RelationDeFileEntity::getFileId, CustomUtil.isEmpty(file) ? -1 : fileId);
        //查找对应的数据元关系集合
        List<RelationDeFileEntity> relationDeFileEntities = irelationDeFileService.list(relationDeFileLambdaWrapper);
        //根据数据元关系集合查找对应的数据元集合
        List<Long> deIdWithFileList = relationDeFileEntities.stream().map(relation -> relation.getDeId()).distinct().collect(Collectors.toList());
        if (CustomUtil.isNotEmpty(deIdWithFileList)) {
            queryWrapper.in(DataElementInfo::getId, deIdWithFileList);
        } else {
            queryWrapper.eq(DataElementInfo::getId, -1);
        }

        return page(page, queryWrapper);
    }


    @Override
    public void addRelation(Long stdFileId, List<Long> relationDeList) {
        List<RelationDeFileEntity> oldRelations = relationDeFileMapper.queryByFileId(stdFileId);
        Set<Long> oldDeIdSet = new HashSet<>(oldRelations.size());
        for (RelationDeFileEntity row : oldRelations) {
            oldDeIdSet.add(row.getDeId());
        }

        List<Long> updataList = new ArrayList<>();
        List<RelationDeFileEntity> inserList = new ArrayList<>();
        if (CustomUtil.isNotEmpty(relationDeList)) {
            List<DataElementInfo> exists = dataElementInfoMapper.selectBatchIds(relationDeList);
            for (DataElementInfo row : exists) {
                RelationDeFileEntity r = new RelationDeFileEntity();
                r.setId(IdWorker.getId());
                r.setDeId(row.getId());
                r.setFileId(stdFileId);
                inserList.add(r);
                if (!oldDeIdSet.contains(row.getId())) {
                    updataList.add(row.getId());
                }
                oldDeIdSet.remove(row.getId());
            }
        }

        relationDeFileMapper.deleteByFileId(stdFileId);
        if (CustomUtil.isNotEmpty(inserList)) {
            relationDeFileMapper.save(inserList);
        }

        updataList.addAll(oldDeIdSet);
        if (CustomUtil.isNotEmpty(updataList)) {
            UserInfo userInfo = CustomUtil.getUser();
            String userName = userInfo == null || userInfo.getUserName() == null ? "" : userInfo.getUserName();
            dataElementInfoMapper.updateVersionByIds(updataList, userName);
        }

    }

    @Override
    public List<DataElementInfo> queryByFileId(Long fileId) {
        return dataElementInfoMapper.queryByFileId(fileId);
    }

    @Override
    public Result<List<DataElementInfo>> queryPageByFileId(Long fileId, Integer offset, Integer limit) {
        Page<DataElementInfo> page = new Page<DataElementInfo>(offset, limit);
        IPage<DataElementInfo> pageResult = dataElementInfoMapper.queryPageByFileId(page, fileId);
        Result<List<DataElementInfo>> result = Result.success(pageResult.getRecords());
        result.setTotalCount(page.getTotal());
        return result;
    }

    @Override
    public void delete(List<Long> idList) {
        dataElementInfoMapper.deleteByIds(idList);
    }

    @Override
    public void deleteByLabelIds(List<Long> idList) {
        dataElementInfoMapper.deleteByLabelIds(idList);
    }


    @Override
    public List<DataElementListVo> getVoByEntities(List<DataElementInfo> list) {
        List<DataElementListVo> result = new ArrayList<>();
        if (CustomUtil.isNotEmpty(list)) {
            List<Long> dictCodeList = new ArrayList<>();
            List<Long> ruleIdList = new ArrayList<>();
            Set<String> deptIds = new HashSet<>();
            if (CustomUtil.isNotEmpty(list)) {
                list.forEach(de -> {
                    if (de.getDictCode() > 0) {
                        dictCodeList.add(de.getDictCode());
                    }
                    if (CustomUtil.isNotEmpty(de.getRuleId()) && de.getRuleId() > 0) {
                        ruleIdList.add(de.getRuleId());
                    }
                    if(CustomUtil.isNotEmpty(de.getDepartmentIds())){
                        deptIds.add(StringUtil.PathSplitAfter(de.getDepartmentIds()));
                    }
                });
            }
            //码值Map
            Map<Long, DictEntity> dictEntityMap = new HashMap<>();
            if (CustomUtil.isNotEmpty(dictCodeList)) {
                dictEntityMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(DictEntity.class).in(DictEntity::getCode, dictCodeList), DictEntity::getCode);
            }
            //编码Map
            Map<Long, RuleEntity> ruleEntityMap = new HashMap<>();
            if (CustomUtil.isNotEmpty(ruleIdList)) {
                ruleEntityMap = SimpleQuery.keyMap(Wrappers.lambdaQuery(RuleEntity.class).in(RuleEntity::getId, ruleIdList), RuleEntity::getId);
            }
            // 查询部门名称
            Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(deptIds);

            Map<Long, DictEntity> finalDictEntityMap = dictEntityMap;
            Map<Long, RuleEntity> finalRuleEntityMap = ruleEntityMap;
            list.forEach(de -> {
                DataElementListVo vo = new DataElementListVo();
                CustomUtil.copyProperties(de, vo);
                vo.setDictId(finalDictEntityMap.get(de.getDictCode()) == null ? null : finalDictEntityMap.get(de.getDictCode()).getId());
                vo.setChName(finalDictEntityMap.get(de.getDictCode()) == null ? null : finalDictEntityMap.get(de.getDictCode()).getChName());
                vo.setRuleName(finalRuleEntityMap.get(de.getRuleId()) == null ? null : finalRuleEntityMap.get(de.getRuleId()).getName());
                if(StringUtils.isNotBlank(vo.getRuleName())){
                    vo.setRuleDictDeleted(finalRuleEntityMap.get(de.getRuleId()).getDeleted());
                }else if(StringUtils.isNotBlank(vo.getChName())){
                    vo.setRuleDictDeleted(finalDictEntityMap.get(de.getDictCode()).getDeleted());
                }
                vo.setDepartmentId(StringUtil.PathSplitAfter(de.getDepartmentIds()));
                vo.setDepartmentName(deptEntityMap.get(vo.getDepartmentId())==null?null:deptEntityMap.get(vo.getDepartmentId()).getName());
                vo.setDepartmentPathNames(deptEntityMap.get(vo.getDepartmentId())==null?null:deptEntityMap.get(vo.getDepartmentId()).getPathName());
                if (!Objects.isNull(de.getLabelId())) {
                    String url = null;
                    try {
                        url = labelInfoById_url + "/api/configuration-center/v1/grade-label/id/" + de.getLabelId();
                        LabelDetailDto labelDetailDto = JsonUtils.json2Obj(UrlCallUtil.getResponseVoForGet(url).getResult(), LabelDetailDto.class);
                        if (labelDetailDto != null) {
                            vo.setLabelName(labelDetailDto.getName());
                            vo.setLabelIcon(labelDetailDto.getIcon());
                            vo.setLabelPath(labelDetailDto.getName_display());
                        }
                    } catch (Exception exception) {
                        log.error("获取分级标签错误,url:{},msg:{}", url, exception.getMessage(), exception);
                    }
                }
                result.add(vo);
            });
        }
        return result;
    }

    @Override
    public int deleteRuleId(Long id) {
        return dataElementInfoMapper.deleteRuleId(id);
    }

    @Override
    public IPage<DataElementFileVo> getPageFileList(Long id, Integer offset, Integer limit) {
        MPJLambdaWrapper<RelationDeFileEntity> queryWrapper = new MPJLambdaWrapper<>();
        queryWrapper.eq(RelationDeFileEntity::getDeId, id);

        //获取关联文件
        queryWrapper.selectAs(StdFileMgrEntity::getId, DataElementFileVo::getFileId);
        queryWrapper.selectAs(StdFileMgrEntity::getFileName, DataElementFileVo::getFileName);
        queryWrapper.selectAs(StdFileMgrEntity::getName, DataElementFileVo::getName);
        queryWrapper.selectAs(StdFileMgrEntity::getAttachmentType, DataElementFileVo::getIsUrl);
        queryWrapper.selectAs(StdFileMgrEntity::getState, DataElementFileVo::getFileState);
        queryWrapper.selectAs(StdFileMgrEntity::getDeleted, DataElementFileVo::getFileDeleted);
        queryWrapper.innerJoin(StdFileMgrEntity.class, on -> on
                .eq(StdFileMgrEntity::getId, RelationDeFileEntity::getFileId)
        );

        //创建分页实体
        Page<RelationDeFileEntity> page = new Page<>(offset, limit);
        //创建排序条件

        page.setOrders(getOrderItemBySingleColumn("f_de_id", false));

        return relationDeFileMapper.selectJoinPage(page, DataElementFileVo.class, queryWrapper);
    }

    @Override
    public Boolean isRepeat(Long filterId, String name, OrgTypeEnum stdType, RepeatTypeEnum type, String departmentIds) {
        LambdaQueryWrapper<DataElementInfo> wrapper = new LambdaQueryWrapper<>();
        Boolean isRepeat;
        switch (type) {
            case DE_NAME_CN:
                wrapper.eq(DataElementInfo::getNameCn, name);
                wrapper.eq(DataElementInfo::getStdType, stdType.getCode());
                wrapper.eq(DataElementInfo::getDeleted, false);
                wrapper.eq(DataElementInfo::getDepartmentIds, TokenUtil.getDeptPathIds(departmentIds).getPathId());
                wrapper.ne(CustomUtil.isNotEmpty(filterId), DataElementInfo::getId, filterId);
                isRepeat = count(wrapper) > 0;
                return isRepeat;

            case DE_NAME_EN:
                wrapper.eq(DataElementInfo::getNameEn, name);
                wrapper.eq(DataElementInfo::getStdType, stdType.getCode());
                wrapper.eq(DataElementInfo::getDeleted, false);
                wrapper.eq(DataElementInfo::getDepartmentIds, TokenUtil.getDeptPathIds(departmentIds).getPathId());
                wrapper.ne(CustomUtil.isNotEmpty(filterId), DataElementInfo::getId, filterId);
                isRepeat = count(wrapper) > 0;
                return isRepeat;
            default:
                return false;
        }
    }

    @Override
    public Set<Long> ruleUsed(List<Long> ruleIds) {
        if (CustomUtil.isEmpty(ruleIds)) {
            return new HashSet<>();
        }
        Set<Long> usedRuleIds = dataElementInfoMapper.queryByRuleIds(ruleIds);
        return usedRuleIds;
    }

    /**
     * @param dataElementInfoList
     * @param type   insert update delete 插入 更新
     * @return
     */
    @Override
    public String packageMqInfo(List<DataElementInfo> dataElementInfoList,String type){

        DataMqDto mqDto = new DataMqDto();
        mqDto.setHeader(new HashMap());

        DataMqDto.Payload payload =  mqDto.new Payload();
        payload.setType("smart-recommendation-graph");

        DataMqDto.Content<DataElementInfo> content =  mqDto.new Content<>();
        content.setType(type);
        content.setTable_name("t_data_element_info");
        content.setEntities(dataElementInfoList);

        payload.setContent(content);

        mqDto.setPayload(payload);

        ObjectMapper objectMapper = new ObjectMapper();
        try {
            String jsonString = objectMapper.writeValueAsString(mqDto);
            return jsonString;
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public List<Long> queryRuleIdByDataCodes(List<Long> ruleIds) {
        return dataElementInfoMapper.queryRuleIdByDataCodes(ruleIds);
    }

    @Override
    public List<Long> queryDictIdByDataCodes(List<Long> dictIds) {

        return dataElementInfoMapper.queryDictIdByDataCodes(dictIds);
    }

    @Override
    public boolean updateBatchEnable(List<Long> ids, Integer stateCode, String reason) {
        int t= dataElementInfoMapper.updateBatchEnable(ids,stateCode,reason);
        return t > 0? true:false;
    }

}
