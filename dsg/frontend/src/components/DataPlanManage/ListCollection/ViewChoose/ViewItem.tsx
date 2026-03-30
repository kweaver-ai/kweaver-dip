import * as React from 'react'
import { Divider } from 'antd'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import DataSourcIcons from '@/components/DataSource/Icons'

export type IViewDBItem = {
    icon?: any
    data?: any
    extend?: React.ReactNode
}
export type IViewItem = {
    icon?: any
    title?: string
    desc?: string
}

const ViewIcon = (
    <FontIcon
        name="icon-shujubiaoshitu"
        type={IconType.COLOREDICON}
        style={{
            fontSize: '24px',
            borderRadius: '4px',
        }}
    />
)

export const ViewItemWithDB = ({
    icon = ViewIcon,
    data,
    extend,
}: IViewDBItem) => {
    return (
        <div className={styles['view-db-item']}>
            <div className={styles['view-db-item-icon']}>{icon}</div>
            <div className={styles['view-db-item-content']}>
                <div>
                    <div title={data?.business_name} className={styles.title}>
                        {data?.business_name || '--'}
                    </div>
                    <div>{extend}</div>
                </div>
                <div>
                    <div title={data?.technical_name} className={styles.tname}>
                        <span>
                            <FontIcon
                                name="icon-mingcheng"
                                style={{
                                    fontSize: '16px',
                                    marginRight: '4px',
                                }}
                            />
                            {data?.technical_name || '--'}
                        </span>
                    </div>
                    <Divider type="vertical" />
                    <div title={data?.datasource} className={styles.db}>
                        <span>
                            <span style={{ marginRight: '4px' }}>
                                <DataSourcIcons
                                    type={data?.datasource_type}
                                    fontSize={16}
                                    iconType="colored"
                                />
                            </span>
                            {data?.datasource || '--'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ViewItem = ({ icon = ViewIcon, title, desc }: IViewItem) => {
    return (
        <div className={styles['view-item']}>
            <div className={styles['view-item-icon']}>{icon}</div>
            <div className={styles['view-item-content']}>
                <div title={title}>{title || '--'}</div>
                <div title={desc}>{desc || '--'}</div>
            </div>
        </div>
    )
}

export default ViewItem
