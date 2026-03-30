package com.dsg.standardization.vo.DataElementVo;


import com.dsg.standardization.common.enums.OperationTypeEnum;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo.DataElementVo
 * @Date: 2023/2/3 16:33
 */
@Data
public class DataElementMessageVo implements Serializable {
    private static final long serialVersionUID = 1L;


    /**
     * 操作类型
     */
    @JsonProperty("operation_type_enum")
    private OperationTypeEnum operationTypeEnum;


    /**
     * 操作时间
     */
    @JsonProperty("operation_time")
    private LocalDateTime operationTime;

    /**
     * 操作对象
     */
    @JsonProperty("code_list")
    private List<Long> codeList;

    /**
     * 操作内容
     */
    @JsonProperty("operation_object")
    private Set<String> operationObject;

    private String version;

}
