/* eslint-disable no-param-reassign */
import React, {
    Key,
    forwardRef,
    ReactNode,
    useEffect,
    useState,
    useImperativeHandle,
    useMemo,
} from 'react'
import { Tree, message, Tooltip } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import { Architecture, DataNode, highLight } from '../ResourcesDir/const'
import { getDomain } from '@/core'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { GlossaryIcons } from './GlossaryIcons'
import DropdownOperate from './DropdownOperate'
import { searchNodesByKey } from '../DataAssetsCatlg/helper'
import { BusinessDomainType } from './const'
import { BusinessActivityOutlined, BusinessObjOutlined } from '@/icons'
import { SearchInput } from '@/ui'

/**
 * @param ref: 提供删除与重命名操作
 * @param defaultTreeExpandedKeys: 默认展开keys
 * @param isShowAll 是否展示全部节点
 * @param hiddenNodeTypeList 要隐藏的节点类型数组
 * @param titleRender 自定义渲染节点
 * @param dragBoxSize Dragbox 当前值
 */
interface ICustomTree {
    ref?: any
    isShowAll?: boolean
    defaultTreeExpandedKeys?: string[]
    defaultTreeSelectedKeys?: string[]
    hiddenNodeTypeList?: Architecture[]
    initNodeType?: Architecture
    initNodeId?: string
    titleRender?: (nodeData: DataNode) => ReactNode
    handleOperate?: (op, data) => void
    getSelectedKeys: (id: string[]) => void
    dragBoxSize?: number[]
}
interface ITreeNode {
    content_id: string
    title: string | ReactNode
    name: string
    children?: ITreeNode[]
    icon?: ReactNode
    object_id?: string
    glossary_id?: string
    type?: string
    expansion_flag?: boolean
    status?: string
    level?: number
}
const CustomTree: React.FC<ICustomTree> = forwardRef((props: any, ref) => {
    const { getSelectedKeys, handleOperate, dragBoxSize } = props
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
    const [searchExpandedKeys, setSearchExpandedKeys] = useState<Key[]>([])
    const [checkedKeys, setCheckedKeys] = useState<Key[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [autoExpandParent, setAutoExpandParent] = useState(true)
    const [dataListArr, setDataListArr] = useState<ITreeNode[]>([])
    const [defaultData, setDefaultData] = useState<ITreeNode[]>([])
    const dataList: ITreeNode[] = []
    const [showTips, setShowTips] = useState<boolean>(false)
    const [inputTooltipTitle, setInputTooltipTitle] = useState<string>()

    useImperativeHandle(ref, () => ({
        expandedKeys,
        getNodeObjects,
        toExpand,
    }))

    // 若展示全部则向外输出初始的选中项为全部
    useEffect(() => {
        getNodeObjects()
    }, [])

    useEffect(() => {
        // 父容器宽度 除去左侧菜单220px
        const prtWid = document.documentElement.clientWidth - 220
        // 拖拽宽度 百分比 [左侧,右侧]
        const [wid] = dragBoxSize
        const widPx = (wid * prtWid) / 100
        if (widPx < 316) {
            setInputTooltipTitle(__('搜索主题域、业务领域、业务对象'))
        } else {
            setInputTooltipTitle('')
        }
    }, [dragBoxSize])

    const getNodeObjects = async (init: boolean = false) => {
        try {
            const res = await getDomain()
            // 树增加图标和操作按钮
            const treeList = generateTreeData(
                res.entries,
                res.entries[0]?.content_id,
            )
            const [firNode] = treeList
            // 展开树形结构，转为数组结构
            generateList(treeList)
            setDataListArr(dataList)
            setDefaultData(treeList)
            setShowTips(treeList.length === 0)
            // setExpandedKeys([...expandedKeys, firNode.content_id])
            if (expandedKeys.length === 0 || init) {
                if (init) setCheckedKeys([firNode.content_id])
                treeOnSelect([firNode.content_id], {
                    node: firNode,
                    selected: true,
                })
            }
        } catch (error) {
            setShowTips(true)
            message.error(error)
        }
    }
    const getTreeNodeName = (data: any) => {
        const TextNode = (
            <div className={styles.treeNodetext}>
                {data.level !== 0 && (
                    <span style={{ marginRight: '5px' }}>
                        <GlossaryIcons
                            showDot={data.level !== 0}
                            type={data.level}
                            status={data.status}
                        />
                    </span>
                )}

                <span
                    title={data.name}
                    dangerouslySetInnerHTML={{
                        __html: highLight(
                            data.name,
                            searchValue,
                            'dirHighLight',
                        ),
                    }}
                />
            </div>
        )
        return (
            <div className={styles.treeNodeBox}>
                {data.level === 3 ? (
                    <div className={styles.nameWrapper}>
                        {TextNode}
                        {data.level === 3 ? (
                            data.object_type ===
                            BusinessDomainType.business_activity ? (
                                <BusinessActivityOutlined
                                    className={styles.typeIcon}
                                />
                            ) : (
                                <BusinessObjOutlined
                                    className={styles.typeIcon}
                                />
                            )
                        ) : null}
                    </div>
                ) : (
                    TextNode
                )}

                <div className={styles.treeOperate}>
                    <DropdownOperate
                        currentData={data}
                        handleOperate={handleOperate}
                    />
                </div>
            </div>
        )
    }

    // 树增加操作按钮、图标、glossary_id
    const generateTreeData = (data: ITreeNode[], glossary_id: string) => {
        data.forEach((item) => {
            item.title = getTreeNodeName(item)
            item.glossary_id = glossary_id
            if (item.children) {
                generateTreeData(item.children, glossary_id)
            }
        })
        return data
    }
    const generateList = (data: any[]) => {
        data.forEach((item) => {
            dataList.push({
                content_id: item.content_id,
                name: item.name,
                title: item.title,
            })
            if (item.children) {
                generateList(item.children)
            }
        })
    }

    const getParentKey = (key: Key, tree: ITreeNode[]): Key => {
        let parentKey: Key
        tree.forEach((item) => {
            if (item.children) {
                if (item.children.some((it) => it.content_id === key)) {
                    parentKey = item.content_id
                } else if (getParentKey(key, item.children)) {
                    parentKey = getParentKey(key, item.children)
                }
            }
        })
        return parentKey!
    }

    const treeOnSelect = (selectedKeys, info) => {
        setCheckedKeys(selectedKeys)
        if (selectedKeys.length > 0) {
            getSelectedKeys(info?.node)
        }
        if (info.selected) {
            setExpandedKeys([...expandedKeys, ...selectedKeys])
        } else {
            const key = info?.node?.content_id
            setExpandedKeys(expandedKeys.filter((item) => item !== key))
        }
    }
    const onExpand = (newExpandedKeys: Key[]) => {
        if (searchValue) {
            setSearchExpandedKeys(newExpandedKeys)
        } else {
            setExpandedKeys(newExpandedKeys)
        }
        setAutoExpandParent(false)
    }
    const toExpand = async (key: string) => {
        await setExpandedKeys([...expandedKeys, key])
    }
    const onChange = (_value: string) => {
        const value = _value?.toLowerCase()
        setSearchValue(_value)
        const newExpandedKeys = dataListArr
            .map((item) => {
                if (item?.name?.toLowerCase().indexOf(value) > -1) {
                    return getParentKey(item.content_id, defaultData)
                }
                return null
            })
            .filter((item, i, self) => item && self.indexOf(item) === i)
        if (value) {
            setSearchExpandedKeys(newExpandedKeys as Key[])
            setAutoExpandParent(true)
        } else {
            setSearchExpandedKeys([...expandedKeys, defaultData[0]?.content_id])
        }
        setShowTips(newExpandedKeys.length === 0)
    }

    // 空库表
    const showDataEmpty = () => {
        const desc = searchValue ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : (
            <span>{__('暂无数据')}</span>
        )
        const icon = searchValue ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    // 搜索高亮
    const treeData = useMemo(() => {
        const loop = (data: any[]): any[] =>
            data.map((item) => {
                const title = getTreeNodeName(item)
                if (item.children) {
                    return {
                        ...item,
                        title,
                        children: loop(item.children),
                    }
                }

                return {
                    ...item,
                    title,
                }
            })
        const list = loop(defaultData)
        return searchNodesByKey(searchValue, 'name', list)
    }, [searchValue, defaultData])

    return (
        <div className={classnames(styles.treeWrapper, styles.treeBox)}>
            <Tooltip title={inputTooltipTitle}>
                <SearchInput
                    placeholder={__('搜索主题域、业务领域、业务对象')}
                    onKeyChange={onChange}
                    className={styles.searchInput}
                />
            </Tooltip>
            {showTips ? (
                showDataEmpty()
            ) : (
                <Tree
                    onSelect={treeOnSelect}
                    selectedKeys={checkedKeys}
                    showIcon
                    switcherIcon={
                        <DownOutlined
                            style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                        />
                    }
                    fieldNames={{
                        title: 'title',
                        key: 'content_id',
                        children: 'children',
                    }}
                    onExpand={onExpand}
                    expandedKeys={
                        searchValue ? searchExpandedKeys : expandedKeys
                    }
                    autoExpandParent={autoExpandParent}
                    blockNode
                    treeData={treeData}
                />
            )}
        </div>
    )
})
export default CustomTree
