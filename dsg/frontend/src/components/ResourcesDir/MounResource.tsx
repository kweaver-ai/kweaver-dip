import { useState, useEffect } from 'react'
import { Table, message, Button } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { LabelTitle } from './BaseInfo'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'
import ApplicationServiceDetail from '@/components/DataAssetsCatlg/ApplicationServiceDetail'
import { resourceTypeList, ResourceType } from './const'

interface IMounResourceItem {
    name: string
    resource_type: number
    code: string
    department: string
}
interface IMounResource {
    resourceData: IMounResourceItem[]
}

const MounResource = (props: IMounResource) => {
    const { resourceData } = props

    const [selectedId, setSelectedId] = useState<string>('')
    const [logicViewDetailOpen, setLogicViewDetailOpen] =
        useState<boolean>(false)
    const [applicationServiceOpen, setApplicationServiceOpen] =
        useState<boolean>(false)
    const columns: any = [
        {
            title: __('资源名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            ellipsis: true,
            render: (text, record) =>
                resourceTypeList?.find((item) => item.value === text)?.label,
        },
        {
            title: __('资源编码'),
            dataIndex: 'code',
            key: 'code',
            ellipsis: true,
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            ellipsis: true,
            render: (_: string, record) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedId(record.resource_id)
                        if (record.resource_type === ResourceType.DataView) {
                            setLogicViewDetailOpen(true)
                        } else {
                            setApplicationServiceOpen(true)
                        }
                    }}
                >
                    {__('详情')}
                </Button>
            ),
        },
    ]

    return (
        <div className={styles.mountResourcesWrapper}>
            <LabelTitle label="资源属性分类" />
            <Table
                columns={columns}
                dataSource={resourceData}
                rowKey="resource_id"
                bordered={false}
                pagination={false}
            />
            {logicViewDetailOpen && selectedId && (
                <LogicViewDetail
                    open={logicViewDetailOpen}
                    onClose={() => {
                        setLogicViewDetailOpen(false)
                    }}
                    id={selectedId}
                />
            )}
            {applicationServiceOpen && selectedId && (
                <ApplicationServiceDetail
                    open={applicationServiceOpen}
                    onClose={() => {
                        setApplicationServiceOpen(false)
                    }}
                    serviceCode={selectedId}
                />
            )}
        </div>
    )
}
export default MounResource
