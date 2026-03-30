package com.dsg.standardization.common.annotation;

import com.dsg.standardization.common.enums.AuditLogEnum;

import java.lang.annotation.*;
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AuditLog {
    AuditLogEnum value();

}
