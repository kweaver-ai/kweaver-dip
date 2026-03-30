package com.dsg.standardization.service;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.RepeatTypeEnum;
import com.dsg.standardization.vo.DataElementVo.*;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.vo.CheckVo;
import com.dsg.standardization.vo.DataElementVo.*;
import com.dsg.standardization.vo.DictVo;
import com.dsg.standardization.vo.Result;
import com.github.yulichang.base.MPJBaseService;
import org.springframework.web.multipart.MultipartFile;


import javax.servlet.http.HttpServletResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * <p>
 * 数据元基本信息表 服务类
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
public interface IDataElementInfoService extends MPJBaseService<DataElementInfo> {
    List<DataElementInfo> getNoPageList(Long catalogId, String state, String keyword, Integer stdType);

    IPage<DataElementInfo> getPageList(Long catalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction, String departmentId);

    IPage<DataElementListVo> getPageListVo(Long catalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction);

    DataElementInfo getOneByIdOrCode(Integer type, Long value);

    /**
     * 新建数据元接受Post的传参校验
     *
     * @param dataElementInfo
     * @param type            0:创建，1：修改
     * @return
     */
    CheckVo<DataElementInfo> checkPost(DataElementInfo dataElementInfo, Integer type);

    /**
     * 查询单例数据元实体
     *
     * @param type  1：ID匹配,2:Code匹配
     * @param value
     * @return
     */
    CheckVo<DataElementInfo> checkIdOrCode(Integer type, Long value);

    /**
     * 查询数据元ID校验
     *
     * @param id
     * @return
     */
    CheckVo<DataElementInfo> checkID(Long id);

    /**
     * 查询数据元ID集合校验,通过校验时返回ID列表
     *
     * @param ids
     * @return
     */
    CheckVo<String> checkID(String ids);

    boolean dictUsed(Long dictCode);

    Set<Long> dictUsed(List<Long> dictCodes);

    /**
     * 判断是否发生版本迭代的变更
     *
     * @param oldInfo 变更前
     * @param newInfo 变更后
     * @return true：关键属性已变更，版本需要变化，false：关键属性未变更，无需变化
     */
    boolean isVersionChanged(DataElementInfo oldInfo, DataElementInfo newInfo);

    /**
     * 获取推送的变化字段
     *
     * @param oldInfo
     * @param newInfo
     * @return
     */
    Map<String, List<Object>> getPushChangedFields(DataElementInfo oldInfo, DataElementInfo newInfo);

    /**
     * 判断是否发生版本不迭代的变更
     *
     * @param oldInfo
     * @param newInfo
     * @return
     */
    boolean isNoVersionChanged(DataElementInfo oldInfo, DataElementInfo newInfo);

    /**
     * 判断是否发生需要推送消息的变更
     *
     * @param oldInfo
     * @param newInfo
     * @return
     */
    boolean isNeedPushChanged(DataElementInfo oldInfo, DataElementInfo newInfo);

    /**
     * 导入文件，成功时通过，失败时导出错误列表
     *
     * @param response
     * @param file
     * @param cls
     * @param catalogId
     */
    void importExcel(HttpServletResponse response, MultipartFile file, Class<DataElementExcelVo> cls, Long catalogId);

    /**
     * 导入文件，成功时返回回填信息
     *
     * @param response
     * @param file
     * @param cls
     * @param catalogId
     */
    List<DEImportSuccessVo> importExcelReturnMsg(HttpServletResponse response, MultipartFile file, Class<DataElementExcelVo> cls, Long catalogId);

    /**
     * 将列表转为excel导出
     *
     * @param response
     * @param cls
     * @param result
     */
    void exportExcel(HttpServletResponse response, Class<DataElementExcelVo> cls, List<DataElementExcelVo> result);

    /**
     * 下载数据元导入模板
     *
     * @param response
     */
    void exportExcelTemplate(HttpServletResponse response);

    CheckVo<String> checkFile(MultipartFile file);

    /**
     * 获得数据元详情
     * @param id
     * @return
     */
    DataElementDetailVo getDetailVo(Long id);

    List<DataElementInfo> queryByCodes(Set<Long> stdCodes);

    IPage<DataElementInfo> queryByRuleId(Long ruleId, Integer offset, Integer limit);

    IPage<DataElementInfo> queryByDictCode(Long code, Integer offset, Integer limit);

    /**
     * 计算数据元的值域并获取结果
     *
     * @param dataElementInfo
     * @return
     */
    String getDataRange(DataElementInfo dataElementInfo);

    /**
     * 计算数据元的值域并获取结果
     *
     * @param dataElementInfo
     * @return
     */
    String getDataRange(DataElementInfo dataElementInfo, DictVo dictVo);

    /**
     * 获取数据元按目录分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByCatalog();

    /**
     * 获取数据元按文件分布数据量Map
     *
     * @return
     */
    Map<Long, Integer> getCountMapGroupByFile();

    /**
     * 按文件目录查找数据元
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
    IPage<DataElementInfo> getPageListByFileCatalog(Long fileCatalogId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction);


    List<DataElementDetailVo> queryByIDOrCode(List<String>ids, List<String> codes);



    /**
     * 按文件查找数据元
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
    IPage<DataElementInfo> getPageListByFile(Long fileId, String state, String keyword, Integer stdType, Integer offset, Integer limit, String sort, String direction);


    void addRelation(Long id, List<Long> relationDeList);

    List<DataElementInfo> queryByFileId(Long id);

    void delete(List<Long> idList);

    void deleteByLabelIds(List<Long> idList);


    Result<List<DataElementInfo>> queryPageByFileId(Long id, Integer offset, Integer limit);

    /**
     * 将数据元列表包装为列表查询结果
     *
     * @param list
     * @return
     */
    List<DataElementListVo> getVoByEntities(List<DataElementInfo> list);

    /**
     * 清空数据元编码规则
     * @param id
     * @return
     */
    int deleteRuleId(Long id);

    /**
     * 分页查找数据元关联文件
     * @param id
     * @param offset
     * @param limit
     * @return
     */

    IPage<DataElementFileVo> getPageFileList(Long id, Integer offset, Integer limit);

    /**
     * 重名校验
     * @param name
     * @param type
     * @return
     */
    Boolean isRepeat(Long filterId, String name, OrgTypeEnum stdType, RepeatTypeEnum type, String departmentIds);

    Set<Long> ruleUsed(List<Long> ruleIds);

     String packageMqInfo(List<DataElementInfo> dataElementInfoList,String type);

    List<Long> queryRuleIdByDataCodes(List<Long> ruleIds);

    List<Long> queryDictIdByDataCodes(List<Long> dictIds);

    boolean updateBatchEnable(List<Long> ids, Integer stateCode, String reason);
}
