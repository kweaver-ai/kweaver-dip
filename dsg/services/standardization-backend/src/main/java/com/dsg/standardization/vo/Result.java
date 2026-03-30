package com.dsg.standardization.vo;


import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.util.CustomUtil;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.google.common.collect.Maps;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.Serializable;
import java.util.Optional;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.common.api
 * @Date: 2022/11/14 10:08
 */
@Data
@ApiModel(description = "接口返回对象")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Result<T> implements Serializable {
    private static final long serialVersionUID = 1;

    /**
     * 返回代码
     */
    @ApiModelProperty(value = "返回代码")
    private String code;

    /**
     * 返回消息
     */
    @ApiModelProperty(value = "返回消息")
    private String description = "";

    /**
     * 返回消息
     */
    @ApiModelProperty(value = "总条数，默认20")
    private Long totalCount;

    /**
     * 触发原因
     */
    @ApiModelProperty(value = "错误细节")
    private Object detail;

    /**
     * 解决对策
     */
    @ApiModelProperty(value = "解决对策")
    private String solution = "";

    /**
     * 返回数据对象
     */
    @ApiModelProperty(value = "返回数据对象")
    private T data;


    private static String serviceName;

    public static void setServiceName(String serviceName) {
        Result.serviceName = serviceName;

    }


    /**
     * 操作成功返回消息、消息码和数据对象
     *
     * @return
     */
    public static <T> Result<T> success() {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getErrorMsg());
        return r;
    }

    /**
     * 操作成功返回消息、消息码和数据对象
     *
     * @param data
     * @return
     */
    public static <T> Result<T> success(T data) {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getErrorMsg());
        r.setData(data);
        return r;
    }

    /**
     * 操作成功返回消息、消息码和数据对象】数据对象总条数，默认20
     *
     * @param data
     * @return
     */
    public static <T> Result<T> success(T data, Long totalCount) {
        Result<T> r = new Result<T>();
        r.setCode(ErrorCodeEnum.SUCCESS.getErrorCode());
        r.setDescription(ErrorCodeEnum.SUCCESS.getErrorMsg());
        r.setData(data);
        r.setTotalCount(totalCount);
        return r;
    }

    /**
     * @param e
     * @return
     */
    public static ResponseEntity<Result> error(CustomException e) {
        return Result.error(e, null);
    }


    public static ResponseEntity<Result> error(CustomException e, Object data) {
        return Result.error(HttpStatus.BAD_REQUEST, e, data);
    }


    public static ResponseEntity<Result> error(HttpStatus httpStatus, CustomException e, Object data) {
        Result r = new Result();
        r.setCode(buildErrorCode(e));
        r.setDescription(Optional.ofNullable(e.getDescription()).orElse(""));
        r.setDetail(Optional.ofNullable(e.getErrorDetails()).orElse(Maps.newHashMap()));
        r.setSolution(Optional.ofNullable(e.getSolution()).orElse(""));
        r.setData(data);
        return ResponseEntity.status(httpStatus)
                .body(r);
    }

    private static String buildErrorCode(CustomException e) {
        if (CustomUtil.isEmpty(serviceName)) {
            return e.getErrorCode();
        }
        return String.format("%s.%s", serviceName, e.getErrorCode());
    }

    public Integer getTotalCount() {
        if (null == totalCount) {
            return null;
        }
        return Integer.parseInt(totalCount.toString());
    }

    public void setTotalCount(Long totalCount) {
        this.totalCount = totalCount;
    }
}
