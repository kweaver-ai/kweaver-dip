import React, { useMemo, useState } from 'react'
import ls, { trim } from 'lodash'
import { Popover, message } from 'antd'
import { Node } from '@antv/x6'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import {
    ExecuteState,
    ModelType,
    WorkflowState,
    executeStateInfo,
    modelTypeInfo,
    workflowStateInfo,
} from './const'
import {
    execDataSync,
    formatError,
    checkNameExist,
    runWorkFlow,
    execDataProcess,
    messageError,
    DataSourceFromType,
} from '@/core'
import __ from './locale'
import {
    DragOutlined,
    InfotipOutlined,
    BusinessSystemOutlined,
    UnkownTypeOutlined,
    FormDetailOutlined,
} from '@/icons'
import DataProcessingColored from '@/icons/DataProcessingColored'
import DataSyncColored from '@/icons/DataSyncColored'
import { DataColoredBaseIcon } from '@/core/dataSource'

/**
 * 状态组件
 * @param type 状态
 */
const StateLabel: React.FC<{
    type: any
}> = ({ type }) => {
    const isExecute = useMemo(
        () => !ls.values(WorkflowState).includes(type),
        [type],
    )
    return (
        <div className={styles.ddw_stateLabelWrap}>
            <div
                className={styles.icon}
                style={{
                    background: isExecute
                        ? `${executeStateInfo[type].color}`
                        : `${workflowStateInfo[type].color}`,
                }}
            />
            <div className={styles.title}>
                {isExecute
                    ? `${executeStateInfo[type].text}`
                    : `${workflowStateInfo[type].text}`}
            </div>
        </div>
    )
}

const changeExecuteType = (type: string) => {
    switch (type) {
        case ExecuteState.SUCCESS:
            return ExecuteState.SUCCESS
        case ExecuteState.FAIL:
            return ExecuteState.FAIL
        default:
            return ExecuteState.UNDERWAY
    }
}

/**
 * 节点信息弹窗内容
 * @param data 数据
 * @param type 类型
 */
const PopContent: React.FC<{ data: any; type: string }> = ({ data, type }) => {
    return (
        <div className={styles.popContentWrap}>
            <div hidden={type === ModelType.PROC}>
                <div className={styles.title}>{__('来源数据表：')}</div>
                <div className={styles.name} title={data?.source?.table_name}>
                    <FormDetailOutlined className={styles.icon} />
                    <span>{data?.source?.table_name}</span>
                </div>
                <div className={styles.detailsWrap}>
                    <span
                        className={styles.detailsItemWrap}
                        title={data?.source?.info_system}
                        hidden={
                            !data?.source?.info_system ||
                            data.source?.source_type !==
                                DataSourceFromType.Records
                        }
                    >
                        <BusinessSystemOutlined className={styles.icon} />
                        <span className={styles.desc}>
                            {data?.source?.info_system}
                        </span>
                        <span className={styles.arrow}>{'>'}</span>
                    </span>
                    <span
                        className={styles.detailsItemWrap}
                        title={data?.source?.datasource_name}
                        style={{
                            maxWidth: data?.source?.info_system
                                ? '50%'
                                : '100%',
                        }}
                        hidden={!data?.source?.datasource_name}
                    >
                        <span className={styles.icon}>
                            <DataColoredBaseIcon
                                type={data?.source?.datasource_type}
                                style={{
                                    fontSize: 14,
                                }}
                                iconType="Outlined"
                            />
                        </span>
                        <span className={styles.desc}>
                            {data?.source?.datasource_name}
                        </span>
                    </span>
                </div>
            </div>
            <div className={styles.split} hidden={type === ModelType.PROC} />
            <div>
                <div className={styles.title}>{__('目标数据表：')}</div>
                <div className={styles.name} title={data?.target?.table_name}>
                    <FormDetailOutlined className={styles.icon} />
                    <span>{data?.target?.table_name}</span>
                </div>
                <div className={styles.detailsWrap}>
                    <span
                        className={styles.detailsItemWrap}
                        title={data?.target?.info_system}
                        hidden={
                            !data?.target?.info_system ||
                            data.target?.source_type !==
                                DataSourceFromType.Records
                        }
                    >
                        <BusinessSystemOutlined className={styles.icon} />
                        <span className={styles.desc}>
                            {data?.target?.info_system}
                        </span>
                        <span className={styles.arrow}>{'>'}</span>
                    </span>
                    <span
                        className={styles.detailsItemWrap}
                        title={data?.target?.datasource_name}
                        style={{
                            maxWidth: data?.target?.info_system
                                ? '50%'
                                : '100%',
                        }}
                    >
                        <span className={styles.icon}>
                            <DataColoredBaseIcon
                                type={data?.target?.datasource_type}
                                style={{
                                    fontSize: 14,
                                }}
                                iconType="Outlined"
                            />
                        </span>
                        <span className={styles.desc}>
                            {data?.target?.datasource_name}
                        </span>
                    </span>
                </div>
            </div>
        </div>
    )
}

