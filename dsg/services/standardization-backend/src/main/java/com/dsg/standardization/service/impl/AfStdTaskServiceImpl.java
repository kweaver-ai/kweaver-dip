package com.dsg.standardization.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.common.util.HttpUtil;
import com.dsg.standardization.common.util.JsonUtils;
import com.dsg.standardization.configuration.Configruation;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.RuleEntity;
import com.dsg.standardization.entity.TaskStdCreateEntity;
import com.dsg.standardization.entity.TaskStdCreateResultEntity;
import com.dsg.standardization.mapper.RuleMapper;
import com.dsg.standardization.mapper.TaskStdCreateMapper;
import com.dsg.standardization.mapper.TaskStdCreateResultMapper;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.http.Header;
import org.apache.http.message.BasicHeader;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.dsg.standardization.service.AfStdTaskService;
import com.dsg.standardization.service.IDataElementInfoService;
import com.dsg.standardization.service.IDictService;
import com.dsg.standardization.service.TaskStdCreateService;


import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Service("afStdTaskService")
public class AfStdTaskServiceImpl implements AfStdTaskService {

    @Autowired
    IDataElementInfoService iDataElementInfoService;

    @Autowired
    IDictService iDictService;

    @Autowired
    Configruation configruation;


    @Autowired
    TaskStdCreateService taskStdCreateService;

    @Autowired
    TaskStdCreateMapper taskStdCreateMapper;

    @Autowired
    TaskStdCreateResultMapper taskStdCreateResultMapper;

    @Autowired
    private RuleMapper ruleMapper;



    /**
     * 标准创建调用推销算法执行推荐逻辑的线程池
     */
    ExecutorService stdCreateExecutorPool = Executors.newFixedThreadPool(10);

    /**
     * 标准推荐
     *
     * @param taskDto
     * @return
     */
    @Override
    public Result<CustomTaskRecDto> stdRec(CustomTaskRecDto taskDto) {
        try {
            Map<String, List<DataElementInfo>> recData = getRecDataFromRecService(taskDto);
            stdRecFillRecData(taskDto, recData);
            CustomTaskRecDto result = createRecResultData(taskDto);
            log.info("返回推荐结果给AF,返回结果：{}", JsonUtils.obj2json(result));
            return Result.success(result);
        } catch (Exception e) {
            log.error("调用标荐算法服务异常，url:{}", configruation.getRecServiceUrl(), e);
            return Result.success(createRecResultData(taskDto));
        }
    }

    /**
     * 弹框中标准推荐
     * @param taskDto
     * @return
     */
    @Override
    public Result<CustomStandRecDto> queryStandRec(CustomStandRecDto taskDto) {
        try {
            Map<String, List<DataElementInfo>> recData = getStandRecDataFromRecService(taskDto);
            getStdRecFillRecData(taskDto, recData);
            CustomStandRecDto result = getStandRecResultData(taskDto);
            log.info("标准推荐结果给AF,返回结果：{}", JsonUtils.obj2json(result));
            return Result.success(result);
        } catch (Exception e) {
            log.error("调用标准荐算法服务异常，url:{}", configruation.getRecServiceUrl(), e);
            return Result.success(getStandRecResultData(taskDto));
        }
    }


