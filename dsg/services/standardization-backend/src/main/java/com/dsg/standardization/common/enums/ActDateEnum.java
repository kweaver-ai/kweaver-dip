package com.dsg.standardization.common.enums;

import com.baomidou.mybatisplus.annotation.EnumValue;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Calendar;
import java.util.Date;

@Getter
@AllArgsConstructor
public enum ActDateEnum {
	ThreeMonth(0, "近三月"), OneYear(1, "近一年"), TwoYear(2, "近两年"), ThreeYear(3, "近三年"), OverThreeYear(4, "三年以上"),
	All(-1, "全部");

	@EnumValue
	@JsonValue
	private Integer code;
	private String message;

	public static Date getStartDate(Integer actDate) {
		Date now = new Date();
		Calendar calendar = Calendar.getInstance();
		if (ThreeMonth.getCode().equals(actDate)) {
			calendar.setTime(now);
			calendar.add(Calendar.MONTH, -3);
			return calendar.getTime();
		} else if (OneYear.getCode().equals(actDate)) {
			calendar.setTime(now);
			calendar.add(Calendar.YEAR, -1);
			return calendar.getTime();
		} else if (TwoYear.getCode().equals(actDate)) {
			calendar.setTime(now);
			calendar.add(Calendar.YEAR, -2);
			return calendar.getTime();
		} else if (ThreeYear.getCode().equals(actDate)) {
			calendar.setTime(now);
			calendar.add(Calendar.YEAR, -3);
			return calendar.getTime();
		}
		return null;
	}

	public static Date getEndDate(Integer actDate) {
		Date now = new Date();
		Calendar calendar = Calendar.getInstance();
		if (OverThreeYear.getCode().equals(actDate)) {
			calendar.setTime(now);
			calendar.add(Calendar.YEAR, -3);
			return calendar.getTime();
		}else if (All.getCode().equals(actDate)) {
			return null;
		}
		return now;
	}
	
	public static ActDateEnum getByMessage(String message) {
		ActDateEnum[] enums = ActDateEnum.values();
        for (ActDateEnum en : enums) {
            if (en.getMessage().equals(message)) {
                return en;
            }
        }
        return null;
    }

    public static ActDateEnum getByCode(Integer code) {
    	ActDateEnum[] enums = ActDateEnum.values();
        for (ActDateEnum en : enums) {
            if (en.getCode().equals(code)) {
                return en;
            }
        }
        return null;
    }

}
