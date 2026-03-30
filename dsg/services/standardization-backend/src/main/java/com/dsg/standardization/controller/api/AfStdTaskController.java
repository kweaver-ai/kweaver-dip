package com.dsg.standardization.controller.api;


import com.dsg.standardization.common.util.JsonUtils;
import com.dsg.standardization.dto.*;
import com.dsg.standardization.service.AfStdTaskService;
import com.dsg.standardization.service.TaskStdCreateService;
import com.dsg.standardization.vo.Result;
import com.dsg.standardization.vo.RoleRecTableDataVo;
import com.github.xiaoymin.knife4j.annotations.ApiOperationSupport;
import com.github.xiaoymin.knife4j.annotations.ApiSort;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


/**
 * API-对接AF标准推荐&标准创建
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-19 17:06:34
 */
@Slf4j
@Api(tags = "API-对接AF标准推荐&标准创建")
@ApiSort(7)
@RestController
@RequestMapping("/v1/dataelement/task")
public class AfStdTaskController {
    @Autowired
    private AfStdTaskService aFStdTaskService;


    @Autowired
    private TaskStdCreateService taskStdCreateService;

    @ApiOperation(value = "获取标准推荐")
    @ApiOperationSupport(order = 1)
    @PostMapping(value = "/std-rec/rec")
    public Result<CustomTaskRecDto> queryStdRec(@Validated @RequestBody CustomTaskRecDto taskDto) {
        log.info("接收到AF发起的标准推荐请求，请求体：{}", JsonUtils.obj2json(taskDto));
        return aFStdTaskService.stdRec(taskDto);
    }

    @ApiOperation(value = "标准创建")
    @ApiOperationSupport(order = 2)
    @PostMapping(value = "/std-create")
    public Result<?> stdCreate(@Validated @RequestBody CustomTaskCreateDto taskDto) {
        log.info("接收到AF发起的标准创建请求，请求体：{}", JsonUtils.obj2json(taskDto));
        return aFStdTaskService.stdCreate(taskDto);
    }

    @ApiOperation(value = "获取弹框中标准推荐（新）")
    @ApiOperationSupport(order = 1)
    @PostMapping(value = "/stand-rec/rec")
    public Result<CustomStandRecDto> queryStnddRec(@Validated @RequestBody CustomStandRecDto taskDto) {
        log.info("AF发起获取标准推荐请求，请求体：{}", JsonUtils.obj2json(taskDto));
        return aFStdTaskService.queryStandRec(taskDto);
    }

    @ApiOperation(value = "标准创建mock服务（提供测试使用）")
    @ApiOperationSupport(order = 3)
    @PostMapping(value = "/rec/mock")
    public DeRecDto recMock(@Validated @RequestBody DeRecDto taskDto) {
        log.info("调用mock接口");
        return aFStdTaskService.recMock(taskDto);
    }


    @ApiOperation(value = "获取编码规则推荐")
    @ApiOperationSupport(order = 4)
    @PostMapping(value = "/rule-rec/rec")
    public Result<List<RoleRecTableDataVo>> queryRuleRecList(@Validated @RequestBody CustomRuleRecDto ruleDto) {
        log.info("接收到AF发起的编码规则推荐，请求体：{}", JsonUtils.obj2json(ruleDto));
        return aFStdTaskService.queryRuleRecList(ruleDto);
    }


}
