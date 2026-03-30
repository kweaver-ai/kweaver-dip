import { Drawer } from 'antd'
import React, { FC, useContext, useEffect } from 'react'
import ApplyManage from '@/components/AccessPolicy/components/ApplyManage'
import { AssetTypeEnum, getAuthRequest, isMicroWidget } from '@/core'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'

interface ApplyPolicyProps {
    id: string // 假设id可以是字符串
    onClose: (needRefresh?: any) => void // onClose是一个无参数的回调函数
    type: string
    style?: React.CSSProperties
    indicatorType?: string
}
const ApplyPolicy: FC<ApplyPolicyProps> = ({
    id,
    onClose,
    type,
    style = {},
    indicatorType,
}) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

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
                ...style,
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
            <ApplyManage
                id={id}
                type={type as AssetTypeEnum}
                onClose={onClose}
                indicatorType={indicatorType}
            />
        </Drawer>
    )
}

export default ApplyPolicy
