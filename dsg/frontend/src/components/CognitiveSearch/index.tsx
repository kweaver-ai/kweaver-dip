import { Tabs } from 'antd'
import { memo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { ParamsType, useCongSearchContext } from './CogSearchProvider'
import AllSearch from './components/AllSearch'
import DataCatlg from './components/DataCatlg'
import { AssetType } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, LoginPlatform } from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { answersTabItem } from './helper'
import { getPlatformNumber } from '@/utils'

/**
 * 切换面板
 */
const SwitchTabs = memo(() => {
    const [searchParams, setSearchParams] = useSearchParams()
    const tabKey: string = searchParams.get('tabKey') || AssetType.ALL
    const { conditions, updateParams, searchInfo, llm, assetType } =
        useCongSearchContext()
    const [{ using }, updateUsing] = useGeneralConfig()
    const platform = getPlatformNumber()

    useEffect(() => {
        if (tabKey) {
            updateParams(ParamsType.Tab, tabKey)
        }
    }, [])

    useUpdateEffect(() => {
        if (tabKey) {
            searchParams.delete('tabKey')
            searchParams.delete('keyword')
            setSearchParams(searchParams)
        }
    }, [conditions])

    /**
     * 无大模型，数据资源有三个 tab， 数据资源目录无 tab
     * 有大模型时，加入问答 tab
     */
    const tabs = () => {
        if (using === 2) {
            const items: any[] = [
                {
                    key: AssetType.ALL,
                    label: __('全部'),
                    children: <AllSearch />,
                },
                {
                    key: AssetType.LOGICVIEW,
                    label: __('库表'),
                    children: <AllSearch />,
                },

                {
                    key: AssetType.INDICATOR,
                    label: __('指标'),
                    children: <AllSearch />,
                },
                {
                    key: AssetType.INTERFACESVC,
                    label: __('接口服务'),
                    children: <AllSearch />,
                },
            ]
            return items
        }
        return llm
            ? [
                  {
                      key: AssetType.ALL,
                      label: __('数据目录'),
                      children: <DataCatlg />,
                  },
                  answersTabItem(false),
              ]
            : []
    }

    if (using === 1) {
        return <DataCatlg />
    }

    if (using === 2) {
        return (
            <Tabs
                activeKey={assetType}
                onChange={(key: string) => {
                    updateParams(ParamsType.Tab, key)
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={tabs()}
                destroyInactiveTabPane
                className={classnames(styles['cognitive-search-tab'], {
                    [styles.cognitiveSearchTabDrm]:
                        platform !== LoginPlatform.default,
                })}
            />
        )
    }

    return null
})

/**
 * 认知搜索
 * @returns
 */
const CognitiveSearch = () => {
    return (
        <div className={styles['cognitive-search']}>
            <SwitchTabs />
        </div>
    )
}

export default memo(CognitiveSearch)
