import React from 'react'
import { Drawer, DrawerProps, Space, Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'

interface ISiderDrawer extends DrawerProps {
    titleText: string
    loading?: boolean
    cancelText?: string
    okText?: string
    handleOk?: () => void
}

const SiderDrawer: React.FC<ISiderDrawer> = ({
    children,
    titleText,
    loading,
    cancelText = __('取消'),
    okText = __('确定'),
    onClose,
    handleOk,
    ...props
}) => {
    // 页头
    const title = (
        <div className={styles.sd_headerWrapper}>
            <span>{titleText}</span>
            <span className={styles.sd_closeBtn} onClick={onClose}>
                <CloseOutlined />
            </span>
        </div>
    )

    // 页脚
    const footer = (
        <div className={styles.sd_footerWrapper}>
            <Button className={styles.sd_cancelBtn} onClick={onClose}>
                {cancelText}
            </Button>
            <Button
                className={styles.sd_okBtn}
                type="primary"
                htmlType="submit"
                loading={loading}
                onClick={handleOk}
            >
                {okText}
            </Button>
        </div>
    )

    return (
        <Drawer
            width={400}
            destroyOnClose
            placement="right"
            maskClosable={false}
            closable={false}
            style={{ position: 'absolute' }}
            headerStyle={{ height: 54, padding: '0 0 0 24px' }}
            bodyStyle={{ padding: '0 24px 24px' }}
            contentWrapperStyle={{ width: '20%', minWidth: 280 }}
            footerStyle={{ height: 72, padding: 16, border: 'none' }}
            title={title}
            footer={footer}
            getContainer={false}
            {...props}
        >
            {children}
        </Drawer>
    )
}

export default SiderDrawer
