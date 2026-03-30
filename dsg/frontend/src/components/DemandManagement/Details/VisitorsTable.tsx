import { Table } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'

const VisitorsTable = () => {
    const dataSource = [
        {
            key: '1',
            name: '胡彦斌',
            age: 32,
            address: '西湖区湖底公园1号',
        },
        {
            key: '2',
            name: '胡彦祖',
            age: 42,
            address: '西湖区湖底公园1号',
        },
    ]

    const columns = [
        {
            title: __('访问者'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: __('所属部门'),
            dataIndex: 'age',
            key: 'age',
        },
        {
            title: __('访问权限'),
            dataIndex: 'address',
            key: 'address',
        },
    ]

    return (
        <div className={styles['visitors-table-wrapper']}>
            <div className={styles['search-container']}>
                <SearchInput placeholder={__('搜索访问者')} />
            </div>
            <Table
                dataSource={dataSource}
                columns={columns}
                pagination={false}
            />
        </div>
    )
}

export default VisitorsTable
