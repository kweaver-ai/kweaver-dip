import { useEffect, useState } from 'react'
import { useDebounce } from 'ahooks'
import { Spin } from 'antd'
import { Empty, SearchInput } from '@/ui'
import styles from './styles.module.less'
import __ from '../locale'
import { useSelectedDataContext } from './SelectedDataContext'
import {
    formatError,
    formRecommendByLogicView,
    getDatasheetView,
    OnlineStatus,
} from '@/core'
import SelectNode from './SelectNode'

import searchEmpty from '@/assets/searchEmpty.svg'
import LogicViewSelectTree from './LogicViewSelectTree'

const LogicViewSelect = () => {
    // 搜索关键字
    const [keyword, setKeyword] = useState('')
    // 防抖搜索关键字
    const debouncedKeyword = useDebounce(keyword, { wait: 500 })
    // 推荐表
    const [recommendForms, setRecommendForms] = useState<Array<any>>([])
    // 搜索表
    const [searchForms, setSearchForms] = useState<Array<any>>([])
    // 搜索loading
    const [searchLoading, setSearchLoading] = useState<boolean>(false)

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
        if (debouncedKeyword) {
            getSearchForms()
        }
        getRecommendForms()
    }, [debouncedKeyword])

    /**
     * 获取搜索表
     */
    const getSearchForms = async () => {
        try {
            setSearchLoading(true)
            const res = await getDatasheetView({
                keyword: debouncedKeyword,
                offset: 1,
                limit: 2000,
                type: 'datasource',
                publish_status: 'publish',
            })
            setSearchForms(res.entries)
        } catch (err) {
            formatError(err)
        } finally {
            setSearchLoading(false)
        }
    }

    /**
     * 获取推荐表
     */
    const getRecommendForms = async () => {
        try {
            const res = await formRecommendByLogicView(mid, {
                keyword: debouncedKeyword || undefined,
                description: formInfo?.description || '',
                id: formInfo.id,
                name: formInfo.name,

                fields: targetNode?.data?.items || [],
                table_kind: formInfo?.table_kind || '',
            })
            setRecommendForms(res?.rec_tables || [])
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.selectBusinessFormContainer}>
            <div className={styles.selectedSearch}>
                <SearchInput
                    onKeyChange={(kw: string) => {
                        setKeyword(kw)
                    }}
                    placeholder={__('搜索库表')}
                    autoComplete="off"
                />
            </div>
            <div className={styles.listContainer}>
                <div
                    className={styles.recommendForm}
                    hidden={!recommendForms.length}
                >
                    <div className={styles.recommendFormTitle}>
                        {__('智能推荐')}
                    </div>
                    {recommendForms.map((recommendForm, index) => {
                        return (
                            <SelectNode
                                info={{
                                    ...recommendForm,
                                    name: recommendForm.business_name,
                                }}
                                // onViewForm={() => {
                                //     handleViewForm(recommendForm)
                                // }}
                                bottomEle={
                                    <div
                                        className={
                                            styles.recommendItemBottomWrapper
                                        }
                                        title={recommendForm.datasource}
                                    >
                                        <span>{__('数据源：')}</span>
                                        {recommendForm.datasource}
                                    </div>
                                }
                                className={styles.selectedFormNodeWrapper}
                            />
                        )
                    })}
                </div>
                {debouncedKeyword ? (
                    <div className={styles.recommendForm}>
                        <div className={styles.recommendFormTitle}>
                            {__('普通搜索')}
                        </div>
                        <div className={styles.recommendContent}>
                            {!searchForms?.length && (
                                <div
                                    style={{
                                        paddingTop: '8px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {searchLoading ? (
                                        <Spin tip={__('加载中...')} />
                                    ) : (
                                        <Empty
                                            desc={__('抱歉，没有找到相关内容')}
                                            iconSrc={searchEmpty}
                                            iconHeight={104}
                                        />
                                    )}
                                </div>
                            )}

                            {searchForms?.map((recommendForm, index) => {
                                return (
                                    <SelectNode
                                        info={{
                                            ...recommendForm,
                                            name: recommendForm.business_name,
                                        }}
                                        // onViewForm={() => {
                                        //     handleViewForm(recommendForm)
                                        // }}
                                        bottomEle={
                                            <div
                                                className={
                                                    styles.recommendItemBottomWrapper
                                                }
                                            >
                                                <span>{__('数据源：')}</span>
                                                {recommendForm.datasource}
                                            </div>
                                        }
                                        className={
                                            styles.selectedFormNodeWrapper
                                        }
                                    />
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className={styles.recommendForm}>
                        <LogicViewSelectTree />
                    </div>
                )}
            </div>
        </div>
    )
}

export default LogicViewSelect
