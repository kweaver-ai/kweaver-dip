import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Anchor,
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Radio,
    Row,
    Select,
    Space,
    Tooltip,
    message,
} from 'antd'
import { trim } from 'lodash'
import moment from 'moment'
import { MicroWidgetPropsContext } from '@/context'
import {
    checkNameWorkOrder,
    createWorkOrder,
    formatError,
    formsEnumConfig,
    getDataProcessingPlan,
    getWorkOrderDetail,
    queryStandardEnum,
    updateWorkOrder,
} from '@/core'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'

import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import __ from './locale'
import styles from './styles.module.less'
import { OrderTypeOptions, SelectPriorityOptions } from '../../helper'
import Return from '../../Return'
import { Empty } from '@/ui'
import EmptyAdd from '@/assets/emptyAdd.svg'
import ViewChoose from '../../ViewChoose'
import ModalTable from './ModalTable'
import PlanSelect from '../../PlanSelect'
import StandardizingModal from './StandardizingModal'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const ModalEmpty = ({ onAdd }: any) => {
    return (
        <div>
            <Empty
                iconSrc={EmptyAdd}
                desc={
                    <div>
                        点击<a onClick={onAdd}>【+添加】</a>按钮,可添加库表
                    </div>
                }
            />
        </div>
    )
}

