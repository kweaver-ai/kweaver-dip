import React, { useContext, useEffect, useState } from 'react'
import {
    Button,
    Col,
    Form,
    Input,
    message,
    Modal,
    ModalProps,
    Select,
} from 'antd'
import { noop, trim } from 'lodash'
import {
    ErrorInfo,
    getActualUrl,
    getPlatformNumber,
    OperateType,
} from '@/utils'
import styles from './styles.module.less'
import {
    BizModelType,
    BusinessDomainLevelTypes,
    checkCoreBusinessName,
    copyBusinessModel,
    createCoreBusiness,
    formatError,
    getBusinessDomainProcessList,
    getCoreBusinessDetails,
    IBusinessDomainItem,
    ICoreBusinessDetails,
    LoginPlatform,
    updateCoreBusiness,
} from '@/core'
import { UNGROUPED, ViewMode } from './const'
import { TaskInfoContext } from '@/context'
import __ from './locale'
import Details from './Details'
import BusinessProcessSelect from './BusinessProcessSelect'
import { AddOutlined } from '@/icons'
import { useBusinessModelContext } from './BusinessModelProvider'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const { TextArea } = Input

interface ICreateCoreBusiness extends ModalProps {
    visible: boolean
    operateType: OperateType
    setOperateType?: (op: OperateType) => void
    selectedNode?: IBusinessDomainItem
    viewMode?: ViewMode
    editId?: string
    modalStyle?: React.CSSProperties
    onClose: () => void
    onSuccess?: (modelInfo) => void
}
const CreateCoreBusiness: React.FC<ICreateCoreBusiness> = ({
    operateType,
    visible,
    selectedNode,
    viewMode,
    editId = '',
    modalStyle,
    mask = true,
    maskClosable = false,
    onClose,
    onSuccess = noop,
    setOperateType = noop,
    ...modalProps
}) => {
    const [form] = Form.useForm()

    const { taskInfo } = useContext(TaskInfoContext)
    const [details, setDetails] = useState<ICoreBusinessDetails>()
    const [isUseEditPId, setIsUseEditPId] = useState(false)
    const [processList, setProcessList] = useState<IBusinessDomainItem[]>([])
    const { checkPermission } = useUserPermCtx()

    const { businessModelType, isButtonDisabled } = useBusinessModelContext()
    const platform = getPlatformNumber()

    // 获取业务模型详情
    const getDetails = async () => {
        if (!editId) return
        const res = await getCoreBusinessDetails(editId)
        const { name, business_domain_id, business_domain_name, description } =
            res
        form.setFieldsValue({
            domain_id: business_domain_id,
            name: operateType === OperateType.COPY ? `${name}_copy` : name,
            description,
        })

        setDetails(res)
    }

    useEffect(() => {
        if (visible) {
            if (
                operateType === OperateType.CREATE &&
                selectedNode?.type === BusinessDomainLevelTypes.Process
            ) {
                form.setFieldsValue({
                    domain_id: selectedNode.id,
                    name: selectedNode.name,
                })
            }
            if (
                [
                    OperateType.EDIT,
                    OperateType.DETAIL,
                    OperateType.COPY,
                ].includes(operateType)
            ) {
                setIsUseEditPId(true)
                getDetails()
            }
        } else {
            form.resetFields()
        }
    }, [visible])

    // 根据部门获取流程列表
    const getProcessList = async () => {
        try {
            const res = await getBusinessDomainProcessList({
                offset: 1,
                limit: 2000,
                department_id:
                    selectedNode?.id === UNGROUPED ? '' : selectedNode?.id,
                getall: selectedNode?.id === UNGROUPED || !selectedNode?.id,
                model_related: 0,
                info_related: 0,
            })
            setProcessList(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (ViewMode.Department === viewMode && visible) {
            getProcessList()
        }
    }, [viewMode, visible])

    const onFinish = async (values) => {
        try {
            let res
            if (operateType === OperateType.CREATE) {
                res = await createCoreBusiness({
                    ...values,
                    task_id: taskInfo?.taskId,
                    model_type: businessModelType,
                })

                message.success(__('新建成功'))
            } else if (operateType === OperateType.COPY) {
                res = await copyBusinessModel(editId, {
                    ...values,
                    task_id: taskInfo?.taskId,
                    model_type: businessModelType,
                    domain_id:
                        viewMode === ViewMode.BArchitecture
                            ? isUseEditPId
                                ? details?.business_domain_id
                                : values.domain_id
                            : values.domain_id,
                })
                message.success(__('复制成功'))
            } else {
                await updateCoreBusiness(
                    {
                        ...values,
                        domain_id:
                            viewMode === ViewMode.BArchitecture
                                ? isUseEditPId
                                    ? details?.business_domain_id
                                    : values.domain_id
                                : values.domain_id,
                        task_id: taskInfo?.taskId,
                    },

                    editId,
                )
                message.success(__('编辑成功'))
            }
            if (
                selectedNode?.id === UNGROUPED &&
                viewMode === ViewMode.Department
            ) {
                const selectedProcess = processList.find(
                    (pro) => pro.id === values.domain_id,
                )
                onSuccess({
                    ...values,
                    business_domain_name: values.domain_id,
                    id: selectedProcess?.department_id,
                    name: selectedProcess?.department_name,
                    domain_id:
                        operateType === OperateType.CREATE
                            ? values.domain_id
                            : undefined,
                })
                return
            }
            if (
                selectedNode?.id === UNGROUPED &&
                viewMode === ViewMode.BArchitecture
            ) {
                onSuccess({
                    ...values,
                    business_domain_name: values.domain_id,
                    id: values.domain_id,
                    name: '',
                    domain_id:
                        operateType === OperateType.CREATE
                            ? values.domain_id
                            : undefined,
                })
                return
            }

            onSuccess({
                ...values,
                business_domain_name: values.domain_id,
                ...res?.[0],
                domain_id:
                    operateType === OperateType.CREATE
                        ? values.domain_id
                        : undefined,
            })
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        const trimValue = trim(value)
        try {
            await checkCoreBusinessName({
                id: operateType === OperateType.CREATE ? undefined : editId,
                name: trimValue,
                task_id: taskInfo?.taskId,
                model_type: businessModelType,
            })
            return Promise.resolve()
        } catch (error) {
            if (error.data.code === 'BusinessGrooming.Model.NameAlreadyExist') {
                return Promise.reject(
                    new Error(
                        businessModelType === BizModelType.BUSINESS
                            ? __('该业务模型名称已存在，请重新输入')
                            : __('该数据模型名称已存在，请重新输入'),
                    ),
                )
            }
            return Promise.resolve()
        }
    }

    const onFieldsChange = (fields) => {
        if (
            operateType === OperateType.EDIT &&
            fields[0].name[0] === 'domain_id'
        ) {
            setIsUseEditPId(false)
        }
    }

    return (
        <div className={styles.createCoreBusiness}>
            <Modal
                width={640}
                getContainer={false}
                open={visible}
                title={
                    businessModelType === BizModelType.BUSINESS
                        ? operateType === OperateType.DETAIL
                            ? __('业务模型基本信息')
                            : operateType === OperateType.CREATE
                            ? __('新建业务模型')
                            : __('编辑业务模型基本信息')
                        : operateType === OperateType.DETAIL
                        ? __('数据模型基本信息')
                        : operateType === OperateType.CREATE
                        ? __('新建数据模型')
                        : __('编辑数据模型基本信息')
                }
                onOk={() => form.submit()}
                onCancel={() => {
                    onClose()
                }}
                destroyOnClose
                maskClosable={maskClosable}
                mask={mask}
                style={modalStyle}
                bodyStyle={{
                    maxHeight: 484,
                    overflow: 'auto',
                    paddingBottom: 0,
                }}
                footer={operateType === OperateType.DETAIL ? null : undefined}
                {...modalProps}
            >
                {operateType === OperateType.DETAIL ? (
                    <>
                        <Details data={details} />
                        {checkPermission(
                            'manageBusinessModelAndBusinessDiagnosis',
                        ) && (
                            <Button
                                className={styles['edit-btn']}
                                onClick={() => setOperateType(OperateType.EDIT)}
                                title={
                                    isButtonDisabled
                                        ? __('审核中，无法操作')
                                        : ''
                                }
                                disabled={isButtonDisabled}
                            >
                                {__('编辑信息')}
                            </Button>
                        )}
                    </>
                ) : (
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="vertical"
                        onFinish={onFinish}
                        scrollToFirstError
                        onFieldsChange={onFieldsChange}
                    >
                        <Form.Item
                            label={
                                businessModelType === BizModelType.BUSINESS
                                    ? __('业务模型名称')
                                    : __('数据模型名称')
                            }
                            name="name"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    required: true,
                                    message: ErrorInfo.NOTNULL,
                                    transform: (value) => trim(value),
                                },
                                // {
                                //     pattern: nameReg,
                                //     message: ErrorInfo.ONLYSUP,
                                //     transform: (value) => trim(value),
                                // },
                                {
                                    validateTrigger: ['onBlur'],
                                    validator: (e, value) =>
                                        validateNameRepeat(value),
                                },
                            ]}
                        >
                            <Input
                                placeholder={
                                    businessModelType === BizModelType.BUSINESS
                                        ? __('请输入业务模型名称')
                                        : __('请输入数据模型名称')
                                }
                                maxLength={128}
                            />
                        </Form.Item>
                        <div className={styles.formProcessContainer}>
                            <Form.Item
                                label={
                                    platform === LoginPlatform.default
                                        ? __('关联业务流程')
                                        : __('关联主干业务')
                                }
                                name="domain_id"
                                required={
                                    businessModelType === BizModelType.BUSINESS
                                }
                                rules={[
                                    {
                                        required:
                                            businessModelType ===
                                            BizModelType.BUSINESS,
                                        message:
                                            platform === LoginPlatform.default
                                                ? __('请选择业务流程')
                                                : __('请选择主干业务'),
                                    },
                                ]}
                            >
                                {viewMode === ViewMode.BArchitecture ? (
                                    <BusinessProcessSelect
                                        disabled={!!taskInfo?.taskId}
                                        placeholder={
                                            platform === LoginPlatform.default
                                                ? __('请选择业务流程')
                                                : __('请选择主干业务')
                                        }
                                    />
                                ) : (
                                    <Select
                                        placeholder={
                                            platform === LoginPlatform.default
                                                ? __('请选择业务流程')
                                                : __('请选择主干业务')
                                        }
                                        showSearch
                                        filterOption={(input, option) => {
                                            return (
                                                option?.children
                                                    ?.toString()
                                                    .toLowerCase()
                                                    .includes(
                                                        trim(
                                                            input.toLowerCase(),
                                                        ),
                                                    ) || false
                                            )
                                        }}
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                        notFoundContent={__('暂无数据')}
                                        allowClear
                                    >
                                        {processList.map((pro) => (
                                            <Select.Option
                                                value={pro.id}
                                                key={pro.id}
                                                disabled={pro.model_id}
                                                title={
                                                    pro.model_id
                                                        ? __(
                                                              '已关联模型，无法选择',
                                                          )
                                                        : ''
                                                }
                                            >
                                                {pro.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                )}
                            </Form.Item>
                            {viewMode === ViewMode.BArchitecture &&
                                !taskInfo?.taskId && (
                                    <div className={styles.addProcessBtn}>
                                        <Button
                                            type="link"
                                            onClick={() => {
                                                window.open(
                                                    getActualUrl(
                                                        '/business/architure',
                                                    ),
                                                )
                                            }}
                                            icon={<AddOutlined />}
                                            className={styles.btn}
                                        >
                                            {__('新建')}
                                        </Button>
                                    </div>
                                )}
                        </div>

                        <Form.Item
                            label={__('描述')}
                            name="description"
                            validateFirst
                            validateTrigger={['onChange', 'onBlur']}
                            rules={[
                                {
                                    transform: (value) => trim(value),
                                },
                            ]}
                        >
                            <TextArea
                                maxLength={300}
                                placeholder={__('请输入描述')}
                                showCount
                                style={{ resize: 'none', height: 134 }}
                                className={styles.showCount}
                            />
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </div>
    )
}

export default CreateCoreBusiness
