import { FC, useState, ReactNode, useEffect, useMemo, Key } from 'react'
import { Cascader, TreeSelect, TreeSelectProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { useDebounce } from 'ahooks'
import { isArray, isString, noop, uniq, uniqBy } from 'lodash'
import classNames from 'classnames'
import { formatError, getSubjectDomain, getSubjectDomainDetail } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { GlossaryIcon, GlossaryIcons } from '../BusinessDomain/GlossaryIcons'
import { BusinessDomainType } from '../BusinessDomain/const'

interface Option {
    value?: string | number | null
    label: ReactNode
    children?: Option[]
    isLeaf?: boolean
    loading?: boolean
    disabled?: boolean
    unCategorizedObj?: any
}

interface SelectThemeDomainType extends TreeSelectProps {
    // 数据变更
    onChange?: (value: any, valueObj?: any) => void

    // 当前选中的业务域。 该组件只支持选中到L2
    value?: any

    // 禁用状态
    disabled?: boolean

    // placehodler
    placeholder?: string

    // 默认显示的数据
    defaultDisplay?: string
    allowClear?: boolean
    // 未分配
    unCategorizedObj?: any
    // 其他分类
    otherCategorizedObj?: any
    // 默认显示
    defaultValue?: string | string[]

    // 初始化报错
    getInitValueError?: (message) => void
    // 可选择的节点
    selectableTypes?: Array<BusinessDomainType>

    // 叶子节点的类型
    leafNodeTypes?: Array<BusinessDomainType>
}

const CommonParams = { limit: 2000, parent_id: '', is_all: false }

const SearchParams = { limit: 2000, keyword: '', is_all: true }

const TreeSelectThemeDomain: FC<SelectThemeDomainType> = ({
    onChange = noop,
    value,
    disabled = false,
    placeholder = __('请选择所属主题'),
    defaultDisplay = '',
    allowClear = false,
    unCategorizedObj,
    otherCategorizedObj,
    defaultValue,
    multiple = false,
    treeCheckable = false,
    getInitValueError = noop,
    selectableTypes = [
        BusinessDomainType.subject_domain,
        BusinessDomainType.business_object,
        BusinessDomainType.business_activity,
    ],
    leafNodeTypes = [
        BusinessDomainType.business_activity,
        BusinessDomainType.business_object,
    ],
    ...props
}) => {
    const [treeData, setTreeData] = useState<any>([])
    const [treeExpandedKeys, setTreeExpandedKeys] = useState<Array<Key>>([])
    const [treeLoadedKeys, setTreeLoadedKeys] = useState<Array<Key>>([])
    const [selectedValue, setSelectedValue] = useState<
        string | Array<string> | undefined
    >(undefined)
    const [loading, setLoading] = useState<boolean>(true)
    const [searchValue, setSearchValue] = useState('')
    // 默认值传入多次，值加载多次，只加载一次
    const [isDefValueInit, setIsDefValueInit] = useState<boolean>(false)

    const isNodeInTreeData = (id: any, data: any[]): boolean => {
        const isExist = data.some((item) => item.id === id)
        return isExist
    }

    useEffect(() => {
        if (!loading) {
            setSelectedValue(value || undefined)
        }
    }, [value])

    const isValueObject = useMemo(() => {
        return props?.labelInValue || props?.treeCheckStrictly
    }, [props?.labelInValue, props?.treeCheckStrictly])

    // 多选情况下，节点的disable状态，逻辑如下：若未选任一节点，则所有节点（包括'其他'（unCategorizedObj）节点）可选，若选中其他（unCategorizedObj）节点，则其余节点disable不可选，若选中主题域节点，则其他节点不可选,
    const isNodeDisable = useMemo(() => {
        const hasMultpSelValue = multiple && !!value?.length
        // labelInValue  或  treeCheckStrictly（treeCheckStrictly会强制将labelInValue转换为true）为true时，value为valueObj
        const ids = isValueObject ? value?.map((v) => v.value || v) : value
        const hasUnCategorized = ids?.includes(unCategorizedObj?.id)
        return {
            // 其他（unCategorizedObj）节点disable
            unCategorizedObjDisable: hasMultpSelValue
                ? !hasUnCategorized
                : false,
            // 除其他（unCategorizedObj）节点外的节点disable
            reqNodeDisable: hasMultpSelValue ? hasUnCategorized : false,
        }
    }, [value])

    const disableTreeDataNode = (changedValue?: Array<any>) => {
        const hasMultpSelValue = multiple && !!changedValue?.length
        const ids = isValueObject
            ? changedValue?.map((v) => v.value)
            : changedValue
        const hasUnCategorized = ids?.includes(unCategorizedObj?.id)
        setTreeData(
            treeData.map((node) => {
                if (node.id === unCategorizedObj?.id) {
                    return {
                        ...node,
                        disabled: hasMultpSelValue ? !hasUnCategorized : false,
                        disableCheckbox:
                            node.type ===
                            BusinessDomainType.subject_domain_group,
                    }
                }
                return {
                    ...node,
                    disabled: hasMultpSelValue ? hasUnCategorized : false,
                    disableCheckbox:
                        node.type === BusinessDomainType.subject_domain_group,
                }
            }),
        )
    }

    useEffect(() => {
        if (!isDefValueInit) {
            setTreeLoadedKeys([])
            setTreeExpandedKeys([])
        }
        if (defaultValue) {
            setIsDefValueInit(true)
            setSelectedValue(undefined)
            if (multiple) {
                if (!defaultValue?.length) return
                // setIsDefValueLoaded(true)
                const ids = isArray(defaultValue)
                    ? defaultValue?.map((item: any) =>
                          isString(item) ? item : item?.value,
                      )
                    : defaultValue
                getAllRelatedNodesInfo(ids as string[], true)
            } else if (
                typeof defaultValue === 'string' &&
                defaultValue !== unCategorizedObj?.id &&
                !isNodeInTreeData(defaultValue, treeData)
            ) {
                getDefaultDomainInfo(defaultValue)
            }
        } else {
            getDomains()
        }
    }, [defaultValue])

    /**
     * 获取所有相关节点(包括父节点)的信息
     * @param ids 目标节点ID数组
     * @returns 包含所有相关节点信息的数组
     */
    const getAllRelatedNodesInfo = async (
        ids: string[],
        disableOther?: boolean,
    ) => {
        try {
            // 存储所有相关节点信息
            let allNodes: any[] = []
            // 存储所有需要获取的路径ID
            // let needLoadIds: string[] = []
            // 2. 收集所有路径ID
            let allPathIds: string[] = []

            let treeDataTemp = [...treeData]
            if (!treeData.length) {
                const rootNode = await getRootNode()
                treeDataTemp = [...rootNode]
            }

            const treeDataIds = treeDataTemp.map((node) => node.id)
            // 已加载的ID
            let gotDetailIds = [...treeDataTemp.map((node) => node.id), ...ids]
            if (!ids.some((id) => !treeDataIds.includes(id))) {
                setSelectedValue(ids)
                return
            }

            // 1. 获取每个ID的详细信息和路径
            const nodesDetails = await Promise.all(
                ids
                    .filter((pathId) => !treeDataIds.includes(pathId))
                    .map(async (id) => {
                        if (id === unCategorizedObj?.id) {
                            return unCategorizedObj
                        }
                        if (id === otherCategorizedObj?.id) {
                            return otherCategorizedObj
                        }
                        const detail: any = await getSubjectDomainDetail(id)
                        const pathIds = detail?.path_id?.split('/') || []

                        // 假设 pathId 是完整的路径字符串，如 "root/parent/child"
                        const parentId =
                            pathIds?.length >= 2
                                ? pathIds[pathIds.length - 2]
                                : ''
                        return {
                            ...detail,
                            pId: parentId,
                        }
                    }),
            )

            nodesDetails.forEach((detail) => {
                if (detail?.path_id) {
                    const pathIds = detail.path_id.split('/')?.slice(0, -1)
                    allPathIds = [...allPathIds, ...pathIds]
                }
            })
            allPathIds = uniq(allPathIds)

            // 存储所有需要加载子节点信息的路径ID
            const unLoadIds =
                allPathIds?.filter(
                    (currentId) =>
                        !treeDataTemp.find(
                            (treeinfo) => treeinfo.pId === currentId,
                        ),
                ) || []

            // 3. 获取所有路径节点的详细信息
            const pathNodesInfo = await Promise.all(
                unLoadIds.map(async (pathId) => {
                    if (pathId) {
                        const children = await getLoadData({ id: pathId })
                        return children?.map((node) => ({
                            ...node,
                            pId: pathId,
                        }))
                    }
                    return []
                }),
            )
            // 更新已加载的ID
            gotDetailIds = [...gotDetailIds, ...unLoadIds]

            const { reqNodeDisable, unCategorizedObjDisable } = isNodeDisable

            // 4. 合并所有节点信息
            allNodes = uniqBy(
                [...treeDataTemp, ...pathNodesInfo.flat()],
                'id',
            ).map((node) => ({
                ...node,
                title: node.name,
                name: <span title={node?.path_name}>{node.name}</span>,
                isLeaf:
                    !node?.child_count ||
                    leafNodeTypes.includes(node.type as BusinessDomainType),
                selectable: selectableTypes.includes(
                    node.type as BusinessDomainType,
                ),
                icon: node.id !== unCategorizedObj?.id && (
                    <GlossaryIcon
                        width="20px"
                        type={node.type as BusinessDomainType}
                        fontSize="20px"
                    />
                ),
                disabled:
                    node.id === unCategorizedObj?.id
                        ? disableOther || unCategorizedObjDisable
                        : reqNodeDisable,
                disableCheckbox:
                    node.type === BusinessDomainType.subject_domain_group,
            }))

            setTreeData(allNodes)
            setTimeout(() => {
                setTreeLoadedKeys(
                    uniq([...treeLoadedKeys, ...(allPathIds || [])]),
                )
                setTreeExpandedKeys(
                    uniq([...treeExpandedKeys, ...(allPathIds || [])]),
                )
            }, 100)
            setSelectedValue(ids)
        } catch (error) {
            formatError(error)
        }
    }

    /**
     * 根据默认选中项，默认展开对应层级
     * @param id
     */
    const getDefaultDomainInfo = async (id: string) => {
        try {
            const res: any = await getSubjectDomainDetail(id)
            const pathIds = res?.path_id?.split('/').slice(0, -1) || []

            const unLoadData =
                pathIds?.filter(
                    (currentId) =>
                        !treeData.find(
                            (treeinfo) => treeinfo.pId === currentId,
                        ),
                ) || []

            const newNodes = await Promise.all(
                unLoadData.map((currentId) =>
                    getLoadData({ id: currentId } as any),
                ),
            )
            let treeDataTemp: any = []
            if (treeData.length) {
                treeDataTemp = [...treeData, ...newNodes.flat()]
            } else {
                const rootNode = await getRootNode()
                treeDataTemp = [...rootNode, ...newNodes.flat()]
            }

            const { reqNodeDisable, unCategorizedObjDisable } = isNodeDisable

            if (multiple) {
                treeDataTemp = treeDataTemp.map((node) => {
                    if (node.id === unCategorizedObj?.id) {
                        return {
                            ...node,
                            disabled: unCategorizedObjDisable,
                        }
                    }
                    return {
                        ...node,
                        disabled: reqNodeDisable,
                    }
                })
            }

            setTreeData(treeDataTemp)

            setTimeout(() => {
                setTreeLoadedKeys([...(treeLoadedKeys || []), ...pathIds])
                setTreeExpandedKeys([...(treeExpandedKeys || []), ...pathIds])
                // 非多选模式下，选中当前节点
                if (!multiple) {
                    setSelectedValue(id)
                }
            }, 100)
        } catch (ex) {
            getDomains()
            setTimeout(() => {
                setTreeLoadedKeys([])
                setTreeExpandedKeys([])
            }, 100)
            if (
                ex.data.code ===
                'ConfigurationCenter.BusinessStructure.RecordNotFoundError'
            ) {
                getInitValueError(__('该部门已被删除，请重新选择'))
            } else {
                formatError(ex)
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * 获取默认需要展开的数据
     * @param param0
     * @returns
     */
    const getLoadData = async ({ id }) => {
        try {
            const res = await getSubjectDomain({
                ...CommonParams,
                parent_id: id,
            })
            return res.entries.map((node) => ({
                ...node,
                title: node.name,
                name: <span title={node?.path}>{node.name}</span>,
                pId: id,
                selectable: selectableTypes.includes(
                    node.type as BusinessDomainType,
                ),
                isLeaf:
                    !node?.child_count ||
                    leafNodeTypes.includes(node.type as BusinessDomainType),
                icon: (
                    <GlossaryIcon
                        width="20px"
                        type={node.type as BusinessDomainType}
                        fontSize="20px"
                    />
                ),
            }))
        } catch (err) {
            formatError(err)
            return Promise.resolve([])
        }
    }

    /**
     * 获取根节点的数据
     * @returns
     */
    const getRootNode = async () => {
        try {
            const res = await getSubjectDomain(CommonParams)
            const data = unCategorizedObj?.id
                ? [...(res.entries || []), unCategorizedObj]
                : res.entries || []
            return data.map((node) => ({
                ...node,
                isLeaf:
                    !node?.child_count ||
                    leafNodeTypes.includes(node.type as BusinessDomainType),
                selectable: selectableTypes.includes(
                    node.type as BusinessDomainType,
                ),
                title: node.name,
                name: <span title={node?.path}>{node.name}</span>,
                pId: '',
                icon: (
                    <GlossaryIcon
                        width="20px"
                        type={node.type as BusinessDomainType}
                        fontSize="20px"
                    />
                ),
            }))
        } catch (err) {
            formatError(err)
            return Promise.resolve([])
        }
    }

    /**
     * 获取根节点
     */
    const getDomains = async () => {
        try {
            const res = (await getSubjectDomain(CommonParams)) || {}
            const data = res.entries || []
            if (otherCategorizedObj?.id) {
                data.push(otherCategorizedObj)
            }
            if (unCategorizedObj?.id) {
                data.push(unCategorizedObj)
            }
            const { reqNodeDisable, unCategorizedObjDisable } = isNodeDisable

            setTreeData(
                data.map((node) => ({
                    ...node,
                    isLeaf:
                        !node?.child_count ||
                        leafNodeTypes.includes(node.type as BusinessDomainType),
                    selectable: selectableTypes.includes(
                        node.type as BusinessDomainType,
                    ),
                    disabled:
                        node.id === unCategorizedObj?.id
                            ? unCategorizedObjDisable
                            : reqNodeDisable,
                    disableCheckbox:
                        node.type === BusinessDomainType.subject_domain_group,
                    title: node.name,
                    name: <span title={node?.path_name}>{node.name}</span>,
                    pId: '',
                    icon: node.id !== unCategorizedObj?.id &&
                        node.id !== otherCategorizedObj?.id && (
                            <GlossaryIcon
                                width="20px"
                                type={node.type as BusinessDomainType}
                                fontSize="20px"
                            />
                        ),
                })),
            )
            // 设置第一层级数据
            // setOptions(
            //     res.entries?.length > 0
            //         ? [...commonHeader, ...businessDomainList]
            //         : [],
            // )
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 展开节点
     * @param param0
     */
    const handleLoadData: TreeSelectProps['loadData'] = async ({
        id,
        type,
    }) => {
        try {
            const res = await getSubjectDomain({
                ...CommonParams,
                parent_id: id,
            })
            const hasMultpSelValue = multiple && selectedValue?.length
            const hasUnCategorized = selectedValue?.includes(
                unCategorizedObj?.id,
            )
            const { reqNodeDisable, unCategorizedObjDisable } = isNodeDisable
            setTreeData([
                ...treeData,
                ...res.entries.map((node) => ({
                    ...node,
                    title: node.name,
                    name: <span title={node?.path_name}>{node.name}</span>,
                    pId: id,
                    isLeaf:
                        !node?.child_count ||
                        leafNodeTypes.includes(node.type as BusinessDomainType),
                    selectable: selectableTypes.includes(
                        node.type as BusinessDomainType,
                    ),
                    // disabled:
                    //     node.id === unCategorizedObj?.id
                    //         ? unCategorizedObjDisable
                    //         : reqNodeDisable,
                    disabled: reqNodeDisable,
                    disableCheckbox:
                        node.type === BusinessDomainType.subject_domain_group,

                    icon: (
                        <GlossaryIcon
                            width="20px"
                            type={node.type as BusinessDomainType}
                            fontSize="20px"
                        />
                    ),
                })),
            ])
            setTreeLoadedKeys([...treeLoadedKeys, id])
            setTreeExpandedKeys([...treeExpandedKeys, id])
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <TreeSelect
            treeDataSimpleMode
            getPopupContainer={(node) => node.parentNode}
            treeDefaultExpandedKeys={treeLoadedKeys}
            treeExpandedKeys={searchValue ? treeLoadedKeys : treeExpandedKeys}
            treeLoadedKeys={treeLoadedKeys}
            treeDefaultExpandAll
            style={{ width: '100%' }}
            dropdownStyle={{
                width: '100%',
                maxHeight: 400,
                overflow: 'auto',
            }}
            value={selectedValue}
            placeholder={placeholder}
            onTreeExpand={(keys: Array<Key>) => {
                setTreeExpandedKeys(keys)
            }}
            onChange={(changedValue, label) => {
                // if (multiple && !changedValue?.length) {
                //     setTreeExpandedKeys([])
                // }
                if (multiple && isArray(changedValue)) {
                    disableTreeDataNode(changedValue)
                }
                onChange(changedValue, label)
            }}
            dropdownMatchSelectWidth={false}
            loadData={handleLoadData}
            treeData={treeData}
            switcherIcon={<DownOutlined />}
            treeIcon
            fieldNames={{
                label: 'name',
                value: 'id',
            }}
            allowClear={allowClear}
            popupClassName={classNames(
                styles.treeSelectThemeDomainWrapper,
                unCategorizedObj?.id && styles.hasUnCategorized,
                searchValue && styles.treeSelectSearchWrapper,
            )}
            treeCheckable={treeCheckable}
            showSearch
            treeNodeFilterProp="title"
            searchValue={searchValue}
            onSearch={(val) => setSearchValue(val)}
            {...props}
        />
    )
}

export default TreeSelectThemeDomain
