package com.dsg.standardization.dto;

import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import org.hibernate.validator.constraints.Length;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Pattern;

/**
 * 码表
 *
 * @author 徐杰
 * @date 2022-11-21 14:53:31
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class DictEnumDto {
    private static final long serialVersionUID = 1L;

    /**
     * 唯一标识
     */
    @ApiModelProperty(value = "唯一标识", example = "1", dataType = "java.lang.String")
    private Long id;

    /**
     * 码表编码，同一码表不同状态或版本编码相同。
     */
    @ApiModelProperty(value = "码值", example = "1", dataType = "java.lang.String", required = true)
    @NotEmpty(message = "码值" + Message.MESSAGE_INPUT_NOT_EMPTY)
//    @Pattern(regexp = Constants.REGEX_INTTEGER_64+"|"+Constants.REGEX_ENGLISH_UNDERLINE_BAR_64, message = "码值" + Message.MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_64)
    @Pattern(regexp = Constants.REGEX_ENGLISH_UNDERLINE_BAR_64, message = "码值" + Message.MESSAGE_ENGLISH_NUMBER_UNDERLINE_BAR_64)
    private String code;

    /**
     * 码表描述
     */
    @ApiModelProperty(value = "码值描述", example = "男", dataType = "java.lang.String", required = true)
    @NotEmpty(message = "码值描述" + Message.MESSAGE_INPUT_NOT_EMPTY)
    @Length(message = "码值描述长度不能超过64", max = 64)
    private String value;

    /**
     * 码表描述
     */
    @Length(max = 300)
    @ApiModelProperty(value = "码值说明", example = "", dataType = "java.lang.String")
    private String description;

    /**
     * 字典ID
     */
    @ApiModelProperty(value = "码表id", example = "1", dataType = "java.lang.String")
    private Long dictId;


}
