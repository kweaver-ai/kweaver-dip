package com.dsg.standardization.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;


@Data
public class DictMqDto implements Serializable {

    private Integer type; //1码表、2编码规则
    private List<Long> dictRuleIds; //码表和编码规则ID
    private List<Long> dataCodes; //数据元code

}


