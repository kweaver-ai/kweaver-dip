import { useState, useEffect, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';
import classNames from 'classnames';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  getNestedParamInfo,
  generateRandomId,
  paramValidationRules,
  defaultParam,
  defaultArraySubParam,
  errorMessages,
} from '../utils';
import ParamTr from './ParamTr';
import styles from './ParamForm.module.less';
import { type ParamItem, ParamTypeEnum, ParamValidateResultEnum } from './types';

interface ParamFormProps {
  value?: ParamItem[];
  onChange?: (value: ParamItem[]) => void;
}

const ParamForm = forwardRef(({ value = [], onChange }: ParamFormProps, ref) => {
  const [params, setParams] = useState<ParamItem[]>(value); // 记录参数列表
  const [errors, setErrors] = useState<Map<string, Record<string, ParamValidateResultEnum>>>(new Map()); // 记录每个参数的校验错误信息
  const [collapsedKeys, setCollapsedKeys] = useState<Set<string>>(new Set()); // 记录哪些数组元素的子参数是折叠的

  const tdOptions = useMemo(() => {
    // 参数类型选项
    const typeOptions = [
      { label: 'String', value: ParamTypeEnum.String },
      { label: 'Number', value: ParamTypeEnum.Number },
      { label: 'Object', value: ParamTypeEnum.Object },
      { label: 'Array', value: ParamTypeEnum.Array },
      { label: 'Boolean', value: ParamTypeEnum.Boolean },
    ];
    // 数组元素的参数类型选项
    const arraySubParamTypeOptions = typeOptions
      .filter(item => item.value !== ParamTypeEnum.Array)
      .map(option => ({ ...option, label: `Array<${option.label}>` }));
    return [
      {
        placeholder: '参数名称',
        field: 'name',
        maxLength: 50,
        showCount: true,
        type: 'input',
        className: styles['name-description-input'],
        shouldDisabled: (isArraySubParam: boolean) => isArraySubParam, // 数组的子元素，name这一列禁止编辑
      },
      {
        placeholder: '参数说明',
        field: 'description',
        maxLength: 255,
        showCount: true,
        type: 'input',
        className: styles['name-description-input'],
      },
      {
        field: 'type',
        type: 'select',
        options: typeOptions,
        className: 'dip-w-100',
        shouldRender: (isArraySubParam: boolean) => !isArraySubParam,
      },
      {
        field: 'type',
        type: 'select',
        options: arraySubParamTypeOptions,
        className: 'dip-w-100',
        shouldRender: (isArraySubParam: boolean) => isArraySubParam, // 数组的子元素，类型下拉选项跟别的不一样
      },
      {
        field: 'required',
        type: 'checkbox',
        className: 'dip-pointer dip-ml-6',
        style: { width: 16, height: 16 },
        shouldDisabled: (isArraySubParam: boolean) => isArraySubParam, // 数组的子元素，required这一列禁止编辑
      },
    ];
  }, []);

  useImperativeHandle(ref, () => ({
    validate,
  }));

  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(params)) {
      setParams(value);
    }
  }, [value]);

  const validate = (paramsToValidate: ParamItem[] = params) => {
    const newErrors = new Map<string, Record<string, ParamValidateResultEnum>>();

    const validateParam = (param: ParamItem, validateName: boolean = true) => {
      const fieldErrors: Record<string, ParamValidateResultEnum> = {};

      // 只对name和description字段进行验证，因为它们是string类型
      if (validateName && 'name' in paramValidationRules) {
        fieldErrors['name'] = paramValidationRules['name'](param.name);
      }

      if ('description' in paramValidationRules) {
        fieldErrors['description'] = paramValidationRules['description'](param.description);
      }

      newErrors.set(param.id, fieldErrors);

      if (param.sub_parameters) {
        param.sub_parameters.forEach(subParam => {
          // 数组类型的子参数不需要校验name字段;非数组类型的子参数正常校验
          validateParam(subParam, param.type !== ParamTypeEnum.Array);
        });
      }
    };

    paramsToValidate.forEach(param => {
      validateParam(param);
    });

    setErrors(newErrors);

    let allValid = true;
    newErrors.forEach(fieldErrors => {
      if (!Object.values(fieldErrors).every(result => result === ParamValidateResultEnum.Valid)) {
        allValid = false;
      }
    });

    return allValid;
  };
  // 处理参数变化
  const handleChange = (newParams: ParamItem[]) => {
    setParams(newParams);
    onChange?.(newParams);
  };

  // 添加参数
  const addParam = () => {
    const newParam: ParamItem = {
      ...defaultParam,
      id: generateRandomId(),
    };
    const newParams = [...params, newParam];
    handleChange(newParams);
  };

  // 添加子项
  const addSubParam = (paramId: string) => {
    const newParams = JSON.parse(JSON.stringify(params));
    const paramInfo = getNestedParamInfo(paramId, newParams);

    // 参数验证和存在性检查
    if (!paramInfo) {
      return;
    }

    // 获取目标参数
    const { targetParam } = paramInfo;

    // 确保 targetParam 有 sub_parameters 属性
    if (!targetParam.sub_parameters || !Array.isArray(targetParam.sub_parameters)) {
      targetParam.sub_parameters = [];
    }

    // 添加子参数
    targetParam.sub_parameters.push({
      ...defaultParam,
      id: generateRandomId(),
    });

    handleChange(newParams);
  };

  // 清除key对应的collapsedKeys记录
  const clearCollapsedKey = useCallback((paramId: string) => {
    setCollapsedKeys(prev => {
      const newKeys = new Set(prev);
      newKeys.delete(paramId);
      return newKeys;
    });
  }, []);

  // 更新参数
  const updateParam = (paramId: string, field: keyof ParamItem, value: any) => {
    const newParams = JSON.parse(JSON.stringify(params));
    const paramInfo = getNestedParamInfo(paramId, newParams);

    // 参数验证和存在性检查
    if (!paramInfo) {
      return;
    }

    // 获取目标参数
    const { targetParam } = paramInfo;
    // 更新参数值
    (targetParam as any)[field] = value;

    // 处理类型变化: 当类型改变时，更新子参数
    if (field === 'type') {
      switch (value) {
        case ParamTypeEnum.Array:
          targetParam.sub_parameters = [
            {
              ...defaultArraySubParam,
              id: generateRandomId(),
            },
          ];
          break;
        case ParamTypeEnum.Object:
          targetParam.sub_parameters = [
            {
              ...defaultParam,
              id: generateRandomId(),
            },
          ];
          break;
        default:
          // 其他类型，清空子参数
          delete targetParam.sub_parameters;

          break;
      }

      // 清除collapsedKeys里的记录
      clearCollapsedKey(paramId);
    }

    handleChange(newParams);
    // 校验更新的field
    validateField(field, paramId, value);
  };

  // 校验更新的field
  const validateField = useCallback((field: string, paramKey: string, value: any) => {
    if (['name', 'description'].includes(field)) {
      const validateResult = paramValidationRules[field as 'name' | 'description'](value);
      setErrors(prev => {
        const newErrors = new Map(prev);
        const existingFieldErrors = newErrors.get(paramKey) || {};
        newErrors.set(paramKey, {
          ...existingFieldErrors,
          [field]: validateResult,
        });
        return newErrors;
      });
    } else if (field === 'type') {
      // 改变类型时，清空子参数、子子参数的错误信息，子参数、子子参数，都是以 paramKey. 开头的
      setErrors(prev => {
        const newErrors = new Map(prev);
        prev.forEach((_, key) => {
          if (key?.startsWith(paramKey + '.')) {
            newErrors.delete(key);
          }
        });
        return newErrors;
      });
    }
  }, []);

  /**
   * 根据参数id删除参数
   * @param paramId 参数的唯一id
   */
  const deleteParam = (paramId: string) => {
    const newParams = JSON.parse(JSON.stringify(params));
    const paramInfo = getNestedParamInfo(paramId, newParams);

    if (paramInfo) {
      const { parentArray, index } = paramInfo;
      parentArray.splice(index, 1);

      handleChange(newParams);
      // 删除，清除errors里的错误
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(paramId);
        return newErrors;
      });
      // 删除，清除collapsedKeys里的记录
      clearCollapsedKey(paramId);
    }
  };

  // 更新collapsedKeys
  const updateCollapsedKeys = useCallback((paramId: string, collapsed: boolean) => {
    setCollapsedKeys(prev => {
      const newKeys = new Set(prev);
      if (collapsed) {
        newKeys.add(paramId);
      } else {
        newKeys.delete(paramId);
      }
      return newKeys;
    });
  }, []);

  return (
    <div className={classNames(styles['param-form'], 'dip-overflowX-auto')}>
      <table className={styles['form-table']}>
        <thead>
          <tr>
            <th className={classNames('dip-required-after dip-ml-10', styles['name-field'])}>参数名称</th>
            <th className={classNames('dip-required-after', styles['description-field'])}>参数说明</th>
            <th className={styles['type-field']}>类型</th>
            <th className={styles['required-field']}>必填</th>
            <th className={styles['action-field']}>操作</th>
          </tr>
        </thead>
        <tbody>
          {params.map(param => (
            <ParamTr
              key={param.id}
              param={param}
              tdOptions={tdOptions as any[]}
              onUpdateParam={updateParam}
              errorMessages={errorMessages}
              errors={errors}
              onDeleteParam={deleteParam}
              onAddSubParam={addSubParam}
              collapsedKeys={collapsedKeys}
              onCollapsedChange={updateCollapsedKeys}
            />
          ))}
        </tbody>
      </table>

      <Button onClick={addParam} type="link" icon={<PlusOutlined />} className="dip-mt-8">
        添加参数
      </Button>
    </div>
  );
});

export default ParamForm;
