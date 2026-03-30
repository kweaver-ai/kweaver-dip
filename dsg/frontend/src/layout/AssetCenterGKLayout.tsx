import React, { Suspense, useMemo, useRef } from 'react'
import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { Loader } from '@/ui'
import styles from './styles.module.less'
import { CongSearchProvider } from '@/components/CognitiveSearch/CogSearchProvider'
import logo from '@/assets/logo2.svg'

const { Content } = Layout

const AssetCenterGKLayout: React.FC = () => {
    const { pathname } = useLocation()
    const ref = useRef<HTMLDivElement>(null)

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
                <div className={styles.layoutHeader}>
                    <div className={styles.imgWrapper}>
                        <img
                            height="36px"
                            width="123px"
                            src={logo}
                            alt="AnyFabric Asset Center"
                            aria-hidden
                            className={styles.img}
                        />
                    </div>
                </div>
                <Layout ref={ref} className={styles.layoutContent}>
                    <Content className={styles.content}>
                        <Suspense fallback={<Loader />}>
                            <Outlet />
                        </Suspense>
                    </Content>
                </Layout>
            </CongSearchProvider>
        </Layout>
    )
}

export default AssetCenterGKLayout
