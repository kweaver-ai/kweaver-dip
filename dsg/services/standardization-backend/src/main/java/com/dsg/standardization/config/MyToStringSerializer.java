package com.dsg.standardization.config;


import com.dsg.standardization.common.constant.Constants;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializerBase;

import java.io.IOException;

public class MyToStringSerializer extends ToStringSerializerBase {
    public static final MyToStringSerializer INSTANCE = new MyToStringSerializer();

    public MyToStringSerializer() {
        super(Object.class);
    }

    public MyToStringSerializer(Class<?> handledType) {
        super(handledType);
    }

    @Override
    public String valueToString(Object value) {
        return value.toString().trim();
    }

    @Override
    public void serialize(Object value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        if (value instanceof Long) {
            Long old = (Long) value;
            if (old < Constants.FRONT_MAX_LONG_VALUE) {
                gen.writeNumber(old);
            } else {
                gen.writeString(this.valueToString(value).trim());
            }
        } else {
            gen.writeString(this.valueToString(value).trim());
        }

    }
}