import React, { useEffect, useState } from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { Button, Form, FormInstance, Input, Select, Space, Tooltip } from 'antd'
import styles from './styles.module.less'
import { AddOutlined, CloseOutlined } from '@/icons'
import { infoItemsConditions } from './const'
import { ErrorInfo, nameReg } from '@/utils'
import __ from './locale'

interface IFilterRules {
    infoItems: any[]
    filterItems?: any[]
    isDetails?: boolean
    form?: FormInstance
}
const FilterRules: React.FC<IFilterRules> = ({
    infoItems,
    filterItems,
    isDetails = false,
    form,
}) => {
    const form1 = Form.useForm()[0]

    useEffect(() => {
        if (filterItems) {
            const f = form || form1
            f.setFieldsValue({
                filter_items: filterItems.length > 0 ? filterItems : [{}],
            })
        }
    }, [filterItems])

    const getTitle = (index: number, key: string) => {
        return filterItems?.[index]?.[key]
    }

    const comp = (
        <Form.List name="filter_items" initialValue={[{}]}>
            {(fields, { add, remove }) => (
                <>
                    {fields.map(({ key, name, ...restField }, index) => (
                        <Space
                            key={key}
                            style={{
                                display: 'flex',
                                marginBottom: 8,
                            }}
                            align="baseline"
                        >
                            <Form.Item
                                {...restField}
                                name={[name, 'item_uuid']}
                            >
                                <Select
                                    style={{ width: 110 }}
                                    placeholder={__('信息项')}
                                    disabled={!!filterItems}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {infoItems.map((item) => (
                                        <Select.Option
                                            key={item.item_uuid}
                                            value={item.item_uuid}
                                        >
                                            {item.item_name}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                name={[name, 'condition']}
                            >
                                <Select
                                    style={{ width: 80 }}
                                    placeholder={__('条件')}
                                    disabled={!!filterItems}
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                >
                                    {infoItemsConditions.map((condition) => (
                                        <Select.Option key={condition.value}>
                                            {condition.label}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item {...restField} name={[name, 'value']}>
                                <Input
                                    disabled={!!filterItems}
                                    placeholder={__('请输入值')}
                                    style={{ width: 110 }}
                                    maxLength={255}
                                    title={getTitle(index, 'value') || ''}
                                />
                            </Form.Item>
                            <Form.Item
                                {...restField}
                                name={[name, 'description']}
                                rules={[
                                    {
                                        pattern: nameReg,
                                        message: ErrorInfo.ONLYSUP,
                                    },
                                ]}
                            >
                                <Input
                                    disabled={!!filterItems}
                                    placeholder={__('规则描述')}
                                    style={{ width: 218 }}
                                    maxLength={255}
                                    title={getTitle(index, 'description') || ''}
                                />
                            </Form.Item>

                            {filterItems ? null : (
                                <>
                                    <AddOutlined
                                        onClick={() => add()}
                                        style={{
                                            visibility:
                                                index !== fields.length - 1
                                                    ? 'hidden'
                                                    : 'visible',
                                        }}
                                    />
                                    <Form.Item noStyle shouldUpdate>
                                        {({ setFieldsValue }) => {
                                            return (
                                                <CloseOutlined
                                                    onClick={() => {
                                                        if (fields.length > 1) {
                                                            remove(name)
                                                        } else {
                                                            setFieldsValue({
                                                                filter_items: [
                                                                    {},
                                                                ],
                                                            })
                                                        }
                                                    }}
                                                />
                                            )
                                        }}
                                    </Form.Item>
                                </>
                            )}
                        </Space>
                    ))}
                </>
            )}
        </Form.List>
    )
    return (
        <div className={styles.filterRuleWrapper}>
            <div className={styles.filterRuleTitle}>
                <Space size={4}>
                    {__('过滤规则')}
                    <span
                        title={`${__('设置规则，可获取指定范围的数据。')}\n${__(
                            '注意：条件之间均为“且”的关系',
                        )}`}
                    >
                        <QuestionCircleOutlined className={styles.tipIcon} />
                    </span>
                </Space>
            </div>
            {/* 详情时借助form赋值展示 */}
            {isDetails ? (
                filterItems && filterItems?.length > 0 ? (
                    <Form form={form || form1}>{comp}</Form>
                ) : (
                    '--'
                )
            ) : (
                comp
            )}
        </div>
    )
}
export default FilterRules
