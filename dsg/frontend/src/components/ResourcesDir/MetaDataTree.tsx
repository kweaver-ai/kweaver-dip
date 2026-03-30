import React, {
    Key,
    forwardRef,
    ReactNode,
    useEffect,
    useState,
    useMemo,
    useImperativeHandle,
} from 'react'
import { Tree, message } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { isEqual, uniqWith } from 'lodash'
import styles from './styles.module.less'
import { Architecture, DataNode } from './const'
import { getMetaDataTree } from '@/core'
import {
    PostgresqlOutlined,
    MysqlOutlined,
    OracleOutlined,
    DataSourceOutlined,
    LibraryOutlined,
    HiveOutlined,
} from '@/icons'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { searchNodesByKey } from '../DataAssetsCatlg/helper'
import { highLight } from '../ResourcesDir/const'
import { SearchInput } from '@/ui'

/**
 * ref: 提供删除与重命名操作
 * defaultTreeExpandedKeys: 默认展开keys
 * isShowAll 是否展示全部节点
 * hiddenNodeTypeList 要隐藏的节点类型数组
 * titleRender 自定义渲染节点
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
    getSelectedKeys: (id: string[]) => void
}
interface ITreeNode {
    id: string
    name: any
    children?: ITreeNode[]
    icon?: ReactNode
}
const CustomTree: React.FC<ICustomTree> = forwardRef((props: any, ref) => {
    const {
        getSelectedKeys,
        defaultTreeExpandedKeys = [],
        defaultTreeSelectedKeys,
    } = props
    const [defaultData, setDefaultData] = useState<ITreeNode[]>([])
    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
    const [checkedKeys, setCheckedKeys] = useState<Key[]>([])
    const [searchValue, setSearchValue] = useState('')
    const [autoExpandParent, setAutoExpandParent] = useState(true)
    const dataList: ITreeNode[] = []
    const [dataListArr, setDataListArr] = useState<ITreeNode[]>([])
    const [showTips, setShowTips] = useState<boolean>(false)

    useImperativeHandle(ref, () => ({
        expandedKeys,
    }))

    // 若展示全部则向外输出初始的选中项为全部
    useEffect(() => {
        getNodeObjects()
    }, [])

    const IconList = {
        1: <OracleOutlined style={{ fontSize: '18px' }} />,
        2: <MysqlOutlined style={{ fontSize: '18px' }} />,
        3: <PostgresqlOutlined style={{ fontSize: '18px' }} />,
        5: <HiveOutlined style={{ fontSize: '18px' }} />,
    }

    const getNodeObjects = async () => {
        try {
            const res = await getMetaDataTree()
            const treeList = res.data?.map((item) => {
                const obj: ITreeNode = {
                    id: '',
                    name: '',
                    children: [],
                    icon: IconList[item.data_source_type] || null,
                }
                obj.id = item.data_source_type + item.data_source_type_name
                obj.name = item.data_source_type_name
                obj.children = item.data_sources?.map((it) => {
                    const schemas = it.schemas?.map((el) => {
                        return {
                            id: el.id,
                            name: el.name,
                            icon: (
                                <LibraryOutlined style={{ fontSize: '18px' }} />
                            ),
                        }
                    })
                    return {
                        id: it.id,
                        children: schemas,
                        name: it.name,
                        icon: (
                            <DataSourceOutlined style={{ fontSize: '18px' }} />
                        ),
                    }
                })
                return obj
            })
            generateList(treeList)
            setDataListArr(dataList)
            setDefaultData(treeList)
            setShowTips(treeList.length === 0)
            if (defaultTreeExpandedKeys && defaultTreeExpandedKeys.length > 0) {
                setExpandedKeys([...expandedKeys, ...defaultTreeExpandedKeys])
            }
            if (defaultTreeSelectedKeys && defaultTreeSelectedKeys.length > 0) {
                setCheckedKeys(defaultTreeSelectedKeys)
            }
        } catch (error) {
            setShowTips(true)
            message.error('获取元数据失败')
        }
    }

    const generateList = (data: ITreeNode[]) => {
        data.forEach((item) => {
            dataList.push({ id: item.id, name: item.name })
            if (item.children) {
                generateList(item.children)
            }
        })
    }

    const getParentKey = (key: Key, tree: ITreeNode[]): Key => {
        let parentKey: Key
        tree.forEach((item) => {
            if (item.children) {
                if (item.children.some((it) => it.id === key)) {
                    parentKey = item.id
                } else if (getParentKey(key, item.children)) {
                    parentKey = getParentKey(key, item.children)
                }
            }
        })
        return parentKey!
    }

    const treeOnSelect = (selectedKeys, info) => {
        if (selectedKeys.length > 0) {
            getSelectedKeys({
                id: selectedKeys.toString(),
                name: info?.node?.name,
                pos: info?.node?.pos,
            })
        }
        // 点击展开
        const expKeys = !info?.node?.expanded
            ? uniqWith([...expandedKeys, info?.node?.id], isEqual)
            : uniqWith(
                  expandedKeys.filter((item) => item !== info?.node?.id),
                  isEqual,
              )
        setExpandedKeys(expKeys)
        // 需要关闭自动展开父级
        setAutoExpandParent(false)
    }
    const onExpand = (newExpandedKeys: Key[]) => {
        setExpandedKeys(newExpandedKeys)
        setAutoExpandParent(false)
    }
    const onChange = (kw: string) => {
        const value = kw?.toLowerCase()
        setSearchValue(kw)
        const newExpandedKeys = dataListArr
            .map((item) => {
                if (item.name.toLowerCase().indexOf(value) > -1) {
                    return getParentKey(item.id, defaultData)
                }
                return null
            })
            .filter((item, i, self) => item && self.indexOf(item) === i)
        if (value) {
            setExpandedKeys(newExpandedKeys as Key[])
            setAutoExpandParent(true)
            setShowTips(newExpandedKeys.length === 0)
        } else {
            setShowTips(false)
        }
    }

    // 空库表
    const showDataEmpty = () => {
        const desc = searchValue ? (
            <span>抱歉，没有找到相关内容</span>
        ) : (
            <span>暂无数据</span>
        )
        const icon = searchValue ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    // 搜索高亮
    const treeData = useMemo(() => {
        const loop = (data: any[]): any[] =>
            data.map((item) => {
                const title = item.name
                const name = (
                    <span
                        title={item.name}
                        dangerouslySetInnerHTML={{
                            __html: highLight(
                                item.name,
                                searchValue,
                                'dirHighLight',
                            ),
                        }}
                    />
                )
                if (item.children) {
                    return {
                        name,
                        title,
                        id: item.id,
                        children: loop(item.children),
                        icon: item.icon,
                    }
                }

                return {
                    name,
                    title,
                    id: item.id,
                    icon: item.icon,
                }
            })
        const list = loop(defaultData)
        return searchNodesByKey(searchValue, 'title', list)
    }, [searchValue, defaultData])

    return (
        <div className={styles.treeBox}>
            <SearchInput
                placeholder={__('搜索数据源、库名称')}
                onKeyChange={onChange}
                className={styles.searchInput}
            />
            {showTips ? (
                showDataEmpty()
            ) : (
                <Tree
                    onSelect={treeOnSelect}
                    showIcon
                    switcherIcon={<DownOutlined />}
                    fieldNames={{
                        title: 'name',
                        key: 'id',
                        children: 'children',
                    }}
                    onExpand={onExpand}
                    defaultSelectedKeys={checkedKeys}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    blockNode
                    treeData={treeData}
                />
            )}
        </div>
    )
})
export default CustomTree
