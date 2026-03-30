import { FC, ReactNode, useEffect, useContext } from 'react'

import { DrawerProps, ConfigProvider } from 'antd'
import { noop } from 'lodash'
import DrawerContent from './DrawerContent'
import Header, { IHeader } from './Header'
import styles from './styles.module.less'
import __ from './locale'

interface IPageDrawer extends DrawerProps {
    onClose?: () => void
    children: ReactNode
    open: boolean
    headerConfig: null | IHeader
}
const PageDrawer: FC<IPageDrawer> = ({
    onClose = noop,
    children,
    open,
    headerConfig = null,
    ...props
}) => {
    const { getPopupContainer } = useContext(ConfigProvider.ConfigContext)

    return (
        <DrawerContent
            destroyOnClose
            getContainer={getPopupContainer}
            open={open}
            {...props}
        >
            <div className={styles.PageContent}>
                {headerConfig ? (
                    <Header
                        onReturn={() => {
                            onClose()
                        }}
                        needReturn={headerConfig?.needReturn || false}
                        group={headerConfig?.group}
                        headerNodes={headerConfig?.headerNodes}
                    />
                ) : null}
                <div
                    className={
                        headerConfig
                            ? styles.hasHeaderContent
                            : styles.notHeaderContent
                    }
                >
                    {children}
                </div>
            </div>
        </DrawerContent>
    )
}

export default PageDrawer
