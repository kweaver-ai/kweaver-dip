import {
    FC,
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react'
import { useSafeState } from 'ahooks'
import classnames from 'classnames'
import { DirTree, Loader } from '@/ui'
import {
    BizModelType,
    formatError,
    getBusinessDomainProcessTree,
    IBusinessDomainItem,
    LoginPlatform,
} from '@/core'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { useBusinessProcessContext } from './BusinessProcessProvider'
import { useBusinessModelContext } from '../BusinessModelProvider'
import { getPlatformNumber } from '@/utils'

interface ProcessProviderProps {
    value?: string
    onSelect?: (value: string) => void
    ref?: any
    parentId?: string
}

/**
 * 数据获取类别
 */
enum DataOpt {
    Init,
    Load,
}

type DataNode = IBusinessDomainItem

const ProcessTree: FC<ProcessProviderProps> = forwardRef(
    ({ value, onSelect, parentId }: any, ref) => {
        // 是否加载中
        const [isLoading, setIsLoading] = useSafeState(true)
        // 展开的节点
        const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([])
        // 目录树数据
        const [data, setData] = useSafeState<Array<any>>([])
        // 已加载的节点
        const [loadedKeys, setLoadedKeys] = useSafeState<string[]>([])
        // 所有选项
        const { setAllOptions } = useBusinessProcessContext()

        const [isEmpty, setIsEmpty] = useState<boolean>(false)

        const { businessModelType } = useBusinessModelContext()

        const platform = getPlatformNumber()

        useEffect(() => {
            setExpandedKeys([])
            setLoadedKeys([])
            getData(DataOpt.Init, parentId)
        }, [parentId])

        /**
         * 更新目录树数据
         * @param list 当前目录树列表
         * @param id 选中项id
         * @param children 选中项子目录
         * @param splitType 最深层子节点类型集合
         * @returns 更新后的目录树数据
         */
        const updateTreeData = (
            list: any[],
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
                            disabled:
                                (businessModelType === BizModelType.BUSINESS &&
                                    child.model_id) ||
                                (businessModelType === BizModelType.DATA &&
                                    child.data_model_id),
                        })),
                        disabled:
                            (businessModelType === BizModelType.BUSINESS &&
                                node.model_id) ||
                            (businessModelType === BizModelType.DATA &&
                                node.data_model_id),
                    }
                }
                if (node.children) {
                    return {
                        ...node,
                        isLeaf: !node.expand,
                        key: node.id,
                        children: updateTreeData(node.children, id, children),
                        disabled:
                            (businessModelType === BizModelType.BUSINESS &&
                                node.model_id) ||
                            (businessModelType === BizModelType.DATA &&
                                node.data_model_id),
                    }
                }
                return { ...node }
            })

        // 获取数据
        const getData = async (optType: DataOpt, parent_id?: string) => {
            try {
                if (optType === DataOpt.Init) {
                    setIsLoading(true)
                }
                const responseData = await getBusinessDomainProcessTree({
                    parent_id,
                    offset: 1,
                    limit: 1000,
                })
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
                        disabled:
                            (businessModelType === BizModelType.BUSINESS &&
                                o.model_id) ||
                            (businessModelType === BizModelType.DATA &&
                                o.data_model_id),
                    }))
                }
                switch (optType) {
                    case DataOpt.Init:
                        setData(initData)

                        if (!initData?.length) {
                            setIsEmpty(true)
                        }
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
            } finally {
                setIsLoading(false)
            }
        }

        // 增量更新
        const onLoadData = async ({ id, children }: any) => {
            try {
                setLoadedKeys([...loadedKeys, id])
                if (children) {
                    return Promise.resolve()
                }
                await getData(DataOpt.Load, id)
            } catch (err) {
                formatError(err)
            }
            return Promise.resolve()
        }

        /**
         * 展开节点
         * @param key 节点key
         * @param info 节点信息
         */
        const handleExpand = (key: any, info: any) => {
            setExpandedKeys(key)
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
                    title={name}
                >
                    <span className={styles.icon}>
                        <FontIcon
                            name="icon-yewuliucheng16"
                            type={IconType.COLOREDICON}
                        />
                    </span>
                    <span className={styles.text}>{name}</span>
                </div>
            )
        }, [])

        return isLoading ? (
            <div className={styles.treeSelectLoadingWrapper}>
                <Loader />
            </div>
        ) : isEmpty ? (
            <div className={styles.treeSelectEmptyWrapper}>
                {__('暂无数据')}
            </div>
        ) : (
            <div className={styles.treeContainerWrapper}>
                <div className={styles.title}>
                    {platform === LoginPlatform.default
                        ? __('业务流程')
                        : __('主干业务')}
                </div>
                <div className={styles.treeWrapper}>
                    <DirTree
                        conf={{
                            showTopTitle: false,
                            showSearch: false,
                        }}
                        treeData={data}
                        loadData={onLoadData}
                        expandedKeys={expandedKeys}
                        loadedKeys={loadedKeys}
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

export default ProcessTree
