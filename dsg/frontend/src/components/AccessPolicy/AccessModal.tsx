import { Drawer } from 'antd'
import React, { useContext, useEffect } from 'react'
import ApplyManage from '@/components/AccessPolicy/components/ApplyManage'
import { AssetTypeEnum, getAuthRequest, isMicroWidget } from '@/core'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import AccessManage from './components/AccessManage'
import {
    UpdateStateProvider,
    useUpdateStateContext,
} from './UpdateStateProvider'

interface IAccessModal {
    id: string
    type: AssetTypeEnum
    onClose?: (needRefresh?: boolean) => void
    indicatorType?: string
}

/** 资源授权弹窗内容组件 */
function AccessModalContent({
    id,
    type,
    onClose,
    indicatorType,
}: IAccessModal) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    // useCogAsstContext 已移除，相关功能已下线
    const { hasAccessChange } = useUpdateStateContext()

    useEffect(() => {
        // useCogAsstContext 已移除
    }, [])

    const handleClose = () => {
        onClose?.(hasAccessChange)
    }

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
                top: '52px',
                left: 0,
                right: 0,
                bottom: 0,
                position: isMicroWidget({ microWidgetProps })
                    ? 'fixed'
                    : 'absolute',
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
            <AccessManage
                id={id}
                type={type}
                onClose={handleClose}
                indicatorType={indicatorType}
            />
        </Drawer>
    )
}

/** 资源授权弹窗 */
function AccessModal({ id, type, onClose, indicatorType }: IAccessModal) {
    return (
        <UpdateStateProvider>
            <AccessModalContent
                id={id}
                type={type}
                onClose={onClose}
                indicatorType={indicatorType}
            />
        </UpdateStateProvider>
    )
}

export default AccessModal
