import React, { useEffect, useState } from 'react'
import { Pagination } from 'antd'
import classnames from 'classnames'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { CheckOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IMountType, ISearchCondition } from '@/components/ResourcesDir/const'
import {
    formatError,
    getRescCatlgList,
    SortDirection,
    SystemCategory,
} from '@/core'
import { getDataRescTypeIcon } from '@/components/DataAssetsCatlg/DataResc/helper'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { DataRescType } from '@/components/DataAssetsCatlg/ApplicationService/helper'
import { RefreshBtn } from '@/components/ToolbarComponents'

const initSearchCondition: ISearchCondition = {
    current: 1,
    pageSize: 20,
    orgcode: '',
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
    mount_type: IMountType.ViewCount,
    publish_status: 'published',
}

interface IProps {
    // 选择对象
    selectType: 'column' | 'catlg'
    selectedNode?: any
    // 当前数据资源目录
    selCatlg?: any
    // 'catlg'模式下，选中数据资源目录
    checkedItems?: any[]
    // 选择/取消选择数据资源目录
    onChangeCatlg: (value?: any, isSel?: boolean) => void
    // 获取目录参数
    catlgParams?: any
}

const CatlgListView = ({
    selectedNode,
    selectType,
    selCatlg,
    checkedItems = [],
    onChangeCatlg,
    catlgParams = {},
}: IProps) => {
    const [total, setTotal] = useState(0)
    const [catlgList, setCatlgList] = useState<Array<any>>([])
    const [catlgListLoading, setCatlgListLoading] = useState(true)
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        ...initSearchCondition,
        // org_code: selectedNode.id,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 200 })
    const nodeDebounce = useDebounce(selectedNode, { wait: 200 })

    useUpdateEffect(() => {
        setCatlgListLoading(true)
        setTotal(0)
        setCatlgList([])
        setSearchCondition({
            ...searchCondition,
            current: 1,
            keyword: '',
        })
    }, [nodeDebounce])

    const spliceParams = () => {
        let searchData: any = {}
        if (selectedNode.cate_id === SystemCategory.Organization) {
            searchData = {
                ...searchCondition,
                department_id: selectedNode.id,
                info_system_id: undefined,
                subject_id: undefined,
                category_node_id: undefined,
            }
        } else if (selectedNode.cate_id === SystemCategory.InformationSystem) {
            searchData = {
                ...searchCondition,
                subject_id: undefined,
                department_id: undefined,
                category_node_id: undefined,
                info_system_id: selectedNode.id,
            }
        } else {
            searchData = {
                ...searchCondition,
                category_node_id: selectedNode.id,
                subject_id: undefined,
                department_id: undefined,
                info_system_id: undefined,
            }
        }
        return searchData
    }

    useUpdateEffect(() => {
        const searchData: any = spliceParams()
        getCatlgList(searchData)
    }, [searchDebounce])

    const getCatlgList = async (params) => {
        try {
            setCatlgListLoading(true)
            const { current, pageSize, ...rest } = params
            const obj = {
                ...rest,
                offset: current,
                limit: pageSize,
                ...catlgParams,
            }
            const res = await getRescCatlgList(obj)
            setCatlgList(res?.entries || [])
            setTotal(res?.total_count || 0)
        } catch (error) {
            formatError(error)
        } finally {
            setCatlgListLoading(false)
        }
    }
    return (
        <div className={styles.catlgListView}>
            <div className={styles.boxTitle}>{__('数据资源目录')}</div>
            {(total > 0 || searchCondition?.keyword) && (
                <div className={styles.searchWrapper}>
                    <SearchInput
                        placeholder={__('搜索数据资源目录名称、编码')}
                        value={searchCondition?.keyword}
                        onKeyChange={(keyword: string) => {
                            if (keyword === searchCondition?.keyword) return
                            setSearchCondition({
                                ...(searchCondition || {}),
                                keyword,
                            })
                        }}
                    />
                    <RefreshBtn
                        onClick={() =>
                            setSearchCondition({ ...searchCondition })
                        }
                    />
                </div>
            )}
            <div className={styles.catlgListContent}>
                {catlgListLoading ? (
                    <Loader />
                ) : catlgList?.length > 0 ? (
                    <>
                        <div className={styles.catlgList}>
                            {catlgList.map((item) => {
                                let isSel = false
                                if (selectType === 'catlg') {
                                    isSel = checkedItems?.find(
                                        (_item) => _item.id === item.id,
                                    )
                                } else {
                                    isSel = selCatlg?.id === item.id
                                }
                                return (
                                    <div
                                        key={item.id}
                                        className={classnames(
                                            styles.catlgInfo,
                                            {
                                                [styles.selCatlgInfo]: isSel,
                                            },
                                        )}
                                        onClick={() =>
                                            onChangeCatlg(item, !isSel)
                                        }
                                    >
                                        {getDataRescTypeIcon(
                                            {
                                                type: DataRescType.DATA_RESC_CATLG,
                                            },
                                            20,
                                        )}
                                        <div
                                            className={styles.catlgNameWrapper}
                                        >
                                            <div
                                                className={styles.top}
                                                title={item.name}
                                            >
                                                {item.name}
                                            </div>
                                            <div className={styles.bottom}>
                                                <span
                                                    className={styles.subInfo}
                                                    title={item.department}
                                                >
                                                    <FontIcon
                                                        name="icon-bumen"
                                                        style={{
                                                            fontSize: 14,
                                                        }}
                                                    />
                                                    <span
                                                        className={
                                                            styles.subInfoText
                                                        }
                                                    >
                                                        {item.department ||
                                                            '--'}
                                                    </span>
                                                </span>
                                                <span
                                                    className={styles.separator}
                                                />
                                                <span
                                                    className={styles.subInfo}
                                                    title={item.info_system}
                                                >
                                                    <FontIcon
                                                        name="icon-yewuxitong1"
                                                        style={{
                                                            fontSize: 14,
                                                        }}
                                                    />
                                                    <span
                                                        className={
                                                            styles.subInfoText
                                                        }
                                                    >
                                                        {item.info_system ||
                                                            '--'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        {isSel && selectType === 'catlg' && (
                                            <CheckOutlined
                                                style={{ color: '#59A3FF' }}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <Pagination
                            size="small"
                            total={total}
                            className={styles.pagination}
                            current={searchCondition?.current}
                            pageSize={searchCondition?.pageSize}
                            hideOnSinglePage
                            showSizeChanger={false}
                            onChange={(current, pageSize) => {
                                setSearchCondition({
                                    ...searchCondition,
                                    current,
                                    pageSize,
                                })
                            }}
                        />
                    </>
                ) : (
                    <Empty
                        style={{
                            marginTop: searchCondition?.keyword ? 32 : 64,
                        }}
                        iconSrc={
                            searchCondition?.keyword ? searchEmpty : dataEmpty
                        }
                        desc={
                            searchCondition?.keyword
                                ? __('抱歉，没有找到相关内容')
                                : __('暂无数据')
                        }
                    />
                )}
            </div>
        </div>
    )
}

export default CatlgListView
