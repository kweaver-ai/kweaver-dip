package com.dsg.standardization.service;


import com.dsg.standardization.dto.*;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.RoleRecTableDataVo;


import java.util.List;


/**
 * 标准推荐任务表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-19 17:06:34
 */
public interface AfStdTaskService {

    Result<CustomTaskRecDto> stdRec(CustomTaskRecDto taskDto);

    Result stdCreate(CustomTaskCreateDto taskDto);

    void sendReulst2AF(Long id);

    DeRecDto recMock(DeRecDto taskDto);

    Result<List<RoleRecTableDataVo>> queryRuleRecList(CustomRuleRecDto ruleDto);

    Result<CustomStandRecDto> queryStandRec(CustomStandRecDto taskDto);
}

