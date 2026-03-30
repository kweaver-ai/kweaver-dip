package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.dsg.standardization.entity.DictEnumEntity;
import org.apache.ibatis.annotations.Param;

import java.util.List;


public interface DictEnumMapper extends BaseMapper<DictEnumEntity> {

    List<DictEnumEntity> queryByDictId(Long id);

    IPage<DictEnumEntity> queryList(Page<DictEnumEntity> page, Long dictId, String keyword);

    List<DictEnumEntity> queryByDictIds(List<Long> dictIds);

    void deleteByDictCodes(List<Long> dictCodes);

    void deleteByDictId(Long dictId);

    void save(@Param("dataList") List<DictEnumEntity> dataList);
}
