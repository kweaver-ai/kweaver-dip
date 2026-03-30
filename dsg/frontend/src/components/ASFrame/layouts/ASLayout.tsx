import React, { Suspense } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Loader } from '@/ui'
import ASHeader from '../ASHeader'
import styles from '../styles.module.less'

const { Content } = Layout

const ASLayout: React.FC = () => {
    return (
        <Layout className={styles.wrapper}>
            <ASHeader />
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

export default ASLayout
