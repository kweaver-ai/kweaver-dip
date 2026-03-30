package com.dsg.standardization.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

@AllArgsConstructor
@Data
public class HttpResponseVo {
    private Integer code;
    private String result;

    public boolean isSucesss() {
        if (code >= 200 && code < 300) {
            return true;
        } else {
            return false;
        }
    }
}
