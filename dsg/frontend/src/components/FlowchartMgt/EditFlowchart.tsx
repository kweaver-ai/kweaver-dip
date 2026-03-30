import React, { useContext, useEffect, useState, useMemo } from 'react'
import { Form, Input, message, Modal, Upload, UploadProps } from 'antd'
import styles from './styles.module.less'
import {
    formatError,
    messageError,
    flowchartCreate,
    flowchartEdit,
    flowchartImport,
    flowchartQueryItem,
    IFlowchartItem,
    transformQuery,
} from '@/core'
import {
    validateFlowchartDescLegitimacy,
    validateFlowchartNameLegitimacy,
    validateFlowchartUniqueness,
} from './validate'
import { TaskInfoContext } from '@/context'
import { OperateType } from '@/utils'
import __ from './locale'
import Loader from '@/ui/Loader'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface IEditFlowchart {
    visible: boolean
    operate: OperateType
    fid?: string
    modelId: string
    taskId?: string
    defaultName?: string
    onClose: () => void
    onSure: (item: IFlowchartItem) => void
}

/**
 * 创建/编辑 流程图
 * @param visible 显示/隐藏
 * @param operate 操作类型
 * @param item 流程图item
 * @param modelId 业务模型id
 * @param onClose 关闭
 * @param onSure 确定
 */
const EditFlowchart: React.FC<IEditFlowchart> = ({
    visible,
    operate,
    fid,
    modelId,
    taskId,
    defaultName,
    onClose,
    onSure,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)

    const [form] = Form.useForm()

    // load
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    // 流程图信息
    const [flowchartItem, setFlowchartItem] = useState<IFlowchartItem>()
    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])
    useEffect(() => {
        if (fid && operate !== OperateType.CREATE && visible) {
            getFlowchartDetail(fid)
            return
        }
        form.setFieldValue('name', defaultName)
    }, [visible])

    // 获取流程图详细信息
    const getFlowchartDetail = async (id) => {
        try {
            setFetching(true)
            const res = await flowchartQueryItem(modelId, id, versionParams)
            setFlowchartItem(res)
            // 编辑下显示已有的name, description
            const { name, description } = res
            form.setFieldsValue({ name, description })
        } catch (err) {
            formatError(err)
            setFlowchartItem(undefined)
        } finally {
            setFetching(false)
        }
    }

    // 对话框onCancel
    const handleModalCancel = () => {
        onClose()
        form.resetFields()
    }

    // 对话框onOk
    const handleModalOk = async () => {
        await form.validateFields()
        const { name, description } = form.getFieldsValue()
        let itemInfo
        try {
            setLoading(true)
            switch (operate) {
                case OperateType.CREATE:
                    itemInfo = await flowchartCreate(modelId, {
                        name,
                        description,
                        task_id: taskId || taskInfo.taskId,
                    })
                    break
                case OperateType.EDIT:
                    itemInfo = await flowchartEdit(
                        modelId,
                        flowchartItem?.id || '',
                        {
                            name,
                            description,
                            task_id: taskId || taskInfo.taskId,
                        },
                    )
                    message.success(__('编辑成功'))
                    break
                default:
                    break
            }
            handleModalCancel()
            onSure(itemInfo[0])
        } catch (err) {
            if (err?.data) {
                formatError(err)
            } else {
                messageError(__('文件不存在请重新上传'))
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.editWrapper}>
            <Modal
                title={`${
                    operate === OperateType.CREATE
                        ? __('新建流程图')
                        : operate === OperateType.EDIT
                        ? __('编辑流程图')
                        : __('导入流程图')
                }`}
                width={640}
                maskClosable={false}
                open={visible}
                onCancel={handleModalCancel}
                onOk={handleModalOk}
                destroyOnClose
                getContainer={false}
                okButtonProps={{ loading }}
                bodyStyle={{
                    display: 'flex',
                    minHeight: 328,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {fetching ? (
                    <Loader />
                ) : (
                    <div className={styles.formWrapper}>
                        <Form
                            form={form}
                            layout="vertical"
                            autoComplete="off"
                            initialValues={{ remember: true }}
                        >
                            <Form.Item
                                label={__('流程图名称')}
                                name="name"
                                validateFirst
                                validateTrigger={['onChange', 'onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        validateTrigger: 'onChange',
                                        validator:
                                            validateFlowchartNameLegitimacy(),
                                    },
                                    {
                                        validateTrigger: 'onBlur',
                                        validator: validateFlowchartUniqueness(
                                            modelId,
                                            operate === OperateType.EDIT
                                                ? flowchartItem?.id || ''
                                                : '',
                                            flowchartItem?.name,
                                        ),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入流程图名称')}
                                    maxLength={128}
                                    className={styles.nameInput}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('描述')}
                                name="description"
                                validateFirst
                                rules={[
                                    {
                                        validator:
                                            validateFlowchartDescLegitimacy(),
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    style={{ height: 136, resize: `none` }}
                                    placeholder={__('请输入描述')}
                                    maxLength={255}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default EditFlowchart
