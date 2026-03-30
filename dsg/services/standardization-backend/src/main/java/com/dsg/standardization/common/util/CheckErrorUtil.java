package com.dsg.standardization.common.util;

import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.ErrorCodeEnum;
import com.dsg.standardization.common.exception.CustomException;
import com.google.common.collect.Lists;
import com.dsg.standardization.vo.CheckErrorVo;

import java.util.ArrayList;
import java.util.List;

public class CheckErrorUtil {

    public static List<CheckErrorVo> createError(String field, String errorDesc, List<CheckErrorVo> errorList) {
        if (errorList == null) {
            errorList = new ArrayList<>();
        }
        CheckErrorVo error = new CheckErrorVo(field, errorDesc);
        errorList.add(error);
        return errorList;
    }

    public static List<CheckErrorVo> createError(String field, String errorDesc) {
        return createError(field, errorDesc, null);
    }

    public static List<CheckErrorVo> getCheckList(Integer offset, Integer limit, String sort, List<String> sortList, String direction, List<String> directionList) {
        List<CheckErrorVo> detail = Lists.newArrayList();
        String key;
        String message;
        if (offset < 1) {
            key = Constants.PARAMETER_OFFSET;
            message = Message.MESSAGE_POSITIVE_INTEGER;
            detail.add(new CheckErrorVo(key, message));
        }
        if (limit < 1 || limit > 1000) {
            key = Constants.PARAMETER_LIMIT;
            message = Message.MESSAGE_POSITIVE_INTEGER_1000;
            detail.add(new CheckErrorVo(key, message));
        }
        if (!sortList.contains(sort)) {
            key = Constants.PARAMETER_SORT;
            message = Message.MESSAGE_VALUE_NO_VALID;
            detail.add(new CheckErrorVo(key, message));
        }
        if (!directionList.contains(direction)) {
            key = Constants.PARAMETER_DIRECTION;
            message = Message.MESSAGE_VALUE_NO_VALID;
            detail.add(new CheckErrorVo(key, message));
        }
        return  detail;
    }

    public static void checkSelectListParameter(Integer offset, Integer limit, String sort, List<String> sortList, String direction, List<String> directionList) {
        List<CheckErrorVo> parameterErrors = getCheckList(offset, limit, sort, sortList, direction, directionList);
        if (CustomUtil.isNotEmpty(parameterErrors)) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, parameterErrors);
        }
    }

    public static void checkPositiveLong(Object value, String key) {
        Long num = ConvertUtil.toLong(value);
        List<CheckErrorVo> detail = Lists.newArrayList();
        String message;
        if (CustomUtil.isEmpty(num) || num < 1) {
            message = Message.MESSAGE_POSITIVE_INTEGER;
            detail.add(new CheckErrorVo(key, message));
        }
        if (CustomUtil.isNotEmpty(detail)) {
            throw new CustomException(ErrorCodeEnum.InvalidParameter, detail);
        }
    }
}
