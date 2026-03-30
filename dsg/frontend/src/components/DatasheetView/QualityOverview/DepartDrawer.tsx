import { Drawer } from 'antd'
import React, { memo } from 'react'
import { LeftOutlined } from '@ant-design/icons'
import DepartView from './DepartView'
import styles from './styles.module.less'
import __ from './locale'

const DepartDrawer = ({
    depart,
    onClose,
}: {
    depart: Record<string, any>
    onClose: () => void
}) => {
    return (
        <Drawer
            open
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
            <div className={styles['drawer-wrapper']}>
                <div className={styles['drawer-wrapper-header']}>
                    <div
                        onClick={onClose}
                        className={styles['drawer-wrapper-header-back']}
                    >
                        <LeftOutlined className={styles['back-icon']} />
                        <span className={styles['back-text']}>
                            {__('返回')}
                        </span>
                    </div>
                    <div className={styles['drawer-wrapper-header-title']}>
                        {__('部门质量详情')}
                    </div>
                </div>
                <div className={styles['drawer-wrapper-content']}>
                    <DepartView depart={depart} isOwner />
                </div>
            </div>
        </Drawer>
    )
}

export default memo(DepartDrawer)
