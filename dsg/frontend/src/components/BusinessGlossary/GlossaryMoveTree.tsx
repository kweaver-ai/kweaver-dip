/* eslint-disable no-param-reassign */
import { Tree, message, Select, Tooltip, Button } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import React, {
    Key,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import classnames from 'classnames'
import {
    formatError,
    getGlossary,
    getGlossaryTree,
    moveCategories,
    PermissionScope,
} from '@/core'

import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import __ from '../BusinessDomain/locale'
import { AddOutlined } from '@/icons'
import { GlossaryMgmtIcons } from '../BusinessDomain/GlossaryIcons'
import { CatlgTreeNode, GlossaryType } from './const'
import { highLight } from '../ResourcesDir/const'
import DropdownOperate from './DropdownOperate'
import { SearchInput } from '@/ui'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IGlossaryMoveTree {
    ref?: any
    contentId?: string
    defalutValue?: string
    getSelectedNode?: (sn: CatlgTreeNode) => void
    handleOperate?: (op, data) => void
}

const GlossaryMoveTree: React.FC<IGlossaryMoveTree> = forwardRef(
    (props: any, ref) => {
        const { getSelectedNode, defalutValue, handleOperate } = props
        const [gData, setGData] = useState<any[]>([])
        const [searchValue, setSearchValue] = useState('')
        const [selectedGlossary, setSelectedGlossary] = useState('')
        const [showTips, setShowTips] = useState<boolean>(false)
        const [glossaryList, setGlossaryList] = useState<any[]>([
            {
                name: '所有术语表',
                id: '',
            },
        ])
        const allGlossaryItem = [
            {
                name: '所有术语表',
                id: '',
            },
        ]
        const [treeValue, setTreeValue] = useState<any[]>([])
        const [dropNode, setDropNode] = useState<any>()
        const [dropEnterNode, setDropEnterNode] = useState<any>()
        const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
        const [autoExpandParent, setAutoExpandParent] = useState(true)
        const [selectedNode, setSelectedNode] = useState<any>()

        const { checkPermission } = useUserPermCtx()

        useImperativeHandle(ref, () => ({
            expandedKeys,
            getAllGlossary,
            getGlossaryList,
            onLoadData,
            updataGlossaryTree,
            delGlossaryTree,
            addGlossaryTree,
            onExpand,
            selectTreeNodeById,
        }))

        useEffect(() => {
            getGlossaryList()
            getAllGlossary()
        }, [])

        useEffect(() => {
            setTreeValue([defalutValue])
        }, [defalutValue])

        useEffect(() => {
            updataGlossaryTree(
                {
                    glossary_id: selectedGlossary,
                    keyword: searchValue,
                },
                true,
            )
        }, [searchValue])

        const getGlossaryList = async (isInit?: boolean) => {
            try {
                const res = await getGlossary()
                // 不显示业务域分组
                const tree = res.entries.filter(
                    (item) => item.id !== '462308570965213996',
                )
                if (tree && tree.length) {
                    tree.forEach((item) => {
                        item.children = []
                        item.title = getTreeNodeName(item)
                        item.isLeaf = !item.expansion_flag
                        item.glossary_id = item.id
                    })
                    const [firNode] = tree
                    setTreeValue([firNode.id])
                    getSelectedNode(firNode)
                    setGData(tree)
                } else {
                    getSelectedNode({})
                }
                setShowTips(tree.length === 0)
            } catch (err) {
                formatError(err)
                setShowTips(true)
            }
        }

        /**
         * @param updataTreeFlag 是否更新术语表树
         * @returns
         */
        const getAllGlossary = async (updataTreeFlag?: boolean) => {
            const res = await getGlossary()
            // 不显示业务域分组
            setGlossaryList(
                [...allGlossaryItem, ...res.entries].filter(
                    (item) => item.id !== '462308570965213996',
                ),
            )
        }

        /**
         * 根据glossary_id更新术语表 树
         * @param params 查询参数
         * @param allTreeFlag 是否更新全部树，默认根据glossary_id更新单个术语表
         * @returns
         */
        const updataGlossaryTree = async (
            params: {
                keyword?: string
                glossary_id: string
            },
            allTreeFlag?: boolean,
        ) => {
            try {
                const res = await getGlossaryTree(params)
                if (res.entries && res.entries.length > 0) {
                    let treeData: any[] = []
                    res.entries = res.entries.filter(
                        (item) => item.id !== '462308570965213996',
                    )
                    if (allTreeFlag || params.keyword) {
                        const tree = addGlossaryId(res.entries)
                        treeData = generateList(tree, params.glossary_id)
                        if (!params.keyword) {
                            setExpandedKeys([])
                        } else {
                            const keys = getExpandedKeys(treeData)
                            setExpandedKeys(keys)
                        }
                    } else {
                        treeData = generateList(
                            gData.map((item) => {
                                if (item.id === params.glossary_id) {
                                    const [firNode] = res.entries
                                    item = { ...item, ...firNode }
                                    if (!firNode.children) {
                                        delete item.children
                                    }
                                }
                                return item
                            }),
                            params.glossary_id,
                        )
                    }
                    setGData(treeData)
                    setShowTips(treeData.length === 0)
                } else {
                    setShowTips(true)
                }
            } catch (err) {
                formatError(err)
            }
        }

        const generateList = (
            data: any[],
            glossary_id: string,
            pId?: string,
            level_frond?: number,
        ) => {
            data.forEach((item) => {
                level_frond = level_frond ? level_frond + 1 : 1
                item.level_frond = level_frond
                item.title = getTreeNodeName(item)
                if (!item.glossary_id) {
                    item.glossary_id = glossary_id
                }
                item.isLeaf = !item.expansion_flag
                if (pId) {
                    item.parent_id = pId
                }
                if (item.children) {
                    generateList(
                        item.children,
                        item.glossary_id,
                        item.id,
                        level_frond,
                    )
                }
            })
            return data
        }

        // 树添加glossary_id
        const addGlossaryId = (data: any[], glossary_id: string = '') => {
            data.forEach((item: any) => {
                item.glossary_id = glossary_id || item.id
                if (item.children) {
                    addGlossaryId(item.children, item.glossary_id)
                }
            })
            return data
        }

        // 获取展开id
        const getExpandedKeys = (data: any[], keys: string[] = []) => {
            data.forEach((item: any) => {
                if (item.children) {
                    keys.push(item.id)
                    getExpandedKeys(item.children, keys)
                }
            })
            return keys
        }

        // 根据id选中tree
        const selectTreeNodeById = (data: any[] = [], id: string = '') => {
            const treeList = data.length > 0 ? data : gData
            treeList.forEach((item) => {
                if (item.id === id) {
                    toSelectFirstNode([item])
                    return
                }
                if (item.children) {
                    selectTreeNodeById(item.children, id)
                }
            })
        }

        const onDragStart: any = (info) => {
            if (info.node.type !== GlossaryType.TERMS) setDropNode(info.node)
        }
        const onDragEnter: any = (info) => {
            if (info.node.type !== GlossaryType.TERMS)
                setDropEnterNode(info.node)
        }
        const onDragEnd: any = async (info) => {
            if (info.node.id === dropNode.id) {
                try {
                    if (
                        dropEnterNode?.id &&
                        dropNode?.id &&
                        dropNode.id !== dropEnterNode.id
                    ) {
                        const obj = {
                            id: dropNode.id,
                            next_id: dropEnterNode.id,
                            dest_parent_id: dropEnterNode.parent_id,
                        }
                        await moveCategories(obj)
                        message.success(__('移动成功'))
                        updataGlossaryTree({
                            glossary_id: info.node.glossary_id,
                        })
                    }
                } catch (err) {
                    formatError(err)
                } finally {
                    setDropEnterNode({})
                }
            }
        }

        // 空库表
        const showDataEmpty = () => {
            const desc = searchValue
                ? __('抱歉，没有找到相关内容')
                : __('暂无数据')

            const icon = searchValue ? searchEmpty : dataEmpty
            return <Empty desc={desc} iconSrc={icon} />
        }

        const onChange = (_value: string) => {
            const value = _value.toLowerCase()
            setSearchValue(value)
            if (value) {
                setAutoExpandParent(true)
            } else {
                setShowTips(false)
                setAutoExpandParent(false)
            }
        }

        const updateTreeData = (
            list: CatlgTreeNode[],
            key: Key,
            children: CatlgTreeNode[],
        ): CatlgTreeNode[] =>
            list.map((node) => {
                if (node.id === key) {
                    return {
                        ...node,
                        children,
                    }
                }
                if (node.children && node.children.length > 0) {
                    return {
                        ...node,
                        children: updateTreeData(node.children, key, children),
                    }
                }
                return node
            })

        // 异步加载
        const onLoadData = async (node: any) => {
            const { key, children } = node
            if (children && children.length > 0) {
                return
            }
            let level_frond: number = node?.level_frond || 0
            if (level_frond) {
                level_frond += 1
            } else {
                level_frond = 1
            }
            const list = await getGlossary({ id: key })
            list.entries.forEach((item) => {
                item.isLeaf = !item.expansion_flag
                item.glossary_id = node.glossary_id
                item.parent_id = key
                item.level_frond = level_frond
                item.title = getTreeNodeName(item)
            })
            setGData((origin) => updateTreeData(origin, key, list.entries))
        }

        const treeOnSelect = (selectedKeys, info) => {
            setTreeValue(selectedKeys)
            if (selectedKeys.length > 0) {
                getSelectedNode(info?.node)
                setSelectedNode(info?.node)
            }
        }

        /**
         * 根据glossary_id 删除指定术语表
         * @param id  glossary_id
         * @returns
         */
        const delGlossaryTree = (id: string) => {
            const tree = gData.filter((item) => item.id !== id)
            setGData(tree)
            setShowTips(tree.length === 0)
            toSelectFirstNode(tree)
        }

        /**
         * 根据glossary_id 添加指定术语表
         * @param id  glossary_id
         * @returns
         */
        const addGlossaryTree = async (id: string) => {
            const res = await getGlossaryTree({ glossary_id: id })
            let treeData: any[] = []
            if (res.entries && res.entries.length > 0) {
                treeData = generateList(res.entries, id)
                setGData([...gData, ...treeData])
                setShowTips(false)
                toSelectFirstNode([...gData, ...treeData])
            }
        }

        const toSelectFirstNode = (tree: any[]) => {
            if (tree.length === 0) {
                getSelectedNode({})
                return
            }
            const [firNode] = tree
            setTreeValue([firNode.id])
            getSelectedNode(firNode)
        }

        // 根据id 展开树
        const toExpand = (id) => {
            setExpandedKeys([...expandedKeys, id])
        }

        const getTreeNodeName = (data: any) => {
            return (
                <div
                    className={classnames(
                        styles.treeNodeBox,
                        styles[`L${data.level_frond || 1}`],
                    )}
                >
                    <div className={styles.treeNodetext}>
                        <span style={{ marginRight: '5px' }}>
                            <GlossaryMgmtIcons
                                type={data.type}
                                status={data.status}
                            />
                        </span>
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
                    <div className={styles.treeOperate}>
                        <DropdownOperate
                            isButton={false}
                            currentData={data}
                            handleOperate={handleOperate}
                        />
                    </div>
                </div>
            )
        }

        const onExpand = (newExpandedKeys: Key[], info) => {
            setExpandedKeys(newExpandedKeys)
            setAutoExpandParent(false)
            if (info.expanded) {
                onLoadData(info.node)
            }
        }

        return (
            <div className={styles.treeWrapper}>
                <div className={styles.titleBox}>
                    <Select
                        defaultValue=""
                        bordered={false}
                        options={glossaryList}
                        fieldNames={{
                            label: 'name',
                            value: 'id',
                        }}
                        onChange={(val) => {
                            setSelectedGlossary(val)
                            updataGlossaryTree({ glossary_id: val }, true)
                            if (val) {
                                treeOnSelect([val], {
                                    node: glossaryList.find(
                                        (item) => item.id === val,
                                    ),
                                })
                            } else if (
                                !val &&
                                glossaryList &&
                                glossaryList.length > 0
                            ) {
                                // 0 为所有术语表
                                treeOnSelect([glossaryList[1]?.id], {
                                    node: glossaryList[1],
                                })
                            }
                        }}
                        className={styles.titleSelect}
                    />

                    {checkPermission([
                        {
                            key: 'manageDataClassification',
                            scope: PermissionScope.All,
                        },
                    ]) && (
                        <Tooltip title={__('新建术语表')}>
                            <Button
                                icon={<AddOutlined />}
                                onClick={() => {
                                    handleOperate('addGlossary')
                                }}
                            />
                        </Tooltip>
                    )}
                </div>
                <SearchInput
                    placeholder={__('请输入名称')}
                    onKeyChange={onChange}
                    className={classnames(styles.searchInput, styles.glossary)}
                />
                {showTips ? (
                    showDataEmpty()
                ) : (
                    <Tree
                        className="draggable-tree"
                        draggable={{
                            icon: false,
                            nodeDraggable: (node: any) => {
                                return (
                                    node.type !== GlossaryType.GLOSSARY &&
                                    node.type !== GlossaryType.TERMS
                                )
                            },
                        }}
                        selectedKeys={treeValue}
                        showIcon
                        switcherIcon={<DownOutlined />}
                        blockNode
                        onDragEnd={onDragEnd}
                        onDragEnter={onDragEnter}
                        onDragStart={onDragStart}
                        treeData={gData}
                        onSelect={treeOnSelect}
                        fieldNames={{
                            title: 'title',
                            key: 'id',
                            children: 'children',
                        }}
                        onExpand={onExpand}
                        expandedKeys={expandedKeys}
                        autoExpandParent={autoExpandParent}
                    />
                )}
            </div>
        )
    },
)

export default GlossaryMoveTree
