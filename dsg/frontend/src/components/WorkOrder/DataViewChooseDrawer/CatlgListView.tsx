import React, { useEffect, useState } from 'react'
import { Pagination } from 'antd'
import classnames from 'classnames'
import { useDebounce, useUpdateEffect } from 'ahooks'
import { CheckOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { FontIcon } from '@/icons'
import {
    DataSourceFromType,
    formatError,
    getDatasheetView,
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

import { IconType } from '@/icons/const'
import { databaseTypesEleData } from '@/core/dataSource'
import { TreeType, UNGROUPED } from '@/components/MultiTypeSelectTree/const'

const initSearchCondition: any = {
    current: 1,
    pageSize: 20,
    keyword: '',
    direction: SortDirection.DESC,
    sort: 'updated_at',
    publish_status: 'publish',
    type: 'datasource',
}

interface IProps {
    // 选择对象
    selectType: 'column' | 'catlg'
    selectedNode?: any
    // 当前数据资源目录
    selectForm?: any
    // 'catlg'模式下，选中数据资源目录
    checkedItems?: any[]
    // 选择/取消选择数据资源目录
    onChangeForm: (value?: any, isSel?: boolean) => void
    // 获取目录参数
    catlgParams?: any
}

const CatlgListView = ({
    selectedNode,
    selectType,
    selectForm,
    checkedItems = [],
    onChangeForm,
    catlgParams = {},
}: IProps) => {
    const [total, setTotal] = useState(0)
    const [catlgList, setCatlgList] = useState<Array<any>>([])
    const [catlgListLoading, setCatlgListLoading] = useState(true)
    const [searchCondition, setSearchCondition] = useState<any>({
        ...initSearchCondition,
        // org_code: selectedNode.id,
    })
    const searchDebounce = useDebounce(searchCondition, { wait: 200 })
    const nodeDebounce = useDebounce(selectedNode, { wait: 200 })

    useUpdateEffect(() => {
        setCatlgListLoading(true)
        setTotal(0)
        setCatlgList([])
        formatSelectedNode(nodeDebounce)
        // setSearchCondition({
        //     ...searchCondition,
        //     current: 1,
        //     keyword: '',
        // })
    }, [nodeDebounce])

    /**
     * 将选中的节点转换为表格参数
     * @param selectedNode 选中的节点
     * @returns 表格参数
     */
    const formatSelectedNodeToTableParams = (currentNode: any) => {
        if (!currentNode || !currentNode.nodeId) {
            return {
                department_id: undefined,
                info_system_id: undefined,
                datasource_source_type: undefined,
                datasource_type: undefined,
                datasource_id: undefined,
            }
        }

        switch (currentNode.treeType) {
            case TreeType.DataSource:
                if (currentNode.nodeType === 'source_type') {
                    return {
                        department_id: undefined,
                        info_system_id: undefined,
                        datasource_type: undefined,
                        datasource_source_type: currentNode.nodeId,
                        datasource_id: undefined,
                    }
                }
                if (currentNode.nodeType === 'dsType') {
                    return {
                        department_id: undefined,
                        info_system_id: undefined,
                        datasource_source_type: currentNode.dataSourceType,
                        datasource_type: currentNode.nodeId,
                        datasource_id: undefined,
                    }
                }
                if (
                    currentNode.nodeType === 'excel' &&
                    selectedNode.dataType === 'file'
                ) {
                    return {
                        department_id: undefined,
                        info_system_id: undefined,
                        datasource_source_type: undefined,
                        datasource_type: undefined,
                        datasource_id: currentNode.nodeId,
                        excel_file_name: currentNode.name,
                    }
                }
                return {
                    department_id: undefined,
                    info_system_id: undefined,
                    datasource_source_type: DataSourceFromType.Analytical,
                    datasource_type: undefined,
                    datasource_id: currentNode.nodeId,
                }
            case TreeType.Department:
                if (currentNode.nodeId === UNGROUPED) {
                    return {
                        department_id: '00000000-0000-0000-0000-000000000000',
                        info_system_id: undefined,
                        datasource_source_type: DataSourceFromType.Analytical,
                        datasource_type: undefined,
                        datasource_id: undefined,
                    }
                }
                return {
                    department_id: currentNode.nodeId,
                    info_system_id: undefined,
                    datasource_source_type: DataSourceFromType.Analytical,
                    datasource_type: undefined,
                    datasource_id: undefined,
                }
            default:
                return {}
        }
    }

    /**
     * 格式化选中的节点
     * @param treeNode
     */
    const formatSelectedNode = (treeNode: any) => {
        const searchParams = formatSelectedNodeToTableParams(treeNode)

        setSearchCondition({
            ...searchCondition,
            ...searchParams,
        })
        // return selectedNode
    }

    // const spliceParams = () => {
    //     let searchData: any = {}
    //     if (selectedNode.cate_id === SystemCategory.Organization) {
    //         searchData = {
    //             ...searchCondition,
    //             department_id: selectedNode.id,
    //             info_system_id: undefined,
    //             subject_id: undefined,
    //             category_node_id: undefined,
    //         }
    //     } else if (selectedNode.cate_id === SystemCategory.InformationSystem) {
    //         searchData = {
    //             ...searchCondition,
    //             subject_id: undefined,
    //             department_id: undefined,
    //             category_node_id: undefined,
    //             info_system_id: selectedNode.id,
    //         }
    //     } else {
    //         searchData = {
    //             ...searchCondition,
    //             category_node_id: selectedNode.id,
    //             subject_id: undefined,
    //             department_id: undefined,
    //             info_system_id: undefined,
    //         }
    //     }
    //     return searchData
    // }

    useUpdateEffect(() => {
        const searchData: any = searchDebounce
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
                datasource_source_type: rest?.datasource_id
                    ? undefined
                    : DataSourceFromType.Analytical,
            }
            const res = await getDatasheetView(obj)
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
            <div className={styles.boxTitle}>
                <span>{__('库表')}</span>
                <span className={styles.desc}>{__('（已发布的库表）')}</span>
            </div>
            {(total > 0 || searchCondition?.keyword) && (
                <div className={styles.searchWrapper}>
                    <SearchInput
                        placeholder={__('搜索库表名称、编码')}
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
                                    isSel = selectForm?.id === item.id
                                }

                                const { Colored = undefined } =
                                    item?.datasource_type
                                        ? databaseTypesEleData.dataBaseIcons[
                                              item?.datasource_type
                                          ]
                                        : {}

                                return (
                                    <div
                                        key={item.id}
                                        className={classnames(
                                            styles.catlgInfo,
                                            {
                                                [styles.selectFormInfo]: isSel,
                                            },
                                        )}
                                        onClick={() =>
                                            onChangeForm(item, !isSel)
                                        }
                                    >
                                        <FontIcon
                                            name="icon-shujubiaoshitu"
                                            style={{ fontSize: 20 }}
                                            type={IconType.COLOREDICON}
                                        />
                                        <div
                                            className={styles.catlgNameWrapper}
                                        >
                                            <div
                                                className={styles.top}
                                                title={item.business_name}
                                            >
                                                {item.business_name}
                                            </div>
                                            <div className={styles.bottom}>
                                                <span
                                                    className={styles.subInfo}
                                                    title={item.department}
                                                >
                                                    <FontIcon
                                                        name="icon-mingcheng"
                                                        style={{
                                                            fontSize: 14,
                                                        }}
                                                    />
                                                    <span
                                                        className={
                                                            styles.subInfoText
                                                        }
                                                        title={
                                                            item.technical_name ||
                                                            ''
                                                        }
                                                    >
                                                        {item.technical_name ||
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
                                                    {item?.datasource_type && (
                                                        <Colored
                                                            style={{
                                                                fontSize: 16,
                                                            }}
                                                        />
                                                    )}
                                                    <span
                                                        className={
                                                            styles.subInfoText
                                                        }
                                                        title={
                                                            item.datasource ||
                                                            ''
                                                        }
                                                    >
                                                        {item.datasource ||
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
