import { CheckOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { Graph, Node } from '@antv/x6'
import { register } from '@antv/x6-react-shape'
import { useDebounce, useUpdateEffect } from 'ahooks'
import {
    ConfigProvider,
    Dropdown,
    Input,
    MenuProps,
    message,
    Tooltip,
} from 'antd'
import classNames from 'classnames'
import { trim } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import { ErrorInfo } from '@/utils'
import {
    AttributeOutlined,
    CloseOutlined,
    EllipsisOutlined,
    FontIcon,
    StandardOutlined,
    UniqueFlagColored,
} from '@/icons'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import {
    CatalogType,
    DataGradeLabelType,
    formatError,
    formsQueryStandardItem,
    IDataItem,
    IGradeLabel,
    IStdRecParams,
} from '@/core'
import SelDataByTypeModal from '@/components/SelDataByTypeModal'
import { getTargetTag } from '@/components/BusinessFormDefineObj/const'
import DataEleDetails from '../../DataEleManage/Details'
import { NodeType, OperateType, standardFields } from '../const'
import { findNodeById, getAntdLocal, graphDeleteNode } from '../helper'
import __ from '../locale'
import styles from './styles.module.less'

let callbackColl: any = []
interface IAttributeNodeComponent {
    node: Node
    graph: Graph
}
const AttributeNodeComponent: React.FC<IAttributeNodeComponent> = ({
    node,
    graph,
}) => {
    const { data } = node

    const [nodeData, setNodeData] = useState<any>(data)
    const [name, setName] = useState('')
    const debounceName = useDebounce(name, { wait: 500 })
    const [isRename, setIsRename] = useState(false)
    const [relateStandardOpen, setRelateStandardOpen] = useState(false)
    const [tipOpen, setTipOpen] = useState(false)
    const [isNameError, setIsNameError] = useState(false)
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])
    // 选择数据元弹窗-数据元详情id
    const [showDEDetailId, setShowDEDetailId] = useState<string>('')
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    const [tags, setTags] = useState<any[]>([])

    const [tipType, setTipType] = useState('')
    const [originData, setOriginData] = useState<IGradeLabel[]>([])
    const [isStart] = useGradeLabelState()
    const [labelInfo, setLabelInfo] = useState<any>({})
    const [stdRecParams, setStdRecParams] = useState<IStdRecParams>()

    useEffect(() => {
        setLabelInfo({
            label_id: data.dataInfo.label_id,
            label_name: data.dataInfo.label_name,
            label_icon: data.dataInfo.label_icon,
        })
    }, [])

    const isAllowSetUnique = useMemo(
        () =>
            nodeData.dataInfo?.standard_info?.data_type
                ? ['char', 'number'].includes(
                      nodeData.dataInfo?.standard_info?.data_type,
                  )
                : true,
        [nodeData],
    )

    // 同级节点的所有名字
    const sameLevelNames = useMemo(() => {
        const currentParentData = findNodeById(
            callbackColl[2](),
            nodeData.parentId,
        )
        const names: string[] = []
        currentParentData?.children?.forEach((item) => {
            if (item.id !== nodeData.id) names.push(item.dataInfo?.name)
        })
        return names
    }, [data])

    useEffect(() => {
        graph.container.addEventListener('click', () => {
            setTipOpen(false)
        })
    }, [graph])

    useUpdateEffect(() => {
        // 重名时不允许保存
        if (sameLevelNames.find((n) => n === debounceName)) {
            callbackColl[4]?.()({
                ...callbackColl[5]?.(),
                [nodeData.id]: __('属性名称在同一逻辑实体中重复，请重新输入'),
            })
            setIsNameError(false)
        } else if (!debounceName) {
            callbackColl[4]?.()({
                ...callbackColl[5]?.(),
                [nodeData.id]: '',
            })
            setIsNameError(false)
        }
        //  else {
        //     callbackColl[4]?.()({
        //         ...callbackColl[5]?.(),
        //         [nodeData.id]: ErrorInfo.ONLYSUP,
        //     })
        //     setIsNameError(true)
        // }
    }, [debounceName])

    useEffect(() => {
        setNodeData(data)
        // setName(data?.dataInfo?.name)
        if (!data?.dataInfo?.name) {
            setIsRename(true)
        }
    }, [data])

    const generateTagItem = (dataArr: IGradeLabel[], id: string) => {
        return dataArr.map((item) => {
            if (item.node_type === DataGradeLabelType.Node) {
                return {
                    className: 'tag-sub-menu-item',
                    label: (
                        <div
                            className={classNames(
                                styles['dropdown-item'],
                                id === item.id &&
                                    styles['dropdown-item-selected'],
                            )}
                        >
                            <div className={styles.left}>
                                {item.id && (
                                    <FontIcon
                                        name="icon-biaoqianicon"
                                        className={styles['tag-icon']}
                                        style={{ color: item.icon }}
                                    />
                                )}
                                <div
                                    className={styles['tag-name']}
                                    title={item.name}
                                >
                                    {item.name}
                                </div>
                            </div>
                            {id === item.id ? (
                                <CheckOutlined
                                    className={styles['checked-icon']}
                                />
                            ) : (
                                <div />
                            )}
                        </div>
                    ),
                    key: item.id,
                }
            }
            // item.node_type === DataGradeLabelType.Group
            return {
                className: item.children?.length > 0 ? 'tag-sub-menu-item' : '',
                label: <span title={item.name}>{item.name}</span>,
                key: item.id,
                style: { width: 140 },
                children:
                    item.children?.length > 0
                        ? generateTagItem(item.children, id)
                        : undefined,
            }
        })
    }

    const getClassificationTag = async () => {
        try {
            // const res = await getDataGradeLabel({ keyword: '' })
            const tagDataTemp = callbackColl[6]?.() || []
            const tagData: IGradeLabel[] = [
                ...(Array.isArray(tagDataTemp) ? tagDataTemp : []),
                {
                    id: '',
                    name: __('无'),
                    node_type: DataGradeLabelType.Node,
                    description: '',
                    parent_id: '',
                    icon: '',
                } as IGradeLabel,
            ]
            setTags(generateTagItem(tagData, data.dataInfo.label_id))
            setOriginData(tagData)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (isStart) {
            getClassificationTag()
        }
    }, [isStart])

    const items: MenuProps['items'] = useMemo(() => {
        const hiddenOperateKey: OperateType[] = []
        hiddenOperateKey.push(
            nodeData?.dataInfo?.unique
                ? OperateType.SetUniqueFlag
                : OperateType.CancelUniqueFlag,
        )
        if (!isStart) {
            hiddenOperateKey.push(OperateType.SetClassification)
        }
        if (nodeData?.dataInfo?.standard_info?.id) {
            hiddenOperateKey.push(OperateType.ReferenceStandard)
        } else {
            hiddenOperateKey.push(OperateType.UpdateReferenceStandard)
            hiddenOperateKey.push(OperateType.DeleteReferenceStandard)
        }
        const allOperate: Array<any> = [
            {
                className: styles.Outer,
                key: OperateType.SetUniqueFlag,
                label: (
                    <Tooltip
                        title={
                            isAllowSetUnique
                                ? ''
                                : __(
                                      '关联标准不属于字符型或数字型，无法设为唯一标识',
                                  )
                        }
                    >
                        <div
                            style={{
                                color: !isAllowSetUnique
                                    ? 'rgba(0, 0, 0, 0.45)'
                                    : 'unset',
                            }}
                            className={styles['dropdown-item']}
                        >
                            {__('设为唯一标识')}
                        </div>
                    </Tooltip>
                ),
            },
            {
                key: OperateType.CancelUniqueFlag,
                label: (
                    <div className={styles['dropdown-item']}>
                        {__('取消唯一标识')}
                    </div>
                ),
            },
            {
                key: OperateType.ReferenceStandard,
                label: (
                    <div className={styles['dropdown-item']}>
                        {__('关联标准')}
                    </div>
                ),
            },
            {
                key: OperateType.UpdateReferenceStandard,
                label: (
                    <div className={styles['dropdown-item']}>
                        {__('更换关联标准')}
                    </div>
                ),
            },
            {
                key: OperateType.DeleteReferenceStandard,
                label: (
                    <div className={styles['dropdown-item']}>
                        {__('解除关联标准')}
                    </div>
                ),
            },
            {
                key: OperateType.SetClassification,
                label: (
                    <div
                        className={classNames(
                            styles['dropdown-item'],
                            // styles['dropdown-item-selected'],
                        )}
                    >
                        {__('设置数据分级')}
                    </div>
                ),
                children: tags,
            },
            {
                key: OperateType.Rename,
                label: (
                    <div className={styles['dropdown-item']}>
                        {__('重命名')}
                    </div>
                ),
            },
            {
                key: OperateType.Delete,
                label: (
                    <div className={styles['dropdown-item']}>{__('删除')}</div>
                ),
            },
        ]
        return allOperate.filter(
            (operate: { key: OperateType }) =>
                !hiddenOperateKey.includes(operate.key),
        )
    }, [nodeData, tags, isStart])

    // 设置唯一标识
    const setUniqueFlag = () => {
        const nodes = graph
            .getNodes()
            .filter((n) => n.data.nodeType === NodeType.Attribute)

        const currentParentData = findNodeById(
            callbackColl[2](),
            nodeData.parentId,
        )
        const uniqueAttr = currentParentData?.children?.find(
            (child) => child?.dataInfo?.unique,
        )

        if (uniqueAttr) {
            // 唯一标识节点的下标
            const uniqueAttributeNodeIndex = nodes.findIndex(
                (n) => n.data?.dataInfo?.id === uniqueAttr.dataInfo?.id,
            )

            confirm({
                title: '确认要替换吗？',
                icon: <ExclamationCircleOutlined />,
                content: (
                    <div
                        className={styles.modalContent}
                    >{`属性 「${uniqueAttr?.dataInfo?.name}」 已被设置为唯一标识属性，是否替换为「${nodeData.dataInfo.name}」？`}</div>
                ),
                okText: '确定',
                cancelText: '取消',
                onOk: () => {
                    const currentData = findNodeById(
                        callbackColl[2](),
                        nodeData.id,
                    )
                    const uniqueData = findNodeById(
                        callbackColl[2](),
                        nodes[uniqueAttributeNodeIndex].id,
                    )
                    if (uniqueData) {
                        // 已存在唯一标识清空
                        uniqueData.dataInfo = {
                            ...uniqueData.dataInfo,
                            unique: false,
                        }
                        nodes[uniqueAttributeNodeIndex].replaceData({
                            ...uniqueData,
                        })
                    }

                    if (currentData && currentData?.dataInfo) {
                        // 设置当前节点唯一标识
                        currentData.dataInfo.unique = true
                        node.replaceData({
                            ...nodeData,
                            dataInfo: {
                                ...nodeData.dataInfo,
                                unique: true,
                                isUpdate: true,
                            },
                        })
                    }
                    message.success(
                        <div className={styles.uniqueTips}>
                            {__('属性')}「
                            <div className={styles.attrName}>
                                {nodeData?.dataInfo?.name}
                            </div>
                            」{__('已设为唯一标识')}
                        </div>,
                    )
                },
            })
        } else {
            const currentData = findNodeById(callbackColl[2](), nodeData.id)
            if (currentData && currentData?.dataInfo) {
                node.replaceData({
                    ...nodeData,
                    dataInfo: { ...nodeData.dataInfo, unique: true },
                })
                currentData.dataInfo.unique = true

                message.success(
                    <div className={styles.uniqueTips}>
                        {__('属性')}「
                        <div className={styles.attrName}>
                            {nodeData?.dataInfo?.name}
                        </div>
                        」{__('已设为唯一标识')}
                    </div>,
                )
            }
        }
    }

    // 取消唯一标识
    const cancelUniqueFlag = () => {
        const currentData = findNodeById(callbackColl[2](), nodeData.id)
        if (currentData && currentData?.dataInfo) {
            currentData.dataInfo.unique = false

            node.replaceData({
                ...nodeData,
                dataInfo: {
                    ...nodeData.dataInfo,
                    unique: false,
                    isUpdate: true,
                },
            })
        }
    }

    // 删除关联标准
    const deleteStandard = () => {
        const currentData = findNodeById(callbackColl[2](), nodeData.id)
        if (currentData && currentData?.dataInfo) {
            currentData.dataInfo = {
                ...currentData.dataInfo,
                standard_info: undefined,
            }

            node.replaceData({
                ...nodeData,
                dataInfo: { ...currentData.dataInfo },
            })
        }
    }

    const getStdRecInfo = async () => {
        const currentParentData = findNodeById(
            callbackColl[2](),
            nodeData.parentId,
        )

        setStdRecParams({
            table_name: currentParentData?.dataInfo?.name,
            table_fields: [
                {
                    table_field: nodeData.dataInfo?.name,
                },
            ],
        })
    }

    const onClick = ({ key, keyPath }) => {
        // 选择标签的情况
        if (!Object.values(OperateType).includes(key)) {
            const targetTag: IGradeLabel = getTargetTag(originData, key)!
            const currentData = findNodeById(callbackColl[2](), nodeData.id)
            if (currentData && currentData?.dataInfo) {
                const dataInfo = {
                    ...currentData.dataInfo,
                    // 选择分级标签后 如果原标准有标签 则取消标准
                    standard_info: currentData.dataInfo?.standard_info?.label_id
                        ? {}
                        : currentData.dataInfo?.standard_info,
                    label_id: key,
                    label_name: targetTag.name,
                    label_icon: targetTag.icon,
                }
                setTags(generateTagItem(originData, key))
                currentData.dataInfo = dataInfo
                setLabelInfo({
                    label_id: key,
                    label_name: targetTag.name,
                    label_icon: targetTag.icon,
                })
                node.replaceData({
                    ...nodeData,
                    dataInfo,
                })
            }
        }
        switch (key) {
            case OperateType.SetUniqueFlag:
                if (!isAllowSetUnique) return
                setUniqueFlag()
                break
            case OperateType.CancelUniqueFlag:
                cancelUniqueFlag()
                break
            case OperateType.ReferenceStandard:
                getStdRecInfo()
                setRelateStandardOpen(true)
                break
            case OperateType.UpdateReferenceStandard:
                getStdRecInfo()
                setRelateStandardOpen(true)
                break
            case OperateType.DeleteReferenceStandard:
                deleteStandard()
                break
            case OperateType.Rename:
                setIsRename(true)
                setName(data?.dataInfo?.name)
                break
            case OperateType.Delete:
                graphDeleteNode(
                    callbackColl[0]().current,
                    callbackColl[2](),
                    node.id,
                )
                break
            default:
                break
        }
    }

    const getNewName = (names: string[], i = 0) => {
        const newName = i === 0 ? __('属性未命名') : `${__('属性未命名')}${i}`
        if (names.find((n) => n === newName)) {
            return getNewName(names, i + 1)
        }
        return newName
    }

    const renameOver = () => {
        if (isNameError) return
        let newName = ''

        if (name) {
            if (sameLevelNames.find((item) => item === name)) {
                message.error(__('属性名称在同一逻辑实体中重复，请重新输入'))
                return
            }
        } else {
            newName = getNewName(sameLevelNames)
        }

        setIsRename(false)
        node.replaceData({
            ...nodeData,
            dataInfo: { ...nodeData.dataInfo, name: name || newName },
        })
        const currentData = findNodeById(callbackColl[2](), node.id)
        if (currentData && currentData?.dataInfo) {
            currentData.dataInfo.name = name || newName
        }
    }

    const handleNameChange = (e) => {
        setName(trim(e.target.value))
    }

    const handleOK = (standardInfo) => {
        const currentData = findNodeById(callbackColl[2](), nodeData.id)
        if (currentData && currentData?.dataInfo) {
            const dataInfo = {
                ...currentData.dataInfo,
                tipOpen: false,
                standard_info: {
                    ...standardInfo,
                    // id: standardInfo.std_id,
                },
            }
            node.replaceData({
                ...nodeData,
                dataInfo,
            })

            currentData.dataInfo = dataInfo
            setRelateStandardOpen(false)
        }
    }

    const toggleTip = (isClose = false) => {
        if (nodeData.dataInfo?.tipOpen === false && isClose) return
        if (nodeData && nodeData?.dataInfo) {
            const dataInfo = {
                ...nodeData.dataInfo,
                tipOpen: isClose ? false : !nodeData.dataInfo?.tipOpen,
            }
            node.replaceData({
                ...nodeData,
                dataInfo,
            })
            const currentData = findNodeById(callbackColl[2](), nodeData.id)
            if (currentData) {
                currentData.dataInfo = dataInfo
            }
        }
    }

    // 关闭其他属性标准的弹窗
    const closeOtherStandardTip = () => {
        // 标准详情弹窗展开的节点
        const standardTipOpenNode = graph
            .getNodes()
            .filter(
                (n) =>
                    n.data.nodeType === NodeType.Attribute &&
                    n.data.id !== nodeData.id &&
                    n.data.dataInfo.tipOpen,
            )?.[0]

        if (standardTipOpenNode) {
            const currentData = findNodeById(
                callbackColl[2](),
                standardTipOpenNode.data.id,
            )
            if (currentData?.dataInfo?.tipOpen) {
                const dataInfo = {
                    ...currentData.dataInfo,
                    tipOpen: false,
                }
                standardTipOpenNode.replaceData({
                    ...standardTipOpenNode.data,
                    dataInfo,
                })

                currentData.dataInfo = dataInfo
            }
        }
    }

    const handleSelected = async (eleData) => {
        try {
            const res = await formsQueryStandardItem({ code: eleData.code })
            const labelData = eleData.label_id
                ? {
                      label_id: eleData.label_id,
                      label_name: eleData.label_name,
                      label_icon: eleData.label_icon,
                  }
                : {}
            if (res) {
                const currentData = findNodeById(callbackColl[2](), nodeData.id)
                if (currentData && currentData?.dataInfo) {
                    const dataInfo = {
                        ...currentData.dataInfo,
                        tipOpen: false,
                        standard_info: {
                            ...res,
                            ...labelData,
                        },
                        ...labelData,
                    }
                    node.replaceData({
                        ...nodeData,
                        dataInfo,
                    })

                    currentData.dataInfo = dataInfo
                    setRelateStandardOpen(false)
                    if (eleData.label_id) {
                        setLabelInfo(labelData)
                        setTags(generateTagItem(originData, eleData.label_id))
                    }
                }
            }
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <ConfigProvider
            locale={getAntdLocal()}
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <div
                className={classNames(
                    styles.commonShapeWrapper,
                    styles.attributeShapeWrapper,
                )}
            >
                <div className={styles.common}>
                    {isRename ? (
                        <Input
                            placeholder={__('请输入属性名称')}
                            value={name}
                            autoFocus
                            onBlur={() => renameOver()}
                            onPressEnter={() => renameOver()}
                            onChange={handleNameChange}
                            maxLength={255}
                            className={
                                isNameError ? styles.nameInput : undefined
                            }
                        />
                    ) : (
                        <>
                            <AttributeOutlined className={styles.typeIcon} />
                            <span
                                className={styles.name}
                                title={nodeData?.dataInfo?.name}
                            >
                                {nodeData?.dataInfo?.name}
                            </span>
                            {callbackColl[3]() === 'edit' && (
                                <div className={styles.right}>
                                    <Dropdown
                                        menu={{
                                            items,
                                            onClick,
                                        }}
                                        placement="bottom"
                                        trigger={['click']}
                                        getPopupContainer={() =>
                                            graph.container
                                        }
                                        overlayClassName={
                                            styles['attribute-dropdown']
                                        }
                                    >
                                        <div className={styles.operate}>
                                            <EllipsisOutlined />
                                        </div>
                                    </Dropdown>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {nodeData?.dataInfo?.unique && (
                    <div className={styles.uniqueFlag}>
                        <UniqueFlagColored />
                    </div>
                )}

                {nodeData?.dataInfo?.standard_info?.id && (
                    <Tooltip
                        open={tipOpen}
                        // autoAdjustOverflow={false}
                        color="white"
                        overlayClassName={styles.standardToolTip}
                        title={
                            <div
                                className={styles.standardDetailsWrapper}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <div className={styles.title}>
                                    {__('标准数据元详情')}
                                    <CloseOutlined
                                        className={styles.closeIcon}
                                        onClick={() => {
                                            setTipOpen(false)
                                        }}
                                    />
                                </div>
                                <div className={styles.detailsInfo}>
                                    {standardFields.map((standard) => (
                                        <div
                                            className={styles.fieldItem}
                                            key={standard.key}
                                        >
                                            <div className={styles.label}>
                                                {standard.label}
                                            </div>
                                            <div
                                                className={styles.value}
                                                title={
                                                    nodeData?.dataInfo
                                                        ?.standard_info?.[
                                                        standard.key
                                                    ]
                                                }
                                            >
                                                {
                                                    nodeData?.dataInfo
                                                        ?.standard_info?.[
                                                        standard.key
                                                    ]
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }
                        getPopupContainer={(n) => graph.container}
                        placement="topLeft"
                    >
                        <Tooltip title={__('标准详情')} placement="bottom">
                            <div
                                className={classNames(
                                    styles.standardIconContainer,
                                    tipOpen && styles.openContainer,
                                )}
                                onClick={(e) => {
                                    // e.stopPropagation()
                                    setTimeout(() => {
                                        setTipOpen(true)
                                    }, 100)
                                }}
                            >
                                <StandardOutlined
                                    className={styles.standardIcon}
                                />
                            </div>
                        </Tooltip>
                    </Tooltip>
                )}

                {isStart && labelInfo?.label_id && labelInfo?.label_name && (
                    <Tooltip
                        title={
                            <span style={{ color: '#000' }}>
                                {labelInfo?.label_name}
                            </span>
                        }
                        placement="bottom"
                        color="#fff"
                    >
                        <div
                            className={classNames(
                                styles.standardIconContainer,
                                styles.tagIconContainer,
                                !nodeData?.dataInfo?.standard_info?.id &&
                                    styles.onlyTagIconContainer,
                                nodeData?.dataInfo?.tipOpen &&
                                    tipType === 'tag' &&
                                    styles.openContainer,
                            )}
                        >
                            <FontIcon
                                name="icon-biaoqianicon"
                                className={styles.standardIcon}
                                style={{
                                    color: labelInfo?.label_icon,
                                }}
                            />
                        </div>
                    </Tooltip>
                )}
                {/* {isStart && labelInfo?.label_id && (
                    <Tooltip
                        open={nodeData?.dataInfo?.tipOpen && tipType === 'tag'}
                        autoAdjustOverflow={false}
                        color="white"
                        overlayClassName={classNames(
                            styles.standardToolTip,
                            styles.tagToolTip,
                        )}
                        destroyTooltipOnHide
                        title={
                            <div
                                className={styles.standardDetailsWrapper}
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <div className={styles.title}>
                                    {__('数据分级')}
                                    <CloseOutlined
                                        className={styles.closeIcon}
                                        onClick={() => {
                                            toggleTip()
                                            setTipType('')
                                        }}
                                    />
                                </div>
                                <div className={styles.detailsInfo}>
                                    <FontIcon
                                        name="icon-biaoqianicon"
                                        style={{
                                            color: labelInfo?.label_icon,
                                        }}
                                    />
                                    <span className={styles.tagName}>
                                        {labelInfo?.label_name}
                                    </span>
                                    {nodeData?.dataInfo?.standard_info
                                        ?.label_id ===
                                        nodeData?.dataInfo?.label_id && (
                                        <div className={styles.tagOrigin}>
                                            {__('来源：${name}', {
                                                name: '数据标准',
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        }
                        getPopupContainer={(n) => graph.container}
                        placement="topLeft"
                    >
                        <Tooltip title={__('数据分级')} placement="bottom">
                            <div
                                className={classNames(
                                    styles.standardIconContainer,
                                    styles.tagIconContainer,
                                    !nodeData?.dataInfo?.standard_info?.id &&
                                        styles.onlyTagIconContainer,
                                    nodeData?.dataInfo?.tipOpen &&
                                        tipType === 'tag' &&
                                        styles.openContainer,
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    if (
                                        nodeData?.dataInfo?.tipOpen &&
                                        tipType === 'tag'
                                    ) {
                                        toggleTip()
                                    } else if (
                                        nodeData?.dataInfo?.tipOpen &&
                                        tipType === 'standard'
                                    ) {
                                        setTipType('tag')
                                    } else {
                                        toggleTip()
                                        setTipType('tag')
                                        closeOtherStandardTip()
                                    }
                                }}
                            >
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    className={styles.standardIcon}
                                    style={{
                                        color: labelInfo?.label_icon,
                                    }}
                                />
                            </div>
                        </Tooltip>
                    </Tooltip>
                )} */}

                {isNameError && (
                    <div className={styles.errorInfo}>{ErrorInfo.ONLYSUP}</div>
                )}
            </div>
            {/* <StandardChoose
                isUnique={nodeData.dataInfo.unique}
                open={relateStandardOpen}
                onClose={() => setRelateStandardOpen(false)}
                onOk={handleOK}
            /> */}
            <SelDataByTypeModal
                visible={relateStandardOpen}
                onClose={() => setRelateStandardOpen(false)}
                dataType={CatalogType.DATAELE}
                oprItems={selDataItems}
                setOprItems={setSelDataItems}
                onOk={(oprItems: any) => {
                    if (oprItems?.[0].code) {
                        handleSelected(oprItems?.[0])
                    }
                }}
                handleShowDataDetail={(
                    dataType: CatalogType,
                    dataId?: string,
                ) => {
                    setShowDEDetailId(dataId || '')
                    setDataEleDetailVisible(true)
                }}
                getContainer={() => graph.container}
                getDisabledDataEleInfo={(dataType) => {
                    // 0 数字型 1 字符型
                    if (
                        nodeData?.dataInfo?.unique &&
                        !(dataType === 0 || dataType === 1)
                    ) {
                        return {
                            disabled: true,
                            tip: __('唯一标识属性只能关联字符型或数字型的标准'),
                        }
                    }
                    return {
                        disabled: false,
                        tip: '',
                    }
                }}
                stdRecParams={stdRecParams}
            />
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!showDEDetailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={showDEDetailId}
                    onClose={() => setDataEleDetailVisible(false)}
                    getContainer={() => graph.container}
                />
            )}
        </ConfigProvider>
    )
}

const AttributeNode = (callback?: any): string => {
    if (callback) {
        callbackColl = callback
    }
    register({
        shape: NodeType.Attribute,
        effect: ['data'],
        component: AttributeNodeComponent,
    })
    return NodeType.Attribute
}

export default AttributeNode
