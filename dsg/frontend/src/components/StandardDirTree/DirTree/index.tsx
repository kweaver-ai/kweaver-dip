import { DownOutlined } from '@ant-design/icons'
import { useSafeState, useUpdateEffect } from 'ahooks'
import { Tooltip, Tree } from 'antd'
import classnames from 'classnames'
import { Key, memo, useEffect, useMemo, useState } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { Loader, SearchInput, Empty } from '@/ui'
import AddDirOutlined from '@/icons/AddDirOutlined'
import type { DirTreeProps } from './index.d'
import __ from './locale'
import styles from './styles.module.less'
import { useDirTreeContext } from '../DirTreeProvider'
import { MoreOperate } from '../const'

import { CatalogOption, CatalogType } from '@/core'

/** 默认无数据空库表 */
const DefaultEmpty = <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />

/** 默认搜索空库表 */
const DefaultSearchEmpty = (
    <div className={styles.dirtreeEmpty}>
        <Empty desc={__('抱歉，没有找到相关内容')} iconSrc={searchEmpty} />
    </div>
)

function DirTree({ conf, ...rest }: DirTreeProps) {
    const {
        showSearch = true,
        dirType,
        catlgClassOption,
        showTopTitle = true,
        canCheckTopTitle = true,
        isCheckTop = false,
        isSearchLoading = false,
        isTreeLoading = false,
        placeholder,
        inputRender,
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
        allCatlgCount,
    } = conf ?? {}
    const { nodeOpt, optNode } = useDirTreeContext()
    const { selCatlgClass, optMenuItems } = nodeOpt ?? {}

    const [isCheckAll, setIsCheckAll] = useState<boolean>(canCheckTopTitle)
    const [isSearch, setIsSearch] = useSafeState<boolean>(false)
    const [searchKey, setSearchKey] = useSafeState<string>('')
    const [selectedKeys, setSelectedKeys] = useSafeState<Key[]>()
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
    const isEmpty = useMemo(() => !rest?.treeData?.length, [rest?.treeData])

    useEffect(() => {
        setIsCheckAll(isCheckTop)
    }, [isCheckTop])

    useEffect(() => {
        setSearchKey('')
    }, [catlgClassOption])

    useUpdateEffect(() => {
        setIsSearch(!!searchKey)
        onSearchChange?.(searchKey)
    }, [searchKey])

    useUpdateEffect(() => {
        if (isCheckTop) {
            handleTop()
        }
    }, [isCheckTop])

    const handleTop = () => {
        if (canCheckTopTitle) {
            setSelectedKeys([])
        }
        setIsCheckAll(true)
        onTopTitleClick?.()
    }

    // 复写onSelect
    const handleTreeSelect = (sks: Key[], info: any) => {
        if (!sks?.length) return
        setSelectedKeys(sks)
        setIsCheckAll(false)
        rest?.onSelect?.(sks, info)
    }

    const onExpand = (eks: Key[], info: any) => {
        setExpandedKeys(eks)
    }

    return (
        <div className={styles.dirtree}>
            {showSearch && (
                <div className={styles.dirtreeSearch}>
                    {inputRender ?? (
                        <div className={styles.dirtreeSearchLine}>
                            <SearchInput
                                placeholder={placeholder || __('请输入')}
                                value={searchKey}
                                onKeyChange={setSearchKey}
                            />
                            {/* 数据元/码表/编码规则自定义目录 及 文件模块有添加操作 */}
                            {(dirType === CatalogType.FILE ||
                                selCatlgClass === CatalogOption.AUTOCATLG) &&
                                optMenuItems?.includes(MoreOperate.ADD) &&
                                onAdd && (
                                    <Tooltip
                                        title={addTips || __('新建目录')}
                                        placement="bottom"
                                    >
                                        <div
                                            className={styles.dirtreeAdd}
                                            onClick={onAdd}
                                        >
                                            <AddDirOutlined />
                                        </div>
                                    </Tooltip>
                                )}
                        </div>
                    )}
                </div>
            )}

            <div
                className={classnames(styles.dirtreeContent, 'dirtreeContent')}
            >
                {searchRender && isSearch ? (
                    isSearchLoading ? (
                        <div className={styles.dirtreeLoading}>
                            <Loader />
                        </div>
                    ) : isSearchEmpty ? (
                        emptySearchRender ?? DefaultSearchEmpty
                    ) : (
                        <div className={styles.dirtreeContentSearch}>
                            {searchRender}
                        </div>
                    )
                ) : (
                    <div className={styles.dirtreeContentData}>
                        {!isTreeLoading && showTopTitle && (
                            <div
                                className={classnames(
                                    styles.dirtreeContentDataTop,
                                    isCheckAll && styles.checked,
                                )}
                                onClick={handleTop}
                            >
                                {topTitle ?? <div>{__('全部目录')}</div>}
                            </div>
                        )}
                        {isTreeLoading ? (
                            <div className={styles.dirtreeLoading}>
                                <Loader />
                            </div>
                        ) : isEmpty && !showTopTitle ? (
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
                )}
            </div>
        </div>
    )
}

export default memo(DirTree)
