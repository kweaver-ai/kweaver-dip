import { Drawer } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import { FC, useEffect, useState } from 'react'
import styles from './styles.module.less'
import GlobalMenu from '@/components/GlobalMenu'
import __ from './locale'
import ServiceMonitoring from '../ServiceMonitoring'

interface LogViewProps {
    open: boolean
    onClose: () => void
    id: string
}
const LogView: FC<LogViewProps> = ({ open, onClose, id }) => {
    return (
        <Drawer
            open={open}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                position: 'fixed',
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles.testApiWrapper}>
                <div className={styles.title}>
                    <GlobalMenu />
                    <div
                        onClick={() => onClose()}
                        className={styles.returnInfo}
                    >
                        <LeftOutlined className={styles.returnArrow} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.titleText}>{__('服务监控')}</div>
                </div>

                <div className={styles.logViewContent}>
                    <ServiceMonitoring id={id} />
                </div>
            </div>
        </Drawer>
    )
}

export default LogView
