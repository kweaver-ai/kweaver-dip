import { forwardRef, useState, useEffect, useImperativeHandle } from 'react'
import {
    Form,
    Button,
    Select,
    Tooltip,
    Row,
    Col,
    FormInstance,
    FormListFieldData,
} from 'antd'
import { cloneDeep, trim } from 'lodash'
import classnames from 'classnames'
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { IDatasheetField, dataTypeMapping, getCommonDataType } from '@/core'
import { AddOutlined } from '@/icons'
import { getFieldTypeIcon } from '@/components/IndicatorManage/helper'
import styles from './styles.module.less'
import { tipLabel } from '../SceneAnalysis/UnitForm/helper'
import { noContentLimit } from '../SceneAnalysis/const'
import __ from './locale'
import { fieldInfos } from '../IndicatorManage/const'
import { FieldLimitItem } from '../RowAndColFilter/RowFilter/CommonItem'

interface DataProps {
    fieldList: any[]
    initData: any
    exampleData?: any
    onConfigChange: (value: any) => void
    form: FormInstance
}

const options = [
    {
        value: 'and',
        label: __('且'),
    },
    {
        value: 'or',
        label: __('或'),
    },
]

const DataFilter = forwardRef((props: DataProps, ref) => {
    const { fieldList, initData, exampleData, onConfigChange, form } = props
    // 组间条件
    const [groupRelation, setGroupRelation] = useState<string>('and')
    // 组内条件
    const [memberRelation, setMemberRelation] = useState<string[]>([])

    const [fieldOptions, setFieldOptions] = useState<any[]>([])

    const getFormatValues = (values: any, list: any[]) => {
        const newValues = cloneDeep(values)
        newValues.where = newValues.where
            .map((item, index: number) => {
                if (!item) return null
                return {
                    ...(memberRelation[index]
                        ? { relation: memberRelation[index] }
                        : {}),
                    member: (item.member || [])
                        .map((m) => {
                            if (!m) return null
                            const targetField: IDatasheetField = list?.find(
                                (f: IDatasheetField) => f.id === m.id,
                            )
                            if (!targetField) return null
                            return {
                                ...m,
                                name_en: targetField.technical_name,
                                data_type: targetField.data_type,
                                name: targetField.business_name,
                            }
                        })
                        .filter(Boolean),
                }
            })
            .filter((item) => item && item.member.length > 0)
        newValues.where_relation = groupRelation
        return newValues
    }

    useEffect(() => {
        if (initData) {
            form.setFieldsValue({ where: initData.where })
            setGroupRelation(initData.where_relation ?? 'and')
            setMemberRelation(initData.where.map((item) => item.relation))
        }
    }, [initData])

    const onReset = () => {
        form.resetFields(['where'])
        const values = form.getFieldsValue()
        onConfigChange(getFormatValues(values, fieldList))
    }

    const onValuesChange = (changeValue, values) => {
        onConfigChange(getFormatValues(values, fieldList))
    }

    const onFinish = async () => {
        const values = await form.validateFields()
        if (!values.where) {
            return {}
        }
        values.where = values.where.map((item, index: number) => ({
            relation: memberRelation[index],
            member: item.member.map((m) => {
                const targetField: IDatasheetField = fieldList?.find(
                    (f: IDatasheetField) => f.id === m.id,
                )!
                return {
                    ...m,
                    name_en: targetField.technical_name,
                    data_type: targetField.data_type,
                    name: targetField.business_name,
                }
            }),
        }))
        values.where_relation = groupRelation
        return values
    }

    useImperativeHandle(ref, () => ({
        onFinish,
        onReset,
    }))

    useEffect(() => {
        setFieldOptions(
            fieldList?.map((field) => {
                const isDisabled = dataTypeMapping.time.includes(
                    field.data_type,
                )
                return {
                    label: (
                        <Tooltip
                            title={
                                isDisabled
                                    ? __('当前不支持选择此类型的字段')
                                    : null
                            }
                        >
                            <span className={styles['label-container']}>
                                {getFieldTypeIcon(field.data_type)}
                                <span
                                    className={styles['label-name']}
                                    title={field.business_name}
                                >
                                    {field.business_name}
                                </span>
                            </span>
                        </Tooltip>
                    ),
                    value: field.id,
                    disabled: isDisabled,
                }
            }),
        )
    }, [fieldList])

    // 根据选择字段类型获取过滤条件的选项
    const getConditionOptions = (
        values,
        groupsIndex: number,
        groupIndex: number,
    ) => {
        const fieldId = values[groupsIndex].member[groupIndex]?.id
        const targetField = fieldList?.find((field) => field.id === fieldId)

        return targetField && targetField.data_type
            ? fieldInfos[getCommonDataType(targetField.data_type)]
                  .limitListOptions
            : []
    }

    // 关联字段搜索过滤
    const filterRelatedField = (inputValue: string, option) => {
        const res = fieldList
            ?.filter((info) =>
                info.business_name
                    .toLocaleLowerCase()
                    .includes(trim(inputValue.toLocaleLowerCase())),
            )
            ?.filter((info) => info.id === option?.value)
        return res.length > 0
    }

    const onFieldChange = (i, j) => {
        form.setFieldValue(['where', i, 'member', j, 'operator'], undefined)
        form.setFieldValue(['where', i, 'member', j, 'value'], undefined)
        form.setFields([
            {
                name: ['where', i, 'member', j, 'operator'],
                errors: [],
            },
            {
                name: ['where', i, 'member', j, 'value'],
                errors: [],
            },
        ])
    }
    const onOConditionChange = (i, j) => {
        form.setFieldValue(['where', i, 'member', j, 'value'], undefined)
        form.setFields([
            {
                name: ['where', i, 'member', j, 'value'],
                errors: [],
            },
        ])
    }

    // 删除条件
    const delCondition = (
        fields1: FormListFieldData[],
        fields: FormListFieldData[],
        field: FormListFieldData,
        field1: FormListFieldData,
        removeGroup: (index: number | number[]) => void,
        remove: (index: number | number[]) => void,
    ) => {
        // 分组只剩一组的时候，条件只剩一个的时候，不要删除分组，只清空当前表单
        // 分组中的条件大于一条，正常删除条件
        // 分组中的条件只有一条的时候，删除整个分组
        if (fields1.length === 1 && fields.length === 1) {
            form.resetFields([
                ['where', field1.name, 'member', field.name, 'id'],
                ['where', field1.name, 'member', field.name, 'operator'],
                ['where', field1.name, 'member', field.name, 'value'],
            ])
        } else if (fields.length > 1) {
            remove(field.name)
        } else {
            removeGroup(field1.name)
        }
        const values = form.getFieldsValue()
        onConfigChange(getFormatValues(values, fieldList))
    }

    // 条件关系变化
    const onCondRelationChange = (value: string, index1: number) => {
        const temp = cloneDeep(memberRelation)
        temp[index1] = value
        setMemberRelation(temp)
    }

    // 分组关系变化
    const onGroupRelationChange = (value: string) => {
        setGroupRelation(value)
    }

    useEffect(() => {
        const values = form.getFieldsValue()
        onConfigChange(getFormatValues(values, fieldList))
    }, [groupRelation, fieldList])

    useEffect(() => {
        if (memberRelation.length) {
            const values = form.getFieldsValue()
            onConfigChange(getFormatValues(values, fieldList))
        }
    }, [memberRelation, fieldList])

    return (
        <div className={styles['limit-row-wrapper']}>
            <Form
                form={form}
                onFinish={onFinish}
                autoComplete="off"
                onValuesChange={onValuesChange}
            >
                <Form.List name="where" initialValue={[{ member: [''] }]}>
                    {(fields1, { add: addGroup, remove: removeGroup }) => {
                        return (
                            <>
                                <div className={styles['row-content']}>
                                    <div
                                        className={classnames(
                                            styles['outer-operator-container'],
                                            {
                                                [styles.disabled]:
                                                    fields1.length <= 1,
                                            },
                                        )}
                                    >
                                        <span>{__('每组间满足')}</span>
                                        <Select
                                            placement="bottomLeft"
                                            className={classnames(
                                                styles['left-select'],
                                                styles.relations,
                                            )}
                                            disabled={fields1.length <= 1}
                                            options={options}
                                            value={groupRelation}
                                            onChange={onGroupRelationChange}
                                            getPopupContainer={(n) =>
                                                n.parentNode
                                            }
                                        />
                                        <span>{__('条件')}</span>
                                    </div>
                                    <div className={styles['groups-container']}>
                                        {fields1.map((field1, index1) => {
                                            return (
                                                <Form.List
                                                    name={[
                                                        field1.name,
                                                        'member',
                                                    ]}
                                                    key={index1}
                                                    initialValue={['']}
                                                >
                                                    {(
                                                        fields,
                                                        { add, remove },
                                                    ) =>
                                                        fields.length <
                                                        1 ? null : (
                                                            <>
                                                                <div
                                                                    className={classnames(
                                                                        styles[
                                                                            'left-operator'
                                                                        ],
                                                                        {
                                                                            [styles.disabled]:
                                                                                fields.length <=
                                                                                1,
                                                                        },
                                                                    )}
                                                                >
                                                                    <span>
                                                                        {__(
                                                                            '过滤条件',
                                                                        )}
                                                                    </span>
                                                                    <Select
                                                                        placement="bottomLeft"
                                                                        disabled={
                                                                            fields.length <=
                                                                            1
                                                                        }
                                                                        className={
                                                                            styles.relations
                                                                        }
                                                                        options={
                                                                            options
                                                                        }
                                                                        defaultValue="and"
                                                                        value={
                                                                            memberRelation[
                                                                                index1
                                                                            ]
                                                                        }
                                                                        onChange={(
                                                                            value,
                                                                        ) =>
                                                                            onCondRelationChange(
                                                                                value,
                                                                                index1,
                                                                            )
                                                                        }
                                                                        getPopupContainer={(
                                                                            n,
                                                                        ) =>
                                                                            n.parentNode
                                                                        }
                                                                    />
                                                                    <span>
                                                                        {__(
                                                                            '关系',
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <div
                                                                    className={
                                                                        styles[
                                                                            'condition-groups-wrapper'
                                                                        ]
                                                                    }
                                                                >
                                                                    {fields.map(
                                                                        (
                                                                            field,
                                                                            index,
                                                                        ) => {
                                                                            return (
                                                                                <Row
                                                                                    align="middle"
                                                                                    className={
                                                                                        styles.mb12
                                                                                    }
                                                                                    gutter={
                                                                                        8
                                                                                    }
                                                                                    key={
                                                                                        index
                                                                                    }
                                                                                >
                                                                                    <Col>
                                                                                        <MinusCircleOutlined
                                                                                            style={{
                                                                                                color:
                                                                                                    fields.length ===
                                                                                                        1 &&
                                                                                                    fields1.length ===
                                                                                                        1
                                                                                                        ? 'rgba(0,0,0,.65)'
                                                                                                        : 'currentcolor',
                                                                                            }}
                                                                                            onClick={() =>
                                                                                                delCondition(
                                                                                                    fields1,
                                                                                                    fields,
                                                                                                    field,
                                                                                                    field1,
                                                                                                    removeGroup,
                                                                                                    remove,
                                                                                                )
                                                                                            }
                                                                                        />
                                                                                    </Col>
                                                                                    <Col
                                                                                        span={
                                                                                            20
                                                                                        }
                                                                                    >
                                                                                        <Row
                                                                                            className={
                                                                                                styles.mb8
                                                                                            }
                                                                                            gutter={
                                                                                                8
                                                                                            }
                                                                                        >
                                                                                            <Col
                                                                                                span={
                                                                                                    12
                                                                                                }
                                                                                            >
                                                                                                <Form.Item
                                                                                                    name={[
                                                                                                        field.name,
                                                                                                        'id',
                                                                                                    ]}
                                                                                                    rules={[
                                                                                                        {
                                                                                                            required:
                                                                                                                true,
                                                                                                            message:
                                                                                                                __(
                                                                                                                    '请选择信息项',
                                                                                                                ),
                                                                                                        },
                                                                                                    ]}
                                                                                                >
                                                                                                    <Select
                                                                                                        style={{
                                                                                                            flexShrink: 1,
                                                                                                        }}
                                                                                                        placeholder={__(
                                                                                                            '信息项',
                                                                                                        )}
                                                                                                        options={
                                                                                                            fieldOptions
                                                                                                        }
                                                                                                        allowClear
                                                                                                        showSearch
                                                                                                        filterOption={(
                                                                                                            inputValue,
                                                                                                            option,
                                                                                                        ) =>
                                                                                                            filterRelatedField(
                                                                                                                inputValue,
                                                                                                                option,
                                                                                                            )
                                                                                                        }
                                                                                                        notFoundContent={tipLabel(
                                                                                                            __(
                                                                                                                '抱歉，没有找到相关内容',
                                                                                                            ),
                                                                                                        )}
                                                                                                        getPopupContainer={(
                                                                                                            node,
                                                                                                        ) =>
                                                                                                            node.parentNode
                                                                                                        }
                                                                                                        onChange={() => {
                                                                                                            onFieldChange(
                                                                                                                field1.name,
                                                                                                                field.name,
                                                                                                            )
                                                                                                        }}
                                                                                                    />
                                                                                                </Form.Item>
                                                                                            </Col>
                                                                                            <Col
                                                                                                span={
                                                                                                    12
                                                                                                }
                                                                                            >
                                                                                                <Form.Item
                                                                                                    noStyle
                                                                                                    shouldUpdate={(
                                                                                                        pre,
                                                                                                        cur,
                                                                                                    ) => {
                                                                                                        return (
                                                                                                            pre
                                                                                                                ?.where[
                                                                                                                index1
                                                                                                            ]
                                                                                                                ?.member[
                                                                                                                index
                                                                                                            ]
                                                                                                                ?.id !==
                                                                                                            cur
                                                                                                                ?.where[
                                                                                                                index1
                                                                                                            ]
                                                                                                                ?.member[
                                                                                                                index
                                                                                                            ]
                                                                                                                ?.id
                                                                                                        )
                                                                                                    }}
                                                                                                >
                                                                                                    {({
                                                                                                        getFieldValue,
                                                                                                    }) => {
                                                                                                        const conditionOptions =
                                                                                                            getConditionOptions(
                                                                                                                getFieldValue(
                                                                                                                    'where',
                                                                                                                ),
                                                                                                                index1,
                                                                                                                index,
                                                                                                            )
                                                                                                        return (
                                                                                                            <Form.Item
                                                                                                                name={[
                                                                                                                    field.name,
                                                                                                                    'operator',
                                                                                                                ]}
                                                                                                                rules={[
                                                                                                                    {
                                                                                                                        required:
                                                                                                                            true,
                                                                                                                        message:
                                                                                                                            __(
                                                                                                                                '请选择查询条件',
                                                                                                                            ),
                                                                                                                    },
                                                                                                                ]}
                                                                                                            >
                                                                                                                <Select
                                                                                                                    placeholder={__(
                                                                                                                        '查询条件',
                                                                                                                    )}
                                                                                                                    options={
                                                                                                                        conditionOptions
                                                                                                                    }
                                                                                                                    notFoundContent={__(
                                                                                                                        '请先选择字段',
                                                                                                                    )}
                                                                                                                    onChange={() => {
                                                                                                                        onOConditionChange(
                                                                                                                            field1.name,
                                                                                                                            field.name,
                                                                                                                        )
                                                                                                                    }}
                                                                                                                />
                                                                                                            </Form.Item>
                                                                                                        )
                                                                                                    }}
                                                                                                </Form.Item>
                                                                                            </Col>
                                                                                        </Row>
                                                                                        <FieldLimitItem
                                                                                            width="100%"
                                                                                            isExplorationModal
                                                                                            // width={getLimitWidth(
                                                                                            //     outerFields,
                                                                                            //     innerFields,
                                                                                            // )}
                                                                                            field={
                                                                                                field
                                                                                            }
                                                                                            exampleData={
                                                                                                exampleData
                                                                                            }
                                                                                            openProbe={
                                                                                                false
                                                                                            }
                                                                                            getItem={(
                                                                                                getField,
                                                                                            ) =>
                                                                                                fieldList.find(
                                                                                                    (
                                                                                                        f,
                                                                                                    ) =>
                                                                                                        f.id ===
                                                                                                        getField(
                                                                                                            [
                                                                                                                'where',
                                                                                                                field1.name,
                                                                                                                'member',
                                                                                                                field.name,
                                                                                                                'id',
                                                                                                            ],
                                                                                                        ),
                                                                                                )
                                                                                            }
                                                                                            getOperator={(
                                                                                                getField,
                                                                                            ) =>
                                                                                                getField(
                                                                                                    [
                                                                                                        'where',
                                                                                                        field1.name,
                                                                                                        'member',
                                                                                                        field.name,
                                                                                                        'operator',
                                                                                                    ],
                                                                                                )
                                                                                            }
                                                                                            shouldUpdate={(
                                                                                                pre,
                                                                                                cur,
                                                                                            ) => {
                                                                                                return (
                                                                                                    pre
                                                                                                        .where[
                                                                                                        index1
                                                                                                    ]
                                                                                                        ?.member[
                                                                                                        index
                                                                                                    ]
                                                                                                        ?.id !==
                                                                                                        cur
                                                                                                            .where[
                                                                                                            index1
                                                                                                        ]
                                                                                                            ?.member[
                                                                                                            index
                                                                                                        ]
                                                                                                            ?.id ||
                                                                                                    pre
                                                                                                        .where[
                                                                                                        index1
                                                                                                    ]
                                                                                                        ?.member[
                                                                                                        index
                                                                                                    ]
                                                                                                        ?.operator !==
                                                                                                        cur
                                                                                                            .where[
                                                                                                            index1
                                                                                                        ]
                                                                                                            ?.member[
                                                                                                            index
                                                                                                        ]
                                                                                                            ?.operator
                                                                                                )
                                                                                            }}
                                                                                        />
                                                                                    </Col>

                                                                                    {index +
                                                                                        1 ===
                                                                                        fields.length && (
                                                                                        <Col>
                                                                                            <Form.Item
                                                                                                noStyle
                                                                                                shouldUpdate={(
                                                                                                    pre,
                                                                                                    cur,
                                                                                                ) => {
                                                                                                    return (
                                                                                                        pre
                                                                                                            .where[
                                                                                                            index1
                                                                                                        ]
                                                                                                            ?.member[
                                                                                                            index
                                                                                                        ] !==
                                                                                                        cur
                                                                                                            .where[
                                                                                                            index1
                                                                                                        ]
                                                                                                            ?.member[
                                                                                                            index
                                                                                                        ]
                                                                                                    )
                                                                                                }}
                                                                                            >
                                                                                                {({
                                                                                                    getFieldValue,
                                                                                                }) => {
                                                                                                    const rowInfo =
                                                                                                        getFieldValue(
                                                                                                            'where',
                                                                                                        )[
                                                                                                            index1
                                                                                                        ]
                                                                                                            .member[
                                                                                                            index
                                                                                                        ]
                                                                                                    const noLimitContent =
                                                                                                        noContentLimit.includes(
                                                                                                            rowInfo?.operator,
                                                                                                        )
                                                                                                    // const isAllowAdd =
                                                                                                    //     (rowInfo &&
                                                                                                    //         rowInfo.id &&
                                                                                                    //         rowInfo.operator &&
                                                                                                    //         rowInfo.value &&
                                                                                                    //         fields.length <
                                                                                                    //             20) ||
                                                                                                    //     noLimitContent
                                                                                                    const isAllowAdd =
                                                                                                        true
                                                                                                    return (
                                                                                                        <PlusCircleOutlined
                                                                                                            style={{
                                                                                                                color: !isAllowAdd
                                                                                                                    ? 'rgba(0,0,0,.45)'
                                                                                                                    : 'currentColor',
                                                                                                            }}
                                                                                                            onClick={() => {
                                                                                                                if (
                                                                                                                    isAllowAdd
                                                                                                                ) {
                                                                                                                    add()
                                                                                                                    if (
                                                                                                                        fields.length ===
                                                                                                                        1
                                                                                                                    ) {
                                                                                                                        memberRelation[
                                                                                                                            index1
                                                                                                                        ] =
                                                                                                                            'and'
                                                                                                                        setMemberRelation(
                                                                                                                            memberRelation,
                                                                                                                        )
                                                                                                                    }
                                                                                                                }
                                                                                                            }}
                                                                                                        />
                                                                                                    )
                                                                                                }}
                                                                                            </Form.Item>
                                                                                        </Col>
                                                                                    )}
                                                                                </Row>
                                                                            )
                                                                        },
                                                                    )}
                                                                </div>
                                                            </>
                                                        )
                                                    }
                                                </Form.List>
                                            )
                                        })}
                                    </div>
                                </div>
                                <Button
                                    onClick={() => addGroup()}
                                    type="link"
                                    icon={<AddOutlined />}
                                    className={styles['add-filter-btn']}
                                    disabled={fields1.length === 20}
                                >
                                    {__('新增一组过滤')}
                                </Button>
                            </>
                        )
                    }}
                </Form.List>
            </Form>
        </div>
    )
})

export default DataFilter
