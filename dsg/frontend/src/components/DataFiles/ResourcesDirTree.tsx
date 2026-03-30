import { RightOutlined } from '@ant-design/icons'
import { Tabs } from 'antd'
import classnames from 'classnames'
import { cloneDeep, isNumber, trim } from 'lodash'
import React, {
    forwardRef,
    ReactNode,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    formatError,
    getObjects,
    getObjectsByKeyword,
    getRescTree,
    IGetObject,
} from '@/core'
import { IRescTreeQuery } from '@/core/apis/dataCatalog/index.d'
import { useQuery } from '@/utils'
import Empty from '@/ui/Empty'
import {
    allNodeInfo,
    Architecture,
    CatlgTreeNode,
    FilterTreeNode,
    hiddenNodeType,
    highLight,
    managementNode,
    oprTreeData,
    RescCatlgType,
} from './const'
import { CatlgOperateType, rescCatlgItems } from './helper'
import Icons from './Icons'
import __ from './locale'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'

const updateTreeData = (
    list: CatlgTreeNode[],
    id: string,
    children: CatlgTreeNode[],
    isExpandAll?: boolean,
): Array<CatlgTreeNode> =>
    list?.map((node) => {
        const resNode = { ...node }
        if (children && isExpandAll) resNode.isExpand = true
        if (node.id === id) {
            return {
                ...resNode,
                isExpand: true,
                children,
            }
        }
        if (node.children) {
            return {
                ...resNode,
                children: updateTreeData(
                    node.children,
                    id,
                    children,
                    isExpandAll,
                ),
            }
        }
        return { ...resNode }
    })

const getTreeNode = (tree: CatlgTreeNode[], func): CatlgTreeNode | null => {
    // eslint-disable-next-line
    for (const node of tree) {
        if (func(node)) return node
        if (node.children) {
            const res = getTreeNode(node.children, func)
            if (res) return res
        }
    }
    return null
}

/**
 * ref: 提供删除与重命名操作
 * isShowAll 是否展示全部节点
 * hiddenNodeTypeList 要隐藏的节点类型数组
 * titleRender 自定义渲染节点
 * getSelectedNode 向组件外提供获取选中的树节点
 * getCurTabKey 提供树结构当前tabKey
 */
