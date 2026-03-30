import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useGetState, useLocalStorageState } from 'ahooks'
import classnames from 'classnames'
import {
    ExclamationCircleOutlined,
    LinkOutlined,
    ReloadOutlined,
    RightOutlined,
} from '@ant-design/icons'
import { Dropdown, MenuProps, Radio, Tooltip } from 'antd'
import { cloneDeep } from 'lodash'
import {
    EllipsisOutlined,
    BusinessFormOutlined,
    FlowchartOutlined,
    SubFlowchartOutlined,
} from '@/icons'
import __ from './locale'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import {
    flowTreeNodeQuery,
    formatError,
    IFlowTreeParams,
    messageError,
    transformQuery,
} from '@/core'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import styles from './styles.module.less'
import { OperateType, useQuery } from '@/utils'
import { TaskInfoContext } from '@/context'
import FlowchartInfoManager, {
    FlowchartTreeNodeType,
    getViewmode,
    openWindowPreviewFlow,
    operateAfterSave,
    products,
    saveFlowRequest,
    totalOperates,
    ViewType,
} from './helper'
import SwimlaneNodeOutlined from '@/icons/SwimlaneNodeOutlined'
import NormalNodeOutlined from '@/icons/NormalNodeOutlined'
import ProcessNodeOutlined from '@/icons/ProcessNodeOutlined'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface DataNode {
    catalog_type: FlowchartTreeNodeType
    id: string
    name: string
    children?: DataNode[]
    isExpand?: boolean
    isLeaf?: boolean
    isError?: boolean
    level: number
    flowchart_level?: number
    absolutePath: string
    path: string
    [key: string]: any
}

/**
 * 流程目录树组件
 * @param hi 树高度
 * @param flowchartId 根流程图id
 * @param onOperate 流程图操作
 * @param getSelectedData 选中节点处理
 */
interface IDrawioTree {
    hi?: number | string
    flowchartId?: string
    mode: 'preview' | 'edit'
    onOperate?: (op) => void
    getSelectedData: (sn: DataNode) => void
}

