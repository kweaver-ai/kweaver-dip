package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dsg.standardization.common.enums.EnableDisableStatusEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.vo.excel.DictExcelVo;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.dto.CountGroupByFileDto;
import com.dsg.standardization.dto.DictDto;
import com.dsg.standardization.dto.DictSearchDto;
import com.dsg.standardization.entity.DictEntity;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Set;


public interface DictMapper extends BaseMapper<DictEntity> {

    IPage<DictEntity> queryList(IPage page,
                                @Param("catalogIds") List<Long> catalogIds,
                                @Param("keyword") String keyword,
                                @Param("orgType") Integer orgType,
                                @Param("state") EnableDisableStatusEnum state, @Param("departmentId") String departmentId);

    DictEntity queryEffectDictByCode(@Param("code") Long code);

    List<DictExcelVo> queryExportData(@Param("search") DictSearchDto search,
                                      @Param("catalogIds") List<Long> catalogIds);

    void removeCatalog(@Param("ids") List<Long> ids,
                       @Param("catalogId") Long catalogId,
                       @Param("updateUser") String updateUser);


    List<DictEntity> checkIsExist(@Param("enName") String enName,
                                  @Param("chName") String chName,
                                  @Param("id") Long id, OrgTypeEnum orgType);

    List<DictEntity> queryDictByCode(Long code);

    List<DictEntity> queryByCodes(Set<Long> dictCodes);

    void save(@Param("dataList") List<DictEntity> dataList);

    List<DictEntity> selectByNames(@Param("orgType") Integer orgType,
                                   @Param("list") List<DictDto> list, @Param("deptIds")String deptIds);

    void deleteByIds(@Param("idList") List<Long> idList);

    IPage<DictEntity> queryByStdFileCatalog(IPage page,
                                            @Param("catalogIds") List<Long> catalogIds,
                                            @Param("keyword") String keyword,
                                            @Param("orgType") Integer orgType,
                                            @Param("state") EnableDisableStatusEnum state);

    List<DictEntity> queryByFileId(@Param("fileId") Long fileId);

    void updateVersionByIds(@Param("idList") List<Long> idList,
                            @Param("updateUser") String updateUser);

    IPage<DictEntity> queryPageByFileId(IPage page, @Param("fileId") Long fileId);

    IPage<DictEntity> queryByStdFile(Page page,
                                     @Param("fileId") Long fileId,
                                     @Param("keyword") String keyword,
                                     @Param("orgType") Integer orgType,
                                     @Param("state") EnableDisableStatusEnum state,@Param("departmentId")String departmentId);

    IPage<DictEntity> queryDataNotUesdStdFile(Page page,
                                              @Param("keyword") String keyword,
                                              @Param("orgType") Integer orgType,
                                              @Param("state") EnableDisableStatusEnum state);

    @Select("SELECT COUNT(f_catalog_id) AS count,  f_catalog_id AS catalogId FROM t_de_dict WHERE f_deleted = 0  GROUP BY f_catalog_id ")
    List<CountGroupByCatalogDto> selectCatalogCountList();

    @Select("SELECT COUNT(1) AS COUNT, t.f_file_id AS fileId  FROM t_relation_dict_file t INNER JOIN t_de_dict t1 ON t.f_dict_id = t1.f_id WHERE t1.f_deleted = 0 GROUP BY  t.f_file_id")
    List<CountGroupByFileDto> selectFileCountList();

    List<DictEntity> queryData(@Param("filterId") Long filterId,
                                     @Param("orgType") Integer orgType,
                                     @Param("chName") String chName,
                                     @Param("enName") String enName,@Param("deptIds") String deptIds);
}
