import { Form, Select, Space, Input } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import { cloneDeep, trim, unionBy } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import { FieldInfosByEN, RelationOptions, UnLimitType } from '../const'
import CopoundInput from './CopoundInput'
import { AddOutlined, DeleteOutLined } from '@/icons'
import { getTypeText } from '@/utils'

/** 最大嵌套条数 */
export const MAX_COUNT_LIMIT = 20

export const tipLabel = (text: string) => (
    <div
        style={{
            color: 'rgba(0, 0, 0, 0.45)',
        }}
    >
        <div>{text}</div>
    </div>
)

/** 关系选项 */
export const RelationOperator = ({ value, onChange }: any) => {
    return (
        <div className={styles['box-operator-container']}>
            <div className={styles['box-operator']}>
                <Select
                    size="small"
                    placement="bottomLeft"
                    bordered={false}
                    defaultValue="and"
                    className={styles['op-select']}
                    suffixIcon={<CaretDownOutlined />}
                    options={RelationOptions}
                    value={value}
                    onChange={onChange}
                    getPopupContainer={(n) => n.parentNode}
                />
            </div>
        </div>
    )
}

/**
 * 属性字段选择项
 */
export const FieldSelectItem = ({
    field,
    options,
    filterOption,
    onChange,
    width,
}: any) => {
    return (
        <Form.Item
            name={[field.name, 'id']}
            rules={[
                {
                    required: true,
                    message: __('请选择字段名称'),
                },
            ]}
        >
            <Select
                style={{
                    width: width || '100%',
                    flexShrink: 1,
                }}
                placeholder={__('请选择字段名称')}
                options={options}
                allowClear
                showSearch
                filterOption={filterOption}
                notFoundContent={tipLabel(__('抱歉，没有找到相关内容'))}
                getPopupContainer={(node) => node.parentNode}
                onChange={onChange}
            />
        </Form.Item>
    )
}
/**
 * 模板属性字段输入项
 */
export const TemplateFieldItem = ({ field, onChange, width }: any) => {
    return (
        <div className={styles.tempInput}>
            <span>{'${'}</span>
            <Form.Item
                name={[field.name, 'id']}
                rules={[
                    {
                        required: true,
                        message: __('请输入字段名称'),
                    },
                ]}
            >
                <Input
                    placeholder={__('字段名称')}
                    maxLength={128}
                    onChange={onChange}
                    width={width}
                />
            </Form.Item>
            <span>{'}'}</span>
        </div>
    )
}

/**
 * 属性字段条件项
 */
export const FieldOperatorItem = ({
    field,
    getOptions,
    shouldUpdate,
    onChange,
    width,
}: any) => {
    return (
        <Form.Item noStyle shouldUpdate={shouldUpdate}>
            {({ getFieldValue }) => {
                return (
                    <Form.Item
                        name={[field.name, 'operator']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择过滤条件'),
                            },
                        ]}
                    >
                        <Select
                            style={{
                                width: width || '100%',
                            }}
                            placeholder={__('过滤条件')}
                            options={getOptions(getFieldValue)}
                            notFoundContent={__('请先选择字段')}
                            onChange={onChange}
                            getPopupContainer={(n) => n.parentNode}
                        />
                    </Form.Item>
                )
            }}
        </Form.Item>
    )
}

/**
 * 属性字段限定项
 */
