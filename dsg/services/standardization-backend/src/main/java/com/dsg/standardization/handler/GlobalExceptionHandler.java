package com.dsg.standardization.handler;

import com.baomidou.mybatisplus.core.toolkit.CollectionUtils;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.common.exception.UnauthorizedException;
import com.dsg.standardization.common.util.CustomUtil;
import com.fasterxml.jackson.databind.JsonMappingException.Reference;
import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.NoHandlerFoundException;
import com.dsg.standardization.vo.CheckErrorVo;
import com.dsg.standardization.vo.Result;

import javax.annotation.PostConstruct;
import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 全局异常处理类，捕获异常，并根据异常返回错误信息。
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @PostConstruct
    public void init() {
        Result.setServiceName("Standardization");
    }

    /**
     * 处理鉴权失败异常
     */
    @ExceptionHandler(value = UnauthorizedException.class)
    @ResponseBody
    public ResponseEntity UnauthorizedExceptionHandler(UnauthorizedException e) {
        Result r = new Result();
        r.setCode(ErrorCodeEnum.NotAuthenticationError.getErrorCode());
        r.setDescription(Optional.ofNullable(e.getDescription()).orElse(ErrorCodeEnum.NotAuthenticationError.getErrorMsg()));
//        r.setDetail(Optional.ofNullable(e.getMessage()).orElse(Maps.newHashMap()));
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(r);
    }


    /**
     * 处理自定义的业务异常，程序员主动抛出BizException异常会被这个方法捕获
     */
    @ExceptionHandler(value = CustomException.class)
    @ResponseBody
    public ResponseEntity<Result> AsExceptionHandler(CustomException e) {
        log.debug("发生异常:", e);
        return Result.error(e);
    }

    /**
     * POST请求体参数校验，使用hibernate-validator
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = BindException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(BindException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, detail, Message.MESSAGE_PARAM_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = ConstraintViolationException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(ConstraintViolationException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, detail, Message.MESSAGE_PARAM_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = MissingPathVariableException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingPathVariableException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, detail, Message.MESSAGE_PATHVARIABLE_ERROR_SOLUTION));
    }

    @ExceptionHandler(value = MaxUploadSizeExceededException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MaxUploadSizeExceededException e) {
        log.error("MaxUploadSizeExceededException发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, detail, Message.MESSAGE_MaxUploadSizeExceededException));
    }

    @ExceptionHandler(value = MultipartException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MultipartException e) {
        log.error("MultipartException发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.PARTAIL_FAILURE, detail, Message.MESSAGE_MultipartException));
    }

    /**
     * Query 参数（Request Parameter） 校验
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = MissingServletRequestParameterException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingServletRequestParameterException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new CustomException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }

    /**
     * part 参数（request part） 校验
     *
     * @param e
     * @return
     */
    @ExceptionHandler(value = MissingServletRequestPartException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MissingServletRequestPartException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new CustomException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }


    /**
     * 处理请求体为空或者参数不正确异常
     */
    @ExceptionHandler(value = HttpMessageNotReadableException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(HttpMessageNotReadableException e) {
        log.debug("发生异常:", e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        Throwable cause = e.getCause();
        if (cause instanceof InvalidFormatException) {
            InvalidFormatException errorEntity = (InvalidFormatException) cause;
            List<Reference> pathList = errorEntity.getPath();
            String errormsg = null;
            if (pathList.size() == 1) {
                errormsg = String.format("%s的值不符合接口要求", pathList.get(0).getFieldName(), errorEntity.getValue());
            } else {
                errormsg = String.format("%s的值[%s]不符合接口要求", pathList.get(0).getFieldName(), errorEntity.getValue());

            }
            List<CheckErrorVo> detail = Lists.newArrayList();
            detail.add(new CheckErrorVo(pathList.get(0).getFieldName(), errormsg));
            return Result.error(
                    new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, "参数校验不通过", detail, solution));
        }
        return Result.error(new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, "请求体为空或格式不正确", null, solution));
    }

    @ExceptionHandler(value = MethodArgumentTypeMismatchException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(MethodArgumentTypeMismatchException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new CustomException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }


    /**
     * 其他运行时异常
     */
    @ExceptionHandler(value = RuntimeException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(RuntimeException e) {
        log.warn("发生异常,原因是:", e);
        return Result.error(HttpStatus.INTERNAL_SERVER_ERROR, new CustomException(ErrorCodeEnum.InternalError), null);
    }

    @ExceptionHandler(value = NoHandlerFoundException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(NoHandlerFoundException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        String solution = Message.MESSAGE_PARAM_ERROR_SOLUTION;
        return Result.error(new CustomException(ErrorCodeEnum.MethodArgumentTypeMismatchException,
                detail, solution));
    }

    @ExceptionHandler(value = HttpRequestMethodNotSupportedException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(HttpRequestMethodNotSupportedException e) {
        log.debug("发生异常:", e);
        String solution = String.format("当前请求方式为：%s，支持的接口请求方式有：%s。详细信息参见产品 API 文档。", e.getMethod(), e.getSupportedHttpMethods());
        return
                Result.error(new CustomException(ErrorCodeEnum.HttpRequestMethodNotSupportedException, null, solution));
    }

    @ExceptionHandler(value = org.springframework.dao.DuplicateKeyException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(org.springframework.dao.DuplicateKeyException e) {
        log.debug("发生异常:", e);
        List<CheckErrorVo> detail = getErrorDetailInfo(e);
        return Result.error(new CustomException(ErrorCodeEnum.Duplicated, detail, Message.MESSAGE_Duplicated_SOLUTION));
    }

    @ExceptionHandler(value = org.springframework.dao.DeadlockLoserDataAccessException.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(org.springframework.dao.DeadlockLoserDataAccessException e) {
        log.debug("发生异常:", e);
        return Result.error(new CustomException(ErrorCodeEnum.SystemBusy, null, Message.SYSTEM_BUSY_ERROR));
    }

    /**
     * 处理其他异常
     */
    @ExceptionHandler(value = Exception.class)
    @ResponseBody
    public ResponseEntity<Result> exceptionHandler(Exception e) {
        log.error("发生异常:", e);
        return Result.error(new CustomException(ErrorCodeEnum.UnKnowException));
    }

    /**
     * 根据异常类型不同，返回不同的异常细节描述
     */
    private List<CheckErrorVo> getErrorDetailInfo(Exception e) {
        List<CheckErrorVo> detail = Lists.newArrayList();
        String key = "";
        String message = "";
        if (e instanceof MethodArgumentTypeMismatchException) {
            MethodArgumentTypeMismatchException errorEntity = (MethodArgumentTypeMismatchException) e;
            key = errorEntity.getName();
            message = String.format("参数%s的值%s与接口要求类型不匹配", errorEntity.getName(), errorEntity.getValue());
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof NoHandlerFoundException) {
            NoHandlerFoundException errorEntity = (NoHandlerFoundException) e;
            key = errorEntity.getRequestURL();
            message = "未找到该URL对应的处理方法";
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof BindException) {
            List<FieldError> allErrors = ((BindException) e).getBindingResult().getFieldErrors();
            for (FieldError errorEntity : allErrors) {
                key = CustomUtil.camelToUnderline(errorEntity.getField());
                message = errorEntity.getDefaultMessage();
                detail.add(new CheckErrorVo(key, message));
            }
        } else if (e instanceof MissingServletRequestParameterException) {
            MissingServletRequestParameterException errorEntity = (MissingServletRequestParameterException) e;
            key = errorEntity.getParameterName();
            message = Message.MESSAGE_INPUT_NOT_EMPTY;
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof MissingServletRequestPartException) {
            MissingServletRequestPartException errorEntity = (MissingServletRequestPartException) e;
            key = errorEntity.getRequestPartName();
            message = Message.MESSAGE_INPUT_NOT_EMPTY;
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof org.springframework.dao.DuplicateKeyException) {
            key = ErrorCodeEnum.Duplicated.getErrorCode();
            message = ErrorCodeEnum.Duplicated.getErrorMsg();
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof org.springframework.dao.DeadlockLoserDataAccessException) {
            key = ErrorCodeEnum.DeadlockException.getErrorCode();
            message = ErrorCodeEnum.DeadlockException.getErrorMsg();
            detail.add(new CheckErrorVo(key, message));
        } else if (e instanceof ConstraintViolationException) {
            ConstraintViolationException errorEntity = (ConstraintViolationException) e;
            Set<ConstraintViolation<?>> violations = errorEntity.getConstraintViolations();
            String violationMessages;
            if (CollectionUtils.isEmpty(violations)) {
                violationMessages = "";
            } else {
                violationMessages = violations.stream()
                        .map(ConstraintViolation::getMessage)
                        .collect(Collectors.joining("；"));
            }

            key = StringUtils.substring(violationMessages,0, StringUtils.indexOf(violationMessages,","));
            if (violationMessages.contains(",") && StringUtils.indexOf(violationMessages,",") != violationMessages.length())
            message = StringUtils.substring(violationMessages, StringUtils.indexOf(violationMessages,",") + 1, violationMessages.length());
            detail.add(new CheckErrorVo(key, message));
        }
        return detail;
    }

    public static CustomException getNewCustomException(ErrorCodeEnum errorCodeEnum, String detail, String solution) {
        List<CheckErrorVo> errorVos = Lists.newArrayList();
        String key = errorCodeEnum.getErrorCode();
        String message = detail;
        errorVos.add(new CheckErrorVo(key, message));
        return  new CustomException(errorCodeEnum, errorVos, solution);
    }

    public static CustomException getNewCustomException(ErrorCodeEnum errorCodeEnum, String detail) {
        return getNewCustomException(errorCodeEnum, detail, Message.MESSAGE_PARAM_ERROR_SOLUTION);
    }
    public static CustomException getNewCustomException(ErrorCodeEnum errorCodeEnum) {
        return getNewCustomException(errorCodeEnum, errorCodeEnum.getErrorMsg());
    }

    public static CustomException getNewCustomException(String code, String description, String detail, String solution) {
        List<CheckErrorVo> errorVos = Lists.newArrayList();
        String key = code;
        String message = detail;
        errorVos.add(new CheckErrorVo(key, message));
        return new CustomException(code, description, errorVos, solution);
    }
}
