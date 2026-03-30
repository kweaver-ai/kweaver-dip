import React, { useState } from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { AutoComplete, Button, Form, Input, Select, Space, Tooltip } from 'antd'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { AddOutlined, CloseOutlined } from '@/icons'
import __ from './locale'
import { ParamsOperator } from '@/core'
import { keyboardReg, nameEnReg } from '@/utils'

interface IFilterRules {
    infoItems?: any[]
    responseData: Array<string>
}
const FilterRules: React.FC<IFilterRules> = ({
    infoItems = [],
    responseData,
}) => {
    return (
        <div className={styles.formFilterList}>
            <Form.List name="rules" initialValue={[{}]}>
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <Space
                                key={key}
                                style={{
                                    display: 'flex',
                                }}
                                size={12}
                                align="baseline"
                            >
                                <Form.Item
                                    {...restField}
                                    name={[name, 'param']}
                                    rules={[
                                        {
                                            pattern: nameEnReg,
                                            message:
                                                __(
                                                    '仅支持英文、数字、下划线及中划线',
                                                ),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <AutoComplete
                                        style={{ width: 280 }}
                                        placeholder={__('信息项')}
                                        options={responseData.map((data) => ({
                                            label: data,
                                            value: data,
                                        }))}
                                        maxLength={128}
                                    />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'operator']}
                                >
                                    <Select
                                        style={{ width: 132 }}
                                        placeholder={__('条件')}
                                        getPopupContainer={(node) => node}
                                        options={[
                                            {
                                                value: ParamsOperator.Equal,
                                                label: `${__('精确匹配')}(${
                                                    ParamsOperator.Equal
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Like,
                                                label: `${__('模糊匹配')}(${
                                                    ParamsOperator.Like
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Neq,
                                                label: `${__('不等于')}(${
                                                    ParamsOperator.Neq
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Greater,
                                                label: `${__('大于')}(${
                                                    ParamsOperator.Greater
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.GreaterEqual,
                                                label: `${__('大于等于')}(${
                                                    ParamsOperator.GreaterEqual
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Less,
                                                label: `${__('小于')}(${
                                                    ParamsOperator.Less
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.LessEqual,
                                                label: `${__('小于等于')}(${
                                                    ParamsOperator.LessEqual
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Incloudes,
                                                label: `${__('包含')}(${
                                                    ParamsOperator.Incloudes
                                                })`,
                                            },
                                            {
                                                value: ParamsOperator.Excludes,
                                                label: `${__('不包含')}(${
                                                    ParamsOperator.Excludes
                                                })`,
                                            },
                                        ]}
                                    />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'value']}
                                    rules={[
                                        {
                                            pattern: keyboardReg,
                                            message: __(
                                                '仅支持中英文、数字、及键盘上的特殊字符',
                                            ),
                                            transform: (value) => trim(value),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder="请输入值"
                                        style={{ width: 280 }}
                                        maxLength={128}
                                    />
                                </Form.Item>
                                <AddOutlined
                                    onClick={() => add()}
                                    style={{
                                        visibility:
                                            index !== fields.length - 1
                                                ? 'hidden'
                                                : 'visible',
                                        margin: '0 0 12px 12px',
                                    }}
                                />
                                {fields.length > 1 && (
                                    <CloseOutlined
                                        onClick={() => remove(name)}
                                        style={{
                                            margin: '0 0 12px 0',
                                        }}
                                    />
                                )}
                            </Space>
                        ))}
                    </>
                )}
            </Form.List>
        </div>
    )
}
export default FilterRules
