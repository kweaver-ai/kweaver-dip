package com.dsg.standardization.common.exception;

import lombok.Data;

import java.io.Serializable;
@Data
public class UnauthorizedException extends RuntimeException implements Serializable {
    /**
     * 错误码
     */
    protected String errorCode;

    /**
     * 错误描述
     */
    protected String description;


    public UnauthorizedException() {
        this.errorCode = "401";
        this.description = "无用户登录信息";
    }


}
