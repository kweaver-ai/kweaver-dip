package com.dsg.standardization.vo.excel;


import cn.afterturn.easypoi.excel.annotation.Excel;
import lombok.Data;
import com.dsg.standardization.vo.BaseExcelVo;


/**
 * 标准文件管理表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
@Data
public class StdFileMgrExcelVo extends BaseExcelVo {

    @Excel(name = "标准文件名称", orderNum = "1", width = 20)
    private String name;

    @Excel(name = "标准编号", orderNum = "2", width = 20)
    private String number;

    @Excel(name = "标准分类", orderNum = "3", width = 20)
    private String orgType;

    @Excel(name = "文件类型", orderNum = "4", width = 20)
    private String attachmentType;

    @Excel(name = "实施日期", orderNum = "5", width = 20)
    private String actDate;

    @Excel(name = "停用日期", orderNum = "6", width = 20)
    private String disableDate;

    @Excel(name = "状态", orderNum = "7", width = 20)
    private String state;

    @Excel(name = "停用原因", orderNum = "8", width = 20)
    private String disableReason;

    @Excel(name = "链接地址", orderNum = "9", width = 20)
    private String attachmentUrl;

    @Excel(name = "附件名称", orderNum = "10", width = 20)
    private String fileName;

    @Excel(name = "说明", orderNum = "11", width = 20)
    private String description;


}
