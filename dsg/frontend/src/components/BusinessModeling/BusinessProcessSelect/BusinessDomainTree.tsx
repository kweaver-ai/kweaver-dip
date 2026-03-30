import { useSafeState } from 'ahooks'
import {
    FC,
    forwardRef,
    memo,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import classnames from 'classnames'
import DirTree from '@/components/StandardDirTree/DirTree'
import {
    BusinessDomainLevelTypes,
    formatError,
    getBusinessDomainTree,
    IBusinessDomainItem,
    IBusinessDomainTreeParams,
} from '@/core'
import BusinessDomainLevelIcon from '@/components/BusinessDomainLevel/BusinessDomainLevelIcon'
import __ from '../locale'
import styles from './styles.module.less'
import { LevelType } from '../const'

interface BusinessDomainTreeProps {
    value?: string
    onSelect: (value: string) => void
    ref?: any
}

// 目录树节点类型
type DataNode = IBusinessDomainItem

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
}

const InitParams = { parent_id: '', keyword: '', getall: false }

const BusinessDomainTree: FC<Partial<BusinessDomainTreeProps>> = forwardRef(
    (props: any, ref) => {
        const { value, onSelect } = props

        const [isLoading, setIsLoading] = useSafeState(false)

        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])

        const [data, setData] = useSafeState<Array<any>>([])

        const [isEmpty, setIsEmpty] = useState<boolean>(false)

        const handleTopAll = () => {
            onSelect('')
        }

        useEffect(() => {
            getData(InitParams, DataOpt.Init)
        }, [])

        const handleExpand = (key: any, info: any) => {
            setExpandedKeys(key)
        }

        // 获取数据
        const getData = async (
            params: Partial<IBusinessDomainTreeParams>,
            optType: DataOpt,
            parent_id?: string,
        ) => {
            try {
                if (optType === DataOpt.Init) {
                    setIsLoading(true)
                }

                const responseData = await getBusinessDomainTree(params)
                const res = responseData?.entries
                if (optType === DataOpt.Init && !res?.length) {
                    setIsEmpty(true)
                } else {
                    setIsEmpty(false)
                }

                let initData
                if (optType === DataOpt.Init) {
                    initData = res?.map((o) => ({
                        ...o,
                        key: o.id,
                        isLeaf: !o.expand,
                        type: o.type,
                    }))
                }
                switch (optType) {
                    case DataOpt.Init:
                        setData(initData)
                        setIsLoading(false)
                        break
                    case DataOpt.Load:
                        setData((prev: DataNode[] | undefined) =>
                            updateTreeData(prev!, parent_id!, res),
                        )
                        break

                    default:
                        break
                }
            } catch (error) {
                formatError(error)
                setIsLoading(false)
            }
        }

        /**
         * 更新目录树数据
         * @param list 当前目录树列表
         * @param id 选中项id
         * @param children 选中项子目录
         * @param splitType 最深层子节点类型集合
         * @returns 更新后的目录树数据
         */
        const updateTreeData = (
            list: DataNode[],
            id: string,
            children: DataNode[],
        ): DataNode[] =>
            list?.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        isLeaf: !node.expand,
                        key: node.id,
                        children: children?.map((child) => ({
                            ...child,
                            key: child.id,
                            isLeaf: !child.expand,
                        })),
                    }
                }
                if (node.children) {
                    return {
                        ...node,
                        isLeaf: !node.expand,
                        key: node.id,
                        children: updateTreeData(node.children, id, children),
                    }
                }
                return { ...node }
            })
        // 增量更新
        const onLoadData = async ({ id, children }: any) => {
            try {
                if (children) {
                    return Promise.resolve()
                }
                await getData(
                    { ...InitParams, parent_id: id },
                    DataOpt.Load,
                    id,
                )
            } catch (err) {
                formatError(err)
            }
            return Promise.resolve()
        }

        /**
         * 目录项
         * @param node 节点数据
         * @returns 目录项Element
         */
        const ItemView = useCallback((nodeData) => {
            const { name, type } = nodeData
            return (
                <div
                    className={classnames({
                        [styles.treeNodeWrapper]: true,
                    })}
                    title={type ? `${LevelType[type]}：${name}` : ''}
                >
                    <span className={styles.icon}>
                        <BusinessDomainLevelIcon type={type} isColored />
                    </span>
                    <span className={styles.text}>{name}</span>
                </div>
            )
        }, [])

        useImperativeHandle(ref, () => ({
            isEmpty,
        }))

        return isEmpty ? (
            <div className={styles.treeSelectEmptyWrapper}>
                {__('暂无数据')}
            </div>
        ) : (
            <div className={styles.treeContainerWrapper}>
                <div className={styles.title}>{__('业务领域')}</div>
                <div className={styles.treeWrapper}>
                    <DirTree
                        conf={{
                            onTopTitleClick: handleTopAll,
                            showTopTitle: true,
                            showSearch: false,
                            topTitle: __('全部'),
                            isCheckTop: value === '',
                        }}
                        treeData={data}
                        loadData={onLoadData}
                        expandedKeys={expandedKeys}
                        onExpand={handleExpand}
                        titleRender={ItemView}
                        selectedKeys={[value]}
                        onSelect={(key, { selectedNodes }) => {
                            onSelect(key[0])
                        }}
                    />
                </div>
            </div>
        )
    },
)

export default BusinessDomainTree
