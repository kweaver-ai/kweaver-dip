import Icon, { CloseOutlined } from '@ant-design/icons'
import {
    Button,
    Checkbox,
    Drawer,
    Form,
    Input,
    Select,
    SelectProps,
    Space,
} from 'antd'
import { DefaultOptionType } from 'antd/lib/select'
import React, { useEffect, useMemo, useState } from 'react'
import { Node } from '@antv/x6'
import { debounce, trim } from 'lodash'
import { useDebounce, useGetState } from 'ahooks'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { formatError, TaskType } from '@/core'
import { validateEmpty, validateName } from '@/utils/validate'
import { assemblyLineSaveContent } from '@/core/apis/assemblyLine'
import {
    ValidateResult,
    getNodesByShape,
    shapeType,
    checkRepeatNodeName,
} from '@/core/graph/helper'
import {
    LoginPlatform,
    roleIconInfo,
    roleInfo,
} from '@/core/apis/configurationCenter/index.d'
import { getPlatformNumber, nameReg, useQuery } from '@/utils'
import { TaskTypeLabel, getTaskTypeIcon } from '../TaskComponents/helper'
import __ from './locale'
import { OrderType } from '../WorkOrder/helper'

/**
 * 节点启动方式
 * @param ANY_NODE_COMPLETION 任意前序节点完成
 * @param ALL_NODE_COMPLETION 全部前序节点完成
 * @param ANY_NODE_START 任意前序节点处于非未启动
 */
enum StartMode {
    ANY_NODE_COMPLETION = 'any_node_completion',
    ALL_NODE_COMPLETION = 'all_node_completion',
    ANY_NODE_START = 'any_node_start',
}

/**
 * 节点完成方式
 * @param MANUAL 手动完成
 * @param AUTO 自动完成
 */
enum CompletionMode {
    MANUAL = 'manual',
    AUTO = 'auto',
}

/** 配置类型 */
export enum CheckType {
    TASK = 'task',
    WORK_ORDER = 'work_order',
}

// 工单类型
const workOrderTypeOptions = [
    {
        label: __('数据归集工单'),
        value: OrderType.AGGREGATION,
    },
    {
        label: __('数据标准化工单'),
        value: OrderType.STANDARD,
    },
    {
        label: __('数据质量检测工单'),
        value: OrderType.QUALITY_EXAMINE,
    },
    {
        label: __('数据融合工单'),
        value: OrderType.FUNSION,
    },
    {
        label: __('数据理解工单'),
        value: OrderType.COMPREHENSION,
    },
]

/**
 * 节点配置侧边栏
 * @param open boolean 显示/隐藏
 * @param node Node<Node.Properties> 节点信息
 * @param graph any? 画布
 * @param graphModel string 画布类型
 * @param roles IAssemblyLineRoleItem[]? 角色
 * @param onClose () => void
 */
