import { AutoComplete, Collapse, Tooltip } from 'antd'
import { ReactNode, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from 'ahooks'
import {
    ISubjectDomainItem,
    formatError,
    getSubjectDomain,
    searchLogicViewfromPanorama,
    validateViewIds,
} from '@/core'
import { SearchInput } from '@/ui'
import {
    AssetIcons,
    AssetNodes,
    FilterType,
    IDataViewItem,
    LevelType,
    hightLightMatch,
} from '../../helper'
import __ from '../../locale'
import styles from './styles.module.less'
import { usePanoramaContext } from '../../PanoramaProvider'

/** 历史记录Key */
const DataViewHistoryKey = 'h_dataview_list'
/** 历史记录最大记录条数 */
const MAX_HISTORY_COUNT = 10

/** 获取历史记录 */
const getHistoryList = () => {
    return JSON.parse(localStorage.getItem(DataViewHistoryKey) || '[]')
}

const InitParams = { limit: 2000, parent_id: '', is_all: true }

/**
 * 新增历史记录
 * @param item 新增项
 * @param key 默认id
 * @returns 返回最新历史记录
 */
const addHistoryItem = (item: IDataViewItem, key = 'id') => {
    const list = getHistoryList()
    const index = list.findIndex((o) => o[key] === item[key])
    let newRecords
    if (index < 0) {
        // 记录中不存在
        newRecords = [item, ...list].filter((o, idx) => idx < MAX_HISTORY_COUNT)
    } else {
        // 记录中存在
        newRecords = [item, ...list.filter((o) => o[key] !== item[key])]
    }
    localStorage.setItem(DataViewHistoryKey, JSON.stringify(newRecords))
    return newRecords
}

const setHistory = (records: IDataViewItem) => {
    localStorage.setItem(DataViewHistoryKey, JSON.stringify(records))
}

const SearchItem = ({
    data,
    onClick,
    lightKey,
}: {
    data: IDataViewItem
    onClick: (item: IDataViewItem) => void
    lightKey?: string
}) => {
    const handleSelect = (e) => {
        e?.stopPropagation()
        onClick?.(data)
    }
    return (
        <div onClick={handleSelect} className={styles['search-item']}>
            <span className={styles['search-item-icon']} title="">
                {AssetIcons[AssetNodes.DATAVIEW]}
            </span>
            <div
                className={styles['search-item-info']}
                title={data.business_name}
            >
                <div
                    className={styles.title}
                    title={data.business_name}
                    dangerouslySetInnerHTML={{
                        __html: hightLightMatch(data.business_name, lightKey),
                    }}
                />
                <div className={styles.path} title={data.subject_path || '无'}>
                    {data.subject_path || '--'}
                </div>
            </div>
        </div>
    )
}

type IAssetSearch = {
    onSelect?: (item: IDataViewItem) => void
}

function AssetSearch({ onSelect }: IAssetSearch) {
    const [selectItem, setSelectItem] = useState<IDataViewItem>()
    const [historyList, setHistoryList] = useState<IDataViewItem[]>([])
    const [results, setResults] = useState<ISubjectDomainItem[]>([])
    const [searchKey, setSearchKey] = useState<string>('')
    const debounceValue = useDebounce(searchKey, { wait: 500 })
    const isSearchRef = useRef<any>(false)
    const selectRef = useRef<any>(false)
    const { Panel } = Collapse
    const {
        currentNode,
        setCurrentNode,
        setActiveId,
        activeId,
        selectedCount,
        setSelectedCount,
        searchSelectedNodeId,
        setSearchSelectedNodeId,
    } = usePanoramaContext()

    const [open, setOpen] = useState<boolean>(false)

    const validateRecords = async (records: IDataViewItem[]) => {
        try {
            const ids = records?.map((o) => o.id)
            const res = await validateViewIds(ids)
            if (res?.ids) {
                const usageList = records.filter((o) => res.ids.includes(o.id))
                setHistoryList(usageList)
                if (records?.length !== usageList?.length) {
                    setHistory(usageList as any)
                }
            }
        } catch (error) {
            formatError(error)
        }
    }

    /** 更新历史记录 */
    useEffect(() => {
        if (selectItem) {
            const records = addHistoryItem(selectItem)
            validateRecords(records)
        }
    }, [selectItem])

    useEffect(() => {
        const records = getHistoryList()
        validateRecords(records)
    }, [])

    useEffect(() => {
        if (debounceValue) {
            getDomainData({ ...InitParams, keyword: debounceValue })
            setOpen(true)
        } else {
            setOpen(false)
        }
    }, [debounceValue])

    const getDomainData = async (params) => {
        try {
            const responseData = await getSubjectDomain(params)
            const res = responseData?.entries
            setResults(res)
        } catch (err) {
            formatError(err)
        }
    }

    // const getSearchResult = async (key: string) => {
    //     const list = await searchLogicViewfromPanorama({
    //         keyword: key,
    //         limit: 20,
    //         offset: 1,
    //     } as any)
    //     setResults(list.entries || [])
    // }

    // useEffect(() => {
    //     if (searchKey) {
    //         getSearchResult(searchKey)
    //     }
    // }, [searchKey])

    // const onChooseItem = (item: IDataViewItem) => {
    //     setSelectItem(item)
    //     if (onSelect) {
    //         onSelect(item)
    //         selectRef.current?.blur()
    //         setSearchKey('')
    //     }
    // }

    // const searchOptions = useMemo(
    //     () =>
    //         results?.map((o) => ({
    //             label: (
    //                 <SearchItem
    //                     data={o}
    //                     onClick={onChooseItem}
    //                     lightKey={searchKey}
    //                 />
    //             ),
    //             value: o.id,
    //         })),
    //     [results],
    // )

    // const historyOptions = useMemo(
    //     () =>
    //         historyList?.map((o) => ({
    //             label: <SearchItem data={o} onClick={onChooseItem} />,
    //             value: o.id,
    //         })),
    //     [historyList],
    // )

    const dropdownRender = (origin: ReactNode) => {
        return (
            <div className={styles['pop-container']}>
                {results?.length ? (
                    <Collapse defaultActiveKey={FilterType} ghost>
                        {FilterType?.map((level: string) => {
                            const list = results?.filter(
                                (o) => o?.type === level,
                            )
                            return list?.length ? (
                                <Panel
                                    header={LevelType[level]}
                                    key={level}
                                    className={styles['search-wrapper-list']}
                                >
                                    {list?.map((o) => (
                                        <div
                                            key={o?.id}
                                            onClick={(e) => {
                                                const pathIds =
                                                    o.path_id.split('/')
                                                if (pathIds) {
                                                    setActiveId(pathIds[0])
                                                }
                                                setSearchSelectedNodeId(o.id)
                                                setSearchKey('')
                                            }}
                                        >
                                            <div
                                                className={
                                                    styles['search-item']
                                                }
                                            >
                                                <div
                                                    className={styles.nameInfo}
                                                >
                                                    <div
                                                        className={
                                                            styles[
                                                                'search-item-icon'
                                                            ]
                                                        }
                                                    >
                                                        {AssetIcons[level]}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles[
                                                                'search-item-right'
                                                            ]
                                                        }
                                                    >
                                                        <div
                                                            className={
                                                                styles[
                                                                    'search-item-content'
                                                                ]
                                                            }
                                                        >
                                                            <div
                                                                className={
                                                                    styles[
                                                                        'search-item-content-name'
                                                                    ]
                                                                }
                                                                title={o.name}
                                                            >
                                                                {o.name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles['path-item']
                                                    }
                                                    title={o.path_name}
                                                >
                                                    {__('路径：${path}', {
                                                        path: o.path_name,
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </Panel>
                            ) : null
                        })}
                    </Collapse>
                ) : (
                    __('未搜索到内容')
                )}
            </div>
        )
    }

    const handleCompositionStart = () => {
        isSearchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        isSearchRef.current = false
    }

    return (
        <div className={styles['asset-search']}>
            <Tooltip
                title={
                    !searchKey ? __('搜索主题域、业务对象/活动、逻辑实体') : ''
                }
            >
                <AutoComplete
                    dropdownRender={dropdownRender}
                    style={{ width: '100%' }}
                    ref={selectRef}
                    maxLength={255}
                    value={searchKey}
                    popupClassName={styles['search-select']}
                    notFoundContent={
                        searchKey && (
                            <div className={styles['search-empty']}>
                                未搜索到内容
                            </div>
                        )
                    }
                    // open={open}
                    open
                    onDropdownVisibleChange={(expand) => {
                        if (searchKey) {
                            setOpen(expand)
                        } else {
                            setOpen(false)
                        }
                    }}
                >
                    <SearchInput
                        placeholder={__('搜索主题域、业务对象/活动、逻辑实体')}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                        onKeyChange={(key) => {
                            if (!isSearchRef.current) {
                                setSearchKey(key)
                            }
                        }}
                        onPressEnter={(e) => e.stopPropagation()}
                    />
                </AutoComplete>
            </Tooltip>
        </div>
    )
}

export default memo(AssetSearch)
