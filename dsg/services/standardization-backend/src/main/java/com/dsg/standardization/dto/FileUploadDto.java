package com.dsg.standardization.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class FileUploadDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name; //文件名称
    private String type;//文件类型,standard_spec标准规范
    private String related_object_id ; //标准文件id
    private String oss_id ;//对象存储ID
    private Long fileSize;//文件大小
}