import { FC, useEffect, useMemo, useState } from 'react'
import { FormInstance } from 'antd/es/form'
import { Button, Col, Form, Input, Row, Select, Space, Tooltip } from 'antd'
import __ from '../../locale'
import { AddOutlined, DeleteOutLined } from '@/icons'
import styles from './styles.module.less'
import { formatError, getFormsFieldsList, transformQuery } from '@/core'
import { useBusinessModelContext } from '../../BusinessModelProvider'
import { operatingKeyList } from '../../const'
import { notBackslashReg } from '@/utils'

interface ItemFormSelectProps {
    formInstance: FormInstance
    outIndex: number
    formId: string
    modelId: string
}

const ItemFormSelect: FC<ItemFormSelectProps> = ({
    formInstance,
    outIndex,
    formId,
    modelId,
}) => {
    const [fieldList, setFieldList] = useState<any[]>([])
    const [usedFieldIds, setUsedFieldIds] = useState<string[]>([])
    const { isDraft, selectedVersion } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    useEffect(() => {
        getFieldList(formId)
    }, [formId])

    useEffect(() => {
        const source_field =
            formInstance.getFieldValue([
                'source_table',
                outIndex,
                'source_field',
            ]) || []
        const hasUsedFieldIds = source_field.map((item) => item.field_id)
        setUsedFieldIds(hasUsedFieldIds)
    }, [formInstance, outIndex])

    /**
     * 获取字段列表
     * @param formId 表id
     */
    const getFieldList = async (id: string) => {
        try {
            const res = await getFormsFieldsList(id, {
                limit: 999,
                ...versionParams,
            })
            setFieldList(
                res.entries.map((item) => ({
                    ...item,
                    label: item.name,
                    value: item.id,
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Form.List name={[outIndex, 'source_field']}>
            {(fields, { add, remove }) => {
                return (
                    <>
                        {fields.map((field, index) => {
                            return (
                                <Row key={field.key} gutter={16}>
                                    <Col span={6}>
                                        <Form.Item
                                            name={[index, 'field_id']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择来源字段'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={__(
                                                    '请选择来源字段（必选）',
                                                )}
                                                options={fieldList.filter(
                                                    (item) => {
                                                        const currentField =
                                                            formInstance.getFieldValue(
                                                                [
                                                                    'source_table',
                                                                    outIndex,
                                                                    'source_field',
                                                                    index,
                                                                    'field_id',
                                                                ],
                                                            )

                                                        if (
                                                            currentField ===
                                                            item.value
                                                        ) {
                                                            return true
                                                        }
                                                        return !usedFieldIds.includes(
                                                            item.value,
                                                        )
                                                    },
                                                )}
                                                onChange={(value) => {
                                                    if (
                                                        index >
                                                        usedFieldIds.length - 1
                                                    ) {
                                                        setUsedFieldIds(
                                                            usedFieldIds.concat(
                                                                value,
                                                            ),
                                                        )
                                                    } else {
                                                        const newUsedFields =
                                                            usedFieldIds.map(
                                                                (
                                                                    item,
                                                                    usedIndex,
                                                                ) => {
                                                                    if (
                                                                        index ===
                                                                        usedIndex
                                                                    ) {
                                                                        return value
                                                                    }
                                                                    return item
                                                                },
                                                            )
                                                        setUsedFieldIds(
                                                            newUsedFields,
                                                        )
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            name={[index, 'operation_logic']}
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择运算逻辑'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                placeholder={__('运算逻辑')}
                                                options={operatingKeyList}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            name={[index, 'source_rule']}
                                            rules={[
                                                {
                                                    pattern: notBackslashReg,
                                                    message:
                                                        __(
                                                            '取值规则不能包含\\',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__('取值规则')}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            name={[index, 'source_rule_desc']}
                                            rules={[
                                                {
                                                    pattern: notBackslashReg,
                                                    message:
                                                        __(
                                                            '取值说明不能包含\\',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__('取值说明')}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item
                                            name={[index, 'check_rule']}
                                            rules={[
                                                {
                                                    pattern: notBackslashReg,
                                                    message:
                                                        __(
                                                            '检验规则不能包含\\',
                                                        ),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__('检验规则')}
                                                maxLength={300}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={2}>
                                        <Space>
                                            <Tooltip
                                                title={
                                                    index === 0 &&
                                                    fields.length === 1
                                                        ? ''
                                                        : __('删除')
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.innerItemDelWrap
                                                    }
                                                    style={{
                                                        marginLeft: 12,
                                                    }}
                                                >
                                                    <DeleteOutLined
                                                        className={
                                                            styles.innerItemDel
                                                        }
                                                        hidden={
                                                            index === 0 &&
                                                            fields.length === 1
                                                        }
                                                        onClick={() => {
                                                            const sourceFields =
                                                                formInstance.getFieldValue(
                                                                    [
                                                                        'source_table',
                                                                        outIndex,
                                                                        'source_field',
                                                                    ],
                                                                )
                                                            const newFields =
                                                                sourceFields.filter(
                                                                    (
                                                                        item,
                                                                        fieldIndex,
                                                                    ) =>
                                                                        fieldIndex !==
                                                                        index,
                                                                )
                                                            formInstance.setFieldValue(
                                                                [
                                                                    'source_table',
                                                                    outIndex,
                                                                    'source_field',
                                                                ],
                                                                newFields,
                                                            )
                                                            setUsedFieldIds(
                                                                usedFieldIds.filter(
                                                                    (
                                                                        item,
                                                                        usedIndex,
                                                                    ) =>
                                                                        usedIndex !==
                                                                        index,
                                                                ),
                                                            )
                                                        }}
                                                    />
                                                </div>
                                            </Tooltip>
                                            <Tooltip title={__('添加')}>
                                                <div
                                                    className={
                                                        styles.innerItemDelWrap
                                                    }
                                                >
                                                    <AddOutlined
                                                        className={
                                                            styles.innerItemDel
                                                        }
                                                        onClick={() => {
                                                            const newField = {
                                                                field_id: null,
                                                                source_field_name:
                                                                    '',
                                                                source_rule: '',
                                                            }
                                                            const sourceFields =
                                                                formInstance.getFieldValue(
                                                                    [
                                                                        'source_table',
                                                                        outIndex,
                                                                        'source_field',
                                                                    ],
                                                                )
                                                            const newFields = [
                                                                ...(sourceFields ||
                                                                    []),
                                                                newField,
                                                            ]
                                                            formInstance.setFieldValue(
                                                                [
                                                                    'source_table',
                                                                    outIndex,
                                                                    'source_field',
                                                                ],
                                                                newFields,
                                                            )
                                                        }}
                                                    />
                                                </div>
                                            </Tooltip>
                                        </Space>
                                    </Col>
                                </Row>
                            )
                        })}
                    </>
                )
            }}
        </Form.List>
    )
}

export default ItemFormSelect
