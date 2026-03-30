import { Table } from 'antd'
import moment from 'moment'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import { CollectionMethod, getDepartName, SyncFrequency } from './helper'
import __ from './locale'
import styles from './styles.module.less'

function ResourceTable({ items }: any) {
    const navigator = useNavigate()
    const toDataViewDetails = (id: string) => {
        const url: string = `/datasheet-view/detail?id=${id}&backPrev=true`
        navigator(url)
    }
    const columns: any = [
        {
            title: (
                <div>
                    <span>{__('资源名称')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('技术名称')}）
                    </span>
                </div>
            ),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.sourceTitle}>
                        <div
                            className={styles.link}
                            title={text}
                            onClick={() => {
                                toDataViewDetails(record?.data_view_id)
                            }}
                        >
                            {text || '--'}
                        </div>
                    </div>
                    <div
                        className={styles.sourceContent}
                        title={record?.technical_name}
                    >
                        {record?.technical_name || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: (
                <div>
                    <span>{__('数据来源')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('数源单位')}）
                    </span>
                </div>
            ),
            dataIndex: 'datasource_name',
            key: 'datasource_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.sourceTitle}>
                        <div
                            title={text}
                            // onClick={() =>
                            //     handleOperate(OperateType.DETAIL, record)
                            // }
                        >
                            {text || '--'}
                        </div>
                    </div>
                    <div
                        className={styles.sourceContent}
                        title={getDepartName(record?.department_path)}
                    >
                        {getDepartName(record?.department_path) || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('归集方式'),
            dataIndex: 'collection_method',
            key: 'collection_method',
            ellipsis: true,
            width: 100,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {CollectionMethod.find((o) => o.value === text)?.label ||
                        '--'}
                </div>
            ),
        },
        {
            title: __('采集时间'),
            dataIndex: 'collected_at',
            key: 'collected_at',
            ellipsis: true,
            width: 180,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'}
                </div>
            ),
        },
        {
            title: __('同步频率'),
            dataIndex: 'sync_frequency',
            key: 'sync_frequency',
            width: 100,
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.ellipsisTitle} title={text}>
                    {SyncFrequency.find((o) => o.value === text)?.label || '--'}
                </div>
            ),
        },
        {
            title: (
                <div>
                    <span>{__('目标数据源')}</span>
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        （{__('数据库')}）
                    </span>
                </div>
            ),
            dataIndex: 'target_datasource_name',
            key: 'target_datasource_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.titleBox}>
                    <div className={styles.sourceTitle}>
                        <div title={text}>{text || '--'}</div>
                    </div>
                    <div
                        className={styles.sourceContent}
                        title={record?.database_name}
                    >
                        {record?.database_name || '--'}
                    </div>
                </div>
            ),
        },
    ]

    const renderEmpty = () => {
        return (
            <Empty
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div> {__('暂无数据')}</div>
                    </div>
                }
                iconSrc={dataEmpty}
            />
        )
    }
    return (
        <div className={styles['resource-list']}>
            <div className={styles.table}>
                {items?.length === 0 ? (
                    <div className={styles.emptyWrapper}>{renderEmpty()}</div>
                ) : (
                    <Table
                        rowClassName={styles.tableRow}
                        columns={columns}
                        dataSource={items}
                        rowKey="data_view_id"
                        scroll={{
                            x: 900,
                        }}
                        pagination={{
                            pageSize: 5,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default ResourceTable
