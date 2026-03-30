package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.RuleTypeEnum;
import com.dsg.standardization.dto.RuleDto;
import com.dsg.standardization.entity.RuleEntity;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.RuleVo;
import com.dsg.standardization.vo.StdFileMgrVo;

import java.util.List;
import java.util.Map;


/**
 * 编码规则表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 15:46:02
 */
public interface RuleService extends IService<RuleEntity> {

    RuleVo queryById(Long id);

    Result create(RuleDto dict);

    Result update(Long id, RuleDto dict);

    Result deleteBatch(String ids);

    Result removeCatalog(List<Long> ids, Long catalogId);

    Result queryUsedDataElementByRuleId(Long id, Integer offset, Integer limit);


    Result queryList(Long catalogId,
                     String keyword,
                     Integer orgType,
                     EnableDisableStatusEnum statusEnu,
                     Integer offset,
                     Integer limit,
                     String sort,
                     String direction, String departmentId, RuleTypeEnum ruleType);

    Result updateState(Long id, EnableDisableStatusEnum state, String reason);

    Result queryByIds(List<Long> ids);

    Result queryByStdFileCatalog(Long stdFileCatalogId,
                                 String keyword,
                                 Integer orgType,
                                 EnableDisableStatusEnum statusEnu,
                                 Integer offset,
                                 Integer limit,
                                 String sort,
                                 String direction, RuleTypeEnum ruleType);

    void addRelation(Long id, List<Long> relationRuleList);

    List<RuleVo> queryByFileId(Long id);

    Result<List<RuleVo>> queryPageByFileId(Long id, Integer offset, Integer limit);

    Result queryByStdFile(Long stdFileId,
                          String keyword,
                          Integer orgType,
                          EnableDisableStatusEnum statusEnum,
                          Integer offset,
                          Integer limit,
                          String sort,
                          String direction,String departmentId, RuleTypeEnum ruleType);

    /**
     * 获取编码规则按目录分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByCatalog();

    /**
     * 获取编码规则按文件分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByFile();

    Result<Boolean> queryDataExists(Long filterId, String name,String departmentIds);

    Result<List<StdFileMgrVo>> queryStdFilesById(Long id, Integer offset, Integer limit);

    RuleVo getDetailByDataId(Long dataId);

    RuleVo getDetailByDataCode(Long dataCode);
}

