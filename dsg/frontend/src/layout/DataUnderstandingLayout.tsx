import React, { Suspense } from 'react'
import { Layout } from 'antd'
import { Outlet } from 'react-router-dom'
import { Loader } from '@/ui'
import styles from './styles.module.less'

const { Content } = Layout

const DataUnderstandingLayout: React.FC = () => {
    return (
        <Layout className={styles.dataUnderstandingLayoutWapper}>
            <Content className={styles.dataUnderstandingLayoutContent}>
                <Suspense fallback={<Loader />}>
                    <Outlet />
                </Suspense>
            </Content>
        </Layout>
    )
}

export default DataUnderstandingLayout
