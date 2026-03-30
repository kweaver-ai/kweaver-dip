package com.dsg.standardization.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.RuleTypeEnum;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.dto.CountGroupByFileDto;
import com.dsg.standardization.entity.RuleEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 编码规则表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 14:34:52
 */
@Mapper
public interface RuleMapper extends BaseMapper<RuleEntity> {
    IPage<RuleEntity> queryList(IPage page,
                                @Param("catalogIds") List<Long> catalogIds,
                                @Param("keyword") String keyword,
                                @Param("orgType") Integer orgType,
                                @Param("state") EnableDisableStatusEnum state, @Param("departmentId") String departmentId, @Param("ruleType") RuleTypeEnum ruleType);

    void removeCatalog(@Param("ids") List<Long> ids,
                       @Param("catalogId") Long catalogId,
                       @Param("updateUser") String updateUser);

    void deleteByIds(@Param("idList") List<Long> idList);

    List<RuleEntity> queryByIds(@Param("ids") List<Long> ids);

    List<RuleEntity> queryByNameAndOrgType(@Param("name") String name,
                                           @Param("orgType") OrgTypeEnum orgType);

    IPage<RuleEntity> queryByStdFileCatalog(IPage page,
                                            @Param("catalogIds") List<Long> catalogIds,
                                            @Param("keyword") String keyword,
                                            @Param("orgType") Integer orgType,
                                            @Param("state") EnableDisableStatusEnum state,@Param("ruleType") RuleTypeEnum ruleType);

    List<RuleEntity> queryByFileId(@Param("fileId") Long fileId);

    void updateVersionByIds(@Param("idList") List<Long> idList,
                            @Param("updateUser") String updateUser);

    IPage<RuleEntity> queryPageByFileId(IPage page, @Param("fileId") Long fileId);

    IPage<RuleEntity> queryDataNotUesdStdFile(Page<RuleEntity> page,
                                              @Param("keyword") String keyword,
                                              @Param("orgType") Integer orgType,
                                              @Param("state") EnableDisableStatusEnum state,@Param("ruleType") RuleTypeEnum ruleType);

    IPage<RuleEntity> queryByStdFile(Page<RuleEntity> page,
                                     @Param("fileId") Long fileId,
                                     @Param("keyword") String keyword,
                                     @Param("orgType") Integer orgType,
                                     @Param("state") EnableDisableStatusEnum state, @Param("departmentId") String departmentId, @Param("ruleType") RuleTypeEnum ruleType);

    @Select("select COUNT(f_catalog_id) AS count,  f_catalog_id AS catalogId from t_rule where f_deleted = 0 group by f_catalog_id ")
    List<CountGroupByCatalogDto> selectCountList();

    @Select("SELECT COUNT(1) AS COUNT, t.f_file_id AS fileId  FROM t_relation_rule_file t INNER JOIN t_rule t1 ON t.f_rule_id = t1.f_id WHERE t1.f_deleted = 0 GROUP BY  t.f_file_id")
    List<CountGroupByFileDto> selectFileCountList();

    List<RuleEntity> queryData(@Param("filterId") Long filterId,
                                     @Param("name") String name,@Param("deptIds") String deptIds);
}
