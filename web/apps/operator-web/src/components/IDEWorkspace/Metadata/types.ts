export enum ParamTypeEnum {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Array = 'array',
  Object = 'object',
}

export interface ParamItem {
  id: string; // 参数唯一标识
  name: string; // 参数名
  description: string; // 参数描述
  default?: string; // 参数默认值
  type: ParamTypeEnum; // 参数类型
  required: boolean; // 是否必填
  example?: object; // 参数示例
  enum?: Array<object>; // 参数枚举值
  sub_parameters?: Array<ParamItem>; // 子参数
}

// 参数校验枚举
export enum ParamValidateResultEnum {
  Valid = 'valid', // 参数有效
  Invalid = 'invalid', // 参数不合法
  Empty = 'empty', // 参数为空
}
