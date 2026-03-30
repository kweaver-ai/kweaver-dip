package com.dsg.standardization.vo;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
@ApiModel(description = "异常错误实体")
public class CheckErrorVo {
    @ApiModelProperty(value = "错误码", dataType = "java.lang.String")
	@JsonProperty("Key")
    private String errorCode;
    @ApiModelProperty(value = "错误信息", dataType = "java.lang.String")
	@JsonProperty("Message")
    private String errorMsg; 
}
