package com.dsg.standardization.filter;

import com.dsg.standardization.common.webfilter.WebTokenFilter;
import org.springframework.stereotype.Component;

import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;

@Component
@WebFilter(filterName = "tokenFilter")
public class TokenFilter extends WebTokenFilter {

    static int RESOURCE_CODE_STD = 30;

    @Override
    protected Integer getResourceCode(HttpServletRequest httpServletRequest) {
        if (RESOURCE_CODE_NULL == super.getConfiguretionResourceCode()) {
            return RESOURCE_CODE_STD;
        }
        return super.getConfiguretionResourceCode();
    }
}
