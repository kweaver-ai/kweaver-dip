import {
    useRef,
    useState,
    forwardRef,
    FC,
    useMemo,
    useImperativeHandle,
    useCallback,
    Key,
    memo,
} from 'react'
import { useAsyncEffect, useHover, useSafeState } from 'ahooks'
import styles from './styles.module.less'
import __ from './locale'
import DirTree from '@/ui/DirTree'
import {
    Architecture,
    DataNode,
    hiddenNodeType,
} from '../BusinessArchitecture/const'
import { useDirTreeContext } from '@/context/DirTreeProvider'
import {
    IGetObject,
    formatError,
    getCurUserDepartment,
    getObjectDetails,
    getObjects,
} from '@/core'
import { OperateType } from '@/utils'
import Icons from '../BusinessArchitecture/Icons'

interface IArchitectureDirTree {
    ref: any
    getSelectedNode: (node: DataNode) => void
    filterType: string
    hiddenType: Architecture[]
    isShowAll: boolean
    isShowOperate: boolean
    type?: string
    isCurrentDept?: boolean
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
    Search,
}

// 参数设置
const InitParams = { limit: 0, id: '', is_all: false }

/**
 * 目录项
 * @param node 节点数据
 * @returns 目录项Element
 */
const ItemView = memo(
    ({
        node,
        isShowOperate,
        handleOperate,
    }: {
        node: DataNode
        isShowOperate: boolean
        handleOperate?: (
            ot: OperateType,
            at: Architecture,
            td?: DataNode,
            parentNode?: DataNode,
        ) => void
    }) => {
        const { name, type } = node
        const { optNode } = useDirTreeContext()
        const ref = useRef<HTMLDivElement | null>(null)
        const isHovering = useHover(ref)

        return (
            <div ref={ref} className={styles['itemview-wrapper']} title={name}>
                <span className={styles['itemview-icon']}>
                    <Icons type={type as Architecture} />
                </span>
                <span className={styles['itemview-wrapper-nodename']}>
                    {name}
                </span>
            </div>
        )
    },
)

const OrgAndDepartmentFilterTree: FC<Partial<IArchitectureDirTree>> =
    forwardRef((props: any, ref) => {
        const {
            getSelectedNode,
            filterType,
            isShowAll = true,
            isShowOperate = false,
            hiddenType = hiddenNodeType,
            type,
            isCurrentDept = false,
        } = props
        const [searchResult, setSearchResult] = useSafeState<DataNode[]>()
        const [data, setData] = useSafeState<DataNode[]>()
        const { currentNode, setCurrentNode } = useDirTreeContext()
        const [selectedNode, setSelectedNode] = useState<DataNode>()
        const [selectedKeys, setSelectedKeys] = useState<Key[]>()

        useImperativeHandle(ref, () => ({
            treeData: data,
            setSelectedKeys,
        }))

        // 获取数据
        const getData = async (
            params: IGetObject,
            optType: DataOpt,
            parent_id?: string,
        ) => {
            try {
                const responseData = await getObjects(params)
                const res = responseData?.entries

                let initData
                if (optType === DataOpt.Init) {
                    if (isCurrentDept) {
                        const currentDept = await getCurUserDepartment()
                        const [firstDept] = currentDept ?? []
                        const currentDeptRes = await getObjectDetails(
                            firstDept?.id,
                        )
                        if (currentDeptRes) {
                            initData = [{ ...currentDeptRes, isLeaf: false }]
                        }
                    } else {
                        initData = res?.map((o) => ({
                            ...o,
                            isLeaf: !o.expand,
                        }))
                    }
                }
                switch (optType) {
                    case DataOpt.Init:
                        setData(initData)
                        break
                    case DataOpt.Load:
                        setData((prev: DataNode[] | undefined) =>
                            updateTreeData(prev!, parent_id!, res),
                        )
                        break
                    case DataOpt.Search:
                        setSearchResult(res)
                        break
                    default:
                        break
                }
            } catch (error) {
                formatError(error)
            }
        }

        // 初始化参数
        const QueryParams = useMemo(
            () => ({ ...InitParams, type: filterType }),
            [filterType],
        )

        const getTreeNode = (tree: DataNode[], func): DataNode | null => {
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
         * 更新目录树数据
         * @param list 当前目录树列表
         * @param id 选中项id
         * @param children 选中项子目录
         * @returns 更新后的目录树数据
         */
        const updateTreeData = (
            list: DataNode[],
            id: string,
            children: DataNode[],
        ): DataNode[] =>
            list.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        // 如果有子节点或者expand为true，则不是叶子节点
                        isLeaf: children?.length ? false : !node.expand,
                        children: children?.map((child) => ({
                            ...child,
                            isLeaf: !child.expand,
                        })),
                    }
                }
                if (node.children) {
                    return {
                        ...node,
                        // 已有子节点的节点，保持非叶子节点状态
                        isLeaf: false,
                        children: updateTreeData(node.children, id, children),
                    }
                }
                return { ...node }
            })

        // 节点查询
        useAsyncEffect(async () => {
            getData(QueryParams, DataOpt.Init)
        }, [QueryParams])
        // 增量更新
        const onLoadData = async ({ id, children }: any) => {
            try {
                if (children) {
                    return Promise.resolve()
                }
                await getData({ ...QueryParams, id }, DataOpt.Load, id)
            } catch (err) {
                formatError(err)
            }
            return Promise.resolve()
        }

        const titleRender = useCallback(
            (node: any) => (
                <ItemView node={node} isShowOperate={isShowOperate} />
            ),
            [isShowOperate, hiddenType],
        )

        // 设置选中节点
        const handleSelect = (keys: Key[], info: any) => {
            const { node } = info // node: EventDataNode<DataNode>
            setCurrentNode(node)
            setSelectedKeys(keys)
            getSelectedNode(node)
        }

        const handleTopAll = () => {
            getSelectedNode({
                id: '',
                name: __('不限'),
            })
            setSelectedKeys([])
        }

        return (
            <div className={styles.orgAndDepartWrapper}>
                <DirTree
                    conf={{
                        placeholder: __('搜索组织/部门'),
                        isSearchEmpty:
                            searchResult !== undefined && !searchResult?.length,
                        onTopTitleClick: handleTopAll,
                        isCheckTop: !currentNode?.id,
                        showTopTitle: isShowAll,
                        showSearch: false,
                        topTitle: __('不限'),
                    }}
                    treeData={data as any}
                    loadData={onLoadData}
                    fieldNames={{ key: 'id' }}
                    titleRender={titleRender}
                    onSelect={handleSelect}
                    selectedKeys={selectedKeys}
                />
            </div>
        )
    })

export default OrgAndDepartmentFilterTree
