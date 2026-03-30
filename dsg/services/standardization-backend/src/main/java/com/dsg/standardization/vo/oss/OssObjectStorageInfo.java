package com.dsg.standardization.vo.oss;

import lombok.Data;

/**
 * 作者: Jie.xu
 * 创建时间：2023/11/6 10:37
 * 功能描述：
 */
@Data
public class OssObjectStorageInfo {
    String app;
    BucketInfo bucketInfo;
    String storageId;
    Boolean isDefault;

    @Data
    public static class BucketInfo {
        String name;
    }


}
