import { useEffect, useState } from 'react'
import { Table } from 'antd'
import __ from './locale'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'
import { ISSZDOrganization, getSSZDOrganization } from '@/core'

interface IProvinceOrganTable {
    code: string
}
const ProvinceOrganTable = ({ code }: IProvinceOrganTable) => {
    const [data, setData] = useState<ISSZDOrganization[]>([])
    const [loading, setLoading] = useState(false)

    const columns = [
        {
            title: __('名称'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: __('类型'),
            dataIndex: 'org_type',
            key: 'org_type',
        },
        {
            title: __('编码'),
            dataIndex: 'region_code',
            key: 'region_code',
        },
    ]

    const getData = async () => {
        try {
            setLoading(true)
            const res = await getSSZDOrganization(code)
            setData(res.entries)
        } catch (e) {
            setData([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (code) {
            getData()
        }
    }, [code])

    return loading ? (
        <div className={styles['province-org-table-loading']}>
            <Loader />
        </div>
    ) : data.length === 0 ? (
        <div className={styles['province-organ-table-empty']}>
            <Empty
                iconSrc={dataEmpty}
                desc={__('此省份/组织/行政区下无数据')}
            />
        </div>
    ) : (
        <Table dataSource={data} columns={columns} pagination={false} />
    )
}

export default ProvinceOrganTable
