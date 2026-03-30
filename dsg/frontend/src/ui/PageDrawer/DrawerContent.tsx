import React from 'react'
import { Drawer, DrawerProps } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'

interface IDrawerContent extends DrawerProps {
    headerWidth?: number | string
    footerExtend?: React.ReactElement
    isShowTitleIcon?: boolean
    loading?: boolean
    titleExtend?: React.ReactElement
    okText?: string
    okButtonProps?: any
    handleOk?: () => void
    onCancel?: () => void
}

const DrawerContent: React.FC<IDrawerContent> = ({
    children,
    footerExtend,
    isShowTitleIcon = false,
    headerWidth,
    title,
    titleExtend,
    loading,
    okText = '确定',
    okButtonProps,
    onClose,
    onCancel,
    handleOk,
    getContainer = false,
    open,
    ...props
}) => {
    return (
        <Drawer
            destroyOnClose
            maskClosable={false}
            maskStyle={{ display: 'none', backgroundColor: 'transparent' }}
            style={{ position: 'absolute' }}
            contentWrapperStyle={{
                width: '100%',
                boxShadow: 'none',
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 1280,
            }}
            getContainer={getContainer}
            open={open}
            {...props}
        >
            <div className={classnames(styles.body)}>{children}</div>
        </Drawer>
    )
}

export default DrawerContent
