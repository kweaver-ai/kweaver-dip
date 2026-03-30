import { Tooltip } from 'antd'
import { trim } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import classnames from 'classnames'
import { useDebounce, useSafeState, useSize, useUnmount } from 'ahooks'
import { useSearchParams } from 'react-router-dom'
import { getActualUrl, getPlatformNumber, useQuery } from '@/utils'
import { goBackTop, ServiceType } from './helper'

import __ from './locale'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'

import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import AllDataCatlg from './AllDataCatlg'
import LogicViewDetail from './LogicViewDetail'
import IndicatorViewDetail from './IndicatorViewDetail'
import { LoginPlatform } from '@/core'
import { RescProvider } from './RescProvider'
import SearchDataCopilot from '../SearchDataCopilot'

/**
 * @param getClickAsset 在需求申请中 - 点击资源跳转资源详情
 * @param getAddAsset 在需求申请中 - 添加资源到资源列表
 * @param isIntroduced 是否是页面中引用该组件
 */
interface IDataAssetsCatlg {
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
    addedAssets?: any[]
    isIntroduced?: boolean
}
// 回到顶部显示高度-4*121
const visibilityHeight = 484

const DataAssetsCatlg: React.FC<IDataAssetsCatlg> = ({
    getClickAsset,
    getAddAsset,
    addedAssets,
    isIntroduced = false,
}) => {
    const platform = getPlatformNumber()

    const query = useQuery()

    const [searchKey, setSearchKey] = useState('')
    const [congKey, setCongKey] = useState('')
    const [showHistory, setShowHistory] = useState(false)

    const headerRef: any = useRef()
    const dataRef: any = useRef()
    const serviceWrapperRef: any = useRef()
    const [isShowInputTip, setIsShowInputTip] = useSafeState<boolean>(false)
    const searchRef = useRef<HTMLDivElement | null>(null)
    const searchSize = useSize(searchRef)

    const sizeChanged = useDebounce(searchSize, {
        wait: 500,
    })

    const [searchParams, setSearchParams] = useSearchParams()
    // 库表详情 id
    const dataviewId = query.get('dataviewId') || ''
    // 指标详情id
    const indicatorId = query.get('indicatorId') || ''
    const homeKeyword = query.get('keyword') || ''
    // 数据库表详情
    const [dataviewOpen, setDataviewOpen] = useState<boolean>(false)
    // 指标详情
    const [indicatorOpen, setIndicatorOpen] = useState<boolean>(false)

    useEffect(() => {
        if (homeKeyword) {
            serviceWrapperRef.current.scrollTop = 290
        }
    }, [homeKeyword])

    useEffect(() => {
        if (dataviewId) {
            setDataviewOpen(true)
            return
        }
        if (indicatorId) {
            setIndicatorOpen(true)
        }
    }, [dataviewId, indicatorId])

    useEffect(() => {
        getPlacehoderDisplayStatus()
    }, [sizeChanged, searchKey])

    /**
     * 计算搜索框的placeholder的
     */
    const getPlacehoderDisplayStatus = () => {
        if (searchKey?.length) {
            setIsShowInputTip(false)
        } else if (searchRef.current) {
            const inputElement =
                searchRef.current.getElementsByTagName('input')[0]
            const inputWidth = inputElement.clientWidth
            const text = inputElement.placeholder
            const newLi = document.createElement('span')
            newLi.innerText = text || ''
            document.querySelector('body')?.appendChild(newLi)
            const textWidth = newLi.getBoundingClientRect().width

            if (textWidth > inputWidth) {
                setIsShowInputTip(true)
            } else {
                setIsShowInputTip(false)
            }
            newLi?.remove()
        }
    }

    const [activeKey, setActiveKey] = useState<string>(
        query.get('activeTabKey') || ServiceType.DATACATLG,
    )

    const [{ using }, updateUsing] = useGeneralConfig()
    // useCogAsstContext 已移除，相关功能已下线

    const searchRender = (_placeholder) => {
        const placeholder =
            _placeholder ||
            (using === 1
                ? __('请输入关键词')
                : __('搜索资源名称、编码、描述/指标定义、字段'))
        return (
            <div
                style={{
                    marginLeft: '16px',
                    width: using === 1 ? '275px' : '316px',
                }}
                ref={searchRef}
            >
                <Tooltip
                    placement="top"
                    title={
                        _placeholder || using === 1
                            ? ''
                            : __('搜索资源名称、编码、描述/指标定义、字段')
                    }
                    overlayInnerStyle={{
                        width: 'fit-content',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <SearchInput
                        placeholder={placeholder}
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            handleSearchPressEnter(kw)
                        }}
                        onPressEnter={(e: any) =>
                            handleSearchPressEnter(e.target?.value)
                        }
                        maxLength={255}
                    />
                </Tooltip>
            </div>
        )
    }

    // const items: TabsProps['items'] = [
    //     getAccess?.(accessScene.data_resource_catalog_data_catalog)
    //         ? {
    //               key: ServiceType.DATACATLG,
    //               label: __('数据目录'),
    //               children: (
    //                   <DataCatlg
    //                       ref={dataRef}
    //                       searchKey={searchKey}
    //                       getClickAsset={getClickAsset}
    //                       getAddAsset={getAddAsset}
    //                       addedAssets={addedAssets}
    //                       isIntroduced={isIntroduced}
    //                       //   searchRender={searchRender}
    //                   />
    //               ),
    //           }
    //         : undefined,
    //     getAccess?.(accessScene.data_resource_catalog_data_catalog)
    //         ? {
    //               key: ServiceType.APPLICATIONSERVICE,
    //               label: __('数据资源'),
    //               children: (
    //                   <ApplicationService
    //                       ref={dataRef}
    //                       searchKey={searchKey}
    //                       isIntroduced={isIntroduced}
    //                       getClickAsset={getClickAsset}
    //                       getAddAsset={getAddAsset}
    //                       searchRender={searchRender}
    //                   />
    //               ),
    //           }
    //         : undefined,
    // ].filter((item) => item) as TabsProps['items']

    // 跳转至认知搜索
    const handleCognitiveSearch = (val?: any) => {
        const value = trim(val)

        const url = getActualUrl(
            `/cognitive-search?tabKey=all&keyword=${value}`,
        )
        window.open(url, '_blank')
    }

    const handleSearchPressEnter = (val?: any) => {
        const value = trim(val)
        setSearchKey(value)
        dataRef?.current?.updFilterCondition(value)
        goBackTop(dataRef?.current?.scrollListId)
    }

    // 滚动元素
    const [scrollTarget, setScrollTarget] = useState<any>()

    useUnmount(() => {
        // useCogAsstContext 已移除
    })

    useEffect(() => {
        if (platform === LoginPlatform.default) {
            // useCogAsstContext 已移除
        }
        // 置顶操作-滚动元素内容列表内的右侧滚动条
        const scrollList = document.getElementById(
            dataRef?.current?.scrollListId || '',
        )
        // 整个页面右侧滚动条
        setScrollTarget(scrollList)

        scrollList?.addEventListener('scroll', () => {
            const scrollListTop = scrollList?.scrollTop || 0

            if (scrollListTop > 0) {
                // 内容列表内的右侧滚动条
                setScrollTarget(scrollList)
            }
        })
    }, [])

    // 点击其他区域，关闭下拉菜单
    useEffect(() => {
        document.addEventListener('click', handleClickOutside)
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [])

    const handleClickOutside = (event: any) => {
        if (searchRef?.current && !searchRef.current.contains(event.target)) {
            setShowHistory(false)
        }
    }

    return (
        <RescProvider>
            <div className={styles.serviceWrap} id="serviceWrap">
                <div
                    ref={serviceWrapperRef}
                    className={classnames(
                        styles.serviceWrapper,
                        isIntroduced && styles.isIntroduced,
                    )}
                    style={{
                        width: '100%',
                    }}
                >
                    <div
                        className={classnames(
                            styles.serviceContentWrapper,
                            getClickAsset && styles.serviceContentInDrawer,
                        )}
                    >
                        {/* <Tabs
                        activeKey={activeKey}
                        onChange={(e) => {
                            handleSetTabKey(e)
                        }}
                        getPopupContainer={(node) => node}
                        tabBarGutter={32}
                        items={items}
                        destroyInactiveTabPane
                        className={styles.serviceTabs}
                    /> */}

                        {/* {using === 1 ? ( */}
                        <AllDataCatlg
                            ref={dataRef}
                            searchKey={searchKey}
                            getClickAsset={getClickAsset}
                            getAddAsset={getAddAsset}
                            addedAssets={addedAssets}
                            isIntroduced={isIntroduced}
                            searchRender={searchRender}
                        />
                        {/* ) : null} */}
                        {/* {using === 2 ? (
                            <ApplicationService
                                ref={dataRef}
                                searchKey={searchKey}
                                isIntroduced={isIntroduced}
                                getClickAsset={getClickAsset}
                                getAddAsset={getAddAsset}
                                searchRender={searchRender}
                            />
                        ) : null} */}
                    </div>

                    {/* {!isIntroduced && (
                    <Tooltip title={__('回到顶部')} placement="bottom">
                        <BackTop
                            visibilityHeight={visibilityHeight}
                            className={styles.backTop}
                            target={() => scrollTarget || window}
                            onClick={() => {
                                // 页面置顶
                                goBackTop(dataRef?.current?.scrollListId)
                            }}
                        >
                            <ReturnTopOutlined />
                        </BackTop>
                    </Tooltip>
                )} */}
                </div>

                {/* 数据库表详情 */}
                {dataviewOpen && (
                    <LogicViewDetail
                        open={dataviewOpen}
                        onClose={() => {
                            setDataviewOpen(false)
                            if (dataviewId) {
                                searchParams.delete('dataviewId')
                                setSearchParams(searchParams)
                            }
                        }}
                        isIntroduced={isIntroduced}
                        canChat
                        hasAsst={platform === LoginPlatform.default}
                    />
                )}

                {/* 指标详情 */}
                {indicatorOpen && (
                    <IndicatorViewDetail
                        open={indicatorOpen}
                        onClose={() => {
                            setIndicatorOpen(false)
                            if (indicatorId) {
                                searchParams.delete('indicatorId')
                                setSearchParams(searchParams)
                            }
                        }}
                        isIntroduced={isIntroduced}
                        canChat
                        hasAsst={platform === LoginPlatform.default}
                    />
                )}

                <SearchDataCopilot />
            </div>
        </RescProvider>
    )
}

export default DataAssetsCatlg
