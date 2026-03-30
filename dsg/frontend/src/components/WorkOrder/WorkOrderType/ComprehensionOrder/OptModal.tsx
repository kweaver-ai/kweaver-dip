import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
    Anchor,
    Button,
    Col,
    DatePicker,
    Drawer,
    Form,
    Input,
    Modal,
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
    getDataComprehensionPlan,
    getRescCatlgList,
    getWorkOrderDetail,
    updateWorkOrder,
} from '@/core'
import { ErrorInfo, keyboardReg, nameReg, validateName } from '@/utils'

import DepartResponsibleSelect from '../../DepartResponsibleSelect'
import __ from './locale'
import styles from './styles.module.less'
import { OrderTypeOptions, SelectPriorityOptions } from '../../helper'
import FreeTaskRelateCats from '@/components/TaskComponents/FreeTaskRelateCats'
import PlanSelect from '../../PlanSelect'
import Return from '../../Return'
import { Empty } from '@/ui'
import EmptyAdd from '@/assets/emptyAdd.svg'
import { SourceTypeEnum } from '../../WorkOrderManage/helper'
import ModalTable from './ModalTable'
import CatlgChooseModal from '@/components/CatlgChooseModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const ModalEmpty = ({ onAdd }: any) => {
    return (
        <div>
            <Empty
                iconSrc={EmptyAdd}
                desc={
                    <div>
                        点击<a onClick={onAdd}>【+添加】</a>
                        按钮,可添加数据资源目录
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
    const container = useRef<any>(null)
    // 资源目录默认信息
    const [assetsCats, setAssetsCats] = useState<
        { id?: string; name?: string; path?: string }[] | undefined
    >()
    const [acLoading, setAcLoading] = useState(false)
    const [fromType, setFromType] = useState<any>()
    const [userInfo] = useCurrentUser()

    const [chooseVisible, setChooseVisible] = useState<boolean>(false)
    const [standardVisible, setStandardVisible] = useState<boolean>(false)
    const [unStandard, setUnStandard] = useState<boolean>(true)
    const [modalViews, setModalViews] = useState<any[]>([])
    const [currentView, setCurrentView] = useState<any>()
    useEffect(() => {
        const noViews = modalViews?.length === 0
        const someUnConfig = modalViews?.some(
            (o) =>
                !o?.fields ||
                (!!o?.fields &&
                    (o?.fields || []).some(
                        (f) => !(f?.standard_required && !!f?.data_element),
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
        if (visible) {
            getAssetsCatList()
        }
    }, [visible])

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

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
                // remark,
                priority,
                responsible_uid,
                responsible_uname,
                source_id,
                source_name,
                source_type, // 暂时全为plan
                catalog_infos,
            } = detail
            const fType = projectNodeStageInfo
                ? SourceTypeEnum.PROJECT
                : source_type || SourceTypeEnum.STANDALONE

            setFromType(fType)
            setModalViews(
                catalog_infos?.map((o) => ({
                    id: o?.catalog_id,
                    name: o?.catalog_name,
                })),
            )
            const param: any = {
                name,
                description,
                source_type: fType,
                // remark,
                priority: priority ? { value: priority } : undefined,
                finished_at: finished_at
                    ? moment(finished_at * 1000)
                    : undefined,
                // catalogs: catalog_infos?.map((o) => o?.catalog_id),
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
    // 获取资源目录列表
    const getAssetsCatList = async (assetsId?: string) => {
        try {
            setAcLoading(true)
            const res = await getRescCatlgList({
                limit: 0,
                categoryID: '',
                orgcode: '',
                online_status: 'online,down-auditing,down-reject',
                need_org_paths: true,
            })
            const arr = res?.entries?.map((e: any) => ({
                id: e.id,
                name: e.title || e?.name,
                path: e.org_paths?.join('/') || e?.department_path,
            }))
            setAssetsCats(arr)
        } catch (err) {
            formatError(err)
        } finally {
            setAcLoading(false)
        }
    }

    const onFinish = async (values) => {
        const {
            priority,
            responsible,
            finished_at,
            source,
            source_type,
            ...rest
        } = values
        const params = {
            ...rest,
            type,
            source_type,
            priority: priority ? priority.value : undefined,
            catalog_ids: modalViews?.length
                ? modalViews?.map((o) => o.id)
                : undefined,

            finished_at: finished_at
                ? finished_at.endOf('day').unix()
                : undefined,
            responsible_uid: responsible?.value,
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

    // 禁止选择今天之前的日期
    const disabledDate = (current) => {
        return current && current < moment().startOf('day')
    }

    const getModalContent = () => {
        return modalViews?.length > 0 ? (
            <>
                <div className={styles['modal-table-top']}>
                    <div className={styles.title}>数据资源目录</div>
                    <div>
                        <Button
                            type="link"
                            onClick={() => {
                                setChooseVisible(true)
                            }}
                        >
                            +添加数据目录
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
                                                disabledDate={disabledDate}
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
                                    {projectNodeStageInfo && (
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
                                    )}

                                    {!projectNodeStageInfo && (
                                        <Col span={12}>
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
                                                    <Radio
                                                        value={
                                                            SourceTypeEnum.STANDALONE
                                                        }
                                                    >
                                                        无
                                                    </Radio>
                                                    <Radio
                                                        value={
                                                            SourceTypeEnum.PLAN
                                                        }
                                                    >
                                                        理解计划
                                                    </Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {fromType === SourceTypeEnum.PLAN && (
                                        <Col span={12}>
                                            <Form.Item
                                                label={__('来源计划', {
                                                    type: typeLabel,
                                                })}
                                                name="source"
                                            >
                                                <PlanSelect
                                                    placeholder={__(
                                                        '请选择计划',
                                                    )}
                                                    fetchMethod={
                                                        getDataComprehensionPlan
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
                                    id="comprehension-info"
                                >
                                    <h4>{__('数据理解信息')}</h4>
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
                                    href="#comprehension-info"
                                    title={__('数据理解信息')}
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
                            // title={
                            //     modalViews?.length === 0
                            //         ? '未添加资源,无法提交'
                            //         : ''
                            // }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        form.submit()
                                    }}
                                    // disabled={unStandard}
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            </div>

            {chooseVisible && (
                <CatlgChooseModal
                    open={chooseVisible}
                    selDataItems={modalViews || []}
                    useDetail={false}
                    onClose={() => setChooseVisible(false)}
                    onSure={async (items) => {
                        // 设置选中view
                        setModalViews((prev) => [...(prev ?? []), ...items])
                        setChooseVisible(false)
                    }}
                />
            )}
        </Drawer>
    )
}

export default OptModal
