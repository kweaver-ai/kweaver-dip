import React, { forwardRef, useRef, Key, useState, useEffect } from 'react'
import { trim } from 'lodash'
import { IDirItem, IDirQueryType, CatalogType } from '@/core'
import { MoreOperate } from './const'
import DirTree from './DirTree'
import { SearchInput } from '@/ui'
import styles from './styles.module.less'

/**
 * @params  dirType 目录类型
 * @params  optMenuItems 悬浮目录项显示...点击更多的菜单，不传/传空数组则不显示操作图标
 */
interface IDirectoryProps {
    ref?: any
    dirType: CatalogType
    treeData: IDirItem[] | undefined
    setTreeData: (data: IDirItem[]) => void
    getTreeList: (query?: IDirQueryType) => void
    selectedDir: IDirItem | undefined
    setSelectedDir: (item: IDirItem) => void
    optMenuItems?: Array<MoreOperate>
}

const Directory: React.FC<IDirectoryProps> = forwardRef((props: any, ref) => {
    const {
        dirType,
        treeData,
        setTreeData,
        getTreeList,
        selectedDir,
        setSelectedDir,
        optMenuItems,
    } = props

    // 搜索展示结果包含所有节点
    // const [showAll, setShowAll] = useState<boolean>(false)

    // 搜索值
    const [searchKey, setSearchKey] = useState('')

    // 目录搜索条件
    const [searchCondition, setSearachCondition] = useState<any>()

    const treeRef = useRef({
        addNewDir: (addedDir: IDirItem) => {},
    })

    useEffect(() => {
        getTreeList(searchCondition)
    }, [searchCondition])

    // debounce搜索目录
    // const handleSearch = (e: any) => {
    //     const { value } = e.target
    //     setSearchKey(value)
    //     getTreeList({ type: dirType, catalog_name: value })
    // }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
        setSearachCondition({ type: dirType, catalog_name: keyword })
    }

    // 目录标题右侧的添加——添加二级目录
    const handleDirAdd = () => {
        treeRef?.current?.addNewDir(treeData[0])
    }

    return (
        <div className="directoryBox">
            <SearchInput
                placeholder="搜索目录"
                onKeyChange={(kw: string) => handleSearchPressEnter(kw)}
                onPressEnter={handleSearchPressEnter}
                className="searchDirInput"
                maxLength={64}
            />
            {/* 目录收起与展开可以操作 sider-trigger 元素 */}
            <div className="directory">
                {/* <div className="dirTitle">
                    <span>目录</span>
                    {optMenuItems && optMenuItems.includes(MoreOperate.ADD) && (
                        <Tooltip title="添加目录">
                            <AddOutlined
                                hidden={!treeData || treeData.length === 0}
                                className="addIcon"
                                onClick={() => handleDirAdd()}
                            />
                        </Tooltip>
                    )}
                </div> */}

                <div className="dirList">
                    <DirTree
                        ref={treeRef}
                        dirType={dirType}
                        checkable={false}
                        treeData={treeData}
                        draggable
                        searchKey={searchKey}
                        optMenuItems={optMenuItems}
                        setTreeData={setTreeData}
                        getTreeList={getTreeList}
                        selectedDir={selectedDir}
                        setSelectedDir={setSelectedDir}
                    />
                </div>
            </div>
        </div>
    )
})
export default Directory