/**
 * 列表Item组件
 * @param data 数据
 * @param type 模型类型
 * @param selected 是否选中
 * @param onStartDrag 拖拽
 */
const ListItem: React.FC<{
    data: any
    type: string
    selected: boolean
    onStartDrag: (
        e: React.MouseEvent<HTMLDivElement, MouseEvent>,
        id: string,
    ) => void
}> = ({ data, type, selected, onStartDrag }) => {
    // 信息的显示隐藏
    const [infoHidden, setInfoHidden] = useState(true)

    return (
        <div
            id={`listItem_${data?.id}`}
            className={styles.listItemWrap}
            onFocus={() => {}}
            onMouseOver={() => {
                setInfoHidden(false)
            }}
            onMouseLeave={() => {
                setInfoHidden(true)
            }}
            onMouseDown={(ev) => !selected && onStartDrag(ev, data)}
        >
            <DragOutlined
                className={styles.dragIcon}
                style={{
                    opacity: selected ? 0.3 : 1,
                }}
            />
            <div
                style={{
                    marginRight: 6,
                    opacity: selected ? 0.3 : 1,
                }}
            >
                {modelTypeIcon(type)}
            </div>
            <div className={styles.itemNameWarp}>
                <div
                    className={styles.itemName}
                    title={data?.name}
                    style={{ opacity: selected ? 0.3 : 1 }}
                >
                    {data?.name}
                </div>
                <Popover
                    placement="right"
                    content={<PopContent data={data} type={type} />}
                >
                    <InfotipOutlined
                        hidden={infoHidden}
                        className={styles.itemInfoIcon}
                    />
                </Popover>
            </div>
        </div>
    )
}

interface IXScroll extends React.HTMLAttributes<HTMLDivElement> {
    contentWi: number
    contentHi: number
}
/**
 * 横向滚动容器
 */
const XScroll: React.FC<IXScroll> = ({
    contentWi,
    contentHi,
    children,
    ...props
}) => {
    return (
        <div
            className={styles.xScrollWrap}
            style={{
                width: contentHi,
                height: contentWi,
                transformOrigin: `${contentWi / 2 + 16}px 0`,
                left: -(contentWi / 2 + 16),
            }}
            {...props}
        >
            <div
                className={styles.xScrollContentWrap}
                style={{ left: contentHi, width: contentWi }}
            >
                {children}
            </div>
        </div>
    )
}

/**
 * 模型图标
 * @param type 类型
 * @param size 大小
 */
const modelTypeIcon = (type: string, size: number = 18) => {
    switch (type) {
        case ModelType.SYNC:
            return (
                <DataSyncColored
                    style={{
                        color: modelTypeInfo[type].color,
                        fontSize: size - 4,
                    }}
                />
            )
        case ModelType.PROC:
            return (
                <DataProcessingColored
                    style={{
                        color: modelTypeInfo[type].color,
                        fontSize: size,
                    }}
                />
            )
        default:
            return (
                <UnkownTypeOutlined
                    style={{
                        fontSize: size,
                    }}
                />
            )
    }
}

interface IHeaderItem extends React.HTMLAttributes<HTMLDivElement> {
    item: any
    selected: boolean
    showLine: boolean
    onClose: () => void
}

/**
 * 头Item组件
 * @param item 数据
 * @param selected 是否选中
 * @param showLine 分割线
 * @param onClose 关闭
 */
const HeaderItem: React.FC<IHeaderItem> = ({
    item,
    selected,
    showLine,
    onClose,
    ...props
}) => {
    // 更多的显示/隐藏
    const [hidden, setHidden] = useState(true)

    return (
        <div
            className={classnames(styles.headerTabItemWrap)}
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
            }}
            {...props}
        >
            <div
                hidden={!selected}
                className={styles.hti_leftBlankWrap}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_leftBlank} />
            </div>
            <div
                className={styles.hti_content}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_nameWrap} title={item.name}>
                    {modelTypeIcon(item.model_type, 16)}
                    <div className={styles.hti_name}>{item.name}</div>
                </div>

                <CloseOutlined
                    hidden={hidden}
                    className={classnames(styles.hti_close)}
                    onClick={(ev) => {
                        ev.stopPropagation()
                        onClose()
                    }}
                />
            </div>
            <div
                hidden={!selected}
                className={styles.hti_rightBlankWrap}
                style={{ background: selected ? '#fff' : '#f0f0f3' }}
            >
                <div className={styles.hti_rightBlank} />
            </div>
            <div
                className={styles.hti_split}
                style={{
                    visibility: showLine ? 'visible' : 'hidden',
                }}
            />
        </div>
    )
}

