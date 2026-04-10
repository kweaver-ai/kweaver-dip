import { memo, useMemo, useCallback, useState } from 'react';
import classNames from 'classnames';
import { Input, Select, Tooltip, Button } from 'antd';
import { PlusCircleOutlined, CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import DeleteIcon from '@/assets/icons/delete.svg';
import { ParamValidateResultEnum, type ParamItem, ParamTypeEnum } from './types';
import styles from './ParamForm.module.less';

interface InputTd {
  type: 'input';
  field: string;
  className?: string;
  placeholder: string;
  maxLength?: number;
  showCount?: boolean;
  style?: React.CSSProperties;
  shouldRender?: (isArraySubParam: boolean) => boolean;
  disabled?: (isArraySubParam: boolean) => boolean;
}
interface SelectTd {
  type: 'select';
  field: string;
  options: Array<any>;
  className?: string;
  style?: React.CSSProperties;
  shouldRender?: (isArraySubParam: boolean) => boolean;
  shouldDisabled?: (isArraySubParam: boolean) => boolean;
}
interface CheckboxTd {
  type: 'checkbox';
  field: string;
  className?: string;
  style?: React.CSSProperties;
  shouldRender?: (isArraySubParam: boolean) => boolean;
  shouldDisabled?: (isArraySubParam: boolean) => boolean;
}
interface ActionTd {
  field: 'action';
  content: React.ReactNode;
  shouldRender?: (isArraySubParam: boolean) => boolean;
  shouldDisabled?: (isArraySubParam: boolean) => boolean;
}

interface ParamTrProps {
  tdOptions: Array<InputTd | SelectTd | CheckboxTd | ActionTd>;
  errors: Map<string, Record<string, ParamValidateResultEnum>>;
  param: ParamItem;
  onUpdateParam: (paramId: string, field: keyof ParamItem, value: any) => void;
  errorMessages: Record<ParamValidateResultEnum, string>;
  depth?: number; // 层级，默认值为1
  onDeleteParam: (paramId: string) => void; // 删除参数
  onAddSubParam: (paramId: string) => void; // 添加子参数
  deleteVisible?: boolean; // 是否显示删除按钮
  isArraySubParam?: boolean; // 是否为数组子参数
  collapsedKeys: Set<string>; // 记录哪些数组元素的子参数是折叠的
  onCollapsedChange: (paramId: string, collapsed: boolean) => void; // 切换是否收起
}

const ParamTr = ({
  tdOptions,
  errors,
  param,
  onUpdateParam,
  errorMessages,
  depth = 1,
  onDeleteParam,
  onAddSubParam,
  deleteVisible = true,
  isArraySubParam = false,
  collapsedKeys,
  onCollapsedChange,
}: ParamTrProps) => {
  // const [collapsed, setCollapsed] = useState<boolean>(false); // 是否收起，默认展开
  const collapsed = useMemo(() => collapsedKeys.has(param.id), [param.id, collapsedKeys]);

  const handleCollapsedChange = useCallback(
    (collapsed: boolean) => {
      onCollapsedChange(param.id, collapsed);
    },
    [param.id, onCollapsedChange]
  );

  // 删除参数
  const handleDeleteParam = useCallback(() => {
    onDeleteParam(param.id);
  }, [param.id, onDeleteParam]);

  // 添加子参数
  const handleAddSubParam = useCallback(() => {
    onAddSubParam(param.id);
  }, [param.id, onAddSubParam]);

  const tds = useMemo(
    () => [
      ...tdOptions.filter(item => item.shouldRender?.(isArraySubParam) ?? true), // 数组的子元素，类型下拉选项跟别的不一样
      {
        field: 'action',
        content: (
          <div>
            {deleteVisible && (
              <Tooltip title="删除">
                <Button
                  type="text"
                  className={classNames('dip-pl-0 dip-pr-0 dip-font-16', styles['action-icon'])}
                  icon={<DeleteIcon />}
                  onClick={handleDeleteParam}
                />
              </Tooltip>
            )}
            {param.type === ParamTypeEnum.Object && (
              <Tooltip title="新增子项">
                <Button
                  type="text"
                  className={classNames(
                    'dip-pl-0 dip-pr-0',
                    styles['action-icon'],
                    deleteVisible ? 'dip-ml-8' : 'dip-ml-40'
                  )}
                  icon={<PlusCircleOutlined />}
                  onClick={handleAddSubParam}
                />
              </Tooltip>
            )}
          </div>
        ),
      },
    ],
    [tdOptions, handleDeleteParam, handleAddSubParam, param.type, deleteVisible, isArraySubParam]
  );

  return (
    <>
      <tr>
        {tds.map(
          (
            { placeholder, field, maxLength, showCount, type, options, className, style, content, shouldDisabled },
            index
          ) => {
            const disabled = shouldDisabled?.(isArraySubParam) ?? false;
            const error: ParamValidateResultEnum =
              errors.get(param.id)?.[field as string] || ParamValidateResultEnum.Valid;
            // 数组、对象可以展开、收起子参数
            const canCollapsed =
              [ParamTypeEnum.Object, ParamTypeEnum.Array].includes(param.type) && param.sub_parameters?.length > 0;
            return (
              <td
                className={styles[`${field}-field`]}
                key={field}
                style={index === 0 ? { paddingLeft: `${(depth - 1) * 20}px` } : {}} // 层级越深，缩进越多
              >
                <span className="dip-flex-align-center dip-pl-2 dip-gap-8">
                  {index === 0 && (
                    <div
                      className={classNames('dip-pointer', styles['collapsed-icon'], {
                        'dip-opacity-0': !canCollapsed,
                      })}
                      onClick={canCollapsed ? () => handleCollapsedChange(!collapsed) : undefined}
                    >
                      {collapsed ? <CaretRightOutlined /> : <CaretDownOutlined />}
                    </div>
                  )}

                  {content ? (
                    content
                  ) : type === 'input' ? (
                    <Input
                      disabled={disabled}
                      className={className}
                      value={param[field] || ''}
                      status={error !== ParamValidateResultEnum.Valid ? 'error' : undefined}
                      onChange={e => onUpdateParam(param.id, field as any, e.target.value)}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      showCount={showCount}
                      autoComplete="off"
                    />
                  ) : type === 'select' ? (
                    <Select
                      disabled={disabled}
                      value={param[field] || ''}
                      onChange={value => onUpdateParam(param.id, field as any, value)}
                      options={options}
                      className={className}
                    />
                  ) : (
                    <input
                      disabled={disabled}
                      type="checkbox"
                      className={classNames(className, {
                        'dip-display-none': disabled,
                      })}
                      style={style}
                      checked={disabled ? false : param[field] || false}
                      onChange={e => onUpdateParam(param.id, field as any, e.target.checked)}
                    />
                  )}
                </span>
                {error !== ParamValidateResultEnum.Valid && (
                  <div className={classNames(styles['error'], 'dip-ml-22')}>{errorMessages[error]}</div>
                )}
              </td>
            );
          }
        )}
      </tr>
      {!collapsed &&
        (param?.sub_parameters || []).map(subParameter => (
          <ParamTr
            key={subParameter.id}
            tdOptions={tdOptions}
            errors={errors}
            param={subParameter}
            onUpdateParam={onUpdateParam}
            errorMessages={errorMessages}
            depth={depth + 1}
            onDeleteParam={onDeleteParam}
            onAddSubParam={onAddSubParam}
            deleteVisible={(param.sub_parameters || []).length > 1} // 只有一个子参数时，此子参数禁止删除
            isArraySubParam={param.type === ParamTypeEnum.Array}
            collapsedKeys={collapsedKeys}
            onCollapsedChange={onCollapsedChange}
          />
        ))}
    </>
  );
};

export default memo(ParamTr);
