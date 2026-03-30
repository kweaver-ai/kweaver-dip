package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.dto.StdFileRealtionDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.StdFileMgrEntity;
import com.dsg.standardization.vo.DictVo;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.RuleVo;
import com.dsg.standardization.vo.StdFileMgrVo;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;


/**
 * 标准文件管理表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
public interface StdFileMgrService extends IService<StdFileMgrEntity> {

    StdFileMgrVo queryById(Long id);

    Result<StdFileMgrVo> create(String number, String name, Long catalog_id, Integer org_type, String act_date, String description, String attachment_type, String attachment_url, String state, String publish_date, String departmentIds, MultipartFile file) throws CustomException;

    Result<StdFileMgrVo> update(Long id, String number, String name, Long catalog_id, Integer org_type, String act_date, String description, String attachment_type, String attachment_url,String state,String publish_date, String departmentIds,MultipartFile file) throws CustomException;

    Result<List<StdFileMgrVo>> queryList(Long catalogId, String keyword, Integer orgType, EnableDisableStatusEnum state, Integer offset, Integer limit, String sort, String direction, String departmentId);

    Result batchDelete(String ids);

    Result batchInternalDelete(String ids);

    Result<List<StdFileMgrVo>> queryByIds(List<Long> ids);

    Result updateState(Long id, EnableDisableStatusEnum statusEnum, String disableReason);

    Result<Integer> removeCatalog(List<Long> ids, Long catalogId);

    void download(HttpServletResponse response, Long id);

    void downloadBatch(HttpServletResponse response, List<Long> ids);

    Result<List<DataElementInfo>> queryRelationDataElements(Long id, Integer offset, Integer limit);

    Result<List<DictVo>> queryRelationDicts(Long id, Integer offset, Integer limit);

    Result<List<RuleVo>> queryRelationRules(Long id, Integer offset, Integer limit);

    Result addRelation(Long id, StdFileRealtionDto realtionDto);

    Result<Map<String, Object>> queryRelations(Long id);

    Result<Boolean> queryDataExists(Long filterId, String number, Integer orgType, String name,String departmentIds);

    Map<Long, Integer> getCountMapGroupByCatalog();

    List<StdFileMgrEntity> getByName(String name);

}

