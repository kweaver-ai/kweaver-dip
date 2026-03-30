package com.dsg.standardization.vo;

import lombok.Data;

/**
 * 作者: Jie.xu
 * 创建时间：2023/12/4 15:28
 * 功能描述：
 */
@Data
public class HydraUser {

    // 是否有效
    Boolean active;

    // 客户端ID，
    String client_id;

    // 用户ID
    String sub;

}
