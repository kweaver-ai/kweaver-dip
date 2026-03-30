import React, { useEffect, useMemo, useState } from 'react'
import {
    Form,
    Input,
    message,
    Modal,
    Select,
    TreeSelect,
    Button,
    Radio,
} from 'antd'
import classnames from 'classnames'
import { findLastIndex, trim } from 'lodash'
import __ from './locale'
import {
    ErrorInfo,
    getPlatformNumber,
    keyboardReg,
    OperateType,
    formatTime,
} from '@/utils'
import styles from './styles.module.less'
import {
    ISystemItem,
    reqInfoSystemList,
    BusinessDomainLevelTypes,
    createBusinessDomainTreeNode,
    updateBusinessDomainTreeNode,
    formatError,
    checkBusinessDomainTreeNode,
    IBusinessDomainItem,
    getBusinessDomainTreeNodeDetails,
    LoginPlatform,
    BusinessAuditStatus,
    deleteDraft,
} from '@/core'
import BusinessDomainSelect from './BusinessDomainSelect'
import { LevelTypeNameMap } from '../BusinessDomainLevel/const'
import { BusinessDomainLevelLabelName, ViewMode } from './const'
import { useArchitecture } from './ArchitectureProvider'
import DepartmentAndOrgSelect from '../DepartmentAndOrgSelect'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { checkAuditProcess } from './helper'

