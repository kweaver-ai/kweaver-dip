import { DownOutlined } from '@ant-design/icons'
import { useDebounce, useSafeState, useSize, useUpdateEffect } from 'ahooks'
import { Dropdown, Tooltip, Tree } from 'antd'
import classnames from 'classnames'
import { Key, memo, useEffect, useMemo, useRef, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import Loader from '../Loader'
import Empty from '../Empty'
import AddDirOutlined from '@/icons/AddDirOutlined'
import SearchInput from '../SearchInput'
import type { DirTreeProps } from './index.d'
import __ from './locale'
import styles from './styles.module.less'
import { EllipsisOutlined } from '@/icons'
/** 默认无数据空库表 */
const DefaultEmpty = <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />

/** 默认搜索空库表 */
const DefaultSearchEmpty = (
    <div style={{ paddingTop: '8px' }}>
        <Empty
            desc={__('抱歉，没有找到相关内容')}
            iconSrc={searchEmpty}
            iconHeight={104}
        />
    </div>
)

function DirTree({ conf, ...rest }: DirTreeProps) {
    const {
        showSearch = true,
        showTopTitle = true,
        canCheckTopTitle = true,
        isCheckTop = false,
        isSearchLoading = false,
        isTreeLoading = false,
        canTreeEmpty = true,
        canCancel = false,
        placeholder,
        aboveSearchRender,
        inputRender,
        searchKeyword = '',
        isSearchEmpty,
        topTitle,
        addTips,
        emptyRender,
        emptySearchRender,
        searchRender,
        onTopTitleClick,
        onSearchChange,
        placeholderWith = 0,
        onAdd,
        onMore,
        moreItems,
        expandKeys,
        treeWrapperClassName,
    } = conf ?? {}
    const [isCheckAll, setIsCheckAll] = useState<boolean>(canCheckTopTitle)

    const [isSearch, setIsSearch] = useSafeState<boolean>(false)
    const [isShowInputTip, setIsShowInputTip] = useSafeState<boolean>(false)
    const [isHovering, setIsHovering] = useSafeState<boolean>(false)
    const inputRef = useRef<any>()
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [selectedKeys, setSelectedKeys] = useSafeState<Key[]>()
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
    const isEmpty = useMemo(
        () => canTreeEmpty && !rest?.treeData?.length,
        [rest?.treeData, canTreeEmpty],
    )

    const searchRef = useRef<HTMLDivElement | null>(null)
    const searchSize = useSize(searchRef)

    const sizeChanged = useDebounce(searchSize, {
        wait: 500,
    })

    useUpdateEffect(() => {
        setSearchKey(searchKeyword || '')
    }, [searchKeyword])

    useEffect(() => {
        setIsCheckAll(isCheckTop)
    }, [isCheckTop])

    useUpdateEffect(() => {
        setIsSearch(!!searchKey)
        onSearchChange?.(searchKey)
    }, [searchKey])

    useUpdateEffect(() => {
        if (isCheckTop) {
            handleTop()
        }
    }, [isCheckTop])

    useUpdateEffect(() => {
        if (expandKeys?.length) {
            onExpand(expandKeys)
        }
    }, [expandKeys])

    const handleTop = () => {
        if (canCheckTopTitle) {
            setSelectedKeys([])
        }
        setIsCheckAll(true)
        onTopTitleClick?.()
    }

    useEffect(() => {
        if (rest?.selectedKeys?.length) {
            // 外界手动修改选择有效节点key
            setIsCheckAll(!rest?.selectedKeys?.find((key) => !!key))
        }
    }, [rest?.selectedKeys])

    // 复写onSelect
    const handleTreeSelect = (sks: Key[], info: any) => {
        // 跳过取消选择
        if (!sks?.length && !canCancel) return
        setSelectedKeys(sks)
        setIsCheckAll(false)
        rest?.onSelect?.(sks, info)
    }

    const onExpand = (eks: Key[]) => {
        setExpandedKeys(eks)
    }

    // useEffect(() => {
    //     if (inputRef.current && placeholderWith) {
    //         const isShow: any =
    //             inputRef.current.input.clientWidth < placeholderWith
    //         if (isHovering && !searchKey?.length) {
    //             setIsShowInputTip(isShow)
    //         } else {
    //             setIsShowInputTip(false)
    //         }
    //     }
    // }, [inputRef.current, placeholderWith, isHovering, searchKey])

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

    return (
        <div
            className={classnames(styles.dirtree, treeWrapperClassName)}
            style={rest?.style}
        >
            {showSearch && (
                <div className={styles['dirtree-search']}>
                    {aboveSearchRender}
                    {inputRender ?? (
                        <div
                            className={styles['dirtree-search-line']}
                            ref={searchRef}
                        >
                            <Tooltip
                                placement="top"
                                title={isShowInputTip ? placeholder : ''}
                                overlayInnerStyle={{
                                    width: 'fit-content',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                <SearchInput
                                    ref={inputRef}
                                    placeholder={placeholder || __('请输入')}
                                    onKeyChange={setSearchKey}
                                    onMouseEnter={() => setIsHovering(true)}
                                    onMouseLeave={() => setIsHovering(false)}
                                    allowClear={!!searchKey}
                                />
                            </Tooltip>
                            {onAdd && (
                                <Tooltip
                                    title={addTips || __('新建目录')}
                                    placement="top"
                                >
                                    <div
                                        className={styles['dirtree-add']}
                                        onClick={onAdd}
                                    >
                                        <AddDirOutlined />
                                    </div>
                                </Tooltip>
                            )}
                            {onMore && (
                                <Tooltip title={__('更多')} placement="top">
                                    <Dropdown
                                        menu={{
                                            items: moreItems,
                                            onClick: onMore,
                                        }}
                                        placement="bottomRight"
                                        trigger={['click']}
                                    >
                                        <div className={styles['dirtree-add']}>
                                            <EllipsisOutlined />
                                        </div>
                                    </Dropdown>
                                </Tooltip>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className={styles['dirtree-content']}>
                {searchRender && isSearch ? (
                    isSearchLoading ? (
                        <div className={styles['dirtree-loading']}>
                            <Loader tip={__('查询中...')} />
                        </div>
                    ) : isSearchEmpty ? (
                        emptySearchRender ?? DefaultSearchEmpty
                    ) : (
                        <div className={styles['dirtree-content-search']}>
                            {searchRender}
                        </div>
                    )
                ) : (
                    <div className={styles['dirtree-content-data']}>
                        {!isTreeLoading && showTopTitle && (
                            <div
                                className={classnames(
                                    styles['dirtree-content-data-top'],
                                    isCheckAll ? styles.checked : '',
                                    'dirtree-content-data-top',
                                )}
                                onClick={handleTop}
                            >
                                {topTitle ?? <div>{__('全部')}</div>}
                            </div>
                        )}
                        <div className={styles['dirtree-content-data-tree']}>
                            {isTreeLoading ? (
                                <div className={styles['dirtree-loading']}>
                                    <Loader />
                                </div>
                            ) : isEmpty ? (
                                emptyRender ?? DefaultEmpty
                            ) : (
                                <Tree
                                    blockNode
                                    showIcon
                                    switcherIcon={<DownOutlined />}
                                    selectedKeys={selectedKeys}
                                    expandedKeys={expandedKeys}
                                    onExpand={onExpand}
                                    {...rest}
                                    onSelect={handleTreeSelect}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default memo(DirTree)
