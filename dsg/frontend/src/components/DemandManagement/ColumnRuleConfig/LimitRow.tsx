import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { Button, Form, Select, Space } from 'antd'
import { CaretDownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { cloneDeep } from 'lodash'
import { AddOutlined, DeleteOutLined } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'
import { fieldInfos } from './const'
import LimitContent from './LimitContent'
import { IDatasheetField, getCommonDataType } from '@/core'
import Icons from '../Icons'

interface ILimitRow {
    fieldList: IDatasheetField[]
    isHaveData: boolean
    initData?: any
    ref?: any
}
const LimitRow: React.FC<ILimitRow> = forwardRef(
    ({ fieldList, isHaveData, initData }: any, ref) => {
        const [form] = Form.useForm()
        // 组间条件
        const [groupRelation, setGroupRelation] = useState<string>('and')
        // 组内条件
        const [memberRelation, setMemberRelation] = useState<string[]>([])

        const [fieldOptions, setFieldOptions] = useState<any[]>([])

        useEffect(() => {
            if (initData) {
                form.setFieldsValue({ where: initData.where })
                setGroupRelation(initData.where_relation)
                setMemberRelation(initData.where.map((item) => item.relation))
            }
        }, [initData])

        const onFinish = async () => {
            const values = await form.validateFields()
            values.where = values.where.map((item, index: number) => ({
                relation: memberRelation[index] || 'and',
                member: item.member.map((m) => {
                    const targetField: IDatasheetField = fieldList.find(
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
        }))

        useEffect(() => {
            setFieldOptions(
                fieldList.map((field) => {
                    return {
                        label: (
                            <span className={styles['label-container']}>
                                <Icons type={field.data_type} fontSize={16} />
                                <span
                                    className={styles['label-name']}
                                    title={field.business_name}
                                >
                                    {field.business_name}
                                </span>
                            </span>
                        ),
                        value: field.id,
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
            const targetField = fieldList.find((field) => field.id === fieldId)

            return targetField && targetField.data_type
                ? fieldInfos[getCommonDataType(targetField.data_type)]
                      .limitListOptions
                : []
        }

        const getLimitWidth = (fields1, fields) => {
            return fields1.length < 2
                ? fields.length > 1
                    ? 430
                    : 480
                : fields.length > 1
                ? 364
                : 420
        }

        return (
            <div className={styles['limit-row-wrapper']}>
                <Form form={form} onFinish={onFinish} autoComplete="off">
                    <Form.List name="where" initialValue={['']}>
                        {(fields1, { add: addGroup, remove: removeGroup }) => {
                            return (
                                <>
                                    <div className={styles['row-content']}>
                                        {fields1.length > 1 && (
                                            <div
                                                className={
                                                    styles[
                                                        'outer-operator-container'
                                                    ]
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles['outer-operator']
                                                    }
                                                >
                                                    <Select
                                                        size="small"
                                                        placement="bottomLeft"
                                                        bordered={false}
                                                        className={
                                                            styles[
                                                                'left-select'
                                                            ]
                                                        }
                                                        suffixIcon={
                                                            <CaretDownOutlined />
                                                        }
                                                        options={[
                                                            {
                                                                value: 'and',
                                                                label: __('且'),
                                                            },
                                                            {
                                                                value: 'or',
                                                                label: __('或'),
                                                            },
                                                        ]}
                                                        value={groupRelation}
                                                        onChange={(val) => {
                                                            setGroupRelation(
                                                                val,
                                                            )
                                                        }}
                                                        getPopupContainer={(
                                                            n,
                                                        ) => n.parentNode}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div
                                            className={classnames(
                                                styles['groups-container'],
                                                fields1.length > 1 &&
                                                    styles[
                                                        'groups-container-with-operator'
                                                    ],
                                            )}
                                        >
                                            {fields1.map((field1, index1) => {
                                                return (
                                                    <Form.List
                                                        name={[
                                                            field1.name,
                                                            'member',
                                                        ]}
                                                        initialValue={['']}
                                                        key={index1}
                                                    >
                                                        {(
                                                            fields,
                                                            { add, remove },
                                                        ) =>
                                                            fields.length <
                                                            1 ? null : (
                                                                <div
                                                                    className={
                                                                        styles[
                                                                            'group-container'
                                                                        ]
                                                                    }
                                                                >
                                                                    {fields.length >
                                                                        1 && (
                                                                        <div
                                                                            className={
                                                                                styles[
                                                                                    'left-operator'
                                                                                ]
                                                                            }
                                                                        >
                                                                            <Select
                                                                                size="small"
                                                                                placement="bottomLeft"
                                                                                bordered={
                                                                                    false
                                                                                }
                                                                                className={
                                                                                    styles[
                                                                                        'left-select'
                                                                                    ]
                                                                                }
                                                                                suffixIcon={
                                                                                    <CaretDownOutlined />
                                                                                }
                                                                                options={[
                                                                                    {
                                                                                        value: 'and',
                                                                                        label: __(
                                                                                            '且',
                                                                                        ),
                                                                                    },
                                                                                    {
                                                                                        value: 'or',
                                                                                        label: __(
                                                                                            '或',
                                                                                        ),
                                                                                    },
                                                                                ]}
                                                                                defaultValue="and"
                                                                                value={
                                                                                    memberRelation[
                                                                                        index1
                                                                                    ]
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) => {
                                                                                    const temp =
                                                                                        cloneDeep(
                                                                                            memberRelation,
                                                                                        )
                                                                                    temp[
                                                                                        index1
                                                                                    ] =
                                                                                        e
                                                                                    setMemberRelation(
                                                                                        temp,
                                                                                    )
                                                                                }}
                                                                                getPopupContainer={(
                                                                                    n,
                                                                                ) =>
                                                                                    n.parentNode
                                                                                }
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        {fields.map(
                                                                            (
                                                                                field,
                                                                                index,
                                                                            ) => {
                                                                                return (
                                                                                    <Space
                                                                                        key={
                                                                                            index
                                                                                        }
                                                                                        align="center"
                                                                                        size={
                                                                                            16
                                                                                        }
                                                                                        className={
                                                                                            styles.space
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
                                                                                                            '请选择字段名称',
                                                                                                        ),
                                                                                                },
                                                                                            ]}
                                                                                        >
                                                                                            <Select
                                                                                                style={{
                                                                                                    width: 292,
                                                                                                    flexShrink: 1,
                                                                                                }}
                                                                                                placeholder={__(
                                                                                                    '请选择字段名称',
                                                                                                )}
                                                                                                options={
                                                                                                    fieldOptions
                                                                                                }
                                                                                                getPopupContainer={(
                                                                                                    node,
                                                                                                ) =>
                                                                                                    node.parentNode
                                                                                                }
                                                                                                onChange={() => {
                                                                                                    form.setFieldValue(
                                                                                                        [
                                                                                                            'where',
                                                                                                            field1.name,
                                                                                                            'member',
                                                                                                            field.name,
                                                                                                            'operator',
                                                                                                        ],
                                                                                                        undefined,
                                                                                                    )
                                                                                                    form.setFieldValue(
                                                                                                        [
                                                                                                            'where',
                                                                                                            field1.name,
                                                                                                            'member',
                                                                                                            field.name,
                                                                                                            'value',
                                                                                                        ],
                                                                                                        undefined,
                                                                                                    )
                                                                                                }}
                                                                                            />
                                                                                        </Form.Item>
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
                                                                                                    ]
                                                                                                        ?.id !==
                                                                                                    cur
                                                                                                        .where[
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
                                                                                                                        '请选择过滤条件',
                                                                                                                    ),
                                                                                                            },
                                                                                                        ]}
                                                                                                    >
                                                                                                        <Select
                                                                                                            style={{
                                                                                                                width: 194,
                                                                                                            }}
                                                                                                            placeholder={__(
                                                                                                                '过滤条件',
                                                                                                            )}
                                                                                                            options={
                                                                                                                conditionOptions
                                                                                                            }
                                                                                                            notFoundContent={__(
                                                                                                                '请先选择字段',
                                                                                                            )}
                                                                                                            onChange={() => {
                                                                                                                form.setFieldValue(
                                                                                                                    [
                                                                                                                        'where',
                                                                                                                        field1.name,
                                                                                                                        'member',
                                                                                                                        field.name,
                                                                                                                        'value',
                                                                                                                    ],
                                                                                                                    undefined,
                                                                                                                )
                                                                                                            }}
                                                                                                        />
                                                                                                    </Form.Item>
                                                                                                )
                                                                                            }}
                                                                                        </Form.Item>
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
                                                                                        >
                                                                                            {({
                                                                                                getFieldValue,
                                                                                            }) => {
                                                                                                const fieldInfo =
                                                                                                    fieldList.find(
                                                                                                        (
                                                                                                            f,
                                                                                                        ) =>
                                                                                                            f.id ===
                                                                                                            getFieldValue(
                                                                                                                [
                                                                                                                    'where',
                                                                                                                    field1.name,
                                                                                                                    'member',
                                                                                                                    field.name,
                                                                                                                    'id',
                                                                                                                ],
                                                                                                            ),
                                                                                                    )
                                                                                                const operator =
                                                                                                    getFieldValue(
                                                                                                        [
                                                                                                            'where',
                                                                                                            field1.name,
                                                                                                            'member',
                                                                                                            field.name,
                                                                                                            'operator',
                                                                                                        ],
                                                                                                    )

                                                                                                return (
                                                                                                    <Form.Item
                                                                                                        name={[
                                                                                                            field.name,
                                                                                                            'value',
                                                                                                        ]}
                                                                                                        rules={[
                                                                                                            {
                                                                                                                required:
                                                                                                                    true,
                                                                                                                message:
                                                                                                                    '请填写限定内容',
                                                                                                            },
                                                                                                        ]}
                                                                                                    >
                                                                                                        <LimitContent
                                                                                                            width={getLimitWidth(
                                                                                                                fields1,
                                                                                                                fields,
                                                                                                            )}
                                                                                                            fieldInfo={
                                                                                                                fieldInfo
                                                                                                            }
                                                                                                            condition={
                                                                                                                operator
                                                                                                            }
                                                                                                            isExistData={
                                                                                                                isHaveData
                                                                                                            }
                                                                                                        />
                                                                                                    </Form.Item>
                                                                                                )
                                                                                            }}
                                                                                        </Form.Item>

                                                                                        <Form.Item>
                                                                                            <DeleteOutLined
                                                                                                style={{
                                                                                                    color:
                                                                                                        fields.length ===
                                                                                                            1 &&
                                                                                                        fields1.length ===
                                                                                                            1 &&
                                                                                                        'rgba(0,0,0,.65)',
                                                                                                }}
                                                                                                onClick={() => {
                                                                                                    if (
                                                                                                        fields.length ===
                                                                                                            1 &&
                                                                                                        fields1.length ===
                                                                                                            1
                                                                                                    )
                                                                                                        return
                                                                                                    remove(
                                                                                                        field.name,
                                                                                                    )
                                                                                                    if (
                                                                                                        fields.length ===
                                                                                                        1
                                                                                                    ) {
                                                                                                        removeGroup(
                                                                                                            index1,
                                                                                                        )
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </Form.Item>
                                                                                        {index +
                                                                                            1 ===
                                                                                            fields.length && (
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
                                                                                                    const isAllowAdd =
                                                                                                        rowInfo &&
                                                                                                        rowInfo.id &&
                                                                                                        rowInfo.operator &&
                                                                                                        rowInfo.value &&
                                                                                                        fields.length <
                                                                                                            20
                                                                                                    return (
                                                                                                        <AddOutlined
                                                                                                            style={{
                                                                                                                color:
                                                                                                                    !isAllowAdd &&
                                                                                                                    'rgba(0,0,0,.45)',
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
                                                                                        )}
                                                                                    </Space>
                                                                                )
                                                                            },
                                                                        )}
                                                                    </div>
                                                                </div>
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
                                        {__('新增过滤')}
                                    </Button>
                                </>
                            )
                        }}
                    </Form.List>
                </Form>
            </div>
        )
    },
)

export default LimitRow