export const FieldLimitItem = ({
    field,
    getItem,
    width,
    getOperator,
    shouldUpdate,
    exampleData,
    openProbe,
    onChange,
    isTemplateConfig,
    isExplorationModal,
    disabled = false,
}: any) => {
    return (
        <Form.Item noStyle shouldUpdate={shouldUpdate}>
            {({ getFieldValue }) => {
                const operator = getOperator(getFieldValue)
                const required = !UnLimitType.includes(operator)
                return (
                    <Form.Item
                        name={[field.name, 'value']}
                        rules={[
                            {
                                required: operator ? required : false,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <CopoundInput
                            width={width}
                            fieldInfo={getItem(getFieldValue)}
                            condition={operator}
                            exampleData={exampleData}
                            openProbe={openProbe}
                            onChange={onChange}
                            isTemplateConfig={isTemplateConfig}
                            isExplorationModal={isExplorationModal}
                            disabled={disabled}
                        />
                    </Form.Item>
                )
            }}
        </Form.Item>
    )
}

export const InnerBtnBox = ({
    isOnly,
    isOutLimit,
    showAdd,
    canAdd,
    getRowItem,
    shouldUpdate,
    onDelete,
    isTemplateConfig,
    onAdd,
}: any) => {
    return (
        <div className={styles['line-btns']}>
            <Form.Item>
                <DeleteOutLined
                    style={{
                        color: isOnly && 'rgba(0,0,0,.65)',
                    }}
                    onClick={onDelete}
                />
            </Form.Item>

            {showAdd && (
                <Form.Item noStyle shouldUpdate={shouldUpdate}>
                    {({ getFieldValue }) => {
                        const rowInfo = getRowItem(getFieldValue)
                        const isUnLimit = UnLimitType.includes(
                            rowInfo?.operator,
                        )
                        const isAllowAdd =
                            (rowInfo &&
                                rowInfo.id &&
                                rowInfo.operator &&
                                rowInfo.value &&
                                canAdd) ||
                            (isTemplateConfig &&
                                rowInfo?.operator &&
                                rowInfo?.value) ||
                            isUnLimit

                        return (
                            <AddOutlined
                                style={{
                                    color: !isAllowAdd && 'rgba(0,0,0,.45)',
                                    marginBottom: '24px',
                                }}
                                onClick={() => {
                                    if (isAllowAdd) {
                                        onAdd()
                                    }
                                }}
                            />
                        )
                    }}
                </Form.Item>
            )}
        </div>
    )
}

export const AllFieldLimitListOptions = () => {
    const allOptions: any[] = []
    const list = Object.values(FieldInfosByEN).map((o) => o.limitListOptions)
    list.forEach((o) => allOptions.push(...o))
    return unionBy(allOptions, 'value')
}

// 根据选择字段类型获取过滤条件的选项
const getConditionOptions = (
    data,
    values,
    groupsIndex: number,
    groupIndex: number,
    isTemplateConfig: boolean,
    isTemplateCustom: boolean,
) => {
    const fieldId = values[groupsIndex].member[groupIndex]?.id
    const targetField = data.find((field) => field.id === fieldId)

    return isTemplateConfig
        ? AllFieldLimitListOptions()
        : targetField && targetField.data_type
        ? FieldInfosByEN[getTypeText(targetField.data_type)].limitListOptions
        : isTemplateCustom
        ? AllFieldLimitListOptions()
        : []
}

const getLimitWidth = (fieldFirst, fieldSecond) => {
    return fieldFirst.length < 2
        ? fieldSecond.length > 1
            ? 430
            : 480
        : fieldSecond.length > 1
        ? 464
        : 420
}

// 关联字段搜索过滤
const filterRelatedField = (data, inputValue: string, option) => {
    const res = data
        .filter((info) =>
            info.business_name
                .toLocaleLowerCase()
                .includes(trim(inputValue.toLocaleLowerCase())),
        )
        .filter((info) => info.id === option?.value)
    return res.length > 0
}

/** 行渲染 */
export const RowInnerLine = ({
    data,
    options,
    outerFields,
    outerIdx,
    outerItem,
    removeGroup,
    memberRelation,
    setMemberRelation,
    onConditionChange,
    onFieldChange,
    exampleData,
    openProbe,
    commonItemWidth,
    isTemplateCustom,
    isTemplateConfig,
    isExplorationModal,
}: any) => {
    return (
        <Form.List
            name={[outerItem.name, 'member']}
            initialValue={['']}
            key={outerIdx}
        >
            {(innerFields, { add, remove }) =>
                innerFields.length < 1 ? null : (
                    <div className={styles['group-container']}>
                        {innerFields.length > 1 && (
                            <RelationOperator
                                value={memberRelation[outerIdx]}
                                onChange={(val) => {
                                    const temp = cloneDeep(memberRelation)
                                    temp[outerIdx] = val
                                    setMemberRelation(temp)
                                }}
                            />
                        )}
                        <div className={styles['inner-line']}>
                            {innerFields.map((innerItem, innerIdx) => {
                                return (
                                    <Space
                                        key={innerIdx}
                                        align="center"
                                        size={16}
                                        className={styles.space}
                                    >
                                        {isTemplateConfig ? (
                                            <TemplateFieldItem
                                                field={innerItem}
                                                onChange={() => {
                                                    onFieldChange(
                                                        outerItem.name,
                                                        innerItem.name,
                                                    )
                                                }}
                                                width={
                                                    commonItemWidth?.selectWidt
                                                }
                                            />
                                        ) : (
                                            <FieldSelectItem
                                                field={innerItem}
                                                options={options}
                                                width={
                                                    commonItemWidth?.selectWidt
                                                }
                                                filterOption={(
                                                    inputValue,
                                                    option,
                                                ) =>
                                                    filterRelatedField(
                                                        data,
                                                        inputValue,
                                                        option,
                                                    )
                                                }
                                                onChange={() => {
                                                    onFieldChange(
                                                        outerItem.name,
                                                        innerItem.name,
                                                    )
                                                }}
                                            />
                                        )}
                                        <FieldOperatorItem
                                            field={innerItem}
                                            getOptions={(getField) =>
                                                getConditionOptions(
                                                    data,
                                                    getField('where'),
                                                    outerIdx,
                                                    innerIdx,
                                                    isTemplateConfig,
                                                    isTemplateCustom,
                                                )
                                            }
                                            onChange={() => {
                                                onConditionChange(
                                                    outerItem.name,
                                                    innerItem.name,
                                                )
                                            }}
                                            shouldUpdate={(pre, cur) => {
                                                return (
                                                    pre.where?.[outerIdx]
                                                        ?.member[innerIdx]
                                                        ?.id !==
                                                    cur.where?.[outerIdx]
                                                        ?.member[innerIdx]?.id
                                                )
                                            }}
                                            width={
                                                commonItemWidth?.operatorWidth
                                            }
                                        />
                                        <FieldLimitItem
                                            width={
                                                commonItemWidth?.limitWidth ||
                                                '100%'
                                            }
                                            isExplorationModal={
                                                isExplorationModal
                                            }
                                            isTemplateConfig={isTemplateConfig}
                                            // width={getLimitWidth(
                                            //     outerFields,
                                            //     innerFields,
                                            // )}
                                            field={innerItem}
                                            exampleData={exampleData}
                                            openProbe={openProbe}
                                            getItem={(getField) =>
                                                data.find(
                                                    (f) =>
                                                        f.id ===
                                                        getField([
                                                            'where',
                                                            outerItem.name,
                                                            'member',
                                                            innerItem.name,
                                                            'id',
                                                        ]),
                                                )
                                            }
                                            getOperator={(getField) =>
                                                getField([
                                                    'where',
                                                    outerItem.name,
                                                    'member',
                                                    innerItem.name,
                                                    'operator',
                                                ])
                                            }
                                            shouldUpdate={(pre, cur) => {
                                                return (
                                                    pre.where?.[outerIdx]
                                                        ?.member[innerIdx]
                                                        ?.id !==
                                                        cur.where?.[outerIdx]
                                                            ?.member[innerIdx]
                                                            ?.id ||
                                                    pre.where?.[outerIdx]
                                                        ?.member[innerIdx]
                                                        ?.operator !==
                                                        cur.where?.[outerIdx]
                                                            ?.member[innerIdx]
                                                            ?.operator
                                                )
                                            }}
                                        />
                                        <InnerBtnBox
                                            isOnly={
                                                innerFields.length === 1 &&
                                                outerFields.length === 1
                                            }
                                            isTemplateConfig={isTemplateConfig}
                                            canAdd={
                                                innerFields.length <
                                                MAX_COUNT_LIMIT
                                            }
                                            showAdd={
                                                innerIdx + 1 ===
                                                innerFields.length
                                            }
                                            getRowItem={(getField) =>
                                                getField('where')[outerIdx]
                                                    .member[innerIdx]
                                            }
                                            shouldUpdate={(pre, cur) => {
                                                return (
                                                    pre.where?.[outerIdx]
                                                        ?.member[innerIdx] !==
                                                    cur.where?.[outerIdx]
                                                        ?.member[innerIdx]
                                                )
                                            }}
                                            onAdd={() => {
                                                add()
                                                if (innerFields.length === 1) {
                                                    // eslint-disable-next-line no-param-reassign
                                                    memberRelation[outerIdx] =
                                                        'and'
                                                    setMemberRelation(
                                                        memberRelation,
                                                    )
                                                }
                                            }}
                                            onDelete={() => {
                                                remove(innerItem.name)
                                                if (innerFields.length === 1) {
                                                    removeGroup(outerIdx)
                                                }
                                            }}
                                        />
                                    </Space>
                                )
                            })}
                        </div>
                    </div>
                )
            }
        </Form.List>
    )
}
