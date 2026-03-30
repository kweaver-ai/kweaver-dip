package com.dsg.standardization.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.dto.DictDto;
import com.dsg.standardization.dto.DictSearchDto;
import com.dsg.standardization.entity.DictEntity;
import com.dsg.standardization.vo.DictEnumVo;
import com.dsg.standardization.vo.DictVo;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.StdFileMgrVo;

import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;

public interface IDictService extends IService<DictEntity> {


    DictVo queryById(Long id);

    DictVo queryDetailByCode(Long code);

    Result create(DictDto dict);

    Result update(DictDto dict);

    Result delete(Long id);

    Result deleteBatch(String ids);

    void export(HttpServletResponse response, DictSearchDto search);

    void exportTemplate(HttpServletResponse response);

    void removeCatalog(List<Long> ids, Long catalogId);

    Result<List<DictVo>> queryList(Long catalogId,
                                   String keyword,
                                   Integer orgType,
                                   EnableDisableStatusEnum state,
                                   Integer offset,
                                   Integer limit,
                                   String sort,
                                   String direction,String departmentId);

    Result checkExist(Long id, String enName, String chName, OrgTypeEnum orgType);

    Result<List<DictEnumVo>> queryDictEnums(Long dictId, String keyword, Integer offset, Integer limit);


    Result queryUsedDataElementByDictId(Long id,
                                        Integer offset,
                                        Integer limit);

    List<DictVo> queryByCodes(Set<Long> dictCodeSet, boolean returnEnums);

    Result updateState(Long id, EnableDisableStatusEnum state, String reason);

    Result queryByStdFileCatalog(Long stdFileCatalogId,
                                 String keyword,
                                 Integer orgType,
                                 EnableDisableStatusEnum state,
                                 Integer offset,
                                 Integer limit,
                                 String sort,
                                 String direction,String departmentId);

    void addRelation(Long id, List<Long> relationDictList);

    List<DictVo> queryByFileId(Long id);

    void checkCatalogIdExist(Long catalogId);

    Result<List<DictVo>> queryPageByFileId(Long id, Integer offset, Integer limit);

    Result<List<DictVo>> queryByStdFile(Long fileId,
                          String keyword,
                          Integer orgType,
                          EnableDisableStatusEnum statusEnum,
                          Integer offset,
                          Integer limit,
                          String sort,
                          String direction,String departmentId);

    /**
     * 获取码表按目录分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByCatalog();

    /**
     * 获取码表按文件分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByFile();

    Result<Boolean> queryDataExists(Long filterId, Integer orgType, String chName, String enName,String departmentIds);

    Result<List<DictVo>> queryByIds(List<Long> ids);

    Result<List<StdFileMgrVo>> queryStdFilesById(Long id, Integer offset, Integer limit);

    Result<List<DictEnumVo>> getDictEnumList(Long dictId);
}
