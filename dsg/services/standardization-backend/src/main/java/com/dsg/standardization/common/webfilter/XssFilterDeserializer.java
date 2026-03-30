package com.dsg.standardization.common.webfilter;


import com.fasterxml.jackson.core.JacksonException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.dsg.standardization.common.util.StringUtil;

import java.io.IOException;

/**
 * 防止xss，指定字段转义
 */
public class XssFilterDeserializer extends JsonDeserializer<String> {

    @Override
    public String deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JacksonException {

        return StringUtil.XssEscape(p.getText());
    }
}
