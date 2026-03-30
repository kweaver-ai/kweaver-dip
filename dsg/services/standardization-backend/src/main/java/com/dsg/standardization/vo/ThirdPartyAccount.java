package com.dsg.standardization.vo;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 作者: Jie.xu
 * 创建时间：2023/12/4 15:28
 * 功能描述：
 */
@Data
public class ThirdPartyAccount implements Serializable {

    private String id;
    private String name;
    private String description;
    private String infoSystems;
    private String applicationDeveloper;
    private String accountName;
    private String accountId;
    private List<String> authorityScope;
    private String hasResource;
    private String provinceAppInfo;
}
