package com.dsg.standardization.vo;

import lombok.Data;

import java.io.Serializable;

/**
 * 作者: Jie.xu
 * 创建时间：2023/12/4 15:28
 * 功能描述：
 */
@Data
public class HydraClientUser implements Serializable {

    private String client_id;
    private String client_name;

}