const { Link } = Anchor
const OptModal = ({
    id,
    visible,
    type,
    onClose,
    projectNodeStageInfo,
}: any) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [form] = Form.useForm()
    const [detail, setDetail] = useState<any>()
    const needDeclaration = useRef<boolean>(false)
    const container = useRef<any>(null)
    const [chooseVisible, setChooseVisible] = useState<boolean>(false)
    const [standardVisible, setStandardVisible] = useState<boolean>(false)
    const [unStandard, setUnStandard] = useState<boolean>(true)
    const [modalViews, setModalViews] = useState<any[]>([])
    const [fromType, setFromType] = useState<any>()
    const [standardEnum, setStandardEnum] = useState<any>()
    const [config, setConfig] = useState<any>()
    const [currentView, setCurrentView] = useState<any>()
    const [userInfo] = useCurrentUser()
    useEffect(() => {
        const noViews = modalViews?.length === 0
        const someUnConfig = modalViews?.some(
            (o) =>
                !o?.fields ||
                (!!o?.fields &&
                    (o?.fields || []).some(
                        (f) => f?.standard_required && !f?.data_element,
                    )),
        )
        setUnStandard(noViews || someUnConfig)
    }, [modalViews])
    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    // 获取配置信息
    const getEnumConfig = async () => {
        try {
            const res = await formsEnumConfig()
            setConfig(res)
        } catch (e) {
            formatError(e)
        }
    }

    // 获取业务标准枚举配置
    const getStandardEnum = async () => {
        const res = await queryStandardEnum()
        setStandardEnum(res)
    }

    useEffect(() => {
        getEnumConfig()
        getStandardEnum()
    }, [])

    const [projectOptions, nodeOptions] = useMemo(() => {
        const { project, node, stage } = projectNodeStageInfo || {}
        return projectNodeStageInfo
            ? [
                  [
                      {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      },
                  ],
                  [
                      stage
                          ? {
                                key: `${stage.id}-${node.id}`,
                                value: `${stage.id}-${node.id}`,
                                label: `${stage.name}/${node.name}`,
                            }
                          : {
                                key: node.id,
                                value: node.id,
                                label: node.name,
                            },
                  ],
              ]
            : [[], []]
    }, [projectNodeStageInfo])

    useEffect(() => {
        if (detail) {
            const {
                description,
                finished_at,
                name,
                remark,
                priority,
                responsible_uid,
                responsible_uname,
                source_id,
                source_name,
                source_type,
                form_views,
            } = detail

            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : source_type || SourceTypeEnum.STANDALONE

            setFromType(fType)
            setModalViews(form_views)
            const param: any = {
                name,
                description,
                // remark,
                source_type: fType,
                priority: priority ? { value: priority } : undefined,
                finished_at: finished_at
                    ? moment(finished_at * 1000)
                    : undefined,
                form_views,
                responsible: responsible_uid
                    ? { value: responsible_uid, label: responsible_uname }
                    : undefined,
            }
            // 项目创建
            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            } else if (source_type === SourceTypeEnum.PLAN) {
                param.source = source_id
                    ? { key: source_id, value: source_id, label: source_name }
                    : undefined
            }
            form?.setFieldsValue(param)
        } else {
            form?.resetFields()
            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : SourceTypeEnum.STANDALONE
            setFromType(fType)

            const param: any = { source_type: fType }
            param.responsible = {
                value: userInfo?.ID,
                key: userInfo?.ID,
                label: userInfo?.VisionName,
            }
            if (projectNodeStageInfo) {
                const { project, node, stage } = projectNodeStageInfo || {}
                param.source = project
                    ? {
                          key: project.id,
                          value: project.id,
                          label: project.name,
                      }
                    : undefined
                param.node = node
                    ? stage?.id
                        ? {
                              key: `${stage.id}-${node.id}`,
                              value: `${stage.id}-${node.id}`,
                              label: `${stage.name}/${node.name}`,
                          }
                        : {
                              key: node.id,
                              value: node.id,
                              label: node.name,
                          }
                    : undefined
            }
            form?.setFieldsValue(param)
        }
    }, [detail, form, projectNodeStageInfo])

    const validateNameRepeat = (fid?: string) => {
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
                const errorMsg = __('该名称已存在，请重新输入')
                checkNameWorkOrder({
                    name: trimValue,
                    id: fid,
                    type,
                })
                    .then((res) => {
                        if (res) {
                            reject(new Error(errorMsg))
                        } else {
                            resolve(1)
                        }
                    })
                    .catch(() => {
                        reject(new Error(errorMsg))
                    })
            })
        }
    }

    const onFinish = async (values) => {
        const {
            priority,
            responsible,
            finished_at,
            source_type,
            source,
            ...rest
        } = values
        const params = {
            ...rest,
            form_views: modalViews,
            source_type,
            type,
            priority: priority ? priority.value : undefined,
            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,
            draft: !needDeclaration.current,
        }

        if (projectNodeStageInfo) {
            params.source_type = SourceTypeEnum.PROJECT
            params.source_id = source?.value
            params.source_name = source?.label
            params.node_id = projectNodeStageInfo?.node?.id
            params.node_name = projectNodeStageInfo?.node?.name
            params.stage_id = projectNodeStageInfo?.stage?.id
            params.stage_name = projectNodeStageInfo?.stage?.name
        } else if (source_type === SourceTypeEnum.PLAN) {
            params.source_id = source?.value
        }

        try {
            const tip = id ? __('更新成功') : __('新建成功')

            if (id) {
                await updateWorkOrder(id, params)
            } else {
                await createWorkOrder(params)
            }

            if (microWidgetProps?.components?.toast) {
                microWidgetProps?.components?.toast.success(tip)
            } else {
                message.success(tip)
            }
            onClose?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const typeLabel = useMemo(() => {
        return OrderTypeOptions.find((o) => o.value === type)?.label ?? ''
    }, [type])

    const getModalContent = () => {
        return modalViews?.length > 0 ? (
            <>
                <div className={styles['modal-table-top']}>
                    <div className={styles.title}>库表</div>
                    <div>
                        <Button
                            type="link"
                            onClick={() => {
                                setChooseVisible(true)
                            }}
                        >
                            +添加
                        </Button>
                    </div>
                </div>

                <ModalTable
                    data={modalViews}
                    onChange={(items) => {
                        setModalViews(items)
                    }}
                    onStandardzing={(item) => {
                        setStandardVisible(true)
                        setCurrentView(item)
                    }}
                />
            </>
        ) : (
            <ModalEmpty
                onAdd={() => {
                    setChooseVisible(true)
                }}
            />
        )
    }

    return (
        <Drawer
            open={visible}
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles['opt-wrapper']}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={`${id ? __('编辑') : __('新建')}${__(
                            '${type}工单',
                            {
                                type: typeLabel,
                            },
                        )}`}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.content} ref={container}>
                        <div className={styles.infoList}>
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off"
                                className={styles.form}
                            >
                                <div
                                    className={styles.moduleTitle}
                                    id="base-info"
                                >
                                    <h4>{__('基本信息')}</h4>
                                </div>

                                <Row gutter={24}>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('工单名称')}
                                            name="name"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                            rules={[
                                                {
                                                    required: true,
                                                    validateTrigger: 'onChange',
                                                    validator: validateName(),
                                                },
                                                {
                                                    validateTrigger: 'onBlur',
                                                    validator:
                                                        validateNameRepeat(id),
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder={__(
                                                    '请输入工单名称',
                                                )}
                                                maxLength={128}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('责任人')}
                                            name="responsible"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择责任人'),
                                                },
                                            ]}
                                        >
                                            <DepartResponsibleSelect
                                                placeholder={__('请选择责任人')}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('优先级')}
                                            name="priority"
                                        >
                                            <Select
                                                labelInValue
                                                placeholder={__('请选择优先级')}
                                                options={SelectPriorityOptions}
                                                getPopupContainer={(node) =>
                                                    node.parentNode
                                                }
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            label={__('截止日期')}
                                            name="finished_at"
                                            validateTrigger={[
                                                'onChange',
                                                'onBlur',
                                            ]}
                                            validateFirst
                                        >
                                            <DatePicker
                                                style={{ width: '100%' }}
                                                format="YYYY-MM-DD"
                                                placeholder={__(
                                                    '请选择截止日期',
                                                )}
                                                getPopupContainer={(node) =>
                                                    node.parentElement ||
                                                    document.body
                                                }
                                            />
                                        </Form.Item>
                                    </Col>

                                    {projectNodeStageInfo ? (
                                        <>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('来源项目')}
                                                    name="source"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择来源项目',
                                                        )}
                                                        options={projectOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={__('工单所在节点')}
                                                    name="node"
                                                >
                                                    <Select
                                                        labelInValue
                                                        placeholder={__(
                                                            '请选择工单所在节点',
                                                        )}
                                                        options={nodeOptions}
                                                        disabled
                                                        getPopupContainer={(
                                                            node,
                                                        ) => node.parentNode}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </>
                                    ) : (
                                        <Col
                                            span={
                                                fromType === SourceTypeEnum.PLAN
                                                    ? 12
                                                    : 24
                                            }
                                        >
                                            <Form.Item
                                                label={__('来源')}
                                                name="source_type"
                                            >
                                                <Radio.Group
                                                    onChange={(e) => {
                                                        const val =
                                                            e.target.value
                                                        setFromType(val)
                                                        form?.setFieldsValue({
                                                            source_type: val,
                                                        })
                                                    }}
                                                    value={fromType}
                                                >
                                                    <Radio value="standalone">
                                                        {__('无')}
                                                    </Radio>
                                                    <Radio value="plan">
                                                        {__('处理计划')}
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {fromType === SourceTypeEnum.PLAN && (
                                        <Col span={12}>
                                            <Form.Item
                                                key="source"
                                                label={__('来源计划')}
                                                name="source"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message:
                                                            __('请选择计划'),
                                                    },
                                                ]}
                                            >
                                                <PlanSelect
                                                    placeholder={__(
                                                        '请选择计划',
                                                    )}
                                                    fetchMethod={
                                                        getDataProcessingPlan
                                                    }
                                                    params={{
                                                        audit_status: 'pass',
                                                    }}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>

                                <Row gutter={24}>
                                    <Col span={24}>
                                        <Form.Item
                                            label={__('工单说明')}
                                            name="description"
                                            rules={[
                                                {
                                                    pattern: keyboardReg,
                                                    message:
                                                        ErrorInfo.EXCEPTEMOJI,
                                                },
                                            ]}
                                        >
                                            <Input.TextArea
                                                placeholder={__('请输入')}
                                                maxLength={800}
                                                style={{
                                                    height: 100,
                                                    resize: 'none',
                                                }}
                                                className={styles['show-count']}
                                                showCount
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className={styles.moduleTitle}
                                    id="standard-modal"
                                >
                                    <h4>{__('标准化信息')}</h4>
                                </div>
                                <div className={styles['modal-table']}>
                                    {getModalContent()}
                                </div>
                            </Form>
                        </div>

                        <div className={styles.menuContainer}>
                            <Anchor
                                targetOffset={48}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#base-info"
                                    title={__('基本信息')}
                                />
                                <Link
                                    href="#standard-modal"
                                    title={__('标准化信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                    <div className={styles.footer}>
                        <Space size={16}>
                            <Button onClick={() => onClose(false)}>
                                {__('取消')}
                            </Button>
                            <Tooltip
                                title={
                                    modalViews?.length === 0
                                        ? '未添加资源,无法提交'
                                        : unStandard
                                        ? '存在资源未标准化,无法提交'
                                        : ''
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        needDeclaration.current = true
                                        form.submit()
                                    }}
                                    disabled={unStandard}
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>
            {chooseVisible && (
                <ViewChoose
                    open={chooseVisible}
                    bindItems={modalViews}
                    onClose={() => {
                        setChooseVisible(false)
                    }}
                    onSure={(items) => {
                        const transData = (items || []).map((o) => ({
                            ...o,
                            datasource_name: o?.datasource,
                        }))
                        // 设置选中view
                        setModalViews((prev) => [...(prev ?? []), ...transData])
                        setChooseVisible(false)
                    }}
                />
            )}

            {standardVisible && (
                <StandardizingModal
                    visible={standardVisible}
                    viewId={currentView?.id}
                    name={currentView?.business_name}
                    config={config}
                    defaultFields={currentView?.fields || []}
                    onClose={() => {
                        setStandardVisible(false)
                        setCurrentView(undefined)
                    }}
                    onSure={(items) => {
                        const its = items?.map((o) => ({
                            data_element: o?.data_element,
                            standard_required: o?.standard_required,
                            technical_name: o?.technical_name,
                            business_name: o?.business_name,
                            id: o?.id,
                        }))

                        setModalViews((prev) =>
                            (prev || []).map((o) =>
                                o?.id === currentView?.id
                                    ? { ...o, fields: its }
                                    : o,
                            ),
                        )
                        setStandardVisible(false)
                        setCurrentView(undefined)
                    }}
                />
            )}
        </Drawer>
    )
}
export default OptModal