const NodeConfigInfo: React.FC<{
    open: boolean
    node?: Node<Node.Properties>
    graph?: any
    graphModel: string
    roleIcons: Array<roleIconInfo>
    onClose: () => void
}> = ({
    open,
    node,
    graph,
    graphModel = 'resumedraft',
    onClose,
    roleIcons,
}) => {
    const [form] = Form.useForm()

    // 参数信息
    const query = useQuery()

    // 请求load
    const [loading, setLoading] = useState(false)

    const platform = getPlatformNumber()
    const [checkOpts, setCheckOpts] = useState<any[]>([
        CheckType.TASK,
        CheckType.WORK_ORDER,
    ])
    useEffect(() => {
        if (node?.data) {
            const { name, node_config, task_config, work_order_config } =
                node.data
            const { start_mode, completion_mode } = node_config
            const { task_type } = task_config || {}
            const { work_order_type } = work_order_config || {}

            const check_type: any[] = []

            if (task_type) {
                check_type.push(CheckType.TASK)
            }
            if (work_order_type) {
                check_type.push(CheckType.WORK_ORDER)
            }

            setCheckOpts(check_type)

            const initFields = {
                name,
                start_mode: start_mode || undefined,
                completion_mode: completion_mode || undefined,
                task_type: task_type ? JSON.parse(task_type) : undefined,
                work_order_type: work_order_type
                    ? JSON.parse(work_order_type)
                    : undefined,
                check_type,
            }

            form.setFieldsValue(initFields)
        }
    }, [open])

    // 保存内容
    const onFinish = async (values) => {
        const {
            name,
            start_mode,
            completion_mode,
            check_type,
            task_type,
            work_order_type,
        } = values
        const status = node?.getData().status
        const { task_config, work_order_config, ...rest } = node?.data || {}
        const dataInfo = {
            ...rest,
            name: trim(name),
            node_config: { start_mode, completion_mode },
            status:
                status === ValidateResult.NodeConfigInfoIsNone
                    ? ValidateResult.Normal
                    : status,
        }

        if (check_type.includes(CheckType.TASK)) {
            dataInfo.task_config = {
                task_type: JSON.stringify(task_type),
            }
        }
        if (!check_type.includes(CheckType.TASK) && dataInfo.task_config) {
            // 没有勾选任务，清理task_config
            delete dataInfo.task_config
        }
        if (check_type.includes(CheckType.WORK_ORDER)) {
            dataInfo.work_order_config = {
                work_order_type: JSON.stringify(work_order_type),
            }
        }
        if (
            !check_type.includes(CheckType.WORK_ORDER) &&
            dataInfo.work_order_config
        ) {
            // 没有勾选工单，清理work_order_config
            delete dataInfo.work_order_config
        }

        // 替换节点信息
        if (!graph || !graph.current) {
            return
        }
        const curNode = graph.current.getNodes()?.find((n) => n.id === node?.id)

        curNode?.replaceData(dataInfo)

        const content = JSON.stringify(graph.current?.toJSON())
        const changedCon = JSON.parse(content)
        // 请求
        try {
            setLoading(true)
            await assemblyLineSaveContent(query.get('id') || '', {
                content: JSON.stringify(changedCon.cells),
                type: 'temp',
            })
            setLoading(false)
            // 检查同名节点
            if (graph?.current) {
                const nodes = getNodesByShape(
                    graph.current.getNodes(),
                    shapeType.InputNode,
                )
                nodes.forEach((n) =>
                    n.setData({
                        ...n.data,
                        status: ValidateResult.Normal,
                    }),
                )
                const repeatNodes = checkRepeatNodeName(nodes)
                repeatNodes.forEach((n) => {
                    n.setData({
                        ...n.data,
                        status: ValidateResult.NodeNameRepeat,
                    })
                })
            }
            onClose()
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 名称唯一性校验
    const validateUniqueness = () => {
        return (_: any, value: string) => {
            return new Promise((resolve, reject) => {
                const trimValue = trim(value)
                if (!trimValue) {
                    reject(new Error(__('输入不能为空')))
                    return
                }
                if (trimValue && !nameReg.test(trimValue)) {
                    reject(new Error(__('仅支持中英文、数字、下划线及中划线')))
                    return
                }
                if (graph?.current) {
                    const nodes = getNodesByShape(
                        graph.current.getNodes(),
                        shapeType.InputNode,
                    )
                    const repeatNodes = nodes.filter((n) => {
                        if (node && n.id !== node.id) {
                            return n.data.name === value
                        }
                        return false
                    })
                    if (repeatNodes.length > 0) {
                        reject(new Error(__('该节点名称已存在，请重新输入')))
                        return
                    }
                    resolve(1)
                }
            })
        }
    }

    // 启动/完成方式的相关内容项
    const modeSelect = [
        {
            label: __('启动方式'),
            name: 'start_mode',
            placeholder: __('请选择节点启动方式'),
            options: [
                {
                    key: StartMode.ALL_NODE_COMPLETION,
                    top: __('完成全部前序节点'),
                    bottom: __(
                        '当前节点的所有前序节点均为完成状态，该节点才可启动',
                    ),
                },
                {
                    key: StartMode.ANY_NODE_COMPLETION,
                    top: __('完成任意前序节点'),
                    bottom: __(
                        '当前节点的任意前序节点为完成状态，该节点才可启动',
                    ),
                },
            ],
        },
    ]

    // 任务类型
    const taskTypeOptions =
        platform === LoginPlatform.default
            ? [
                  //   {
                  //       value: TaskType.NORMAL,
                  //       label: TaskTypeLabel[TaskType.NORMAL],
                  //   },
                  {
                      value: TaskType.MODEL,
                      label: TaskTypeLabel[TaskType.MODEL],
                  },
                  {
                      value: TaskType.DATACOLLECTING,
                      label: TaskTypeLabel[TaskType.DATACOLLECTING],
                  },
                  {
                      value: TaskType.DATASHEETVIEW,
                      label: TaskTypeLabel[TaskType.DATASHEETVIEW],
                  },
                  {
                      value: TaskType.INDICATORPROCESSING,
                      label: TaskTypeLabel[TaskType.INDICATORPROCESSING],
                  },
              ]
            : [
                  {
                      value: TaskType.MODEL,
                      label: TaskTypeLabel[TaskType.MODEL],
                  },
                  {
                      value: TaskType.DATAMODELING,
                      label: TaskTypeLabel[TaskType.DATAMODELING],
                  },
                  {
                      value: TaskType.MODELINGDIAGNOSIS,
                      label: TaskTypeLabel[TaskType.MODELINGDIAGNOSIS],
                  },
                  {
                      value: TaskType.MAINBUSINESS,
                      label: TaskTypeLabel[TaskType.MAINBUSINESS],
                  },
                  {
                      value: TaskType.STANDARDNEW,
                      label: TaskTypeLabel[TaskType.STANDARDNEW],
                  },
              ]

    // 方式的选择器Item
    const modeSelectItem = ({ key, top, bottom }) => (
        <Select.Option value={key} key={key}>
            <div className={styles.modeSelectItemWrapper}>
                <div className={styles.top}>{top}</div>
                <div className={styles.bottom}>{bottom}</div>
            </div>
        </Select.Option>
    )

    // 选择器空库表
    const selectEmpty = (
        <div className={styles.selectEmptyWrapper}>
            <Empty desc={__('暂无数据')} iconSrc={empty} />
        </div>
    )

    // 页头
    const title = (
        <div className={styles.titleWrapper}>
            <span>{__('节点配置信息')}</span>
            <span className={styles.closeBtn} onClick={onClose}>
                <CloseOutlined className={styles.closeBtn} />
            </span>
        </div>
    )

    // 页脚
    const footer = graphModel === 'resumedraft' && (
        <div className={styles.footerWrapper}>
            <Space size={12}>
                <Button className={styles.cancelBtn} onClick={onClose}>
                    {__('取消')}
                </Button>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    onClick={() => form.submit()}
                >
                    {__('确定')}
                </Button>
            </Space>
        </div>
    )

    return (
        <Drawer
            width={400}
            title={title}
            placement="right"
            closable={false}
            maskClosable={graphModel !== 'resumedraft'}
            onClose={onClose}
            open={open}
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={footer}
            footerStyle={{ height: 64, padding: 16 }}
            bodyStyle={{ overflow: 'hidden auto' }}
            destroyOnClose
        >
            <Form
                disabled={graphModel !== 'resumedraft'}
                form={form}
                layout="vertical"
                autoComplete="off"
                initialValues={{ remember: true }}
                onFinish={onFinish}
            >
                <div className={styles.basicTitle}>{__('基本信息')}</div>
                <Form.Item
                    label={__('节点名称')}
                    name="name"
                    key="name"
                    required
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            validateTrigger: 'onChange',
                            validator: validateName(),
                        },
                        {
                            validateTrigger: 'onBlur',
                            validator: validateUniqueness(),
                        },
                    ]}
                >
                    <Input
                        placeholder={__('请输入节点名称')}
                        maxLength={32}
                        style={{ color: 'rgba(0, 0, 0, 0.85)' }}
                    />
                </Form.Item>
                {modeSelect.map((mode) => (
                    <Form.Item
                        label={mode.label}
                        name={mode.name}
                        key={mode.name}
                        required
                        validateFirst
                        rules={[
                            {
                                validator: validateEmpty(mode.placeholder),
                            },
                        ]}
                    >
                        <Select
                            className={styles.customSelect}
                            placeholder={mode.placeholder}
                            getPopupContainer={(d) => d.parentNode}
                        >
                            {mode.options.map((v) => modeSelectItem(v))}
                        </Select>
                    </Form.Item>
                ))}
                <div className={styles.basicTitle}>
                    {__('类型配置')}
                    <span
                        style={{
                            color: 'rgba(0, 0, 0, 0.45)',
                            fontWeight: 'normal',
                        }}
                    >
                        ({__('至少选择一个类型')})
                    </span>
                </div>
                <Form.Item
                    name="check_type"
                    key="check_type"
                    rules={[
                        {
                            required: true,
                            message: __('至少选择一个类型'),
                            type: 'array',
                            validateTrigger: ['onBlur', 'onChange'],
                        },
                    ]}
                >
                    <Checkbox.Group
                        options={[
                            {
                                label: __('工单'),
                                value: CheckType.WORK_ORDER,
                            },
                            {
                                label: __('任务'),
                                value: CheckType.TASK,
                            },
                        ]}
                        value={checkOpts}
                        defaultValue={[CheckType.TASK, CheckType.WORK_ORDER]}
                        onChange={(checks) => {
                            setCheckOpts(checks)
                            form?.setFieldsValue({
                                check_type: checks,
                            })
                        }}
                    />
                </Form.Item>
                {checkOpts.includes(CheckType.WORK_ORDER) && (
                    <Form.Item
                        label={__('工单类型')}
                        name="work_order_type"
                        key="work_order_type"
                        validateTrigger={['onBlur', 'onChange']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择工单类型'),
                                type: 'array',
                                validateTrigger: ['onBlur', 'onChange'],
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择工单类型')}
                            mode="multiple"
                            showSearch={false}
                            getPopupContainer={(d) => d.parentNode}
                            allowClear
                        >
                            {workOrderTypeOptions.map((item) => {
                                return (
                                    <option value={item.value}>
                                        <div className={styles.typeSelect}>
                                            {item.label}
                                        </div>
                                    </option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                )}

                {checkOpts.includes(CheckType.TASK) && (
                    <Form.Item
                        label={__('任务类型')}
                        name="task_type"
                        key="task_type"
                        validateTrigger={['onBlur', 'onChange']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择任务类型'),
                                type: 'array',
                                validateTrigger: ['onBlur', 'onChange'],
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择任务类型')}
                            mode="multiple"
                            showSearch={false}
                            getPopupContainer={(d) => d.parentNode}
                            allowClear
                        >
                            {taskTypeOptions.map((item) => {
                                return (
                                    <option value={item.value}>
                                        <div className={styles.typeSelect}>
                                            <span className={styles.typeIcon}>
                                                {getTaskTypeIcon(item.value)}
                                            </span>
                                            {item.label}
                                        </div>
                                    </option>
                                )
                            })}
                        </Select>
                    </Form.Item>
                )}
            </Form>
        </Drawer>
    )
}

export default NodeConfigInfo
