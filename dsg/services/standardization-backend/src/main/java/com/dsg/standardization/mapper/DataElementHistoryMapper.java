package com.dsg.standardization.mapper;


import com.github.yulichang.base.MPJBaseMapper;
import com.dsg.standardization.entity.DataElementHistoryEntity;

import java.util.List;
import java.util.Set;

/**
 * <p>
 * 数据元历史信息表 Mapper 接口
 * </p>
 *
 * @author Wang ZiYu
 * @since 2022-11-22
 */
public interface DataElementHistoryMapper extends MPJBaseMapper<DataElementHistoryEntity> {

    Set<Long> queryUsedDictCode(List<Long> dictCodes);
}
