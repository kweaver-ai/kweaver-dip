import { useUpdate, useUpdateEffect } from 'ahooks'
import { List, message } from 'antd'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classnames from 'classnames'
import { useSearchParams } from 'react-router-dom'
import FilterConditionLayout from '@/components/DataAssetsCatlg/FilterConditionLayout'
import {
    RescErrorCodeList,
    formatCatlgError,
} from '@/components/DataAssetsCatlg/helper'
import { getRepositoryIsOnline, reqCatlgCommonInfo } from '@/core'
import { getActualUrl, rewriteUrl, useQuery } from '@/utils'
import { ParamsType, useCongSearchContext } from '../../CogSearchProvider'
import { BusinObjOpr, AssetType } from '../../const'
import __ from '../../locale'
import DerivationModel from '../DerivationModel'
import PageLayout from '../PageLayout'
import ScrollList from '../ScrollList'
import styles from '../styles.module.less'
import DataAssetsItem from './DataAssetsItem'
import DataCatlgContent from '@/components/DataAssetsCatlg/DataCatlgContent'
import CitySharingDrawer from '@/components/CitySharing/CitySharingDrawer'

function DataCatlg({ getAddAsset, addedAssets }: any) {
    const {
        loading,
        searchInfo,
        conditions,
        updateParams,
        data,
        onLoadMore,
        isCongSearch,
    } = useCongSearchContext()
    const [scrollTop, setScrollTop] = useState<number>(0)
    const [filters, setFilters] = useState<any>({})
    const [current, setCurrent] = useState<any>()
    const isInit = useRef<boolean>(true)
    const [listData, setListData] = useState<any>()
    const [dataCatlgVisible, setDataCatlgVisible] = useState<boolean>(false)
    const [graphVisible, setGraphVisible] = useState<boolean>(false)
    const [showGraph, setShowGraph] = useState<boolean>(false)
    // 目录共享申报
    const [applyCatalog, setApplyCatalog] = useState<any>()
    const [searchParams, setSearchParams] = useSearchParams()
    const query = useQuery()
    // 目录详情 id
    const catalogId = query.get('catalogId') || ''

    useEffect(() => {
        // 重新搜索数据时，关闭所有抽屉
        setDataCatlgVisible(false)
        if (catalogId) {
            setDataCatlgVisible(true)
        }
    }, [searchInfo, catalogId])

    useEffect(() => {
        setListData(data?.entries)
    }, [data])

    useUpdateEffect(() => {
        setScrollTop(0)
    }, [conditions])

    useUpdateEffect(() => {
        if (!isInit.current) {
            getData()
        }
        // 解决初次加载重复触发问题
        isInit.current = false
    }, [filters])
    const getData = async () => {
        updateParams(ParamsType.Filter, filters)
    }

    // 失效数据时重新刷新列表
    const updateData = () => {
        // updateParams(condition)
        getData()
    }

    const getAssetIsOnline = async (item: any, type: AssetType) => {
        onItemClick(item, type)
        // try {
        //     const res = await getRepositoryIsOnline(item?.id)
        //     if (!res.available) {
        //         message.error(
        //             __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
        //         )
        //         updateData()
        //     } else {
        //         onItemClick(item, type)
        //     }
        // } catch (error) {
        //     message.error(
        //         __('当前目录暂不支持在数据资源目录中查看，请查看其他目录'),
        //     )
        // }
    }

    // 更新当前列表项权限
    const updCurItemDownloadAccess = async (cId: string, newItem?: any) => {
        let curItem = newItem
        if (!newItem) {
            try {
                // 根据审核策略不同,申请可能会被自动拒绝或其他情况
                // 获取最新权限值来设置按钮状态
                curItem = await reqCatlgCommonInfo(cId)
            } catch (error) {
                // 需求申请中报错不进行路由跳转
                formatCatlgError(error)
            }
        }

        const listDataTemp = listData?.map((liItem) => {
            if (liItem.id === curItem.id) {
                return {
                    ...liItem,
                    download_access: curItem?.download_access,
                }
            }
            return liItem
        })
        setListData(listDataTemp)
    }

    // 目录下载或添加到申请清单操作成功/失败之后的更新操作
    const handleAssetBtnUpdate = async (
        type: BusinObjOpr,
        item: any,
        newItem?: any,
    ) => {
        if (type === BusinObjOpr.DATADOWNLOAD) {
            // 申请下载
            updCurItemDownloadAccess(item?.id, newItem)
        } else {
            // 失效资源添加到申请清单 或 立即申请-资源不支持 ——刷新列表
            updateData()
        }
    }

    const handleError = (error?: any) => {
        const { code } = error?.data || {}

        // 资源下线-刷新列表（其他错误如服务器错误等，不刷新列表）
        if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
            updateData()
        }
    }

    const onItemClick = (item: any, type: AssetType) => {
        setCurrent(item)
        setDataCatlgVisible(true)
    }

    const onGraphClick = (item: any) => {
        setCurrent(item)
        setGraphVisible(true)
    }
    /**
     * 数据目录项
     */
    const itemRender = (item) => {
        return (
            <List.Item
                key={item.id}
                className={classnames(
                    styles['list-item'],
                    current?.id === item.id && styles['is-selected'],
                )}
            >
                <DataAssetsItem
                    item={item}
                    key={item.id}
                    handleAssetBtnUpdate={handleAssetBtnUpdate}
                    handleError={handleError}
                    checkClickAssetIsOnline={getAssetIsOnline}
                    addedAssets={addedAssets}
                    getAddAsset={getAddAsset}
                    isCongSearch={isCongSearch}
                    getClickAsset={onItemClick}
                    onGraphClick={onGraphClick}
                    onShareApply={(value) => {
                        setApplyCatalog(value)
                    }}
                />
            </List.Item>
        )
    }

    return (
        <>
            <PageLayout>
                <div className={styles['page-wrapper-content']}>
                    <div
                        className={classnames(
                            styles['page-wrapper-top'],
                            styles['catlg-wrapper-top'],
                        )}
                    >
                        {/* <FilterConditionLayout
                            layoutClassName={styles['filter-condition']}
                            updateList={(cond: Object) => setFilters(cond)}
                        /> */}
                        <div className={styles['page-wrapper-top-count']}>
                            {__('共')}
                            <span>{data?.total_count ?? 0}</span>
                            {__('条结果')}
                        </div>
                    </div>
                    <ScrollList
                        isSearch={conditions?.keyword}
                        loading={loading}
                        scrollTop={scrollTop}
                        itemRender={itemRender}
                        hasMore={
                            listData !== undefined &&
                            listData?.length < data?.total_count
                        }
                        data={listData}
                        onLoad={() => {
                            onLoadMore()
                        }}
                    />
                </div>

                {graphVisible && (
                    <DerivationModel
                        open={graphVisible}
                        item={current}
                        type={AssetType.DATACATLG}
                        handleClose={() => {
                            setGraphVisible(false)
                        }}
                        handleDetail={() => {
                            setGraphVisible(false)
                            setShowGraph(true)
                            setDataCatlgVisible(true)
                        }}
                    />
                )}
            </PageLayout>
            {dataCatlgVisible && (
                <DataCatlgContent
                    open={dataCatlgVisible}
                    onClose={() => {
                        setDataCatlgVisible(false)
                        if (showGraph) {
                            setGraphVisible(true)
                            setShowGraph(false)
                        }
                        if (catalogId) {
                            searchParams.delete('catalogId')
                            setSearchParams(searchParams)
                        }
                    }}
                    assetsId={current?.id}
                    isIntroduced={false}
                    handleAssetBtnUpdate={() => {}}
                    errorCallback={() => {}}
                    canChat
                    hasAsst
                />
            )}

            {/* 目录共享申报 */}
            {applyCatalog && (
                <CitySharingDrawer
                    applyResource={applyCatalog}
                    operate="create"
                    open={!!applyCatalog}
                    onClose={() => setApplyCatalog(undefined)}
                />
            )}
        </>
    )
}

export default memo(DataCatlg)
