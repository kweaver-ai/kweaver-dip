package constant

var TypeConvertMap = map[string]struct{}{
	//整数型转布尔型
	NUMBER + BOOLEAN:   {},
	TINYINT + BOOLEAN:  {},
	SMALLINT + BOOLEAN: {},
	INTEGER + BOOLEAN:  {},
	INT + BOOLEAN:      {},
	BIGINT + BOOLEAN:   {},
	//整数型转字符型
	NUMBER + VARCHAR:   {},
	TINYINT + VARCHAR:  {},
	SMALLINT + VARCHAR: {},
	INTEGER + VARCHAR:  {},
	INT + VARCHAR:      {},
	BIGINT + VARCHAR:   {},

	//小数型转布尔型
	REAL + BOOLEAN:            {},
	FLOAT + BOOLEAN:           {},
	DOUBLE + BOOLEAN:          {},
	DOUBLEPRECISION + BOOLEAN: {},
	//小数型转字符型
	REAL + VARCHAR:            {},
	FLOAT + VARCHAR:           {},
	DOUBLE + VARCHAR:          {},
	DOUBLEPRECISION + VARCHAR: {},

	//高精度型转字符型
	DECIMAL + VARCHAR: {},
	NUMERIC + VARCHAR: {},
	DEC + VARCHAR:     {},

	//日期型转字符型
	DATE + VARCHAR: {},

	//日期时间型转日期型
	DATETIME + DATE:                 {},
	TIMESTAMP + DATE:                {},
	TIMESTAMP_WITH_TIME_ZONE + DATE: {},

	//日期时间型转字符型
	DATETIME + VARCHAR:                 {},
	TIMESTAMP + VARCHAR:                {},
	TIMESTAMP_WITH_TIME_ZONE + VARCHAR: {},
	TIME + VARCHAR:                     {},
	TIME_WITH_TIME_ZONE + VARCHAR:      {},

	//字符型转布尔型
	VARCHAR + BOOLEAN: {},
	STRING + BOOLEAN:  {},

	//字符型转整数型
	VARCHAR + BIGINT: {},
	STRING + BIGINT:  {},

	//字符型转小数型
	VARCHAR + DOUBLE: {},
	STRING + DOUBLE:  {},

	//字符型转高精度型
	VARCHAR + DECIMAL: {},
	STRING + DECIMAL:  {},

	//字符型转日期型
	VARCHAR + DATE: {},
	STRING + DATE:  {},

	//字符型转日期时间型
	VARCHAR + TIMESTAMP:           {},
	STRING + TIMESTAMP:            {},
	VARCHAR + TIME:                {},
	VARCHAR + TIME_WITH_TIME_ZONE: {},

	CHAR + VARCHAR: {},
}
