package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dsg.standardization.entity.RelationDictFileEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface RelationDictFileMapper extends BaseMapper<RelationDictFileEntity> {


    void save(@Param("dataList") List<RelationDictFileEntity> relations);

    void deleteByDictId(@Param("dictId") Long dictId);

    List<RelationDictFileEntity> queryByDictId(@Param("dictId") Long dictId);

    void deleteByFileId(@Param("fileId") Long stdFileId);

    List<RelationDictFileEntity> queryByFileId(@Param("fileId") Long stdFileId);
}
