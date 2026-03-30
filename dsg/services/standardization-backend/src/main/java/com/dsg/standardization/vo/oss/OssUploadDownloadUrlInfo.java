package com.dsg.standardization.vo.oss;

import lombok.Data;

import java.util.Map;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/6 13:35
 * 功能描述：
 */
@Data
public class OssUploadDownloadUrlInfo {
    String method;
    String url;
    Map<String, String> headers;
}
