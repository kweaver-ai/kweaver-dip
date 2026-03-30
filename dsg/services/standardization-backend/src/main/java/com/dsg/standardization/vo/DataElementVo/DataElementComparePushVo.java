package com.dsg.standardization.vo.DataElementVo;


import com.dsg.standardization.common.enums.DataTypeEnum;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import lombok.Data;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo.DataElementVo
 * @Date: 2023/2/6 19:51
 */
@Data
public class DataElementComparePushVo {
    private String nameCn;

    private String nameEn;

    private DataTypeEnum dataType;

    private OrgTypeEnum stdType;

    private Integer dataLength;

    private Integer dataPrecision;

    private Long dictCode;

}
