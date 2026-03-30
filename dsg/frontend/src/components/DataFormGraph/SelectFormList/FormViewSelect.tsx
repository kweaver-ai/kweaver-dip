import { FC, useEffect, useRef, useState, useMemo } from 'react'
import { useDebounce } from 'ahooks'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Empty, Loader } from '@/ui'
import styles from './styles.module.less'
import __ from '../locale'
import { useSelectedDataContext } from './SelectedDataContext'

import {
    formatError,
    formsQuery,
    getCoreBusinessDetails,
    SortDirection,
    transformQuery,
} from '@/core'
import SelectNode from './SelectNode'
import dataEmpty from '@/assets/dataEmpty.svg'

import { FormTableKind } from '@/components/Forms/const'
import { useBusinessModelContext } from '../../BusinessModeling/BusinessModelProvider'

interface FormViewSelectProps {
    tableKind: string
}
const FormViewSelect: FC<FormViewSelectProps> = ({ tableKind }) => {
    // 搜索关键字
    const [keyword, setKeyword] = useState('')
    // 防抖搜索关键字
    const debouncedKeyword = useDebounce(keyword, { wait: 500 })
    // 推荐表
    const [recommendForms, setRecommendForms] = useState<Array<any>>([])

    const [totalCount, setTotalCount] = useState<number>(0)
    // 搜索表
    const [searchForms, setSearchForms] = useState<Array<any>>([])
    // 搜索loading
    const [searchLoading, setSearchLoading] = useState<boolean>(false)

    const [modelId, setModelId] = useState<string>('')

    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    const scrollRef = useRef(null)

    const scrollListId = 'scrollableDiv'

    const {
        formInfo,
        targetNode,
        mid,
        onStartDrag,
        allOriginNodes,
        dragLoading,
        setDragLoading,
    } = useSelectedDataContext()

    useEffect(() => {
        if (tableKind && mid) {
            if (formInfo?.table_kind === FormTableKind.DATA_ORIGIN) {
                getModelId()
            } else {
                setModelId(mid)
            }
        }
    }, [tableKind, mid])

    useEffect(() => {
        if (modelId) {
            getSearchForms([])
        }
    }, [modelId, tableKind])

    /**
     * 获取搜索表
     */
    // const getSearchForms = async () => {
    //     try {
    //         setSearchLoading(true)
    //         const res = await getDatasheetView({
    //             keyword: debouncedKeyword,
    //             offset: 1,
    //             limit: 2000,
    //             type: 'datasource',
    //         })
    //         setSearchForms(res.entries)
    //     } catch (err) {
    //         formatError(err)
    //     } finally {
    //         setSearchLoading(false)
    //     }
    // }

    const getModelId = async () => {
        try {
            const res = await getCoreBusinessDetails(mid)
            setModelId(res.same_node_model_id || '')
        } catch (err) {
            formatError(err)
        }
    }

    const getSearchForms = async (lastData: Array<any>) => {
        try {
            const res = await formsQuery(modelId, {
                offset: Math.ceil(lastData.length / 30) + 1,
                limit: 30,
                table_kind: tableKind,
                direction: SortDirection.DESC,
                sort: 'updated_at',
                keyword,
                ...versionParams,
            })
            setTotalCount(res.total_count)
            setSearchForms([...lastData, ...res.entries])
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 获取推荐表
     */
    // const getRecommendForms = async () => {
    //     try {
    //         const res = await formRecommendByLogicView(mid, {
    //             keyword: debouncedKeyword || undefined,
    //             description: formInfo?.description || '',
    //             id: formInfo.id,
    //             name: formInfo.name,

    //             fields: targetNode?.data?.items || [],
    //             table_kind: formInfo?.table_kind || '',
    //         })
    //         setRecommendForms(res?.rec_tables || [])
    //     } catch (err) {
    //         formatError(err)
    //     }
    // }

    return (
        <div className={styles.selectBusinessFormContainer}>
            <div
                ref={scrollRef}
                id={scrollListId}
                className={styles.scrollWrapper}
            >
                <InfiniteScroll
                    hasMore={searchForms.length < totalCount}
                    loader={
                        <div
                            className={styles.listLoading}
                            // hidden={!listDataLoading}
                        >
                            <Loader />
                        </div>
                    }
                    next={() => {
                        getSearchForms(searchForms)
                    }}
                    dataLength={searchForms.length}
                    scrollableTarget={scrollListId}
                    endMessage={
                        searchForms.length === 0 ? (
                            <Empty
                                style={{ marginTop: 77 }}
                                iconSrc={dataEmpty}
                                desc={
                                    tableKind === FormTableKind.STANDARD ? (
                                        <div className={styles.scrollEmpty}>
                                            <span>
                                                {__('关联的业务流程中')}
                                            </span>
                                            <span>{__('暂无业务标准表')}</span>
                                        </div>
                                    ) : (
                                        <div className={styles.scrollEmpty}>
                                            <span>{__('此数据模型中')}</span>
                                            <span>
                                                {tableKind ===
                                                FormTableKind.DATA_STANDARD
                                                    ? __('暂无业务标准表')
                                                    : __('暂无原始数据表')}
                                            </span>
                                        </div>
                                    )
                                }
                            />
                        ) : (
                            ''
                        )
                    }
                >
                    {searchForms.map((item) => (
                        <SelectNode info={item} />
                    ))}
                </InfiniteScroll>
            </div>
        </div>
    )
}

export default FormViewSelect
