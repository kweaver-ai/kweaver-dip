package com.dsg.standardization.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.dsg.standardization.common.enums.OrgTypeEnum;
import com.dsg.standardization.common.enums.StdFileAttachmentTypeEnum;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 标准文件管理表
 *
 * @author xxx.cn
 * @email xxxx@xxx.cn
 * @date 2022-12-06 16:53:03
 */
@Data
@TableName("t_std_file")
public class StdFileMgrEntity extends BaseEntity implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 主键
     */
    @TableId(value = "f_id", type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 标准编号 例如DB3502/T 035-2022
     */
    @TableField(value = "f_number")
    private String number;


    @TableField(value = "f_catalog_id")
    private Long catalogId;

    @TableField(value = "f_name")
    private String name;

    @TableField(value = "f_act_date")
    private Date actDate;

    @TableField(value = "f_publish_date")
    private Date publishDate;

    @TableField(value = "f_disable_Date")
    private Date disableDate;

    @TableField(value = "f_attachment_type")
    private StdFileAttachmentTypeEnum attachmentType;

    @TableField(value = "f_attachment_url")
    private String attachmentUrl;

    @TableField(value = "f_file_name")
    private String fileName;

    /**
     * 标准组织类型
     */
    @TableField(value = "f_org_type")
    private OrgTypeEnum orgType;

    @TableField(value = "f_description")
    private String description;

    @TableField(exist = false)
    private String catalogName;

    @TableField(value = "f_department_ids")
    private String departmentIds;
    @TableField(value = "f_third_dept_id")
    private String thirdDeptId;
}
