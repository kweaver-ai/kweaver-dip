import { Tabs } from 'antd'
import { useState } from 'react'
import FavoriteTable from './FavoriteTable'
import { ResType } from '@/core'
import styles from './styles.module.less'
import __ from './locale'

/**
 * 我的收藏
 */
const MyFavoriteList = () => {
    const [activeKey, setActiveKey] = useState(ResType.DataView)

    const handleTabChange = (key: ResType) => {
        setActiveKey(key)
    }

    const renderTabContent = (key: ResType) => {
        if (key !== activeKey) return null

        return <FavoriteTable key={key} menu={key} />
    }

    return (
        <div className={styles.favoriteMgt}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as ResType)}
                items={[
                    {
                        label: __('逻辑视图'),
                        key: ResType.DataView,
                        children: renderTabContent(ResType.DataView),
                    },
                    {
                        label: __('接口服务'),
                        key: ResType.InterfaceSvc,
                        children: renderTabContent(ResType.InterfaceSvc),
                    },
                    {
                        label: __('指标'),
                        key: ResType.Indicator,
                        children: renderTabContent(ResType.Indicator),
                    },
                ]}
            />
        </div>
    )
}

export default MyFavoriteList
