import React, { Suspense, useMemo, useRef } from 'react'
import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import AssetCenterHeader from '@/components/AssetCenterHeader'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import { CongSearchProvider } from '@/components/CognitiveSearch/CogSearchProvider'
import { isRuntimeMicroApp } from '@/utils'
import MicroAppHeader from '@/components/MicroAppHeader'

const { Content } = Layout

const PersonalCenterLayout: React.FC = () => {
    const { pathname } = useLocation()
    const ref = useRef<HTMLDivElement>(null)
    // 判断是否为微应用模式
    const isMicroApp = useMemo(() => isRuntimeMicroApp(), [])

    useMemo(() => {
        // 滚动条平滑回到顶部
        ref?.current?.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth',
        })
    }, [pathname])

    return (
        <Layout className={styles.layoutWapper}>
            <CongSearchProvider>
                {/* 微应用模式:使用主应用的Header组件渲染菜单 */}
                {isMicroApp ? <MicroAppHeader /> : <AssetCenterHeader />}
                <Layout hasSider>
                    <Layout ref={ref} className={styles.layoutContent}>
                        <Content className={styles.content}>
                            <Suspense fallback={<Loader />}>
                                <Outlet />
                            </Suspense>
                        </Content>
                    </Layout>
                </Layout>
            </CongSearchProvider>
        </Layout>
    )
}

export default PersonalCenterLayout
