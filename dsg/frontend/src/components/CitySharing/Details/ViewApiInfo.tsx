import { Input, Modal, Select, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { CommonTitle, SearchInput } from '@/ui'
import __ from '../locale'
import { detailServiceOverview, formatError } from '@/core'
import { maskingList, operatorList } from '@/components/ApiServices/const'
import styles from './styles.module.less'

interface ViewFieldsProps {
    open: boolean
    onCancel: () => void
    id: string
}
const ViewApiInfo = ({ open, onCancel, id }: ViewFieldsProps) => {
    const [detailData, setDetailData] = useState<any>()

    const getApiDetail = async () => {
        try {
            const res = await detailServiceOverview(id)
            setDetailData(res)
        } catch (error) {
            formatError(error)
        }
    }
    useEffect(() => {
        if (id) {
            getApiDetail()
        }
    }, [id])

    const columns = [
        {
            title: __('技术名称'),
            dataIndex: 'en_name',
            key: 'en_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('业务名称'),
            dataIndex: 'cn_name',
            key: 'cn_name',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('字段类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('是否必填'),
            dataIndex: 'required',
            key: 'required',
            ellipsis: true,
            render: (text) =>
                text === 'yes'
                    ? __('必填')
                    : text === 'no'
                    ? __('非必填')
                    : '--',
        },
        {
            title: __('运算逻辑'),
            dataIndex: 'operator',
            key: 'operator',
            ellipsis: true,
            render: (text) =>
                operatorList.find((item) => item.value === text)?.label || '--',
        },
        {
            title: __('排序规则'),
            dataIndex: 'sort',
            key: 'sort',
            ellipsis: true,
            render: (text) =>
                text === 'unsorted'
                    ? __('不排序')
                    : text === 'asc'
                    ? __('升序')
                    : __('降序'),
        },
        {
            title: __('脱敏规则'),
            dataIndex: 'masking',
            key: 'masking',
            ellipsis: true,
            render: (text) =>
                maskingList.find((item) => item.value === text)?.label || '--',
        },
        {
            title: __('默认值'),
            dataIndex: 'default_value',
            key: 'default_value',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || '--',
        },
    ]

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={detailData?.service_info?.service_name}
            width={900}
            bodyStyle={{ maxHeight: 700, overflowY: 'auto' }}
            footer={null}
        >
            <div className={styles['view-api-wrapper']}>
                <CommonTitle title={__('参数配置')} />
                <div className={styles['api-title']}>{__('请求参数')}</div>
                <Table
                    columns={columns.filter(
                        (item) => item.key !== 'sort' && item.key !== 'masking',
                    )}
                    dataSource={
                        detailData?.service_param?.data_table_request_params
                    }
                    rowKey="cn_name"
                    pagination={false}
                />
                <div className={styles['api-title']}>{__('返回参数')}</div>
                <Table
                    columns={columns.filter(
                        (item) =>
                            item.key !== 'required' &&
                            item.key !== 'operator' &&
                            item.key !== 'default_value',
                    )}
                    dataSource={
                        detailData?.service_param?.data_table_response_params
                    }
                    rowKey="cn_name"
                    pagination={false}
                />

                {detailData?.service_response?.rules.length > 0 && (
                    <>
                        <div className={styles['common-title']}>
                            <CommonTitle title={__('过滤规则')} />
                        </div>
                        <div className={styles.detailsLabelBox}>
                            <div className={styles.rulesTitle}>
                                {__(
                                    '设置规则，可获取指定条件的数据，条件之间均为“且”的关系',
                                )}
                            </div>
                            {detailData?.service_response?.rules.map(
                                (item, index) => {
                                    return (
                                        <div
                                            className={styles.rulesBox}
                                            key={index}
                                        >
                                            <Input
                                                disabled
                                                value={item.param}
                                            />
                                            <Select
                                                disabled
                                                value={item.operator}
                                                options={operatorList}
                                            />
                                            <Input
                                                disabled
                                                value={item.value}
                                            />
                                        </div>
                                    )
                                },
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    )
}

export default ViewApiInfo
