package com.dsg.standardization.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.entity.StdFileMgrEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Date;
import java.util.List;


/**
 * 标准文件管理表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
@Mapper
public interface StdFileMgrMapper extends BaseMapper<StdFileMgrEntity> {

    List<StdFileMgrEntity> queryByNumber(@Param("number") String number);

    List<StdFileMgrEntity> queryByOrgTypeAndName(@Param("name") String name, @Param("orgType") int orgType);

    IPage<StdFileMgrEntity> queryList(Page<StdFileMgrEntity> page,
                                      @Param("catalogIds") List<Long> catalogIds,
                                      @Param("keyword") String keyword,
                                      @Param("orgType") Integer orgType,
                                      @Param("state") EnableDisableStatusEnum state, @Param("departmentId") String departmentId);

    int deleteByIds(@Param("idList") List<Long> idList);

    List<StdFileMgrEntity> queryByIds(@Param("idList") List<Long> ids);

    int removeCatalog(@Param("ids") List<Long> ids,
                      @Param("catalogId") Long catalogId,
                      @Param("updateUser") String updateUser);

    List<StdFileMgrEntity> queryData(@Param("filterId") Long filterId,
                                     @Param("number") String number,
                                     @Param("orgType") Integer orgType,
                                     @Param("name") String name,@Param("deptIds") String deptIds);

    @Select("select COUNT(f_catalog_id) AS count,  f_catalog_id AS catalogId from t_std_file where f_deleted = 0 group by f_catalog_id ")
    List<CountGroupByCatalogDto> selectCountList();

    void updateNumberActDate(@Param("id") Long id,
                             @Param("number") String number,
                             @Param("actDate") Date actDate);

    IPage<StdFileMgrEntity> queryStdFilesByDictId(Page<StdFileMgrEntity> page,
                                                  @Param("dictId") Long dictId);

    IPage<StdFileMgrEntity> queryStdFilesByRuleId(Page<StdFileMgrEntity> page,
                                                  @Param("ruleId") Long ruleId);
}
