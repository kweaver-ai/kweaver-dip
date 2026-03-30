import { Tabs } from 'antd'
import { useEffect, useState } from 'react'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import FavoriteTable from './FavoriteTable'
import FavoriteTableResMode from '../FavoriteResMode/FavoriteTable'
import { ResType } from '@/core'
import styles from './styles.module.less'
import __ from './locale'

/**
 * 我的收藏
 */
const MyFavoriteList = () => {
    const [{ using }] = useGeneralConfig()

    const [activeKey, setActiveKey] = useState(ResType.DataCatalog)

    const handleTabChange = (key: ResType) => {
        setActiveKey(key)
    }

    const renderTabContent = (key: ResType) => {
        if (key !== activeKey) return null
        if (using === 2) {
            return <FavoriteTableResMode key={key} menu={key} />
        }

        return <FavoriteTable key={key} menu={key} />
    }

    useEffect(() => {
        setActiveKey(using === 2 ? ResType.DataView : ResType.DataCatalog)
    }, [using])

    return (
        <div className={styles.favoriteMgt}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => handleTabChange(key as ResType)}
                items={[
                    {
                        label: __('库表'),
                        key: ResType.DataView,
                        children: renderTabContent(ResType.DataView),
                    },
                    {
                        label: __('数据资源目录'),
                        key: ResType.DataCatalog,
                        children: renderTabContent(ResType.DataCatalog),
                    },
                    {
                        label: __('接口服务'),
                        key: ResType.InterfaceSvc,
                        children: renderTabContent(ResType.InterfaceSvc),
                    },
                ].filter((item) =>
                    using === 2
                        ? item?.key !== ResType.DataCatalog
                        : item?.key !== ResType.DataView,
                )}
            />
        </div>
    )
}

export default MyFavoriteList
