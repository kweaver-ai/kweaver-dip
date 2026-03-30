package com.dsg.standardization.vo;


import com.dsg.standardization.dto.DictEnumDto;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DictEnumVo extends DictEnumDto {
}
