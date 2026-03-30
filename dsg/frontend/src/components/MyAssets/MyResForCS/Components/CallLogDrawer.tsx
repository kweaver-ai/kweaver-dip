import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import { Drawer, Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import DrawerHeader from '@/components/CitySharing/component/DrawerHeader'
import { CommonTitle } from '@/ui'
import ShareApplyList from './ShareApplyList'
import { ResTypeEnum } from '../const'
import DetailsPage from '@/components/CitySharing/Details/DetailsPage'
import DataPushInfo from './DataPushInfo'
import AppInfo from './AppInfo'
import CallLog from './CallLog'

interface IDetails {
    id: string
    open: boolean
    onClose?: () => void
}

const Details: React.FC<IDetails> = ({ id, open, onClose = noop }) => {
    return (
        <Drawer
            width="100%"
            open={open}
            onClose={onClose}
            headerStyle={{ display: 'none' }}
            bodyStyle={{ padding: 0 }}
        >
            <div className={classnames(styles['call-log-drawer'])}>
                {/* 导航头部 */}
                <DrawerHeader
                    title={__('查看调用日志')}
                    fullScreen
                    onClose={onClose}
                />
                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <CallLog isInDrawer serviceId={id} />
                    </div>
                </div>
            </div>
        </Drawer>
    )
}
export default Details
