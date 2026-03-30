import React from 'react'
import { Col, Space } from 'antd'
import { CloseOutlined, LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface IDrawerHeader {
    title?: string // 标题
    fullScreen?: boolean // 是否全屏，默认全屏
    showIcon?: boolean // 是否显示图标,默认不显示
    onClose?: () => void // 关闭
    children?: React.ReactNode // 子组件
}

/**
 * 抽屉头部
 */
const DrawerHeader = ({
    title,
    fullScreen = true,
    showIcon = false,
    onClose,
    children,
}: IDrawerHeader) => {
    return (
        <div
            className={classnames(
                styles.drawerHeader,
                fullScreen && styles.inFullScreen,
            )}
        >
            {fullScreen ? (
                <>
                    <Col span={8} className={styles.returnWrappper}>
                        <div className={styles.returnInfo}>
                            <div onClick={() => onClose?.()}>
                                <LeftOutlined className={styles.returnArrow} />
                                <span className={styles.returnText}>
                                    {__('返回')}
                                </span>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        {showIcon && (
                            <FontIcon
                                name="icon-shujutuisongicon"
                                type={IconType.COLOREDICON}
                                className={styles.titleIcon}
                            />
                        )}
                        <div className={styles.titleText} title={title}>
                            {title}
                        </div>
                    </Col>
                    <Col span={8} className={styles.middle}>
                        {children}
                    </Col>
                    <Col span={8} />
                </>
            ) : (
                <>
                    <div className={styles.titleText} title={title}>
                        {title}
                    </div>
                    <CloseOutlined
                        className={styles.close}
                        onClick={() => onClose?.()}
                    />
                </>
            )}
        </div>
    )
}

export default DrawerHeader
