import { Table } from 'antd'
import { useEffect, useState } from 'react'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { ISSZDDemandBaseInfo } from '@/core'

interface IDataSource {
    showOperate?: boolean
    basicInfo?: ISSZDDemandBaseInfo
}
const DataSource = ({ showOperate = true, basicInfo }: IDataSource) => {
    const [dataSource, setDataSource] = useState<ISSZDDemandBaseInfo[]>([])

    useEffect(() => {
        if (basicInfo) {
            setDataSource([basicInfo])
        }
    }, [basicInfo])

    const columns = [
        {
            title: __('需求数据资源目录'),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            ellipsis: true,
            render: (name) => {
                return (
                    <div className={styles['name-container']}>
                        <div className={styles['name-info']}>
                            <FontIcon
                                name="icon-shujumuluguanli1"
                                type={IconType.COLOREDICON}
                                className={styles.icon}
                            />
                            <span title={name}>{name}</span>
                        </div>
                        {basicInfo?.catalog_status === 0 && (
                            <div className={styles['status-flag']}>
                                {__('已失效')}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('共享类型'),
            dataIndex: 'shared_type',
            key: 'shared_type',
        },
        {
            title: __('需求信息项'),
            dataIndex: 'columns',
            key: 'columns',
        },
        {
            title: __('操作'),
            dataIndex: 'operate',
            key: 'operate',
            render: () => {
                // 若需求实施未完成，操作显示--，若需求实施已完成，操作显示【资源申请】，此操作在共享申请需求实现，这里不做说明
                return <a>{__('资源申请')}</a>
            },
        },
    ]

    return (
        <div className={styles['datasource-wrapper']}>
            <div className={styles['title-container']}>
                <CommonTitle title={__('需求数据资源')} />
            </div>
            <Table
                className={styles['datasource-table']}
                dataSource={dataSource}
                columns={
                    showOperate
                        ? columns
                        : columns.filter((item) => item.key !== 'operate')
                }
                pagination={false}
            />
        </div>
    )
}

export default DataSource
