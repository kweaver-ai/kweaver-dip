import React, { useEffect, useState } from 'react'
import { Modal, ConfigProvider, Table } from 'antd'
import classNames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import {
    quantileNode,
    thousandSeparator,
    progressNode,
    fieldIcons,
} from './helper'
import { formatError, getDictDetailById, dataTypeMapping } from '@/core'
import Empty from '@/ui/Empty'

interface IFieldsDetailsModal {
    open: boolean
    onClose: () => void
    data: any
}

const FieldsDetailsModal: React.FC<IFieldsDetailsModal> = ({
    open,
    onClose,
    data,
}) => {
    const [fieldsList, setFieldsList] = useState<any[]>([])
    const [progressData, setProgressData] = useState<any[]>([])
    const [dictCodeData, setDictCodeData] = useState<any[]>([])

    const columns = [
        {
            title: '码值',
            dataIndex: 'code',
            key: 'code',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: '码值描述',
            dataIndex: 'value',
            key: 'value',
            ellipsis: true,
            render: (text) => text || '--',
        },
    ]

    useEffect(() => {
        const timeType = ['Day', 'Month', 'Year', 'Group']
        const dateType = [
            ...dataTypeMapping.date,
            ...dataTypeMapping.datetime,
            ...dataTypeMapping.time,
        ]
        // 需要显示单位的类型
        const unitFields = [
            'NullCount',
            'BlankCount',
            'unique',
            'Zero',
            'true',
            'false',
        ]
        // 后端返回多了""字段,需单独处理 .replace(/"/g, '')
        const strFields = ['Max', 'Min', 'Avg']
        const fileds = data?.details
            .filter((item) => !timeType.includes(item.rule_id))
            .map((item) => {
                const value = strFields.includes(item.rule_id)
                    ? item?.result.replace(/"/g, '')
                    : item.rule_id === 'Quantile'
                    ? item?.result
                        ? item?.result.split(',')
                        : [0, 0, 0]
                    : item?.result || 0
                const valueStr = dateType.includes(data?.field_type)
                    ? value?.toString().substring(0, 19)
                    : value
                const [description] = item.description
                return {
                    rule_id: item.rule_id,
                    name: item.rule_name,
                    value: value === 0 ? 0 : valueStr || value || '--',
                    description:
                        item.rule_id === 'Quantile'
                            ? __('分位数')
                            : description,
                    quantileDes:
                        item.rule_id === 'Quantile'
                            ? ['25%', '50%', '75%']
                            : undefined,
                    icon: fieldIcons[item.rule_id],
                    showUnit: unitFields.includes(item.rule_id),
                }
            })
        setFieldsList(fileds)

        const progress = data?.details
            .filter((item) => timeType.includes(item.rule_id))
            .map((item) => {
                const [first, second] = item.description
                const result = item.result ? JSON.parse(item.result) : []
                const column = result?.map((it) => it?.[0] || '') || []
                const columnData = result?.map((it) => it?.[1] || '') || []
                const sum = columnData?.length || 0
                const total = columnData?.reduce((cur, pre) => {
                    return Number(cur) + Number(pre)
                }, 0)
                return {
                    ...item,
                    first,
                    second,
                    column:
                        item.rule_id !== 'Group'
                            ? column?.map((it) =>
                                  it.substring(
                                      0,
                                      item.rule_id === 'Day'
                                          ? 10
                                          : item.rule_id === 'Month'
                                          ? 7
                                          : item.rule_id === 'Year'
                                          ? 4
                                          : undefined,
                                  ),
                              )
                            : column,
                    columnData,
                    sum,
                    total,
                }
            })
        setProgressData(progress)

        if (data?.params) {
            const list: any = JSON.parse(data?.params)
            const dictList: any = []
            // eslint-disable-next-line no-restricted-syntax
            for (const key in list) {
                if (Object.prototype.hasOwnProperty.call(list, key)) {
                    dictList.push({
                        code: key,
                        value: list[key],
                    })
                }
            }
            setDictCodeData(dictList)
        }
    }, [data])

    // table数据为空时（两种状态）
    const showTableEmpty = () => {
        return <Empty />
    }

    return (
        <div>
            <Modal
                title={__('字段内容详情')}
                width={1220}
                open={open}
                onCancel={onClose}
                className={styles.fieldsDetailsModalWrapper}
                maskClosable={false}
                footer={null}
                zIndex={1001}
            >
                <div className={styles.modalBox}>
                    <div className={styles.modaltitle}>
                        <div title={data.field_name_cn}>
                            <span className={styles.titleLable}>
                                {__('中文名称：')}
                            </span>
                            <span className={styles.titleVal}>
                                {data.field_name_cn}
                            </span>
                        </div>
                        <div title={data.field_name_en}>
                            <span className={styles.titleLable}>
                                {__('英文名称：')}
                            </span>
                            <span className={styles.titleVal}>
                                {data.field_name_en}
                            </span>
                        </div>
                    </div>
                    <div className={styles.modalSecondLine}>
                        {fieldsList.map((item, index) => {
                            return (
                                <div className={styles.ruleBox} key={index}>
                                    <div className={styles.ruleItem}>
                                        <div className={styles.name}>
                                            <span className={styles.nameIcon}>
                                                {item.icon}
                                            </span>
                                            {item.name}
                                        </div>
                                        <div
                                            className={classNames(
                                                styles.value,
                                                item.rule_id === 'Quantile' &&
                                                    styles.quantileValue,
                                            )}
                                        >
                                            {item.rule_id === 'Quantile' ? (
                                                quantileNode(item)
                                            ) : (
                                                <div
                                                    className={
                                                        styles.statisticBox
                                                    }
                                                    title={item.value}
                                                >
                                                    {thousandSeparator(
                                                        item.value,
                                                    )}
                                                    {item.showUnit && (
                                                        <span
                                                            className={
                                                                styles.statisticUnit
                                                            }
                                                        >
                                                            {__('行')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '0 12px',
                        }}
                    >
                        <div className={styles.progressListBox}>
                            {progressData.map((item) => {
                                return (
                                    <div key={item.rule_id}>
                                        {progressNode(item)}
                                    </div>
                                )
                            })}
                        </div>
                        {dictCodeData.length > 0 && (
                            <div className={styles.dictCodeBox}>
                                <ConfigProvider
                                    renderEmpty={() => showTableEmpty()}
                                >
                                    <Table
                                        rowKey={(rec) => rec.code}
                                        columns={columns}
                                        dataSource={dictCodeData}
                                        pagination={false}
                                        scroll={{
                                            y: '246px',
                                        }}
                                        bordered
                                    />
                                </ConfigProvider>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default FieldsDetailsModal
