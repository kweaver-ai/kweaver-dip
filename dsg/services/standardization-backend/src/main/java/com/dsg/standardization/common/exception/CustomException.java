package com.dsg.standardization.common.exception;


import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.BaseErrorInfoInterface;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.io.Serializable;

/**
 * 自定义异常
 */
@Data
@ApiModel("异常错误实体")
public class CustomException extends RuntimeException implements Serializable {
    /**
     * 错误码
     */
    @ApiModelProperty(value = "错误码", dataType = "java.lang.String")
    protected String errorCode;

    /**
     * 错误描述
     */
    @ApiModelProperty(value = "错误描述", dataType = "java.lang.String")
    protected String description;

    /**
     * 错误细节
     */
    @ApiModelProperty(value = "错误细节", dataType = "java.lang.Object")
    private Object errorDetails;

    /**
     * 错误处理建议
     */
    @ApiModelProperty(value = "错误处理建议", dataType = "java.lang.String")
    private String solution;

    /**
     * 错误信息地址
     */
    @ApiModelProperty(value = "错误信息地址", dataType = "java.lang.String")
    private String errorLink;

    public CustomException(String errorCode, String errorMsg) {
        this(errorCode, errorMsg, null, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }

    public CustomException(String errorCode, String errorMsg, Object errorDetails) {
        this(errorCode, errorMsg, errorDetails, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }

    public CustomException(String errorCode, String errorMsg, Object errorDetails, String solution) {
        super(String.valueOf(errorMsg));
        this.errorCode = errorCode;
        this.description = errorMsg;
        this.errorDetails = errorDetails;
        this.solution = solution;
        if (this.solution == null) {
            this.solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        }
    }


    public CustomException(BaseErrorInfoInterface errorInfoInterface, String errorMsg) {
        this(errorInfoInterface.getErrorCode(), errorMsg, null, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }

    public CustomException(BaseErrorInfoInterface errorInfoInterface) {
        this(errorInfoInterface.getErrorCode(), errorInfoInterface.getErrorMsg(), null, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }

    public CustomException(BaseErrorInfoInterface errorInfoInterface, Object detail) {
        this(errorInfoInterface.getErrorCode(), errorInfoInterface.getErrorMsg(), detail, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }

    public CustomException(BaseErrorInfoInterface errorInfoInterface, Object detail, String solution) {
        this(errorInfoInterface.getErrorCode(), errorInfoInterface.getErrorMsg(), detail, solution);
    }

    public CustomException(BaseErrorInfoInterface errorInfoInterface, String description, Object detail, String solution) {
        this(errorInfoInterface.getErrorCode(), description, detail, solution);
    }


    public CustomException(BaseErrorInfoInterface errorInfoInterface, Throwable cause) {
        super(errorInfoInterface.getErrorMsg(), cause);
        this.errorCode = errorInfoInterface.getErrorCode();
        this.description = errorInfoInterface.getErrorMsg();
        this.solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
    }


    @Override
    public Throwable fillInStackTrace() {
        return this;
    }

}
