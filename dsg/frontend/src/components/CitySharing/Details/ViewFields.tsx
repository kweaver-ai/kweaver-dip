import { Modal, Table } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { SearchInput } from '@/ui'
import __ from '../locale'
import { formatError, getDatasheetViewDetails } from '@/core'
import { getTypeText } from '@/utils'

interface ViewFieldsProps {
    open: boolean
    onCancel: () => void
    id: string
}
const ViewFields = ({ open, onCancel, id }: ViewFieldsProps) => {
    const [data, setData] = useState<any[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5,
    })

    const dataSource = useMemo(() => {
        if (searchValue) {
            return data.filter(
                (item) =>
                    item.business_name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase()) ||
                    item.technical_name
                        .toLowerCase()
                        .includes(searchValue.toLowerCase()),
            )
        }
        return data
    }, [data, searchValue])

    const getViewFields = async () => {
        try {
            const res = await getDatasheetViewDetails(id)
            setData(res.fields)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getViewFields()
        }
    }, [id])

    const columns = [
        {
            title: __('字段业务名称'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
        },
        {
            title: __('字段技术名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (text: string) => getTypeText(text, false),
        },
    ]

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={__('查看申请表字段')}
            width={746}
            footer={null}
            bodyStyle={{ height: 400 }}
        >
            <div>
                <SearchInput
                    placeholder={__('搜索字段名称')}
                    style={{ width: 240, marginBottom: 14, float: 'right' }}
                    onKeyChange={(key) => setSearchValue(key)}
                />
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    scroll={{ y: 230 }}
                    pagination={{
                        size: 'small',
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) =>
                            __('共${count}条', { count: total }),
                        pageSizeOptions: ['5', '10', '20', '50', '100'],
                        onChange: (page, pageSize) => {
                            setPagination({
                                current: page,
                                pageSize: pageSize || pagination.pageSize,
                            })
                        },
                        onShowSizeChange: (current, size) => {
                            setPagination({
                                current: 1,
                                pageSize: size,
                            })
                        },
                    }}
                />
            </div>
        </Modal>
    )
}

export default ViewFields
