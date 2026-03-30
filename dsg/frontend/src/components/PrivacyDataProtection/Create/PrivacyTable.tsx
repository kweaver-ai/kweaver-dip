import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Table, Space, Button, Select, Tooltip } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from '../locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { TipsLabel } from '@/components/BusinessTagAuthorization/helper'
import {
    DesensitizationMode,
    desensitizationModeList,
    desensitizationModeTipsText,
} from '../const'
import { getDesensitizationRule, formatError } from '@/core'

interface IPrivacyTable {
    dataSource: any[]
    onChange: (data) => void
    isDetails?: boolean
    isValidate?: boolean
}

const PrivacyTable = (props: IPrivacyTable, ref) => {
    const { dataSource, onChange, isDetails, isValidate } = props
    const [privacyRule, setPrivacyRule] = useState<any[]>([])

    useEffect(() => {
        if (!isDetails) {
            getRuleList()
        }
    }, [])

    const columns: any = [
        {
            title: __('脱敏字段'),
            dataIndex: 'form_view_field_business_name',
            key: 'form_view_field_business_name',
            width: '260px',
            ellipsis: true,
        },
        {
            title: __('字段数据分级'),
            dataIndex: 'form_view_field_data_grade',
            key: 'form_view_field_data_grade',
            ellipsis: true,
            render: (text: any, record: any) => text || '--',
        },
        {
            title: __('引用脱敏算法'),
            dataIndex: 'desensitization_rule_id',
            key: 'desensitization_rule_id',
            ellipsis: true,
            width: 200,
            render: (text: any, record: any) => {
                const status =
                    !record.desensitization_rule_id &&
                    (record.is_edit || isValidate)
                        ? 'error'
                        : ''
                const statusText = !record.desensitization_rule_id
                    ? record.is_edit
                        ? __('引用算法已不存在')
                        : isValidate
                        ? __('请选择脱敏算法')
                        : ''
                    : ''
                const val = !text ? undefined : text
                return isDetails ? (
                    record.desensitization_rule_name
                ) : (
                    <Select
                        style={{ width: '100%' }}
                        value={val}
                        placeholder={__('请选择脱敏算法')}
                        options={privacyRule}
                        onChange={(e, option) => onRuleChange(option, record)}
                        fieldNames={{
                            label: 'name',
                            value: 'id',
                        }}
                        status={status}
                        suffixIcon={
                            statusText ? (
                                <Tooltip title={statusText}>
                                    <ExclamationCircleOutlined
                                        style={{ color: '#e60012' }}
                                    />
                                </Tooltip>
                            ) : null
                        }
                    />
                )
            },
        },
        {
            title: (
                <TipsLabel
                    label={__('脱敏方式')}
                    maxWidth="350px"
                    placement="bottom"
                    tips={
                        <div>
                            <div
                                style={{
                                    fontWeight: 550,
                                    borderBottom:
                                        '1px solid rgba(0, 0, 0, 0.1)',
                                    paddingBottom: '4px',
                                }}
                            >
                                {__('脱敏方式')}
                            </div>
                            {desensitizationModeTipsText.map((item, index) => (
                                <div key={index} style={{ margin: '10px 0' }}>
                                    <div>{item.title}</div>
                                    <div
                                        style={{
                                            color: 'rgba(0, 0, 0, 0.45)',
                                            fontSize: '12px',
                                        }}
                                    >
                                        {item.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                />
            ),
            dataIndex: 'desensitization_rule_method',
            key: 'desensitization_rule_method',
            ellipsis: true,
            render: (text, record) =>
                isDetails
                    ? text
                    : desensitizationModeList.find(
                          (item) =>
                              item.value === record.desensitization_rule_method,
                      )?.label ||
                      text ||
                      '--',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 80,
            render: (text, record) => (
                <Space size="middle">
                    <Button
                        type="link"
                        onClick={() => {
                            onChange(
                                dataSource.filter(
                                    (item) => item.id !== record.id,
                                ),
                            )
                        }}
                    >
                        {__('删除')}
                    </Button>
                </Space>
            ),
        },
    ]

    const getRuleList = async () => {
        try {
            const res = await getDesensitizationRule({
                limit: 20,
                offset: 1,
                sort: 'updated_at',
                direction: 'desc',
                keyword: '',
            })
            setPrivacyRule(res?.entries || [])
        } catch (err) {
            formatError(err)
        }
    }

    const onRuleChange = (option: any, record: any) => {
        const list = dataSource.map((item) => {
            if (item.id === record.id) {
                return {
                    ...item,
                    desensitization_rule_method: option.method,
                    desensitization_rule_id: option.id,
                }
            }
            return item
        })
        onChange(list)
    }

    return (
        <div>
            <Table
                columns={
                    isDetails
                        ? columns.filter((item) => item.key !== 'action')
                        : columns
                }
                rowKey="id"
                dataSource={dataSource}
                pagination={{
                    showSizeChanger: false,
                    hideOnSinglePage: true,
                }}
                locale={{
                    emptyText: (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    ),
                }}
            />
        </div>
    )
}

export default PrivacyTable
