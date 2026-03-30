import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Input, Spin, Tooltip } from 'antd'
import { useDebounce } from 'ahooks'
import { Node } from '@antv/x6'
import classnames from 'classnames'
import { RightOutlined, SearchOutlined } from '@ant-design/icons'
import __ from '../locale'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    formRecommendByIntelligence,
    getSearchForms,
    getFormsFieldsList,
    IFormItem,
    formatError,
    getUngroupForms,
    IUngroupForm,
    transformQuery,
} from '@/core'
import styles from './styles.module.less'
import CustomTree from '../../BusinessArchitecture/ArchitectureTree'
import { Architecture } from '../../BusinessArchitecture/const'
import Icons from '../../BusinessArchitecture/Icons'
import FieldTableView from '../FieldTableView'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { UNGROUPED } from '../helper'
import { useSelectedDataContext } from './SelectedDataContext'
import SelectNode from './SelectNode'
import { useBusinessModelContext } from '../../BusinessModeling/BusinessModelProvider'

const BusinessFormSelect = () => {
    const [recommendForms, setRecommendForms] = useState<Array<IFormItem>>([])
    const [keyword, setKeyword] = useState('')
    const [searchForms, setSearchForms] = useState<Array<IFormItem>>([])
    const [searchLoading, setSearchLoading] = useState<boolean>(false)
    const timeoutIdRef = useRef<number | null>(null)
    const [viewTableFlag, setViewTableFlag] = useState<boolean>(false)
    const [viewTableData, setViewTableData] = useState<Array<any>>([])
    const [viewTableFid, setViewTableFid] = useState<string>('')

    const [selectedNode, setSelectedNode] = useState<any>()
    const [isExpand, setIsExpand] = useState(false)
    const [forms, setForms] = useState<IUngroupForm[]>([])
    const ref: any = useRef()
    const { formInfo, targetNode, mid } = useSelectedDataContext()
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    const getForms = async () => {
        const res = await getUngroupForms(mid)
        setForms(res)
    }

    useEffect(() => {
        getForms()
    }, [])

    useEffect(() => {
        if (keyword) {
            handleSearchForms(keyword)
        } else {
            setSearchForms([])
        }
    }, [keyword])

    useEffect(() => {
        if (formInfo && !keyword) {
            getRecommendData()
        }
    }, [targetNode, keyword])

    /**
     * 获取推荐表
     */
    const getRecommendData = async () => {
        try {
            if (formInfo) {
                const { rec_tables } = await formRecommendByIntelligence(mid, {
                    // data_range: formInfo.data_range,
                    description: formInfo?.description || '',
                    // guideline: formInfo.guideline,
                    id: formInfo.id,
                    name: formInfo.name,
                    // resource_tag: formInfo?.resource_tag || [],
                    // source_system:
                    //     formInfo?.source_system?.map((source) => source.id) ||
                    //     [],
                    // update_cycle: formInfo.update_cycle,

                    fields: targetNode?.data?.items || [],
                    table_kind: formInfo?.table_kind || '',
                })
                if (rec_tables) {
                    setRecommendForms(rec_tables)
                }
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 获取搜索结果
     * @param key 关键字
     */
    const handleSearchForms = async (key: string) => {
        try {
            setSearchLoading(true)
            const { local_tables, rec_tables } = await getSearchForms(mid, {
                keyword: key,
                id: formInfo.id,
            })
            if (rec_tables) {
                setRecommendForms(rec_tables)
            }
            if (local_tables) {
                setSearchForms(local_tables)
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setSearchLoading(false)
        }
    }

    /**
     * 创建节点
     * @param dataNodeInfo
     * @returns
     */
    const createTreeNode = (dataNodeInfo) => {
        return dataNodeInfo.type === Architecture.BFORM ? (
            <SelectNode
                info={dataNodeInfo}
                onViewForm={() => {
                    handleViewForm(dataNodeInfo)
                }}
                className={styles.selectTreeNode}
            />
        ) : (
            <div
                className={classnames(
                    styles.recommendFormItem,
                    styles.recommendFormFatherNode,
                )}
            >
                <div className={styles.recommendFormName}>
                    <Icons type={dataNodeInfo.type} />
                    <div className={styles.recommendFormItemName}>
                        {dataNodeInfo.name}
                    </div>
                </div>
            </div>
        )
    }

    /**
     * handleMouseUp
     * 点击表名字，弹窗显示表格详情
     */

    const handleViewForm = (recommendForm) => {
        return async () => {
            try {
                const { entries } = await getFormsFieldsList(recommendForm.id, {
                    limit: 999,
                    ...versionParams,
                })
                setViewTableFid(recommendForm.id)
                setViewTableData(entries)
                setViewTableFlag(true)
            } catch (ex) {
                formatError(ex)
            }
        }
    }
    return (
        <div className={styles.selectBusinessFormContainer}>
            <div className={styles.selectedSearch}>
                <SearchInput
                    onKeyChange={(kw: string) => {
                        setKeyword(kw)
                    }}
                    placeholder={__('搜索业务表名称')}
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
                            <div className={styles.recommendFormWrapper}>
                                <SelectNode
                                    info={recommendForm}
                                    onViewForm={() => {
                                        handleViewForm(recommendForm)
                                    }}
                                />
                                <div
                                    className={styles.recommendFormPath}
                                    title={recommendForm.path}
                                >
                                    {recommendForm.path
                                        ? recommendForm.path
                                        : __('未分组')}
                                </div>
                            </div>
                        )
                    })}
                </div>
                {keyword ? (
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
                                    <>
                                        <SelectNode
                                            info={recommendForm}
                                            onViewForm={() => {
                                                handleViewForm(recommendForm)
                                            }}
                                        />
                                        <div
                                            className={styles.recommendFormPath}
                                            title={recommendForm.path}
                                        >
                                            {recommendForm.path}
                                        </div>
                                    </>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div className={styles.recommendForm}>
                        <div className={styles.recommendFormTitle}>
                            {__('全部业务表')}
                        </div>
                        <div className={styles.treeSelectNode}>
                            <CustomTree
                                isShowAll={false}
                                titleRender={createTreeNode}
                                getSelectedNode={(sn) =>
                                    setSelectedNode(sn as any)
                                }
                                hiddenNodeTypeList={[
                                    Architecture.BMATTERS,
                                    Architecture.BSYSTEM,
                                ]}
                                initNodeType={[
                                    Architecture.ORGANIZATION,
                                    Architecture.DEPARTMENT,
                                ].join()}
                                ref={ref}
                                isShowForms
                                mid={mid}
                            />
                            <div
                                className={classnames(
                                    styles['extend-node'],
                                    selectedNode?.id === UNGROUPED &&
                                        styles['active-extend-node'],
                                )}
                                onClick={() => {
                                    setSelectedNode({
                                        id: UNGROUPED,
                                    })
                                    ref.current?.setSelectedNode({
                                        id: UNGROUPED,
                                    })
                                }}
                            >
                                {forms && forms?.length ? (
                                    <RightOutlined
                                        className={classnames(
                                            styles.arrow,
                                            isExpand && styles.expandArrow,
                                        )}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setIsExpand(!isExpand)
                                        }}
                                    />
                                ) : null}
                                {__('未分组')}
                            </div>
                            <div className={styles.forms} hidden={!isExpand}>
                                {forms?.map((f) => (
                                    <div className={styles.form}>
                                        <SelectNode
                                            info={{
                                                ...f,
                                                type: Architecture.BFORM,
                                            }}
                                            onViewForm={() => {
                                                handleViewForm({
                                                    ...f,
                                                    type: Architecture.BFORM,
                                                })
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {viewTableFlag && (
                <FieldTableView
                    formId={viewTableFid}
                    onClose={() => {
                        setViewTableFlag(false)
                    }}
                    items={viewTableData}
                    model="view"
                />
            )}
        </div>
    )
}

export default BusinessFormSelect
