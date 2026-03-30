import React, { Suspense } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Loader } from '@/ui'
import styles from '../styles.module.less'

const { Content } = Layout

const ASFullScreenLayout: React.FC = () => {
    return (
        <Layout className={styles.wrapper}>
            <Layout className={styles.contentWrapper}>
                <Content className={styles.content}>
                    <Suspense fallback={<Loader />}>
                        <Outlet />
                    </Suspense>
                </Content>
            </Layout>
        </Layout>
    )
}

export default ASFullScreenLayout
