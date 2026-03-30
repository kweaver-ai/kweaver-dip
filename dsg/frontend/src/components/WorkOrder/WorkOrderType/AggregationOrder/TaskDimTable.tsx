import { Table } from 'antd'

/** 归集任务数据表维度 */
const TaskDimTable = ({ data }: any) => {
    const columns = [
        {
            title: '目标表名称',
            dataIndex: 'table_name',
            key: 'table_name',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: '所属部门',
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (text, record) => {
                return text?.path ? (
                    <div title={text?.path}>{text?.path}</div>
                ) : (
                    '--'
                )
            },
        },
        {
            title: '归集数据量',
            dataIndex: 'count',
            key: 'count',
            ellipsis: true,
            render: (text, record) => text || 0,
        },
    ]

    return (
        <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={false}
        />
    )
}

export default TaskDimTable
