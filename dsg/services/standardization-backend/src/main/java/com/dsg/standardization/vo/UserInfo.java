package com.dsg.standardization.vo;

import lombok.Data;

import java.util.List;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/7 10:21
 * 功能描述：
 */
@Data
public class UserInfo {
    String userId; // 用户ID
    String userName; // 登录用户
    String nickName; // 用户昵称
    List<Department> deptList;
}
