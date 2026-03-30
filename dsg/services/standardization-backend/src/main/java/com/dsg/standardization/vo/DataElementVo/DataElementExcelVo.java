package com.dsg.standardization.vo.DataElementVo;

import cn.afterturn.easypoi.excel.annotation.Excel;
import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.dto.LabelDetailDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.vo.BaseExcelVo;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * @Author: WangZiYu
 * @description:xxx
 * @Date: 2022/12/2 9:37
 */
@Data
@Slf4j
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DataElementExcelVo extends BaseExcelVo {
//    @Excel(name="中文名称")
//    private String value1;

    @Excel(name = "*中文名称", orderNum = "1", width = 20)
    private String nameCn;

    @Excel(name = "*英文名称", orderNum = "2", width = 20)
    private String nameEn;

    @Excel(name = "同义词", orderNum = "3", width = 30)
    private String synonym;

    @Excel(name = "*标准分类", orderNum = "4", width = 20)
    private String orgTypeMsg;

    @Excel(name = "*数据类型", orderNum = "5", width = 20)
    private String dataTypeMsg;

    @Excel(name = "数据长度", orderNum = "6", width = 10)
    private String dataLength;

    @Excel(name = "数据精度", orderNum = "7", width = 10)
    private String dataPrecision;

    @Excel(name = "数据元说明", orderNum = "8", width = 30)
    private String description;

    @Excel(name = "数据分级", orderNum = "9", width = 30)
    private String labelName;

    private Long labelId;

    public DataElementInfo getDataElementInfo() {
        DataElementInfo dataElementInfo = new DataElementInfo();
        BeanUtils.copyProperties(this, dataElementInfo);
        dataElementInfo.setStdType(EnumUtil.getEnumObject(OrgTypeEnum.class, s -> s.getMessage().equals(this.orgTypeMsg)).orElse(OrgTypeEnum.Unknown));
        dataElementInfo.setDataType(EnumUtil.getEnumObject(DataTypeEnum.class, s -> s.getMessage().equals(this.dataTypeMsg)).orElse(DataTypeEnum.Unknown));
//        if (dataElementInfo.getDataType().equals(DataTypeEnum.Binary)) {
//            dataElementInfo.setDataType(DataTypeEnum.Char);
//        }
        // 导入Excel字符型和高精度型时长度为空设置默认值为1， 高精度型时精度为空设置默认值为0
       if (dataElementInfo.getDataType().equals(DataTypeEnum.Decimal)) {
           dataElementInfo.setDataLength(ConvertUtil.toInt(this.dataLength,1));
           dataElementInfo.setDataPrecision(ConvertUtil.toInt(this.dataPrecision,0));
        }else {
           dataElementInfo.setDataLength(ConvertUtil.toInt(this.dataLength));
           dataElementInfo.setDataPrecision(ConvertUtil.toInt(this.dataPrecision));
       }
        return dataElementInfo;
    }

    public DataElementExcelVo getVo(DataElementInfo dataElementInfo) {
        BeanUtils.copyProperties(dataElementInfo, this);
        this.setOrgTypeMsg(dataElementInfo.getStdType().getMessage());
        this.setDataTypeMsg(dataElementInfo.getDataType().getMessage());
        this.setDataLength(String.valueOf(dataElementInfo.getDataLength()));
        this.setDataPrecision(String.valueOf(dataElementInfo.getDataPrecision()).equals("null") ? "" : String.valueOf(dataElementInfo.getDataPrecision()));
        return this;
    }

    public static List<DataElementExcelVo> getListByDeInfo(List<DataElementInfo> dataElementInfoList) {
        if (CustomUtil.isEmpty(dataElementInfoList)) {
            return null;
        } else {
            return dataElementInfoList.stream().map(item -> {
                DataElementExcelVo vo = new DataElementExcelVo();
                vo = vo.getVo(item);
                return vo;
            }).collect(Collectors.toList());
        }
    }

    public static List<DataElementInfo> convertToDeInfoList(List<DataElementExcelVo> voList, String labelInfoById_url) {
        if (CustomUtil.isEmpty(voList)) {
            return null;
        } else {
            return voList.stream().map(item -> {
                DataElementInfo dataElementInfo = item.getDataElementInfo();
                if (!Objects.isNull(item.getLabelName())) {
                    String url = labelInfoById_url + "/api/configuration-center/v1/grade-label/name/" + item.getLabelName();
                    try {
                        LabelDetailDto labelDetailDto = JsonUtils.json2Obj(UrlCallUtil.getResponseVoForGet(url).getResult(), LabelDetailDto.class);
                        if (labelDetailDto != null && !StringUtils.isEmpty(labelDetailDto.getId())) {
                            dataElementInfo.setLabelId(Long.valueOf(labelDetailDto.getId()));
                        } else {
                            dataElementInfo.setLabelId(1L);
                        }
                    } catch (Exception exception) {
                        log.error("convertToDeInfoList error,url:{}", url);
                    }
                }
                return dataElementInfo;
            }).collect(Collectors.toList());
        }
    }

}