interface ICreateArchitecture {
    open: boolean
    operateType: OperateType
    levelType: BusinessDomainLevelTypes
    // 业务架构-左侧树视角（业务域、部门/组织架构，部门/组织架构）
    viewMode?: ViewMode
    onClose: () => void
    operateData?: IBusinessDomainItem
    onOk?: (
        type: OperateType,
        newDataId: string,
        currentData?: IBusinessDomainItem,
    ) => void
    domainLevels: BusinessDomainLevelTypes[]
    selectedNode?: IBusinessDomainItem
    // 默认数据
    defaultData?: any
    taskId?: string
    // 引用组件
    quote?: string
}
const CreateArchitecture: React.FC<ICreateArchitecture> = ({
    open,
    operateType,
    levelType,
    viewMode,
    onClose,
    operateData,
    onOk,
    domainLevels,
    selectedNode,
    defaultData = {},
    quote,
    taskId,
}) => {
    const [form] = Form.useForm()
    const [systems, setSystems] = useState<ISystemItem[]>([])
    const [isUseEditPId, setIsUseEditPId] = useState(false)
    const [details, setDetails] = useState<IBusinessDomainItem>()
    const platformNumber = getPlatformNumber()
    const { selectedDepartmentId } = useArchitecture()
    const [userInfo] = useCurrentUser()
    const [userDepId, setUserDepId] = useState('')

    // 新建：父级是流程类型时代表新建子流程 编辑：todo 子流程不显示所属业务域
    const isSubprocess = useMemo(() => {
        if (operateType === OperateType.CREATE) {
            return operateData?.type === BusinessDomainLevelTypes.Process
        }
        // const level = operateData?.path_id.split('/').length || 3
        // // 如果上一级是流程，那么当前编辑的为子流程
        // return domainLevels[level - 2] === BusinessDomainLevelTypes.Process
        return (
            operateData?.type === BusinessDomainLevelTypes.Process &&
            operateData.parent_type === BusinessDomainLevelTypes.Process
        )
    }, [operateData, operateType])

    useEffect(() => {
        if (userInfo?.ParentDeps?.[0]?.path_id) {
            const userDepIds = userInfo?.ParentDeps?.[0]?.path_id.split('/')
            setUserDepId(userDepIds[userDepIds.length - 1])
        }
    }, [userInfo])

    // 获取信息系统
    const getAllSystems = async () => {
        const res = await reqInfoSystemList({
            limit: 2000,
            offset: 1,
        })
        setSystems(res.entries)
    }

    useEffect(() => {
        const pathIds = selectedNode?.path_id?.split('/')
        if (pathIds) {
            const lastDomainIndex = findLastIndex(
                domainLevels,
                (item) => item === BusinessDomainLevelTypes.Process,
            )
            if (pathIds.length - 1 === lastDomainIndex - 1) {
                form.setFieldsValue({
                    parent_id: selectedNode?.id,
                })
            }
        }
    }, [selectedNode, domainLevels])

    const getData = async () => {
        if (operateData) {
            try {
                const node: any = await getBusinessDomainTreeNodeDetails(
                    operateData.id,
                    operateData?.has_draft ? { draft: true } : undefined,
                )
                form.setFieldsValue({
                    ...node,
                    business_system_id: node.business_system || undefined,
                    department_id: node?.department_id || undefined,
                    parent_id:
                        operateData?.type ===
                            BusinessDomainLevelTypes.Process && !isSubprocess
                            ? node?.parent_name
                            : undefined,
                })
                setDetails(node)
            } catch (error) {
                formatError(error)
            }
        }
    }
    useEffect(() => {
        if (!open) {
            form.resetFields()
        } else {
            getAllSystems()
            if (operateType === OperateType.EDIT) {
                setIsUseEditPId(true)
                getData()
                // form.setFieldsValue({
                //     ...operateData,
                //     business_system_id:
                //         operateData?.business_system || undefined,
                //     department_id: operateData?.department_id || undefined,
                //     parent_id:
                //         operateData?.type ===
                //             BusinessDomainLevelTypes.Process && !isSubprocess
                //             ? operateData?.parent_name
                //             : undefined,
                // })
            } else if (operateType === OperateType.CREATE) {
                form.setFieldsValue({
                    ...defaultData,
                    department_id:
                        selectedDepartmentId || userDepId || undefined,
                })
            }
        }
    }, [open, selectedDepartmentId, userDepId])

    const getNamePlaceholder = () => {
        return levelType === BusinessDomainLevelTypes.DomainGrouping
            ? __('请输入业务领域分组名称')
            : levelType === BusinessDomainLevelTypes.Domain
            ? __('请输入业务领域名称')
            : platformNumber === LoginPlatform.default
            ? __('请输入业务流程名称')
            : __('请输入主干业务名称')
    }

    const validateNameRepeat = async (value: string): Promise<void> => {
        if (
            operateType === OperateType.CREATE &&
            !form.getFieldValue('parent_id') &&
            levelType === BusinessDomainLevelTypes.Process
        )
            return Promise.resolve()
        try {
            const res = await checkBusinessDomainTreeNode({
                parent_id: isSubprocess
                    ? operateType === OperateType.CREATE
                        ? operateData?.id
                        : operateData?.parent_id
                    : operateType === OperateType.CREATE
                    ? levelType === BusinessDomainLevelTypes.Process
                        ? form.getFieldValue('parent_id')
                        : operateData?.id || ''
                    : operateData?.type === BusinessDomainLevelTypes.Process
                    ? isUseEditPId
                        ? operateData.parent_id
                        : form.getFieldValue('parent_id')
                    : operateData?.parent_id || '',
                name: trim(value),
                node_id:
                    operateType === OperateType.CREATE ? '' : operateData?.id,
            })
            if (res.repeat) {
                return Promise.reject(
                    new Error(
                        levelType === BusinessDomainLevelTypes.DomainGrouping
                            ? __('该名称的业务领域分组已存在，请重新输入')
                            : levelType === BusinessDomainLevelTypes.Domain
                            ? __(
                                  '当前节点下，本层级中该名称的业务领域已存在，请重新输入',
                              )
                            : platformNumber === LoginPlatform.default
                            ? __(
                                  '当前节点下，本层级中该名称的业务流程已存在，请重新输入',
                              )
                            : __(
                                  '当前节点下，本层级中该名称的主干业务已存在，请重新输入',
                              ),
                    ),
                )
            }
            return Promise.resolve()
        } catch (error) {
            return Promise.reject(new Error(error.data.description))
        }
    }

    const onFinish = async (values) => {
        try {
            let res
            if (OperateType.CREATE === operateType) {
                const taskPrams = taskId ? { task_id: taskId } : {}
                res = await createBusinessDomainTreeNode({
                    parent_id: operateData?.id,
                    // 创建业务流程时 values中的parent_id会覆盖
                    ...values,
                    type: levelType,
                    ...taskPrams,
                })
                message.success(__('新建成功'))
            } else {
                res = await updateBusinessDomainTreeNode(
                    {
                        ...values,
                        parent_id:
                            !isSubprocess &&
                            operateData?.type ===
                                BusinessDomainLevelTypes.Process
                                ? isUseEditPId
                                    ? operateData.parent_id
                                    : values.parent_id
                                : undefined,
                    },

                    operateData?.id || '',
                )

                // 检查是否配置了发布审核流程
                const hasAuditProcess = await checkAuditProcess(levelType)
                // 未配置发布审核流程时提示编辑成功
                if (!hasAuditProcess) {
                    message.success(__('编辑成功'))
                }
            }
            onClose()
            onOk?.(
                operateType,
                {
                    ...res[0],
                    ...values,
                    type:
                        OperateType.CREATE === operateType
                            ? levelType
                            : undefined,
                },
                operateData,
            )
        } catch (error) {
            formatError(error)
        }
    }

    const onFieldsChange = (fields) => {
        if (fields?.[0]?.name?.[0] === 'parent_id') {
            form.validateFields(['name'])
            if (operateType === OperateType.EDIT) {
                setIsUseEditPId(false)
            }
        }

        if (fields?.[0]?.name?.[0] === 'business_system_id') {
            const systemIds = fields[0]?.value
            if (systemIds?.length > 0) {
                const systemDepartmentId =
                    systems?.find((item) => systemIds[0] === item.id)
                        ?.department_id || ''

                if (systemDepartmentId) {
                    // 使用 setTimeout 确保在下一个事件循环中更新
                    setTimeout(() => {
                        form.setFieldsValue({
                            department_id: systemDepartmentId,
                        })
                    }, 0)
                }
            }
        }
    }

    const getDisabledNode = (node: IBusinessDomainItem) => {
        const lastDomainIndex = findLastIndex(
            domainLevels,
            (item) => item === BusinessDomainLevelTypes.Domain,
        )
        const disable =
            (node.path?.split?.('/')?.length || 0) - 1 !== lastDomainIndex
        return {
            disable,
            message: disable ? __('不支持选择此节点') : '',
        }
    }

    // 删除草稿
    const handleCancelDraft = async () => {
        try {
            await deleteDraft(operateData?.id || '')
            message.success(__('删除草稿成功'))
            // 重新获取数据
            await getData()
        } catch (error) {
            formatError(error)
        }
    }

    const getTips = () => {
        // 新建时，不展示草稿提示
        if (operateType === OperateType.CREATE) return null
        if (details && details?.has_draft && quote === 'businessArea') {
            if (details?.audit_status === BusinessAuditStatus.ChangeReject) {
                return (
                    <div className={styles['tips-wrapper']}>
                        {__('变更审核未通过，已产生草稿。审批意见：')}
                        <div
                            className={styles['tips-content']}
                            title={details?.description}
                        >
                            {details?.reject_reason}
                        </div>
                        <Button
                            className={styles['tips-button']}
                            type="link"
                            onClick={handleCancelDraft}
                        >
                            {__('恢复到已发布的内容')}
                        </Button>
                    </div>
                )
            }
            if (details?.audit_status === BusinessAuditStatus.Published) {
                return (
                    <div
                        className={classnames(
                            styles['tips-wrapper'],
                            styles['tips-draft'],
                        )}
                    >
                        {__('当前草稿')}
                        <div>{formatTime(details?.updated_at)}</div>
                        {__('由【')}
                        <div
                            className={styles['tips-content']}
                            title={details?.updated_by}
                        >
                            {details?.updated_by}
                        </div>
                        {__('】编辑产生')}
                        <Button
                            className={styles['tips-button']}
                            type="link"
                            onClick={handleCancelDraft}
                        >
                            {__('放弃草稿')}
                        </Button>
                    </div>
                )
            }
            return null
        }

        return null
    }

    return (
        <Modal
            title={
                operateType === OperateType.CREATE
                    ? `${__('新建')}${
                          levelType === BusinessDomainLevelTypes.Process &&
                          platformNumber !== LoginPlatform.default
                              ? __('主干业务')
                              : LevelTypeNameMap[levelType]
                      }`
                    : `${__('编辑')}${
                          levelType === BusinessDomainLevelTypes.Process &&
                          platformNumber !== LoginPlatform.default
                              ? __('主干业务')
                              : LevelTypeNameMap[
                                    operateData?.type ||
                                        BusinessDomainLevelTypes.DomainGrouping
                                ]
                      }`
            }
            okText={__('提交')}
            width={640}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            maskClosable={false}
        >
            <div className={styles['create-architecture-wrapper']}>
                {getTips()}
                <Form
                    layout="vertical"
                    autoComplete="off"
                    form={form}
                    onFinish={onFinish}
                    onFieldsChange={onFieldsChange}
                >
                    <div
                        className={styles['father-node']}
                        // 创建 第一层级流程 与 业务域分组 时不需展示父级
                        hidden={
                            levelType ===
                                BusinessDomainLevelTypes.DomainGrouping ||
                            (levelType === BusinessDomainLevelTypes.Process &&
                                !operateData)
                        }
                    >
                        {__('父级节点：')}
                        {`${
                            operateType === OperateType.CREATE
                                ? operateData?.name
                                : details?.parent_name
                        } （${
                            LevelTypeNameMap[
                                (operateType === OperateType.CREATE
                                    ? operateData?.type
                                    : details?.parent_type) ||
                                    BusinessDomainLevelTypes.DomainGrouping
                            ]
                        }）`}
                    </div>
                    <Form.Item
                        label={
                            OperateType.CREATE === operateType
                                ? BusinessDomainLevelLabelName[levelType]
                                : operateData
                                ? BusinessDomainLevelLabelName[operateData.type]
                                : ''
                        }
                        name="name"
                        validateTrigger={['onChange', 'onBlur']}
                        validateFirst
                        rules={[
                            {
                                required: true,
                                transform: (value) => trim(value),
                                message: ErrorInfo.NOTNULL,
                            },
                            // {
                            //     pattern: nameReg,
                            //     transform: (value) => trim(value),
                            //     message: ErrorInfo.ONLYSUP,
                            // },
                            {
                                validateTrigger: ['onBlur'],
                                validator: (e, value) =>
                                    validateNameRepeat(value),
                            },
                        ]}
                    >
                        <Input
                            placeholder={getNamePlaceholder()}
                            maxLength={128}
                        />
                    </Form.Item>
                    {/* 新建子层业务流程不展示业务域及业务域分组 */}
                    {![
                        BusinessDomainLevelTypes.DomainGrouping,
                        BusinessDomainLevelTypes.Domain,
                    ].includes(levelType) && (
                        <>
                            {!isSubprocess && (
                                <Form.Item
                                    label={__('所属业务领域')}
                                    name="parent_id"
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择所属业务领域'),
                                        },
                                    ]}
                                >
                                    <BusinessDomainSelect
                                        isShowProcess={false}
                                        initTreeNode={
                                            // 业务域树节点下新建流程，传入选中节点
                                            operateType ===
                                                OperateType.CREATE &&
                                            viewMode === ViewMode.Domain
                                                ? selectedNode
                                                : undefined
                                        }
                                        getDisabledNode={getDisabledNode}
                                    />
                                </Form.Item>
                            )}

                            <Form.Item
                                shouldUpdate={(prevValues, currentValues) =>
                                    JSON.stringify(
                                        prevValues.business_system_id,
                                    ) !==
                                    JSON.stringify(
                                        currentValues.business_system_id,
                                    )
                                }
                                noStyle
                            >
                                {({ getFieldValue }) => {
                                    const systemIds =
                                        getFieldValue('business_system_id')
                                    let systemDepartmentId = ''
                                    if (systemIds?.length > 0) {
                                        systemDepartmentId =
                                            systems?.find(
                                                (item) =>
                                                    systemIds[0] === item.id,
                                            )?.department_id || ''
                                    }

                                    return (
                                        <Form.Item
                                            label={__('所属部门')}
                                            name="department_id"
                                            rules={[
                                                {
                                                    required: true,
                                                    message:
                                                        __('请选择所属部门'),
                                                },
                                            ]}
                                        >
                                            <DepartmentAndOrgSelect
                                                defaultValue={
                                                    systemDepartmentId ||
                                                    details?.department_id ||
                                                    selectedDepartmentId ||
                                                    userDepId ||
                                                    ''
                                                }
                                                allowClear
                                                placeholder={__(
                                                    '请选择所属部门',
                                                )}
                                                getInitValueError={(result) => {
                                                    if (result) {
                                                        form.setFields([
                                                            {
                                                                name: [
                                                                    'department_id',
                                                                ],
                                                                errors: [
                                                                    result,
                                                                ],
                                                                value: null,
                                                            },
                                                        ])
                                                    }
                                                }}
                                            />
                                            {/* <DepartmentSelected
                                    placeholder={__('请选择所属部门')}
                                    dropdownStyle={{
                                        width: '100%',
                                        maxHeight: 400,
                                        overflow: 'auto',
                                    }}
                                    dropdownMatchSelectWidth={false}
                                    getInitValueError={(result) => {
                                        if (result) {
                                            form.setFields([
                                                {
                                                    name: ['department_id'],
                                                    errors: [result],
                                                    value: null,
                                                },
                                            ])
                                        }
                                    }}
                                /> */}
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                            <Form.Item
                                label={__('关联信息系统')}
                                name="business_system_id"
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择关联信息系统'),
                                    },
                                ]}
                            >
                                <Select
                                    placeholder={__('请选择关联信息系统')}
                                    mode="multiple"
                                    getPopupContainer={(node) =>
                                        node.parentNode
                                    }
                                    showSearch
                                    options={systems}
                                    optionFilterProp="name"
                                    fieldNames={{ label: 'name', value: 'id' }}
                                    notFoundContent={
                                        systems.length === 0
                                            ? __('暂无数据')
                                            : __('未找到匹配的结果')
                                    }
                                />
                            </Form.Item>
                        </>
                    )}

                    {![
                        BusinessDomainLevelTypes.DomainGrouping,
                        BusinessDomainLevelTypes.Domain,
                    ].includes(levelType) && (
                        <Form.Item
                            label={__('是否业务事项')}
                            name="business_matter"
                            initialValue={details?.business_matter || 0}
                        >
                            <Radio.Group>
                                <Radio value={1}>{__('是')}</Radio>
                                <Radio value={0}>{__('否')}</Radio>
                            </Radio.Group>
                        </Form.Item>
                    )}

                    <Form.Item
                        label={__('描述')}
                        name="description"
                        rules={[
                            {
                                transform: (value) => trim(value),
                                pattern: keyboardReg,
                                message: ErrorInfo.EXCEPTEMOJI,
                            },
                        ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入描述')}
                            maxLength={300}
                            style={{ height: 134, resize: 'none' }}
                            showCount
                            className={styles.showCount}
                        />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    )
}

export default CreateArchitecture