    /**
     * 调用推荐算法
     * @param taskDto
     * @return
     */
    public Map<String, List<DataElementInfo>> getRecDataFromRecService(CustomTaskRecDto taskDto) {

        DeRecDto deRecDto = new DeRecDto();
        deRecDto.setTableName(taskDto.getTable());
        deRecDto.setDepartmentId(taskDto.getDepartmentId());
        List<DeRecDto.Field> fieldList = new ArrayList<>();
        deRecDto.setTableFields(fieldList);
        for (CustomTbFieldDto row : taskDto.getTableFields()) {
            DeRecDto.Field field = new DeRecDto.Field();
            field.setTableFieldName(row.getTableField());
            fieldList.add(field);
        }

        Long start = System.currentTimeMillis();
        HttpResponseVo resp;
        try {
            String body = JsonUtils.obj2json(deRecDto);
            log.info("开始调用推荐算法服务，url:{},request body： {}", configruation.getRecServiceUrl(), body);
            resp = HttpUtil.httpPost(configruation.getRecServiceUrl(), body, null);
        } catch (Exception e) {
            log.error("调用标荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecServiceUrl(), System.currentTimeMillis() - start, e);
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }
        if (resp == null) {
            log.error("调用标荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecServiceUrl(), System.currentTimeMillis() - start);
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }

        if (resp.getCode() != HttpStatus.OK.value()) {
            log.error("调用标荐算法服务异常，url:{}，耗时：{}毫秒，返回信息为:{} ", configruation.getRecServiceUrl(), System.currentTimeMillis() - start, resp.getResult());
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }

        log.info("调用推荐算法服务结束，url:{}，耗时：{}毫秒 ", configruation.getRecServiceUrl(), System.currentTimeMillis() - start);
        log.info("调用推荐算法服务结束返回结果，{}", resp.getResult());
        DeRecDto resultData = JsonUtils.json2Obj(resp.getResult(), DeRecDto.class);

        // 推荐结果字段和数据元的映射map
        Map<String, List<DataElementInfo>> fieldRecStdMap = new HashMap<>();

        List<DeRecDto.Field> tableFields = resultData.getTableFields();
        if (CustomUtil.isEmpty(tableFields)) {
            return fieldRecStdMap;
        }

        // 获取到推荐的所有数据元code
        Set<Long> stdCodes = new HashSet<>();
        for (DeRecDto.Field field : tableFields) {
            if (CustomUtil.isEmpty(field.getRecStds())) {
                continue;
            }
            for (DeRecDto.Std recStd : field.getRecStds()) {
                if (CustomUtil.isNotEmpty(recStd.getStdCode())) {
                    stdCodes.add(recStd.getStdCode());
                }
            }
        }
        // 根据推荐的数据元code做信息补全，并且去掉code不存在的部分数据。
        Map<Long, DataElementInfo> codeStdCacheMap = getStdMap(stdCodes);

        // 组装字段和推荐的数据元map，key:字段名称，value:推荐的数据元列表
        for (DeRecDto.Field field : tableFields) {
            String fieldName = field.getTableFieldName();
            if (CustomUtil.isEmpty(field.getRecStds())) {
                continue;
            }
            for (DeRecDto.Std recStd : field.getRecStds()) {
                Long stdCode = recStd.getStdCode();
                DataElementInfo tempDe = codeStdCacheMap.get(stdCode);
                if (tempDe != null) {
                    if (!fieldRecStdMap.containsKey(fieldName)) {
                        List<DataElementInfo> tempList = new ArrayList<>();
                        fieldRecStdMap.put(fieldName, tempList);
                    }
                    List<DataElementInfo> tempList = fieldRecStdMap.get(fieldName);
                    tempList.add(tempDe);
                    // 推荐结果只保留三个
                    if (tempList.size() >= 3) {
                        break;
                    }
                }
            }
        }
        return fieldRecStdMap;
    }

    /**
     * 创建推荐的返回结果结构体
     * @param taskDto
     * @return
     */
    private CustomTaskRecDto createRecResultData(CustomTaskRecDto taskDto) {
        CustomTaskRecDto result = new CustomTaskRecDto();
        result.setTable(taskDto.getTable());
        result.setTableDescription(taskDto.getTableDescription());
        List<CustomTbFieldDto> fields = new ArrayList<>();
        result.setTableFields(fields);
        for (CustomTbFieldDto row : taskDto.getTableFields()) {
            CustomTbFieldDto field = new CustomTbFieldDto();
            field.setTableField(row.getTableField());
            field.setTableFieldDescription(row.getTableFieldDescription());
            field.setStdRefFile(row.getStdRefFile());
            field.setRecStds(row.getRecStds());
            fields.add(field);
        }
        return result;
    }

    /**
     * 标准推荐填充推荐结果
     *
     * @param taskDto
     */
    private void stdRecFillRecData(CustomTaskRecDto taskDto, Map<String, List<DataElementInfo>> recData) {
        if (CustomUtil.isEmpty(recData)) {
            return;
        }
        Map<Long, DictVo> codeDictCacheMap = getDictMap(recData);
        for (CustomTbFieldDto field : taskDto.getTableFields()) {
            String fieldName = field.getTableField();
            List<DataElementInfo> recDataElementInfoList = recData.get(fieldName);
            if (CustomUtil.isEmpty(recDataElementInfoList)) {
                continue;
            }
            List<RecStdVo> resultRecStds = new ArrayList<>();
            for (DataElementInfo de : recDataElementInfoList) {
                RecStdVo recStd = new RecStdVo();
                recStd.setId(de.getId());
                recStd.setStdCode(String.valueOf(de.getCode()));
                recStd.setStdEnName(de.getNameEn());
                recStd.setStdChName(de.getNameCn());
                recStd.setDataLength(de.getDataLength());
                recStd.setDataPrecision(de.getDataPrecision());
                recStd.setDataType(de.getDataType() == null ? "" : de.getDataType().getMessage());
                recStd.setStdType(de.getStdType().getMessage());
                DictVo dictVo = codeDictCacheMap.get(de.getDictCode());
                recStd.addDict(dictVo);
                recStd.setDataRange(iDataElementInfoService.getDataRange(de, dictVo));
                resultRecStds.add(recStd);
            }
            field.setRecStds(resultRecStds);
        }
    }


    /**
     * 获取标准推荐填充推荐结果
     * @param taskDto
     */
    private void getStdRecFillRecData(CustomStandRecDto taskDto, Map<String, List<DataElementInfo>> recData) {
        if (CustomUtil.isEmpty(recData)) {
            return;
        }
        Map<Long, DictVo> codeDictCacheMap = getDictMap(recData);
        for (CustomStandTbFieldDto field : taskDto.getTableFields()) {
            String fieldName = field.getTableField();
            List<DataElementInfo> recDataElementInfoList = recData.get(fieldName);
            if (CustomUtil.isEmpty(recDataElementInfoList)) {
                continue;
            }
            List<RecStdVo> resultRecStds = new ArrayList<>();
            for (DataElementInfo de : recDataElementInfoList) {
                RecStdVo recStd = new RecStdVo();
                recStd.setId(de.getId());
                recStd.setStdCode(String.valueOf(de.getCode()));
                recStd.setStdEnName(de.getNameEn());
                recStd.setStdChName(de.getNameCn());
                recStd.setDataLength(de.getDataLength());
                recStd.setDataPrecision(de.getDataPrecision());
                recStd.setDataType(de.getDataType() == null ? "" : de.getDataType().getMessage());
                recStd.setStdType(de.getStdType().getMessage());
                DictVo dictVo = codeDictCacheMap.get(de.getDictCode());
                recStd.addDict(dictVo);
                recStd.setDataRange(iDataElementInfoService.getDataRange(de, dictVo));
                resultRecStds.add(recStd);
            }
            field.setRecStds(resultRecStds);
        }
    }


    private Map<Long, DictVo> getDictMap(Map<String, List<DataElementInfo>> codeStdCacheMap) {
        Set<Long> dictCodeSet = new HashSet<>();
        for (Map.Entry<String, List<DataElementInfo>> row : codeStdCacheMap.entrySet()) {
            for (DataElementInfo de : row.getValue()) {
                dictCodeSet.add(de.getDictCode());
            }
        }
        return getDictMap(dictCodeSet);
    }

    @NotNull
    private Map<Long, DictVo> getDictMap(Set<Long> dictCodeSet) {
        List<DictVo> dictVos = iDictService.queryByCodes(dictCodeSet, true);
        Map<Long, DictVo> dictMap = new HashMap<>();
        for (DictVo row : dictVos) {
            DictVo temp = new DictVo();
            temp.setChName(row.getChName());
            temp.setEnName(row.getEnName());
            temp.setCode(row.getCode());
            List<DictEnumVo> enumVoList = new ArrayList<>();
            temp.setEnums(enumVoList);
            if (CustomUtil.isNotEmpty(row.getEnums())) {
                for (DictEnumVo enumVo : row.getEnums()) {
                    DictEnumVo tempEnumVo = new DictEnumVo();
                    tempEnumVo.setCode(enumVo.getCode());
                    tempEnumVo.setValue(enumVo.getValue());
                    enumVoList.add(tempEnumVo);
                }
            }
            dictMap.put(row.getCode(), temp);
        }
        return dictMap;
    }

    private Map<Long, DataElementInfo> getStdMap(Set<Long> stdCodes) {
        List<DataElementInfo> dataElementInfoList = iDataElementInfoService.queryByCodes(stdCodes);
        Map<Long, DataElementInfo> codeStdCacheMap = new HashMap<>();
        for (DataElementInfo row : dataElementInfoList) {
            if (EnableDisableStatusEnum.ENABLE.equals(row.getState())) {
                codeStdCacheMap.put(row.getCode(), row);
            }
        }
        return codeStdCacheMap;
    }


    @Override
    public Result stdCreate(CustomTaskCreateDto taskDto) {
        Result<Long> result = taskStdCreateService.createTask(taskDto);
        if (!result.getCode().equals(ErrorCodeEnum.SUCCESS.getErrorCode())) {
            return result;
        }
        Long id = result.getData();
        stdCreateExecutorPool.submit(() -> stcCreateFillRecData(id, taskDto));
        return Result.success();
    }

    @Override
    public void sendReulst2AF(Long id) {
        TaskStdCreateEntity exist = taskStdCreateMapper.queryById(id);
        List<TaskResultVo> tableFields = taskStdCreateResultMapper.queryByTaskId(id);

        CustomTaskCreateDto result = new CustomTaskCreateDto();
        result.setTaskNo(exist.getTaskNo());
        result.setTable(exist.getTable());
        result.setTableDescription(exist.getTableDescription());

        List<CustomTbFieldDto> resultTableFields = new ArrayList<>(tableFields.size());
        result.setTableFields(resultTableFields);

        Set<Long> stdCodes = new HashSet<>();
        for (TaskResultVo field : tableFields) {
            if (CustomUtil.isNotEmpty((field.getStdCode()))) {
                stdCodes.add(Long.parseLong(field.getStdCode()));
            }
        }
        // 根据推荐的数据元code做信息补全，并且去掉code不存在的部分数据。
        Map<Long, DataElementInfo> stdMap = getStdMap(stdCodes);


        // 获取数据元关联的字典
        Set<Long> dictCodeSet = new HashSet<>();
        for (Map.Entry<Long, DataElementInfo> row : stdMap.entrySet()) {
            Long dictCode = row.getValue().getDictCode();
            if (CustomUtil.isNotEmpty(dictCode)) {
                dictCodeSet.add(row.getValue().getDictCode());
            }
        }
        Map<Long, DictVo> dictMap = getDictMap(dictCodeSet);

        for (TaskResultVo row : tableFields) {
            String deCodeStr = row.getStdCode();
            Long deCode = deCodeStr == null ? 0l : Long.parseLong(deCodeStr);
            DataElementInfo de = stdMap.get(deCode);
            if (CustomUtil.isEmpty(de)) {
                continue;
            }

            CustomTbFieldDto field = new CustomTbFieldDto<>();
            field.setTableField(row.getTableField());
            field.setTableFieldDescription(row.getTableFieldDescription());
            field.setStdRefFile(row.getStdRefFile());

            RecStdVo recStd = new RecStdVo();
            recStd.setId(de.getId());
            recStd.setStdCode(String.valueOf(de.getCode()));
            recStd.setStdEnName(de.getNameEn());
            recStd.setStdChName(de.getNameCn());
            recStd.setDataLength(de.getDataLength());
            recStd.setDataPrecision(de.getDataPrecision());
            recStd.setDataType(de.getDataType() == null ? "" : de.getDataType().getMessage());
            recStd.setStdType(de.getStdType().getMessage());
            DictVo dictVo = dictMap.get(de.getDictCode());
            recStd.addDict(dictVo);
            recStd.setDataRange(iDataElementInfoService.getDataRange(de, dictVo));
            field.setRecStds(recStd);
            resultTableFields.add(field);
        }
        try {
            Header headers = new BasicHeader(Constants.HTTP_HEADER_TOKEN_KEY, CustomUtil.getToken());
            HttpUtil.httpPost(exist.getWebhook(), JsonUtils.obj2json(result), new Header[]{headers});
        } catch (Exception e) {
            log.error("调用AF服务异常，结果推送失败,url={}", exist.getWebhook(), e);
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用AF服务异常，结果推送失败！");
        }
    }


    /**
     * 标准创建填充推荐结果
     *
     * @param id
     * @param taskDto
     */
    private void stcCreateFillRecData(Long id, CustomTaskCreateDto taskDto) {
        List<TaskResultVo> resultEntityList = taskStdCreateResultMapper.queryByTaskId(id);

        CustomTaskRecDto recDto = new CustomTaskRecDto();
        CustomUtil.copyProperties(taskDto, recDto);

        List<CustomTbFieldDto> recFields = new ArrayList<>();
        CustomUtil.copyListProperties(resultEntityList, recFields, CustomTbFieldDto.class);
        recDto.setTableFields(recFields);
        Map<String, List<DataElementInfo>> recDataMap = getRecDataFromRecService(recDto);

        for (TaskResultVo field : resultEntityList) {
            String fieldName = field.getTableField();
            List<DataElementInfo> recDataList = recDataMap.get(fieldName);
            if (CustomUtil.isEmpty(recDataList)) {
                continue;
            }

            List<Long> stdCodeList = new ArrayList<>();
            for (DataElementInfo row : recDataList) {
                stdCodeList.add(row.getCode());
            }
            TaskStdCreateResultEntity updateResultEntity = new TaskStdCreateResultEntity();
            updateResultEntity.setId(field.getId());
            updateResultEntity.setRecStdCodes(StringUtils.join(stdCodeList, ","));
            taskStdCreateResultMapper.updateById(updateResultEntity);
        }
    }


    @Override
    public DeRecDto recMock(DeRecDto taskDto) {

        DeRecDto result = new DeRecDto();
        result.setTableName(taskDto.getTableName());

        List<DeRecDto.Field> tableFields = taskDto.getTableFields();
        List<DeRecDto.Field> resultFieldList = new ArrayList<>();
        result.setTableFields(resultFieldList);
        if (CustomUtil.isNotEmpty(tableFields)) {
            for (DeRecDto.Field field : tableFields) {
                QueryWrapper queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("f_deleted", 0);
                queryWrapper.eq("f_state", 1);
                queryWrapper.like("f_name_cn", field.getTableFieldName());
                List<DataElementInfo> dataList = iDataElementInfoService.getBaseMapper().selectList(queryWrapper);
                if (CustomUtil.isNotEmpty(dataList)) {
                    DeRecDto.Field tempField = new DeRecDto.Field();
                    tempField.setTableFieldName(field.getTableFieldName());
                    setRecData(tempField, dataList);
                    resultFieldList.add(tempField);
                }
            }

        }
        return result;
    }

    /**
     * 取名字最短的3条记录
     *
     * @param dataList
     * @return
     */
    private void setRecData(DeRecDto.Field field, List<DataElementInfo> dataList) {
        Set<Integer> set = new TreeSet<>();
        Map<Integer, List<DataElementInfo>> map = new HashMap<>();
        for (DataElementInfo row : dataList) {
            int length = row.getNameCn().length();
            set.add(length);
            if (!map.containsKey(length)) {
                List<DataElementInfo> list = new ArrayList<>();
                map.put(length, list);
            }
            map.get(length).add(row);
        }

        List<DeRecDto.Std> recStdVoList = new ArrayList<>();
        List<Long> codeList = new ArrayList<>();
        for (Integer row : set) {
            if (codeList.size() > 3) {
                break;
            }
            List<DataElementInfo> list = map.get(row);
            for (DataElementInfo rowDe : list) {
                if (codeList.size() < 3) {
                    codeList.add(rowDe.getCode());
                    DeRecDto.Std recStdVo = new DeRecDto.Std();
                    recStdVo.setStdChName(rowDe.getNameCn());
                    recStdVo.setStdCode(rowDe.getCode());
                    recStdVoList.add(recStdVo);
                } else {
                    break;
                }
            }
        }

        field.setRecStds(recStdVoList);
    }


    @Override
    public Result<List<RoleRecTableDataVo>> queryRuleRecList(CustomRuleRecDto ruleDto) {
            Long start = System.currentTimeMillis();
            HttpResponseVo resp;
            try {
                String body = JsonUtils.obj2json(ruleDto);
                log.info("开始调用规则推荐算法服务，url:{},request body： {}", configruation.getRecRuleServiceUrl(), body);
                resp = HttpUtil.httpPost(configruation.getRecRuleServiceUrl(), body, null);
            } catch (Exception e) {
                log.error("调用规则推荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecRuleServiceUrl(), System.currentTimeMillis() - start, e);
                throw new CustomException(ErrorCodeEnum.UnKnowException, "调用规则推荐算法服务异常");
            }
            if (resp == null) {
                log.error("调用规则推荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecRuleServiceUrl(), System.currentTimeMillis() - start);
                throw new CustomException(ErrorCodeEnum.UnKnowException, "调用规则推荐算法服务异常");
            }

            if (resp.getCode() != HttpStatus.OK.value()) {
                log.error("调用规则推荐算法服务异常，url:{}，耗时：{}毫秒，返回信息为:{} ", configruation.getRecRuleServiceUrl(), System.currentTimeMillis() - start, resp.getResult());
                throw new CustomException(ErrorCodeEnum.UnKnowException, "调用规则推荐算法服务异常");
            }

            log.info("调用规则推荐算法服务结束，url:{}，耗时：{}毫秒 ", configruation.getRecRuleServiceUrl(), System.currentTimeMillis() - start);
            log.info("调用规则推荐算法服务结束返回结果，{}", resp.getResult());
            RuleRecVo resultData = JsonUtils.json2Obj(resp.getResult(), RuleRecVo.class);
            if (CustomUtil.isEmpty(resultData)) {
                return  Result.success();
            }
            List<RoleRecTableDataVo> tableFields = resultData.getData();
            if (CustomUtil.isEmpty(tableFields)) {
                return  Result.success(tableFields);
            }

            // 获取到推荐的所有编码规则ID
            Set<Long> stdCodes = new HashSet<>();
            for (RoleRecTableDataVo tables : tableFields) {
                List<RoleRecFieldsDataVo> tablesList = tables.getFields();
                if (CustomUtil.isEmpty(tablesList)) {
                    continue;
                }
                for (RoleRecFieldsDataVo fileds : tablesList) {
                    List<RoleRecDataVo> recList = fileds.getRec();
                    if (CustomUtil.isEmpty(recList)) {
                        continue;
                    }
                    for (RoleRecDataVo ruleRec : recList) {
                        if (CustomUtil.isNotEmpty(ruleRec.getRule_id())) {
                            stdCodes.add(Long.valueOf(ruleRec.getRule_id()));
                        }
                    }
                }
            }
            if (CustomUtil.isEmpty(stdCodes)){
                return  Result.success(tableFields);
            }
            // 根据推荐的编码规则Id做信息补全，并且去掉Id不存在的部分数据。
            Map<Long, OrgTypeEnum> codeStdCacheMap = getRulesOrgTypeEnumMap(stdCodes);

            // 组装字段和推荐的数据元map，key:字段名称，value:推荐的数据元列表
            for (RoleRecTableDataVo tables : tableFields) {
                List<RoleRecFieldsDataVo> tablesList = tables.getFields();
                if (CustomUtil.isEmpty(tablesList)) {
                    continue;
                }
                for (RoleRecFieldsDataVo fileds : tablesList) {
                    List<RoleRecDataVo> recList = fileds.getRec();
                    if (CustomUtil.isEmpty(recList)) {
                        continue;
                    }
                    List<RoleRecDataVo> ruleRecList = new ArrayList<>();
                    for (RoleRecDataVo ruleRec : recList) {
                        if (CustomUtil.isEmpty(ruleRec.getRule_id())) {
                            continue;
                        }
                        Long ruleId = Long.valueOf(ruleRec.getRule_id());
                        OrgTypeEnum tempDe = codeStdCacheMap.get(ruleId);
                        if (tempDe != null) {
                            ruleRec.setOrgType(tempDe);
                            if(ruleRecList.size()>=3){
                               break;
                            }else{
                                ruleRecList.add(ruleRec);
                            }
                        }
                    }
                    fileds.setRec(ruleRecList);
                }
            }
        return Result.success(tableFields);
    }

    private Map<Long, OrgTypeEnum> getRulesOrgTypeEnumMap(Set<Long> ruleIds) {
        LambdaQueryWrapper<RuleEntity> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.in(RuleEntity::getId,ruleIds);
        List<RuleEntity> ruleList = ruleMapper.selectList(queryWrapper);
        Map<Long, OrgTypeEnum> codeStdCacheMap = new HashMap<>();
        for (RuleEntity row : ruleList) {
            if (EnableDisableStatusEnum.ENABLE.equals(row.getState())) {
                codeStdCacheMap.put(row.getId(), row.getOrgType());
            }
        }
        return codeStdCacheMap;
    }

    /**
     * 弹框调用推荐算法
     * @param taskDto
     * @return
     */
    public Map<String, List<DataElementInfo>> getStandRecDataFromRecService(CustomStandRecDto taskDto) {

        DeRecDto deRecDto = new DeRecDto();
        deRecDto.setTableName(taskDto.getTableName());
        deRecDto.setDepartmentId(taskDto.getDepartmentId());
        List<DeRecDto.Field> fieldList = new ArrayList<>();
        deRecDto.setTableFields(fieldList);
        for (CustomStandTbFieldDto row : taskDto.getTableFields()) {
            DeRecDto.Field field = new DeRecDto.Field();
            field.setTableFieldName(row.getTableField());
            fieldList.add(field);
        }

        Long start = System.currentTimeMillis();
        HttpResponseVo resp;
        try {
            String body = JsonUtils.obj2json(deRecDto);
            log.info("弹框开始调用推荐算法服务，url:{},request body： {}", configruation.getRecServiceUrl(), body);
            resp = HttpUtil.httpPost(configruation.getRecServiceUrl(), body, null);
        } catch (Exception e) {
            log.error("弹框调用标荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecServiceUrl(), System.currentTimeMillis() - start, e);
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }
        if (resp == null) {
            log.error("弹框调用标荐算法服务异常，url:{}，耗时：{}毫秒", configruation.getRecServiceUrl(), System.currentTimeMillis() - start);
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }

        if (resp.getCode() != HttpStatus.OK.value()) {
            log.error("弹框调用标荐算法服务异常，url:{}，耗时：{}毫秒，返回信息为:{} ", configruation.getRecServiceUrl(), System.currentTimeMillis() - start, resp.getResult());
            throw new CustomException(ErrorCodeEnum.UnKnowException, "调用标荐算法服务异常");
        }

        log.info("弹框调用推荐算法服务结束，url:{}，耗时：{}毫秒 ", configruation.getRecServiceUrl(), System.currentTimeMillis() - start);
        log.info("弹框调用推荐算法服务结束返回结果，{}", resp.getResult());
        DeRecDto resultData = JsonUtils.json2Obj(resp.getResult(), DeRecDto.class);

        // 推荐结果字段和数据元的映射map
        Map<String, List<DataElementInfo>> fieldRecStdMap = new HashMap<>();

        List<DeRecDto.Field> tableFields = resultData.getTableFields();
        if (CustomUtil.isEmpty(tableFields)) {
            return fieldRecStdMap;
        }

        // 获取到推荐的所有数据元code
        Set<Long> stdCodes = new HashSet<>();
        for (DeRecDto.Field field : tableFields) {
            if (CustomUtil.isEmpty(field.getRecStds())) {
                continue;
            }
            for (DeRecDto.Std recStd : field.getRecStds()) {
                if (CustomUtil.isNotEmpty(recStd.getStdCode())) {
                    stdCodes.add(recStd.getStdCode());
                }
            }
        }
        // 根据推荐的数据元code做信息补全，并且去掉code不存在的部分数据。
        Map<Long, DataElementInfo> codeStdCacheMap = getStdMap(stdCodes);

        // 组装字段和推荐的数据元map，key:字段名称，value:推荐的数据元列表
        for (DeRecDto.Field field : tableFields) {
            String fieldName = field.getTableFieldName();
            if (CustomUtil.isEmpty(field.getRecStds())) {
                continue;
            }
            for (DeRecDto.Std recStd : field.getRecStds()) {
                Long stdCode = recStd.getStdCode();
                DataElementInfo tempDe = codeStdCacheMap.get(stdCode);
                if (tempDe != null) {
                    if (!fieldRecStdMap.containsKey(fieldName)) {
                        List<DataElementInfo> tempList = new ArrayList<>();
                        fieldRecStdMap.put(fieldName, tempList);
                    }
                    List<DataElementInfo> tempList = fieldRecStdMap.get(fieldName);
                    tempList.add(tempDe);
                    // 推荐结果只保留三个
                    if (tempList.size() >= 3) {
                        break;
                    }
                }
            }
        }
        return fieldRecStdMap;
    }

    /**
     * 标准推荐的返回结果结构体
     * @param taskDto
     * @return
     */
    private CustomStandRecDto getStandRecResultData(CustomStandRecDto taskDto) {
        CustomStandRecDto result = new CustomStandRecDto();
        result.setTableName(taskDto.getTableName());
        result.setTableDescription(taskDto.getTableDescription());
        List<CustomStandTbFieldDto> fields = new ArrayList<>();
        result.setTableFields(fields);
        for (CustomStandTbFieldDto row : taskDto.getTableFields()) {
            CustomStandTbFieldDto field = new CustomStandTbFieldDto();
            field.setTableField(row.getTableField());
            field.setTableFieldDescription(row.getTableFieldDescription());
            field.setStdRefFile(row.getStdRefFile());
            field.setRecStds(row.getRecStds());
            fields.add(field);
        }
        return result;
    }
}

