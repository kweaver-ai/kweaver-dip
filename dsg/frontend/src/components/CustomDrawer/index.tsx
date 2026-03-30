import React, { useEffect } from 'react'
import { Drawer, DrawerProps, Space, Button } from 'antd'
import { LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { ModelOutlined } from '@/icons'
import styles from './styles.module.less'

interface ICustomDrawer extends DrawerProps {
    headerWidth?: number | string
    customHeaderStyle?: React.CSSProperties
    customTitleStyle?: React.CSSProperties
    customBodyStyle?: React.CSSProperties
    contentWrapperStyle?: React.CSSProperties
    isShowFooter?: boolean
    footerExtend?: React.ReactElement
    isShowTitleIcon?: boolean
    loading?: boolean
    titleExtend?: React.ReactElement
    backElement?: React.ReactElement
    okText?: string
    okButtonProps?: any
    handleOk?: () => void
    onCancel?: () => void
    isShowHeader?: boolean
    maskClosable?: boolean
    footerStyle?: React.CSSProperties
}

const CustomDrawer: React.FC<ICustomDrawer> = ({
    children,
    isShowFooter = true,
    footerExtend,
    isShowTitleIcon = false,
    headerWidth,
    customHeaderStyle,
    customTitleStyle,
    customBodyStyle,
    title,
    titleExtend,
    loading,
    backElement = '返回',
    okText = '确定',
    okButtonProps,
    onClose,
    onCancel,
    handleOk,
    getContainer = false,
    isShowHeader = true,
    contentWrapperStyle = {
        width: '100%',
        boxShadow: 'none',
    },
    open,
    maskClosable = false,
    footerStyle,
    ...props
}) => {
    return (
        <Drawer
            destroyOnClose
            maskClosable={maskClosable}
            maskStyle={{ display: 'none', backgroundColor: 'transparent' }}
            style={{ position: 'absolute' }}
            push={{ distance: 0 }}
            contentWrapperStyle={contentWrapperStyle}
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
            // 显示抽屉自带title
            title={
                !isShowHeader && props?.headerStyle?.display !== 'none'
                    ? title
                    : undefined
            }
            onClose={
                !isShowHeader && props?.headerStyle?.display !== 'none'
                    ? onClose
                    : undefined
            }
            {...props}
        >
            {isShowHeader && (
                <div
                    className={styles.header}
                    style={{ width: headerWidth, ...customHeaderStyle }}
                >
                    <div
                        className={styles.drawerTitleWrapper}
                        style={customTitleStyle}
                    >
                        <div className={styles.return} onClick={onClose}>
                            <LeftOutlined className={styles.arrow} />
                            <span className={styles.returnText}>
                                {backElement}
                            </span>
                        </div>
                        <div className={styles.drawerTitle}>
                            {isShowTitleIcon && (
                                <div className={styles.modalIconWrapper}>
                                    <ModelOutlined
                                        className={styles.modalIcon}
                                    />
                                </div>
                            )}

                            <div
                                className={styles.title}
                                title={
                                    typeof title === 'string'
                                        ? title
                                        : undefined
                                }
                            >
                                {title}
                            </div>
                        </div>
                    </div>
                    {titleExtend && (
                        <div className={styles.drawerTitleExtend}>
                            {titleExtend}
                        </div>
                    )}
                </div>
            )}
            <div
                id="customDrawerBody"
                className={classnames(
                    styles.body,
                    isShowFooter && styles.bodyWithFooter,
                )}
                style={{
                    ...customBodyStyle,
                }}
            >
                {children}
            </div>
            {isShowFooter && !footerExtend && (
                <div className={styles.footer} style={footerStyle}>
                    <div className={styles.operate}>
                        <Space>
                            <Button
                                className={styles.cancelBtn}
                                onClick={onCancel || onClose}
                            >
                                取消
                            </Button>
                            <Button
                                className={styles.okBtn}
                                type="primary"
                                htmlType="submit"
                                onClick={handleOk}
                                disabled={loading}
                                {...okButtonProps}
                            >
                                {okText}
                            </Button>
                        </Space>
                    </div>
                </div>
            )}
            {isShowFooter && footerExtend && (
                <div className={styles.drawerFooterExtend}>
                    <div className={styles.footerBody}>{footerExtend}</div>
                </div>
            )}
        </Drawer>
    )
}

export default CustomDrawer
