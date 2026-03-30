import { Table } from 'antd'
import classNames from 'classnames'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { ResourceType, ResourceTypeMap } from '../Province/const'
import { ISSZDCatalogDetail } from '@/core'

interface IRelatedDataSource {
    dataSource: ISSZDCatalogDetail[]
}

const RelatedDataSource = ({ dataSource }: IRelatedDataSource) => {
    const columns = [
        {
            title: (
                <div>
                    {__('需求数据资源目录')}
                    <span className={styles['title-code']}>
                        {__('（编码）')}
                    </span>
                </div>
            ),
            dataIndex: 'catalog_title',
            key: 'catalog_title',
            ellipsis: true,
            render: (name, record) => (
                <div className={styles['name-info-container']}>
                    <FontIcon
                        name="icon-shujumuluguanli1"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles.names}>
                        <div
                            className={styles.name}
                            title={record.catalog_title}
                        >
                            {record.catalog_title}
                        </div>
                        <div
                            className={styles['tech-name']}
                            title={record.catalog_code}
                        >
                            {record.catalog_code}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: __('挂接数据资源'),
            dataIndex: 'resource_name',
            key: 'resource_name',
        },
        {
            title: __('资源类型'),
            dataIndex: 'resource_type',
            key: 'resource_type',
            render: (rt: ResourceType) => rt || ResourceTypeMap[rt],
        },
    ]

    return (
        <div
            className={classNames(
                styles['datasource-wrapper'],
                styles['related-datasource-wrapper'],
            )}
        >
            <div className={styles['title-container']}>
                <CommonTitle title={__('关联需求资源')} />
            </div>
            <Table
                className={styles['datasource-table']}
                dataSource={dataSource}
                columns={columns}
                pagination={false}
            />
        </div>
    )
}

export default RelatedDataSource
