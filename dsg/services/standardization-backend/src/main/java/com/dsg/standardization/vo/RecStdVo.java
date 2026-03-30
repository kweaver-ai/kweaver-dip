package com.dsg.standardization.vo;


import com.dsg.standardization.common.constant.Message;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@ApiModel
public class RecStdVo implements Serializable {
    @ApiModelProperty(value = "唯一标识", dataType = "java.lang.String",example = "123")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long id;
    @ApiModelProperty(value = "标准编号", example = "")
    @JsonProperty("std_code")
    private String stdCode;

    @ApiModelProperty(value = "标准中文名称", example = "")
    @JsonProperty("std_ch_name")
    private String stdChName;

    @ApiModelProperty(value = "标准英文名称", example = "")
    @JsonProperty("std_en_name")
    private String stdEnName;

    @ApiModelProperty(value = "数据长度", example = "")
    @JsonProperty("data_length")
    private Integer dataLength;

    @ApiModelProperty(value = "数据精度", example = "")
    @JsonProperty("data_precision")
    private Integer dataPrecision;

    @ApiModelProperty(value = "数据类型", example = "")
    @JsonProperty("data_type")
    private String dataType;

    @ApiModelProperty(value = "值域", example = "")
    @JsonProperty("data_range")
    private String dataRange;

    @ApiModelProperty(value = "标准分类", example = "")
    @JsonProperty("std_type")
    private String stdType;

    @ApiModelProperty(value = "码表", example = "")
    private Dict dicts;

    public void addDict(DictVo dictVo) {
        if (dictVo == null) {
            return;
        }
        this.dicts = new Dict();
        dicts.setId(dictVo.getId());
        dicts.setCode(dictVo.getCode());
        dicts.setChName(dictVo.getChName());
        dicts.setEnName(dictVo.getEnName());

        List<DictEnum> enums = new ArrayList<>();
        dicts.setEnums(enums);
        for (DictEnumVo row : dictVo.getEnums()) {
            DictEnum eu = new DictEnum();
            eu.setCode(row.getCode());
            eu.setValue(row.getValue());
            enums.add(eu);
        }
    }

    @Data
    public static class Dict {

        @ApiModelProperty(value = "唯一标识", dataType = "java.lang.String")
        private Long id;

        @ApiModelProperty(value = "码值", dataType = "java.lang.String")
        private Long code;

        /**
         * 码表中文名称
         */
        @ApiModelProperty(value = "中文名称", example = "性别", dataType = "java.lang.String")
        @JsonProperty("ch_name")
        private String chName;

        /**
         * 码表英文名称
         */
        @NotBlank(message = "英文名称" + Message.MESSAGE_INPUT_NOT_EMPTY)
        @JsonProperty("en_name")
        private String enName;

        @ApiModelProperty(value = "码值和描述列表")
        private List<DictEnum> enums;

    }

    @Data
    public static class DictEnum {
        /**
         * 码表编码，同一码表不同状态或版本编码相同。
         */
        @ApiModelProperty(value = "码值", example = "1", dataType = "java.lang.String")
        @JsonProperty("code")
        private String code;

        /**
         * 码表描述
         */
        @ApiModelProperty(value = "码值描述", example = "男", dataType = "java.lang.String")
        @JsonProperty("value")
        private String value;

    }

}
