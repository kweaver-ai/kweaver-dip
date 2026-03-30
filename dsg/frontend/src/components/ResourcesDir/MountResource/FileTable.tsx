import React from 'react'
import { Button, Table } from 'antd'
import moment from 'moment'
import { getFileAttachmentPreviewPdf } from '@/core/apis/dataCatalog'
import styles from './styles.module.less'
import __ from '../locale'
import { resourceTypeList, ResourceType } from '../const'
import FileIcon from '@/components/FileIcon'
import { transUnit } from '@/components/DataFiles/helper'

interface IFileTable {
    dataSource: any[]
}

const FileTable: React.FC<IFileTable> = ({ dataSource }) => {
    const columns = [
        {
            title: __('文件名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text, record) => {
                if (!text) return '--'
                // const suffix = getSuffix(text)
                return (
                    <>
                        <FileIcon
                            suffix={record.type}
                            style={{
                                marginRight: 8,
                                verticalAlign: 'middle',
                            }}
                        />
                        {text}
                    </>
                )
            },
        },
        {
            title: __('文件类型'),
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            render: (_, record) => {
                const { type } = record
                if (!type) return '--'
                return type
            },
        },
        {
            title: __('文件大小'),
            dataIndex: 'size',
            key: 'size',
            ellipsis: true,
            render: (text) => {
                if (!text) return '--'
                const { size, unit } = transUnit(text)
                return `${size}${unit}`
            },
        },
        {
            title: __('更新时间'),
            dataIndex: 'updateTime',
            key: 'updateTime',
            ellipsis: true,
            render: (text) => {
                // if (!text) return '--'
                return moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_: string, record) => {
                return (
                    <Button
                        type="link"
                        onClick={(e) => {
                            e.stopPropagation()
                            toPreview(record)
                        }}
                    >
                        {__('预览')}
                    </Button>
                )
            },
        },
    ]

    const toPreview = async (record: any) => {
        const { href_url } = await getFileAttachmentPreviewPdf({
            id: record.id,
            preview_id: record.preview_oss_id,
        })
        window.open(href_url, '_blank')
    }

    return (
        <Table
            style={{ marginBottom: 20 }}
            columns={columns}
            rowKey="resource_id"
            dataSource={dataSource}
            pagination={{
                showSizeChanger: false,
                hideOnSinglePage: true,
            }}
        />
    )
}
export default FileTable
