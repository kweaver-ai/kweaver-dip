package com.dsg.standardization.service.impl;


import com.dsg.standardization.entity.DataElementHistoryEntity;
import com.dsg.standardization.mapper.DataElementHistoryMapper;
import com.github.yulichang.base.MPJBaseServiceImpl;
import org.springframework.stereotype.Service;
import com.dsg.standardization.service.IDataElementHistoryService;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.service.impl 数据元历史信息表，服务实现类
 * @Date: 2023/1/31 10:08
 */
@Service
public class DataElementHistoryServiceImpl extends MPJBaseServiceImpl<DataElementHistoryMapper, DataElementHistoryEntity> implements IDataElementHistoryService {
}