/**
 * 检查名称重复
 * @param value 输入值
 * @param oldName 旧名称
 */
const checkNameRepeat = async (
    value: string,
    oldName?: string,
    id?: string,
) => {
    try {
        if (trim(value) === oldName) {
            return Promise.resolve()
        }
        if (trim(value)) {
            const res = await checkNameExist(value, id)
            if (res?.repeat) {
                return Promise.reject(
                    new Error(__('该工作流名称已存在，请重新输入')),
                )
            }
        }
        return Promise.resolve()
    } catch (ex) {
        formatError(ex)
        return Promise.resolve()
    }
}

/**
 * 根据节点去寻找上游节点
 * @param nodes 所有节点
 * @param node 当前节点
 * @returns
 */
const getPreorderNode = (nodes, node): Node[] => {
    if (nodes.length === 0 || !node) {
        return []
    }
    const { pre_node_id } = node.data
    if (pre_node_id.length > 0) {
        return [
            ...pre_node_id.flatMap((info) =>
                getPreorderNode(
                    nodes,
                    nodes.find((n) => info === n.id),
                ),
            ),
            node,
        ]
    }
    return [node]
}

/**
 * 执行工作流
 * @param id 工作流id
 */
const handleExecuteWf = async (id: string, model: string) => {
    try {
        switch (model) {
            case 'proc':
                await execDataProcess(id)
                break
            case 'sync':
                await execDataSync(id)
                break
            case 'wf':
                await runWorkFlow(id)
                break
            default:
                break
        }
        message.success(__('立即执行成功'))
    } catch (err) {
        if (
            model === 'wf' &&
            err?.data?.code === 'Standardization.InvalidParameter'
        ) {
            messageError(__('该工作流中节点均被删除，无法执行'))
        } else {
            formatError(err)
        }
    }
}

/**
 * 获取数据状态
 */
const updateExecStatus = async (
    id: string,
    model: string,
    callback: (status: boolean) => void,
) => {
    callback(false)
    // try {
    //     let res
    //     switch (model) {
    //         case 'sync':
    //             res = await getDataSyncHistoryList({
    //                 ...defaultLogsParams,
    //                 model_uuid: id,
    //                 status: ExecuteState.UNDERWAY,
    //             })
    //             break
    //         case 'proc':
    //         case 'wf':
    //             res = await queryWorkFlowLogsList({
    //                 ...defaultLogsParams,
    //                 process_uuid: id,
    //                 status: ExecuteState.UNDERWAY,
    //             })
    //             break
    //         default:
    //             break
    //     }
    //     const { data } = res
    //     const { current_page, total_list, total_page, ...rest } = data
    //     if (total_list?.length) {
    //         const timer = setTimeout(async () => {
    //             clearTimeout(timer)
    //             await updateExecStatus(id, model, callback)
    //         }, 5000)
    //     } else if (!total_list?.length) {
    //         callback(false)
    //     }
    // } catch (ex) {
    //     formatError(ex)
    // }
}

/**
 * 日志时长转换(同步加工)
 * @param times
 */
const formatTotalTime = (times: number) => {
    const allSecond = Math.ceil(times / 1000)
    const currentTimes = {
        hours: Math.floor(allSecond / 3600),
        minutes: Math.floor(allSecond / 60) % 60,
        seconds: allSecond % 60,
    }
    switch (true) {
        case !!currentTimes.hours:
            return `${currentTimes.hours}${__('小时')}${
                currentTimes.minutes
            }${__('分')}${currentTimes.seconds}${__('秒')}`
        case !!currentTimes.minutes:
            return `${currentTimes.minutes}${__('分')}${
                currentTimes.seconds
            }${__('秒')}`
        case !!currentTimes.seconds:
            return `${currentTimes.seconds}${__('秒')}`
        default:
            return `0${__('秒')}`
    }
}

/**
 * 日志时长转换(工作流)
 * @param times XXhXXmXXs
 */
const formatWfTotalTime = (times: string) => {
    return times
        .replace('h', __('小时'))
        .replace('m', __('分'))
        .replace('s', __('秒'))
}

export {
    StateLabel,
    ListItem,
    HeaderItem,
    XScroll,
    PopContent,
    modelTypeIcon,
    checkNameRepeat,
    handleExecuteWf,
    getPreorderNode,
    updateExecStatus,
    changeExecuteType,
    formatTotalTime,
    formatWfTotalTime,
}