interface IResourcesDirTree {
    ref?: any
    isShowAll?: boolean
    hiddenNodeTypeList?: Architecture[]
    initNodeType?: string
    initNodeId?: string
    titleRender?: (nodeData: CatlgTreeNode) => ReactNode
    getSelectedNode: (sn: CatlgTreeNode) => void
    getCurTabKey: (activeKey: string) => void
}
const ResourcesDirTree: React.FC<IResourcesDirTree> = forwardRef(
    (props: any, ref) => {
        const {
            getCurTabKey,
            getSelectedNode,
            titleRender,
            isShowAll = true,
            hiddenNodeTypeList = hiddenNodeType,
            initNodeType = Architecture.DOMAIN,
            initNodeId,
        } = props
        const query = useQuery()

        const getDefaultTabKey = () => {
            const defaultTabKey = query.get('activeTabKey')

            switch (defaultTabKey) {
                case RescCatlgType.RESC_CLASSIFY:
                    return RescCatlgType.RESC_CLASSIFY
                case RescCatlgType.ORGSTRUC:
                default:
                    return RescCatlgType.ORGSTRUC
            }
        }

        const [activeKey, setActiveKey] = useState<string>(getDefaultTabKey())

        // 搜索词查询
        const [searchKey, setSearchKey] = useState<string>('')
        // 是否回车搜索
        const [isSearchEnter, setIsSearchEnter] = useState(false)
        const [treeData, setTreeData] = useState<CatlgTreeNode[]>([])
        // 鼠标移入项的id 用来展示的操作区
        const [operateId, setOperateId] = useState('')
        // 鼠标点击选中项的id，用来设置选中背景
        const [selectedId, setSelectedId] = useState('all')
        // 操作行的节点信息 创建时为创建节点的父级 重命名时为重命名的节点
        const [treeFilter, setTreeFilter] = useState<FilterTreeNode>(
            FilterTreeNode.ALL,
        )
        // 第一层节点的缩进层级 （相当于0）
        const [firstLevel, setFirstLevel] = useState(1)

        // 若展示全部则向外输出初始的选中项为全部
        useEffect(() => {
            if (isShowAll) {
                getSelectedNode({
                    ...allNodeInfo,
                })
            }
        }, [])

        useImperativeHandle(ref, () => ({
            treeData,
        }))

        // 组织架构接口字段名称为id，资源分类接口字段名称为node_id
        const getNodeObjects = async (
            params: IGetObject | IRescTreeQuery,
            oprType = CatlgOperateType.OTHER,
            // isFirst = false,
        ) => {
            try {
                let res
                // 组织架构
                if (activeKey === RescCatlgType.ORGSTRUC) {
                    if (params.keyword) {
                        res = {
                            entries: await getObjectsByKeyword(
                                params as IGetObject,
                            ),
                        }
                    } else {
                        res = await getObjects(params as IGetObject)
                    }
                } else if (activeKey === RescCatlgType.RESC_CLASSIFY) {
                    // 资源分类
                    res = await getRescTree(params)
                }

                if (oprType === CatlgOperateType.CLKTOEXPAND) {
                    // 点击节点展开
                    const nodeId =
                        activeKey === RescCatlgType.ORGSTRUC ? 'id' : 'node_id'
                    setTreeData((origin) =>
                        updateTreeData(
                            origin,
                            (params as CatlgTreeNode)[nodeId],
                            res.entries,
                            !!isSearchEnter,
                        ),
                    )
                } else if (oprType === CatlgOperateType.SEARCH) {
                    // 回车搜索

                    const treeDataTemp = oprTreeData(
                        '',
                        res.entries,
                        {},
                        { isExpand: false },
                        { isExpand: !!params.keyword },
                    )

                    setTreeData(treeDataTemp)

                    // 不展示全部时，默认选中项为第一个节点
                    if (!isShowAll) {
                        getSelectedNode(res.entries?.[0])
                        setSelectedId(res.entries?.[0]?.id)
                    } else if (searchKey) {
                        // 搜索时，默认选中全部节点
                        setSelectedId('all')
                        getSelectedNode({
                            ...allNodeInfo,
                        })
                    }
                } else if (oprType === CatlgOperateType.OTHER) {
                    setTreeData(res.entries)

                    // 不展示全部时，默认选中项为第一个节点
                    if (!isShowAll) {
                        getSelectedNode(res.entries?.[0])
                        setSelectedId(res.entries?.[0]?.id)
                    } else if (searchKey) {
                        // 搜索时，默认选中全部节点
                        setSelectedId('all')
                        getSelectedNode({
                            ...allNodeInfo,
                        })
                    }
                }
            } catch (error) {
                formatError(error)
            }
        }

        useEffect(() => {
            setSearchKey('')
            setTreeData([])
            getCurTabKey(activeKey)

            if (activeKey === RescCatlgType.ORGSTRUC) {
                getNodeObjects({
                    limit: 0,
                    id: '',
                    is_all: true,
                    type: initNodeType,
                })
            } else if (activeKey === RescCatlgType.RESC_CLASSIFY) {
                getNodeObjects({ recursive: false })
            }
        }, [activeKey])

        const onLoadData = ({ id, children }: CatlgTreeNode) => {
            if (children) return
            if (activeKey === RescCatlgType.ORGSTRUC) {
                getNodeObjects(
                    {
                        id,
                        is_all: false,
                        limit: 0,
                        type: managementNode.join(),
                    },
                    CatlgOperateType.CLKTOEXPAND,
                )
            } else if (activeKey === RescCatlgType.RESC_CLASSIFY) {
                getNodeObjects(
                    { node_id: id, recursive: false },
                    CatlgOperateType.CLKTOEXPAND,
                )
            }
        }

        const renderTreeNode = (
            td: CatlgTreeNode,
            level: number,
            parentNode?: CatlgTreeNode,
        ) => {
            return (
                <div
                    className={classnames(
                        styles.treeNode,
                        td.id === selectedId && styles.selectedTreeNode,
                        [Architecture.BFORM].includes(
                            td.type as Architecture,
                        ) && styles.disableTreeNode,
                    )}
                    onMouseEnter={() => setOperateId(td.id)}
                    onMouseLeave={() => setOperateId('')}
                    style={{
                        paddingLeft: 18 * level,
                    }}
                    onClick={() => {
                        if (
                            [Architecture.BFORM].includes(
                                td.type as Architecture,
                            )
                        )
                            return
                        if (selectedId !== td.id) {
                            setSelectedId(td.id)
                            getSelectedNode(td)
                        }
                        const temp = cloneDeep(treeData)
                        // 点击展开
                        const curNode = getTreeNode(
                            temp,
                            (node: CatlgTreeNode) => node.id === td.id,
                        )
                        if (!curNode) return
                        curNode.isExpand = !curNode.isExpand
                        setTreeData(temp)

                        // 如果没有搜索, 点击展开第一次调接口-同业务架构(/systemConfig/businessArchitecture)页面
                        if (!isNumber(curNode.children?.length)) {
                            onLoadData(td)
                        }
                    }}
                    hidden={
                        hiddenNodeTypeList.includes(td.type as Architecture)
                        // 屏蔽管理节点
                        // treeFilter === FilterTreeNode.MNode &&
                        // !managementNode.includes(td.type as Architecture)
                    }
                    title={td.name}
                >
                    <RightOutlined
                        // 表单 || 显示管理节点时部门以下不展示===部门不展示箭头
                        style={{
                            visibility:
                                Architecture.BFORM === td.type ||
                                (Architecture.DEPARTMENT === td.type &&
                                    treeFilter === FilterTreeNode.MNode)
                                    ? 'hidden'
                                    : 'visible',
                        }}
                        className={classnames(
                            styles.arrow,
                            td.isExpand && styles.expandArrow,
                        )}
                    />

                    {titleRender ? (
                        titleRender(td)
                    ) : (
                        <>
                            {activeKey === RescCatlgType.ORGSTRUC && (
                                <Icons type={td.type as Architecture} />
                            )}
                            <div className={styles.rightContent}>
                                {/* <div
                                    className={classnames(
                                        styles.nodeName,
                                        selectedId === td.id &&
                                            styles.selectedNodeName,
                                    )}
                                >
                                    {td.name}
                                </div> */}
                                <div
                                    className={classnames(
                                        styles.nodeName,
                                        selectedId === td.id &&
                                            styles.selectedNodeName,
                                    )}
                                    // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{
                                        __html: highLight(
                                            td.name,
                                            searchKey,
                                            'dirHighLight',
                                        ),
                                    }}
                                />
                            </div>
                        </>
                    )}
                </div>
            )
        }

        // let level = 0

        const renderTreeNodes = (
            tData: CatlgTreeNode[],
            // parentNode?: CatlgTreeNode,
        ) => {
            // let level = 0
            const result = (
                data,
                level: number,
                parentNode?: CatlgTreeNode,
            ) => {
                // eslint-disable-next-line no-param-reassign
                level += 1
                return data.map((item, index) => {
                    // eslint-disable-next-line no-param-reassign
                    item = { ...item, level }
                    return (
                        <div
                            key={item.id}
                            className={
                                activeKey === RescCatlgType.RESC_CLASSIFY
                                    ? styles.rescTreeNode
                                    : undefined
                            }
                            style={
                                {
                                    // paddingLeft: 18 * level,
                                }
                            }
                        >
                            {renderTreeNode(item, level, parentNode)}
                            <div hidden={!item.isExpand}>
                                {item.children
                                    ? result(item.children, level, item)
                                    : null}
                            </div>
                        </div>
                    )
                })
            }
            return result(tData, 0)
        }

        // 搜索框enter
        const handleSearchPressEnter = (e: any) => {
            // 回车搜索
            const value = typeof e === 'string' ? e : trim(e.target.value)
            const lastSearchKey = searchKey

            // 都为空字符串就不搜索
            if (!lastSearchKey?.trim() && !value) {
                return
            }
            setSearchKey(value)
            setIsSearchEnter(true)
            // run({
            //     ...queryParams,
            //     keyword: e.target.value,
            //     current: 1,
            // })
            if (activeKey === RescCatlgType.ORGSTRUC) {
                let type = initNodeType
                if (value) {
                    type = managementNode.join()
                }
                getNodeObjects(
                    {
                        limit: 0,
                        id: '',
                        is_all: true,
                        keyword: value,
                        type,
                    },
                    CatlgOperateType.SEARCH,
                )
            } else if (activeKey === RescCatlgType.RESC_CLASSIFY) {
                getNodeObjects(
                    { keyword: value, recursive: true },
                    CatlgOperateType.SEARCH,
                )
            }
        }

        // 空库表
        const showDataEmpty = () => {
            const desc = searchKey ? (
                <span>{__('抱歉，没有找到相关内容')}</span>
            ) : (
                <span>{__('暂无数据')}</span>
            )
            const icon = searchKey ? searchEmpty : dataEmpty
            return <Empty desc={desc} iconSrc={icon} />
        }

        return (
            <div className={styles.treeWrapper}>
                <Tabs
                    activeKey={activeKey}
                    items={rescCatlgItems}
                    onChange={(key) => {
                        setActiveKey(key as RescCatlgType)
                        setSelectedId('all')
                        getSelectedNode(allNodeInfo)
                    }}
                    className={styles.dirTab}
                />
                <div className={styles.treeSearch}>
                    <SearchInput
                        placeholder={
                            activeKey === RescCatlgType.ORGSTRUC
                                ? __('搜索组织或部门')
                                : __('搜索资源分类名称')
                        }
                        value={searchKey}
                        onKeyChange={(kw: string) => {
                            // 至少搜索过一次之后的清空操作
                            if (kw === '' && isSearchEnter) {
                                handleSearchPressEnter(kw)
                                setIsSearchEnter(false)
                            } else {
                                setSearchKey(kw)
                            }
                        }}
                        onPressEnter={handleSearchPressEnter}
                        maxLength={32}
                    />
                </div>
                {isShowAll && (
                    <div
                        className={classnames(
                            styles.treeNode,
                            styles.all,
                            selectedId === 'all' && styles.selectedTreeNode,
                        )}
                        onClick={() => {
                            if (selectedId === 'all') return
                            setSelectedId('all')

                            getSelectedNode({
                                ...allNodeInfo,
                            })
                        }}
                        hidden={treeData?.length === 0}
                    >
                        <div className={styles.rightContent}>全部</div>
                    </div>
                )}

                {treeData?.length > 0 && renderTreeNodes(treeData)}
                {treeData?.length === 0 && showDataEmpty()}
            </div>
        )
    },
)
export default ResourcesDirTree
