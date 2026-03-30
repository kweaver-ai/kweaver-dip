package com.dsg.standardization.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 编码规表推荐
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-11-30 15:11:22
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class RuleRecVo implements Serializable {
    private static final long serialVersionUID = 1L;

//        private Integer code;
//        private String msg;
        @JsonProperty("data")
        private List<RoleRecTableDataVo> data;
}


