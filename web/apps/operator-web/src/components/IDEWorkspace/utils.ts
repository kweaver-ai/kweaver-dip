import { validateParamName } from '@/utils/validators';
import { generateRandomString, generateRandomNumber, generateRandomBoolean } from '@/utils/handle-function';
import { type ParamItem, ParamValidateResultEnum, ParamTypeEnum } from './Metadata/types';

// 默认的依赖库安装源地址
export const defaultDependenciesUrl = 'https://pypi.org/simple/';

// 生成随机id
export const generateRandomId = () => `param_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
export const defaultArraySubParamName = '[Array Item]';
// 默认参数
export const defaultParam: ParamItem = {
  id: '',
  name: '',
  description: '',
  type: ParamTypeEnum.String,
  required: true,
};
// 默认数组子项参数
export const defaultArraySubParam: ParamItem = {
  ...defaultParam,
  name: defaultArraySubParamName,
};
export const errorMessages = {
  [ParamValidateResultEnum.Valid]: '',
  [ParamValidateResultEnum.Invalid]: '只允许字母、数字和下划线，且不能以数字开头',
  [ParamValidateResultEnum.Empty]: '请输入',
};

interface InputOutputType {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

// 通用解析函数
function parseInputOutput(properties: any, required: string[] | undefined, defaultDescription = ''): InputOutputType[] {
  if (!properties) return [];

  return Object.entries(properties).map(([key, value]: [string, any]) => {
    let sub_parameters;
    if (value.type === 'object' && value.properties) {
      sub_parameters = parseInputOutput(value.properties, value.required);
    } else if (value.type === 'array' && value.items) {
      sub_parameters = [
        {
          id: generateRandomId(),
          name: defaultArraySubParamName,
          type: value.items.type,
          description: value.items.description,
          sub_parameters: parseInputOutput(value.items.properties, value.items.required),
        },
      ];
    }
    return {
      id: generateRandomId(),
      name: key,
      type: value.type,
      description: value.description || defaultDescription,
      required: required?.includes(key) || false,
      sub_parameters,
    };
  });
}

// 从函数的工具信息Spec中解析出outputs
export function parseOutputsFromToolInfo(apiSpec: any) {
  const successOutput = apiSpec?.responses?.find((item: any) => item.status_code === '200');
  if (!successOutput) return [];

  const { properties, required } = successOutput?.content?.['application/json']?.schema?.properties?.result || {};
  return parseInputOutput(properties, required);
}

// 从函数的工具信息Spec中解析出inputs
export function parseInputsFromToolInfo(apiSpec: any) {
  const { properties, required } = apiSpec?.request_body?.content?.['application/json']?.schema || {};
  return parseInputOutput(properties, required, '');
}

// 参数校验规则
export const paramValidationRules = {
  name: (value: string) => {
    if (!value?.trim()) {
      return ParamValidateResultEnum.Empty;
    }
    if (!validateParamName(value)) {
      return ParamValidateResultEnum.Invalid;
    }
    return ParamValidateResultEnum.Valid;
  },
  description: (value: string) => {
    if (!value?.trim()) {
      return ParamValidateResultEnum.Empty;
    }
    return ParamValidateResultEnum.Valid;
  },
};

/**
 * 根据参数id获取嵌套参数的详细信息
 * @param paramId - 参数的唯一id
 * @param targetParams - 目标参数数组，包含所有参数及其嵌套子参数
 * @returns 返回目标参数信息对象，包含目标参数、父级参数数组和索引位置；如果未找到则返回 null
 *
 * @example
 * // 获取id为param_123的参数
 * getNestedParamInfo("param_123", params);
 *
 * // 获取id为param_456的参数（无论它在哪个层级）
 * getNestedParamInfo("param_456", params);
 */
export const getNestedParamInfo = (
  paramId: string,
  targetParams: ParamItem[]
): { targetParam: ParamItem; parentArray: ParamItem[]; index: number } | null => {
  // 辅助函数：递归查找参数
  const findParam = (
    params: ParamItem[],
    parentArray: ParamItem[]
  ): { targetParam: ParamItem; parentArray: ParamItem[]; index: number } | null => {
    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (param.id === paramId) {
        return {
          targetParam: param,
          parentArray,
          index: i,
        };
      }

      // 递归查找子参数
      if (param.sub_parameters && Array.isArray(param.sub_parameters)) {
        const result = findParam(param.sub_parameters, param.sub_parameters);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  return findParam(targetParams, targetParams);
};

// 根据类型，自动生成参数值
const generateParamValue = (param: ParamItem) => {
  let value: any;
  switch (param.type) {
    case ParamTypeEnum.String:
      // 生成随机字符串，长度1~10位
      value = generateRandomString(10);
      break;
    case ParamTypeEnum.Number:
      // 生成随机数字，长度4位
      value = generateRandomNumber(4);
      break;
    case ParamTypeEnum.Boolean:
      // 生成随机boolean
      value = generateRandomBoolean();
      break;
    case ParamTypeEnum.Array:
      {
        const subParam = param.sub_parameters?.[0];
        // 生成随机数组长度，值1~9
        const arrLength = generateRandomNumber(1);
        value = subParam?.type ? Array.from({ length: arrLength }, () => generateParamValue(subParam)) : [];
      }
      break;
    case ParamTypeEnum.Object:
      value = {};
      param.sub_parameters?.forEach(subParam => {
        if (subParam?.type) {
          value[subParam.name] = generateParamValue(subParam);
        }
      });

      break;
  }
  return value;
};

// 生成参数值
export const generateParamValues = (params: ParamItem[]) => {
  const values: Record<string, any> = {};
  params.forEach(param => {
    values[param.name] = generateParamValue(param);
  });
  return values;
};

// 过滤inputs/outputs，将里面name不合法/为空 或 description为空的参数过滤掉
export const filterInvalidParams = (params: ParamItem[] | undefined): ParamItem[] => {
  // 提前返回空数组，避免不必要的计算
  if (!params || params.length === 0) {
    return [];
  }

  return params
    .map(param => {
      // 验证参数名称和描述
      const isNameValid = paramValidationRules.name(param.name) === ParamValidateResultEnum.Valid;
      const isDescriptionValid = paramValidationRules.description(param.description) === ParamValidateResultEnum.Valid;
      if (!isNameValid || !isDescriptionValid) {
        return undefined;
      }

      let sub_parameters: ParamItem[] | undefined;

      if (param.type === ParamTypeEnum.Object) {
        // 递归过滤Object类型的子参数
        sub_parameters = filterInvalidParams(param.sub_parameters);
      } else if (param.type === ParamTypeEnum.Array) {
        // 处理Array类型参数，确保子参数存在
        const arraySubParam = param.sub_parameters?.[0];
        if (
          arraySubParam &&
          paramValidationRules.description(arraySubParam.description) === ParamValidateResultEnum.Valid
        ) {
          // 递归过滤Array类型参数的子参数
          const filteredSubSubParams = filterInvalidParams(arraySubParam.sub_parameters);
          sub_parameters = [
            {
              ...arraySubParam,
              sub_parameters: filteredSubSubParams,
            },
          ];
        }
      }

      return {
        ...param,
        sub_parameters,
      };
    })
    .filter(Boolean) as ParamItem[];
};

// 给inputs/outpus增加id，用于前端界面的展示
export const addParamId = (params: ParamItem[]): ParamItem[] => {
  return params.map(param => {
    return {
      ...param,
      id: param.id || generateRandomId(),
      sub_parameters: param.sub_parameters ? addParamId(param.sub_parameters) : undefined,
    };
  });
};
