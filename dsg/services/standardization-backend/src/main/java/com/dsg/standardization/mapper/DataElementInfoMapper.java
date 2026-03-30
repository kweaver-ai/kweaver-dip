package com.dsg.standardization.mapper;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.github.yulichang.base.MPJBaseMapper;
import com.dsg.standardization.dto.CountGroupByFileDto;
import com.dsg.standardization.entity.DataElementInfo;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;
import java.util.Set;

/**
 * <p>
 * 数据元基本信息表 Mapper 接口
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
public interface DataElementInfoMapper extends MPJBaseMapper<DataElementInfo> {

    Set<Long> queryUsedDictCode(List<Long> dictCodes);

    IPage<DataElementInfo> queryByRuleId(IPage page, @Param("ruleId") Long ruleId);

    IPage<DataElementInfo> queryByDictCode(IPage page, @Param("dictCode") Long dictCode);

    List<DataElementInfo> queryByCodes(@Param("codes") Set<Long> codes);

    List<DataElementInfo> queryByFileId(@Param("fileId") Long fileId);

    void deleteByIds(@Param("idList") List<Long> idList);

    void deleteByLabelIds(@Param("idList") List<Long> idList);


    void updateVersionByIds(@Param("idList") List<Long> idList, @Param("updateUser") String updateUser);

    IPage<DataElementInfo> queryPageByFileId(IPage page, @Param("fileId") Long fileId);

    @Select("SELECT COUNT(1) AS COUNT, t.f_file_id AS fileId  FROM t_relation_de_file t INNER JOIN t_data_element_info t1 ON t.f_de_id = t1.f_de_id WHERE t1.f_deleted = 0 GROUP BY  t.f_file_id")
    List<CountGroupByFileDto> selectFileCountList();

    @Update("UPDATE t_data_element_info SET f_rule_id = null where f_de_id = #{id}")
    int deleteRuleId(Long id);

    Set<Long> queryByRuleIds(@Param("ruleIds") List<Long> ruleIds);

    List<Long> queryRuleIdByDataCodes(@Param("ruleIds") List<Long> ruleIds);

    List<Long> queryDictIdByDataCodes(@Param("dictIds") List<Long> dictIds);

    int updateBatchEnable(@Param("ids")List<Long> ids,@Param("stateCode") Integer stateCode,@Param("reason") String reason);
}