const DrawioTree: React.FC<IDrawioTree> = ({
    hi,
    flowchartId,
    mode,
    onOperate,
    getSelectedData,
}) => {
    // 流程图相关信息
    const { drawioInfo, setDrawioInfo } = useContext(DrawioInfoContext)
    // 流程图存储所有信息
    const [df, setDf, getDf] = useGetState<any>()
    useMemo(() => {
        setDf(drawioInfo)
    }, [drawioInfo])
    // 存储信息
    const [afFlowchartInfo, setAfFlowchartInfo] = useLocalStorageState<any>(
        `${flowchartId}`,
    )
    const flowInfosMg = useMemo(() => {
        return new FlowchartInfoManager(
            afFlowchartInfo?.flowchartData?.infos || [],
            afFlowchartInfo?.flowchartData?.current,
        )
    }, [afFlowchartInfo])

    const query = useQuery()

    // 查看视角
    const [viewKey, setViewKey] = useState<ViewType>(
        (query.get('viewKey') || mode === 'preview'
            ? ViewType.FLOWPATH
            : ViewType.PROCESSNAV) as ViewType,
    )

    // 下拉菜单显示/隐藏
    const [listShow, setListShow] = useState(false)

    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)

    const { checkPermission } = useUserPermCtx()

    // 更多按钮的背景色
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')
    const [refreshEnabled, setRefreshEnabled] = useState(false)

    // 树结构
    const [treeData, setTreeData, getTreeData] = useGetState<DataNode[]>([])

    // 点击选中项的id，用来设置选中背景
    const [selectedNode, setSelectedNode, getSelectedNode] = useGetState<
        DataNode | undefined
    >()
    // load
    const [treeLoading, setTreeLoading] = useState(false)
    const { isDraft, selectedVersion, isButtonDisabled } =
        useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    // 获取最新数据
    const getLatestData = () => {
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')

            setAfFlowchartInfo(temp)
            return new FlowchartInfoManager(
                temp?.flowchartData?.infos || [],
                temp?.flowchartData?.current,
            )
        }
        return undefined
    }

    // 查找想要的节点
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

    // 调整选中节点
    const changeSelectedNode = (absolutePath?: string, id?: string) => {
        if (!absolutePath) {
            setSelectedNode(undefined)
            return
        }
        const temp = cloneDeep(getTreeData())
        const curNode = getTreeNode(temp || [], (node: DataNode) => {
            if (id) {
                return (
                    node.absolutePath.includes(absolutePath) &&
                    node.absolutePath.includes(id)
                )
            }
            return node.absolutePath === absolutePath
        })
        if (curNode !== null) {
            setSelectedNode(curNode)
        } else {
            setSelectedNode(undefined)
        }
    }

    useMemo(async () => {
        if (drawioInfo?.currentFid) {
            const fm = await getLatestData()
            // 更新选中的流程图节点
            if (fm?.current) {
                changeSelectedNode(fm.current?.absolutePath)
            }
        }
    }, [drawioInfo?.currentFid])

    useEffect(() => {
        // 消息处理
        const handleMessage = async (e) => {
            try {
                if (typeof e?.data === 'string') {
                    const data = JSON.parse(e?.data)
                    const { event } = data
                    switch (event) {
                        case 'af_flowContent':
                            // 获取drawio文件内容
                            saveFlowForJump(data)
                            break
                        case 'af_changeSelectedNode': {
                            // 更换选中节点
                            const fm = await getLatestData()
                            changeSelectedNode(
                                fm?.current?.absolutePath,
                                data.cellInfos.id,
                            )
                            break
                        }
                        case 'af_bindFlowChanged': {
                            // 绑定子流程删除
                            const fm = await getLatestData()
                            bindFlowChanged(fm?.current?.absolutePath, data.id)
                            break
                        }
                        case 'af_shouldUpdateForm':
                            setRefreshEnabled(true)
                            break
                        case 'af_updateFlowTree':
                            updateFlowTreeRootInfo(data)
                            break
                        default:
                            break
                    }
                }
            } catch (error) {
                // console.log('error ', error)
            }
        }

        window.addEventListener('message', handleMessage, false)
        return () => {
            window.removeEventListener('message', handleMessage, false)
            const tempStr = window.localStorage.getItem(`${flowchartId}`)
            if (tempStr !== null) {
                const temp = JSON.parse(tempStr || '')
                // 存储流程树
                if (temp?.isRecord) {
                    setAfFlowchartInfo({
                        ...temp,
                        flowchartTree: ViewType.PROCESSNAV
                            ? getTreeData()
                            : undefined,
                        isRecord: false,
                    })
                }
            }
        }
    }, [])

    useEffect(() => {
        // 从存储中取树数据
        const lsTree = window.localStorage.getItem(`${flowchartId}`)
        let temp
        if (lsTree !== null && mode === 'edit') {
            temp = JSON.parse(lsTree || '')?.flowchartTree
            setTreeData(temp)
        }
        if (!temp && flowchartId && flowInfosMg?.root) {
            // 根流程图加入树结构
            const { mid, title, mbsid, read_only, is_ref } = flowInfosMg.root
            const firstNode = {
                catalog_type: FlowchartTreeNodeType.FLOWCHART,
                id: flowchartId,
                name: title,
                absolutePath: flowchartId,
                path: flowchartId,
                isExpand: true,
                level: 0,
                flowchart_level: 1,
                flowchart_id: flowchartId,
                flowchart_name: title,
                main_business_id: mbsid,
                business_model_id: mid,
                is_ref,
                read_only,
            }
            setSelectedNode(firstNode)
            setTreeData([firstNode])
            // 请求根数据
            setTreeLoading(true)
            getFlowTreeQuery(
                {
                    fid: flowchartId,
                    main_business_id: mbsid,
                    type: viewKey,
                },
                flowchartId,
            )
        }
    }, [flowchartId])

    useEffect(() => {
        // 切换树左上角下拉框查看模式时，初始化树节点+右侧流程图
        if (!flowchartId || !flowInfosMg?.root || mode === 'edit') return
        const { mid, title, mbsid, read_only, is_ref } = flowInfosMg.root
        const firstNode = {
            catalog_type: FlowchartTreeNodeType.FLOWCHART,
            id: flowchartId,
            name: title,
            absolutePath: flowchartId,
            path: flowchartId,
            isExpand: true,
            level: 0,
            flowchart_level: 1,
            flowchart_id: flowchartId,
            flowchart_name: title,
            main_business_id: mbsid,
            business_model_id: mid,
            is_ref,
            read_only,
        }
        setSelectedNode(firstNode)
        setTreeData([firstNode])
        // 请求根数据
        setTreeLoading(true)
        getFlowTreeQuery(
            {
                fid: flowchartId,
                main_business_id: mbsid,
                type: viewKey,
            },
            flowchartId,
        )
        const fm = getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)

        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            fm?.onCurrentData(firstNode?.path)
            setAfFlowchartInfo({
                ...temp,
                flowchartData: fm,
            })
            setDrawioInfo({
                ...getDf(),
                currentFid: firstNode?.id,
                viewKey,
            })
        }
    }, [viewKey])

    /**
     * 获取树数据
     * @param absolutePath 绝对路径
     */
    const getFlowTreeQuery = async (
        params: IFlowTreeParams,
        absolutePath?: string,
    ) => {
        if (!params.fid) {
            return
        }
        try {
            const res = await flowTreeNodeQuery(params.fid, {
                main_business_id: params?.main_business_id || '',
                node_id: params?.node_id || '',
                type: params?.type || ViewType.PROCESSNAV,
                ...versionParams,
            })
            setTreeData((origin) =>
                updateTreeData(
                    origin || [],
                    res.map((r) => {
                        return changeDataToCustomTree(r)
                    }),
                    absolutePath,
                ),
            )
        } catch (e) {
            if (
                e.data.code ===
                'BusinessGrooming.Flowchart.FlowchartNodeNotFound'
            ) {
                messageError(
                    __('未找到对应流程节点，流程导航已更新，请查看最新内容'),
                )
                refreshNav()
                return
            }
            formatError(e)
        } finally {
            setTreeLoading(false)
        }
    }

    // 循环转换树结构
    const updateTreeData = (
        list: DataNode[],
        children: DataNode[],
        absolutePath?: string,
    ): DataNode[] => {
        return list.map((node) => {
            if (node.absolutePath === absolutePath) {
                let childData = children.map((c) => {
                    if (
                        [
                            FlowchartTreeNodeType.PROCESS,
                            FlowchartTreeNodeType.FLOWCHART,
                        ].includes(c.catalog_type)
                    ) {
                        return {
                            ...c,
                            level: node.level + 1,
                            absolutePath: `${node.absolutePath}/${c.id}`,
                            path: `${node.path}/${c.id}`,
                        }
                    }
                    return {
                        ...c,
                        level: node.level + 1,
                        absolutePath: `${node.absolutePath}/${c.id}`,
                        path: node.path,
                    }
                })
                // 子流程类型
                if (
                    [
                        FlowchartTreeNodeType.PROCESS,
                        FlowchartTreeNodeType.FLOWCHART,
                    ].includes(node.catalog_type)
                ) {
                    childData = children.map((c) => {
                        // 路径处理，加入存储
                        if (
                            c.catalog_type === FlowchartTreeNodeType.FLOWCHART
                        ) {
                            const fm = getLatestData()
                            const tempStr = window.localStorage.getItem(
                                `${flowchartId}`,
                            )

                            if (tempStr !== null) {
                                const temp = JSON.parse(tempStr || '')
                                const infosHasSame =
                                    temp?.flowchartData?.infos?.find(
                                        (iItem) => iItem.path === c.path,
                                    )
                                if (!infosHasSame) {
                                    const path = `${node.path}/${c.id}`
                                    const abPath = `${node.absolutePath}/${c.id}`
                                    const oldData = fm?.find(path)
                                    if (
                                        fm?.current &&
                                        fm.current?.path === path
                                    ) {
                                        fm.current.absolutePath = abPath
                                    }
                                    fm?.addData({
                                        mid: c.business_model_id,
                                        fid: c.flowchart_id,
                                        title: c.flowchart_name,
                                        isRoot: false,
                                        is_ref: c.is_ref,
                                        mbsid:
                                            c.main_business_id ||
                                            fm?.current?.mbsid,
                                        read_only: c.read_only,
                                        path,
                                        absolutePath: abPath,
                                    })
                                    setAfFlowchartInfo({
                                        ...temp,
                                        flowchartData: fm,
                                    })
                                }
                            }
                        }
                        return {
                            ...c,
                            level: node.level + 1,
                            absolutePath: `${node.absolutePath}/${c.id}`,
                            path: `${node.path}/${c.id}`,
                        }
                    })
                }

                return {
                    ...node,
                    isExpand: true,
                    isLeaf: children.length === 0,
                    children: childData,
                }
            }
            if (node.children) {
                return {
                    ...node,
                    children: updateTreeData(
                        node.children,
                        children,
                        absolutePath,
                    ),
                }
            }
            return node
        })
    }

    // 数据类型转换，后端数据->树数据
    const changeDataToCustomTree = (data: any): DataNode => {
        switch (data.catalog_type) {
            case FlowchartTreeNodeType.FLOWCHART:
                return {
                    ...data?.sub_flowchart,
                    id: data?.sub_flowchart?.flowchart_id,
                    name: data?.sub_flowchart?.flowchart_name,
                    catalog_type: data.catalog_type,
                    read_only: data.read_only,
                }
            case FlowchartTreeNodeType.FORM:
                return {
                    ...data?.form,
                    id: data?.form?.form_id,
                    name: data?.form?.name,
                    catalog_type: data.catalog_type,
                    read_only: data.read_only,
                }
            case FlowchartTreeNodeType.SWIMLANE:
                return {
                    ...data?.node_swimlane,
                    id: data?.node_swimlane?.node_id,
                    name: data?.node_swimlane?.node_name,
                    catalog_type: data.catalog_type,
                    read_only: data.read_only,
                }
            case FlowchartTreeNodeType.NORMAL:
                return {
                    ...data?.node_normal,
                    id: data?.node_normal?.node_id,
                    name: data?.node_normal?.node_name,
                    catalog_type: data.catalog_type,
                    read_only: data.read_only,
                }
            case FlowchartTreeNodeType.PROCESS:
                return {
                    ...data,
                    ...data?.node_process,
                    id: data?.node_process?.node_id,
                    name: data?.node_process?.node_name,
                    catalog_type: data.catalog_type,
                }
            default:
                return data
        }
    }

    // 刷新树内容
    const handleRefresh = () => {
        const fm = getLatestData()
        if (getDf()?.isCreate) {
            // 更新创建标识
            setDrawioInfo({ ...getDf(), isCreate: false })
            // 请求根信息
            getFlowTreeQuery(
                {
                    fid: fm?.root?.fid,
                    main_business_id: fm?.root?.mbsid,
                    type: viewKey,
                },
                fm?.root?.absolutePath,
            )
        } else {
            if (
                fm?.current?.fid !== fm?.root?.fid &&
                getTreeData()?.[0]?.isLeaf
            ) {
                // 根流程图未展开请求根信息
                getFlowTreeQuery(
                    {
                        fid: fm?.root?.fid,
                        main_business_id: fm?.root?.mbsid,
                        type: viewKey,
                    },
                    fm?.root?.absolutePath,
                )
            } else {
                // 请求当前流程图信息
                getFlowTreeQuery(
                    {
                        fid: fm?.current?.fid,
                        main_business_id: fm?.current?.mbsid,
                        type: viewKey,
                    },
                    fm?.current?.absolutePath,
                )
            }
            if (fm?.current && !getSelectedNode()) {
                changeSelectedNode(fm.current.absolutePath)
            }
        }
    }

    // 绑定子流程删除
    const bindFlowChanged = (absolutePath?: string, id?: string) => {
        if (!absolutePath) return
        // 更新展开收起状态
        const temp = cloneDeep(getTreeData())
        const curNode = getTreeNode(temp || [], (node: DataNode) => {
            if (id) {
                return (
                    node.absolutePath.includes(absolutePath) &&
                    node.absolutePath.includes(id)
                )
            }
            return node.absolutePath === absolutePath
        })
        if (curNode !== null) {
            curNode.isError = true
            setTreeData(temp)
        }
    }

    // 更新树根节点信息
    const updateFlowTreeRootInfo = (data?) => {
        const { id, name } = data
        // 更新展开收起状态
        const tempTree = cloneDeep(getTreeData())
        const curNode = tempTree[0]
        if (curNode !== null) {
            curNode.flowchart_name = name
            curNode.name = name
            setTreeData(tempTree)
        }
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            // 更新流程图树信息
            setAfFlowchartInfo({
                ...temp,
                flowchartTree: tempTree,
            })
        }
    }

    // 跳转前保存流程图
    const saveFlowForJump = async (data?) => {
        const { flag } = data
        if (
            ['forTreeJumpOpen', 'forTreeJumpFlow', 'forTreeRefresh'].includes(
                flag,
            )
        ) {
            const fm = await getLatestData()
            const bo = await saveFlowRequest(
                fm?.current?.mid,
                fm?.current?.fid,
                getDf()?.taskId,
                data,
                getDf(),
            )
            switch (flag) {
                case 'forTreeJumpFlow':
                    previewFlow()
                    break
                case 'forTreeRefresh':
                    handleRefresh()
                    break
                default:
                    break
            }
        }
    }

    // 节点选中
    // 目录节点类型，流程节点normal、子流程节点process、泳道swimlane、表单form、流程图flowchart
    const handleSelectedNode = (td: DataNode) => {
        const fm = getLatestData()
        if (
            [
                FlowchartTreeNodeType.NORMAL,
                FlowchartTreeNodeType.PROCESS,
                FlowchartTreeNodeType.SWIMLANE,
            ].includes(td.catalog_type) &&
            td.absolutePath.startsWith(fm?.current?.absolutePath || '')
        ) {
            // 高亮节点
            getDf()?.iframe?.current?.contentWindow?.postMessage(
                JSON.stringify({
                    event: 'dio_selectedNode',
                    id: td.id,
                    path: td.absolutePath,
                }),
                '*',
            )
        } else {
            // 取消高亮
            getDf()?.iframe?.current?.contentWindow?.postMessage(
                JSON.stringify({
                    event: 'dio_selectedNodeCancel',
                    id: td.id,
                }),
                '*',
            )
        }
        // 表单详情
        if (td.catalog_type === FlowchartTreeNodeType.FORM) {
            getSelectedData(td)
        }
        if (selectedNode?.absolutePath !== td.absolutePath) {
            setSelectedNode(td)
            // 跳转流程图
            if (td.catalog_type === FlowchartTreeNodeType.FLOWCHART) {
                if (
                    getViewmode(getDf().viewmode, fm?.current?.read_only) ===
                    '1'
                ) {
                    previewFlow(td)
                    return
                }
                operateAfterSave(getDf(), 'forTreeJumpFlow')
            }
        }
    }

    // 查看子流程图
    const previewFlow = (td?: DataNode) => {
        const fm = getLatestData()
        const tempStr = window.localStorage.getItem(`${flowchartId}`)
        if (tempStr !== null) {
            const temp = JSON.parse(tempStr || '')
            fm?.onCurrentData(td?.path || getSelectedNode()!.path)
            setAfFlowchartInfo({
                ...temp,
                flowchartData: fm,
            })
            setDrawioInfo({
                ...getDf(),
                currentFid: td?.id || getSelectedNode()!.id,
            })
        }
    }

    // 打开业务模型新窗口
    const handleJump = (td: DataNode) => {
        const fm = getLatestData()
        if (getViewmode(getDf().viewmode, fm?.current?.read_only) !== '1') {
            operateAfterSave(getDf(), 'forTreeJumpOpen')
        }
        openWindowPreviewFlow({
            main_business_id: td.sub_flowchart.main_business_id,
            viewType: getDf()?.viewType,
        })
    }

    // 各个类型的节点
    const TreeIcons: React.FC<{ td: DataNode }> = ({ td }) => {
        const getIcon = (type) => {
            switch (type) {
                case FlowchartTreeNodeType.FLOWCHART:
                    if (td.flowchart_level === 1) {
                        return (
                            <FlowchartOutlined
                                className={styles.pt_treeIcon}
                                style={{ fontSize: 14 }}
                            />
                        )
                    }
                    return (
                        <SubFlowchartOutlined
                            className={styles.pt_treeIcon}
                            style={{ fontSize: 14 }}
                        />
                    )
                case FlowchartTreeNodeType.FORM:
                    return (
                        <BusinessFormOutlined className={styles.pt_treeIcon} />
                    )
                case FlowchartTreeNodeType.SWIMLANE:
                    return (
                        <SwimlaneNodeOutlined
                            className={styles.pt_treeIcon}
                            style={{ fontSize: 14 }}
                        />
                    )
                case FlowchartTreeNodeType.NORMAL:
                    return <NormalNodeOutlined className={styles.pt_treeIcon} />
                case FlowchartTreeNodeType.PROCESS:
                    return (
                        <ProcessNodeOutlined className={styles.pt_treeIcon} />
                    )
                default:
                    return <div />
            }
        }
        return getIcon(td.catalog_type)
    }

    // 单行节点
    const renderTreeNode = (td: DataNode, parentNode?: DataNode) => {
        return (
            <div
                className={classnames(
                    styles.pt_treeNode,
                    td.absolutePath === getSelectedNode()?.absolutePath &&
                        styles.pt_selectedTreeNode,
                )}
                style={{
                    paddingLeft: 22 * td.level + 16,
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    handleSelectedNode(td)
                }}
                title={td.name}
            >
                <RightOutlined
                    style={{
                        visibility:
                            td.isLeaf ||
                            td.catalog_type === FlowchartTreeNodeType.FORM
                                ? 'hidden'
                                : 'visible',
                    }}
                    className={classnames(
                        styles.pt_arrow,
                        td.isExpand && styles.pt_expandArrow,
                    )}
                    onClick={(e) => {
                        e.stopPropagation()
                        // 更新展开收起状态
                        const temp = cloneDeep(treeData)
                        const curNode = getTreeNode(
                            temp || [],
                            (node: DataNode) =>
                                node.absolutePath === td.absolutePath,
                        )
                        if (!curNode) return
                        curNode.isExpand = !curNode.isExpand
                        setTreeData(temp)
                        // 展开请求数据
                        if (curNode.isExpand) {
                            getFlowTreeQuery(
                                {
                                    fid: td.flowchart_id,
                                    main_business_id:
                                        flowInfosMg?.root?.mbsid || '',
                                    node_id: td?.node_id,
                                    type: viewKey,
                                },
                                td.absolutePath,
                            )
                        } else {
                            curNode.children = []
                            // flowInfosMg?.deleteDatas(td.path)
                            // setLsFlowInfos(flowInfosMg)
                        }
                    }}
                />
                <TreeIcons td={td} />
                <div className={styles.pt_rightContent}>
                    <div className={classnames(styles.pt_nodeName)}>
                        {td.name || '--'}
                    </div>
                    {td.catalog_type === FlowchartTreeNodeType.PROCESS ? (
                        td.isError ? (
                            <Tooltip title={__('子流程有变更')}>
                                <ExclamationCircleOutlined
                                    className={styles.pt_errorIcon}
                                    style={{ color: 'rgb(245 34 45)' }}
                                />
                            </Tooltip>
                        ) : (
                            td?.sub_flowchart?.is_ref && (
                                <Tooltip title={__('查看流程所属业务模型')}>
                                    <LinkOutlined
                                        className={styles.pt_operateIcon}
                                        onClick={() => handleJump(td)}
                                    />
                                </Tooltip>
                            )
                        )
                    ) : null}
                </div>
            </div>
        )
    }

    // 流程树
    const renderTreeNodes = (data: DataNode[], parentNode?: DataNode) => {
        return data.map((item, index) => {
            return (
                <div key={item.id}>
                    {renderTreeNode(item, parentNode)}
                    <div hidden={!item.isExpand}>
                        {item.children
                            ? renderTreeNodes(item.children, item)
                            : null}
                    </div>
                </div>
            )
        })
    }

    // 菜单项
    const items: MenuProps['items'] = [
        {
            key: OperateType.EDIT,
            label: (
                <div style={{ color: 'rgba(0,0,0,0.85)' }}>
                    {__('详细信息')}
                </div>
            ),
            title: isButtonDisabled ? __('审核中，无法操作') : '',
            disabled: isButtonDisabled,
            access: 'manageBusinessModelAndBusinessDiagnosis',
        },
        {
            key: OperateType.DELETE,
            label: (
                <div style={{ color: 'rgba(0,0,0,0.85)' }}>{__('删除')}</div>
            ),
            title: isButtonDisabled ? __('审核中，无法操作') : '',
            disabled: isButtonDisabled,
            access: 'manageBusinessModelAndBusinessDiagnosis',
        },
    ].filter((item) => checkPermission(item.access))

    // 空白显示
    const showEmpty = () => {
        const desc = (
            <div className={styles.pt_emptyText}>
                <div>{__('暂无数据')}</div>
                <div>{__('添加节点后，点击刷新更新导航')}</div>
            </div>
        )
        return <Empty desc={desc} iconSrc={dataEmpty} />
    }

    const refreshNav = () => {
        if (refreshEnabled) {
            setTreeLoading(true)
            const fm = getLatestData()
            if (fm?.current?.read_only) {
                handleRefresh()
                return
            }
            operateAfterSave(getDf(), 'forTreeRefresh')
        }
    }

    return (
        <div
            className={styles.processTreeWrapper}
            style={{ height: hi || '100%' }}
        >
            {mode === 'edit' ? (
                <div className={styles.pt_headerEdWrapper}>
                    {__('流程导航')}
                    <Tooltip title={__('更新导航')}>
                        <ReloadOutlined
                            className={styles.pt_refresh}
                            onClick={() => refreshNav()}
                        />
                    </Tooltip>
                </div>
            ) : (
                <div className={styles.pt_headerPreWrapper}>
                    {/* <Select
                        value={viewKey}
                        bordered={false}
                        options={viewOptionList}
                        onChange={(option: ViewType) => {
                            setViewKey(option)
                            // const fm = getLatestData()
                            // // 请求当前流程图信息
                            // getFlowTreeQuery(
                            //     {
                            //         fid: flowchartId,
                            //         main_business_id: fm?.current?.mbsid,
                            //         type: option,
                            //     },
                            //     flowchartId,
                            // )
                        }}
                        onDropdownVisibleChange={(open) => {
                            setListShow(open)
                        }}
                        suffixIcon={
                            listShow ? (
                                <CaretUpOutlined className={styles.downIcon} />
                            ) : (
                                <CaretDownOutlined
                                    className={styles.downIcon}
                                />
                            )
                        }
                        className={styles.viewSelect}
                        getPopupContainer={(n) => n}
                    /> */}
                    <div className={styles.pt_headerTop}>
                        <span style={{ fontWeight: 550 }}>
                            {__('业务流程')}
                        </span>
                        {getDf()?.viewmode === '1' &&
                            checkTask(OperateType.EDIT) &&
                            checkPermission(
                                'manageBusinessModelAndBusinessDiagnosis',
                            ) && (
                                <span
                                    className={styles.pt_more}
                                    style={{ backgroundColor: bg }}
                                    onFocus={() => {}}
                                    onMouseOver={() => {
                                        setBg('rgba(0, 0, 0, 0.04)')
                                    }}
                                    onMouseLeave={() => {
                                        setBg('rgba(0, 0, 0, 0)')
                                    }}
                                >
                                    <Dropdown
                                        menu={{
                                            items,
                                            onClick: (info) =>
                                                onOperate?.(info.key),
                                            onFocus: () =>
                                                setBg('rgba(0, 0, 0, 0.04)'),
                                            onMouseOver: () =>
                                                setBg('rgba(0, 0, 0, 0.04)'),
                                        }}
                                        placement="bottomRight"
                                        getPopupContainer={(n) =>
                                            n.parentElement?.parentElement || n
                                        }
                                    >
                                        <EllipsisOutlined />
                                    </Dropdown>
                                </span>
                            )}
                    </div>
                    <Radio.Group
                        onChange={(e) => {
                            setViewKey(e.target.value)
                        }}
                        value={viewKey}
                        style={{ marginTop: 12 }}
                    >
                        <Radio.Button value={ViewType.FLOWPATH}>
                            {__('仅显示流程')}
                        </Radio.Button>
                        <Radio.Button value={ViewType.PROCESSNAV}>
                            {__('显示全部内容')}
                        </Radio.Button>
                    </Radio.Group>
                </div>
            )}
            {treeLoading ? (
                <Loader />
            ) : treeData?.length > 0 && !getDf()?.isCreate ? (
                <div className={styles.pt_treeWrapper}>
                    <div style={{ minWidth: 'fit-Content' }}>
                        {renderTreeNodes(treeData)}
                    </div>
                </div>
            ) : (
                showEmpty()
            )}
        </div>
    )
}

export default DrawioTree
