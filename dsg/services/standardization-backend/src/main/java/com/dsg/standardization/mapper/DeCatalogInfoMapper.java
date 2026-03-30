package com.dsg.standardization.mapper;


import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.dsg.standardization.entity.DeCatalogInfo;

import java.io.Serializable;
import java.util.List;

/**
 * <p>
 * 数据元目录基本信息表 Mapper 接口
 * </p>
 *
 * @author WZY
 * @since 2022-11-12
 */
public interface DeCatalogInfoMapper extends BaseMapper<DeCatalogInfo> {
    List<DeCatalogInfo> getChildren(Serializable fParentId);
}
