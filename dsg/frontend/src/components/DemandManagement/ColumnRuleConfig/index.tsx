import React, { useEffect, useRef, useState } from 'react'
import {
    Button,
    Collapse,
    Form,
    Input,
    Modal,
    Radio,
    Select,
    Space,
    Steps,
    Tooltip,
    message,
} from 'antd'
import { trim } from 'lodash'
import { useMount, useUnmount, useUpdateEffect } from 'ahooks'
import __ from '../locale'
import styles from './styles.module.less'
import {
    AssetTypeEnum,
    IDatasheetField,
    ISubView,
    formatError,
    getDatasheetViewDetails,
    getExploreReport,
    getLogicViewAuth,
    getSubViews,
    getVirtualEngineExample,
    getVisitorAuth,
} from '@/core'
import { OperateRuleMode } from './const'
import ViewRules from '../Details/ViewRules'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import VisitorCard from '../VisitorCard'
import RowAndColFilter from '@/components/RowAndColFilter/RowAndColFilter'
import { VisitorProvider } from '../VisitorProvider'
import { ErrorInfo, keyboardCharactersReg } from '@/utils'
import { Permission } from '../const'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

const { Panel } = Collapse

interface IColumnRuleConfig {
    open: boolean
    onClose: () => void
    onOk?: (data) => void
    editData?: any
    onDataChange?: () => void
    sheetId: string
}
const ColumnRuleConfig: React.FC<IColumnRuleConfig> = ({
    open,
    onClose,
    onOk,
    editData,
    onDataChange,
    sheetId,
}) => {
    const [form] = Form.useForm()
    const [currentStep, setCurrentStep] = useState(0)
    const [fields, setFields] = useState<any[]>([])
    const [exampleData, setExampleData] = useState<any>({})
    const [openProbe, setOpenProbe] = useState<boolean>()
    const [visitors, setVisitors] = useState<any[]>([])
    const [originVisitors, setOriginVisitors] = useState<any[]>([])
    const [detail, setDetail] = useState<any>()
    const [subViews, setSubViews] = useState<ISubView[]>([])
    const [visitorPermission, setVisitorPermission] = useState<{
        [key: string]: Permission
    }>({})

    const filterRef = useRef<any>()

    useEffect(() => {
        if (editData) {
            setVisitors(editData.policies)
            setOriginVisitors(editData.policies)
            if (editData.id) {
                form.setFieldsValue({ ruleId: editData.id })
            } else {
                form.setFieldsValue({
                    type: editData.id
                        ? OperateRuleMode.Choose
                        : OperateRuleMode.Add,
                    name: editData.spec.name,
                })
                setDetail(editData.spec.detail)
            }
        }
    }, [editData])

    useMount(() => {
        message.config({
            top: 100,
            getContainer: () =>
                document.getElementById('rule-config-wrapper-id')!,
        })
    })

    useUnmount(() => {
        message.config({
            top: 100,
            getContainer: () => document.body,
        })
    })

    // 获取访问者的库表权限
    const getVisitorExistPermission = async (vs) => {
        const res = await Promise.all(
            vs.map((v) =>
                getVisitorAuth({
                    subject_id: v.subject_id,
                    object_type: AssetTypeEnum.SubView,
                    subject_type: 'user',
                }),
            ),
        )
        const permissions = {}
        res.forEach((r, pIndex) => {
            if (r.entries.length > 0) {
                const sheetPer = r.entries.find(
                    (item) => item.object_id === form.getFieldValue('ruleId'),
                )
                if (sheetPer) {
                    const downloadPer = sheetPer.permissions.find(
                        (p) => p.action === Permission.Download,
                    )
                    if (downloadPer && downloadPer.effect === 'allow') {
                        permissions[vs[pIndex].subject_id] = Permission.Download
                    } else {
                        const readPer = sheetPer.permissions.find(
                            (p) => p.action === Permission.Read,
                        )
                        if (readPer && readPer.effect === 'allow') {
                            permissions[vs[pIndex].subject_id] = Permission.Read
                        }
                    }
                }
            }
        })
        setVisitorPermission({ ...visitorPermission, ...permissions })
        setVisitors(
            visitors.map((item) => {
                if (item.actions.length === 0) {
                    if (permissions[item.subject_id] === Permission.Download) {
                        return {
                            ...item,
                            actions: [Permission.Download, Permission.Read],
                        }
                    }
                    if (permissions[item.subject_id] === Permission.Read) {
                        return {
                            ...item,
                            actions: [Permission.Read],
                        }
                    }
                    return item
                }
                return item
            }),
        )
    }

    useEffect(() => {
        if (visitors.length > 0) {
            getVisitorExistPermission(visitors)
        }
    }, [visitors.length])

    const getFields = async () => {
        const res = await getDatasheetViewDetails(sheetId)
        const [catalog, schema] = res.view_source_catalog_name.split('.')
        const exampleRes = await getVirtualEngineExample({
            catalog,
            schema,
            table: res?.technical_name,
            limit: 10,
        })
        const exaData = {}
        const { columns, data } = exampleRes
        columns.forEach((item, index) => {
            exaData[item.name] = Array.from(
                new Set(data.map((it) => it[index])),
            )
        })
        setExampleData(exaData)
        setFields(res.fields || [])
    }

    // 判断是否有探查报告
    const judgeProbe = async () => {
        try {
            const res = await getExploreReport({ id: sheetId })
            setOpenProbe(!!res)
        } catch (err) {
            setOpenProbe(false)
            // formatError(err)
        }
    }

    const getAuth = async () => {
        try {
            const res = await getSubViews({
                logic_view_id: sheetId,
                limit: 1000,
            })
            setSubViews(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (sheetId) {
            getFields()
            judgeProbe()
            getAuth()
        }
    }, [sheetId])

    const onFinish = async () => {
        const res = await form.validateFields()

        if (Array.isArray(visitors) && visitors.length === 0) {
            message.error(__('请添加访问者'))
            return
        }
        const emptyVisitor = visitors.find(
            (v) => !v.actions || v.actions.length === 0,
        )
        if (emptyVisitor) {
            message.error(
                __('请选择${name}访问库表的权限', {
                    name: emptyVisitor.subject_name,
                }),
            )
            return
        }
        if (res.type === OperateRuleMode.Add) {
            const isPass = await filterRef.current?.onValidateFilter()
            if (!isPass) return
        }
        const detailData = await filterRef.current?.onFinish()

        const data = {
            id: res.type === OperateRuleMode.Choose ? res.ruleId : undefined,
            name:
                res.type === OperateRuleMode.Choose
                    ? subViews.find((item) => item.id === res.ruleId)?.name
                    : undefined,
            spec:
                res.type === OperateRuleMode.Add
                    ? {
                          name: res.name,
                          logic_view_id: sheetId,
                          detail: detailData,
                      }
                    : undefined,
            policies: visitors,
        }
        onOk?.(data)
        onClose()
        message.success(__('保存成功'))
    }

    // 标题
    const headerRender = (title: string, desc: string) => {
        return (
            <div className={styles['filter-header']}>
                <span className={styles['filter-header-title']}>{title}</span>
                <span className={styles['filter-header-desc']}>({desc})</span>
            </div>
        )
    }

    const handleChange = () => {
        onDataChange?.()
    }

    const handleNext = async () => {
        await form.validateFields()
        if (form.getFieldValue('type') === OperateRuleMode.Add) {
            const isPass = await filterRef.current?.onValidateFilter()
            if (!isPass) return
        }
        setCurrentStep(1)
    }

    return (
        <Modal
            title={__('添加行/列规则')}
            open={open}
            onCancel={onClose}
            width={1144}
            bodyStyle={{
                height: 482,
                overflowY: 'auto',
                padding: '20px 24px',
            }}
            wrapClassName={styles['row-column-config-wrapper']}
            footer={
                <Space size={12} className={styles['row-column-footer']}>
                    {currentStep === 0 ? (
                        <Button
                            onClick={() => {
                                ReturnConfirmModal({
                                    onCancel: onClose,
                                    content: __(
                                        '离开此页将放弃当前更改的内容，请确认操作。',
                                    ),
                                })
                            }}
                        >
                            {__('取消')}
                        </Button>
                    ) : visitors.length > 0 ? (
                        <div
                            className={styles['reset-btn']}
                            onClick={() => {
                                ReturnConfirmModal({
                                    onOK: () => {
                                        setVisitors(originVisitors)
                                    },
                                    title: __('确定重置本次添加的访问者吗？'),
                                    content: __(
                                        '重置后您添加的访问者及其权限不会被保存，请确认操作。',
                                    ),
                                    cancelText: __('取消'),
                                    okText: __('确定'),
                                })
                            }}
                        >
                            {__('重置')}
                        </div>
                    ) : (
                        <div
                            className={styles['cancel-btn']}
                            onClick={() => {
                                ReturnConfirmModal({
                                    onCancel: onClose,
                                    content: __(
                                        '离开此页将放弃当前更改的内容，请确认操作。',
                                    ),
                                })
                            }}
                        >
                            {__('取消')}
                        </div>
                    )}

                    {currentStep === 0 && (
                        <Button type="primary" onClick={() => handleNext()}>
                            {__('下一步')}
                        </Button>
                    )}
                    {currentStep === 1 && (
                        <>
                            <Button onClick={() => setCurrentStep(0)}>
                                {__('上一步')}
                            </Button>
                            <Button type="primary" onClick={onFinish}>
                                {__('保存')}
                            </Button>
                        </>
                    )}
                </Space>
            }
        >
            <VisitorProvider>
                <div
                    className={styles['rule-config-wrapper']}
                    id="rule-config-wrapper-id"
                >
                    <div className={styles['step-container']}>
                        <Steps
                            className={styles.step}
                            current={currentStep}
                            items={[
                                {
                                    title: __('配置申请规则'),
                                },
                                {
                                    title: __('添加访问者'),
                                },
                            ]}
                        />
                    </div>

                    <Form
                        autoComplete="off"
                        form={form}
                        style={{
                            height: currentStep === 1 ? 0 : 'unset',
                            overflow: currentStep === 1 ? 'hidden' : 'unset',
                        }}
                    >
                        <Form.Item
                            label={__('行列规则')}
                            name="type"
                            required
                            initialValue={OperateRuleMode.Choose}
                        >
                            <Radio.Group>
                                <Radio value={OperateRuleMode.Choose}>
                                    {__('选择行/列规则')}
                                </Radio>
                                <Radio value={OperateRuleMode.Add}>
                                    {__('新增行/列规则')}
                                </Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) => pre.type !== cur.type}
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('type') ===
                                    OperateRuleMode.Choose ? (
                                    <Form.Item
                                        label={__('选择行/列规则')}
                                        name="ruleId"
                                        rules={[
                                            {
                                                required: true,
                                                message: __('请选择行/列规则'),
                                            },
                                        ]}
                                    >
                                        <Select
                                            placeholder={__('选择行/列规则')}
                                            className={
                                                styles['choose-rule-select']
                                            }
                                            options={subViews}
                                            fieldNames={{
                                                label: 'name',
                                                value: 'id',
                                            }}
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) => pre.type !== cur.type}
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('type') ===
                                    OperateRuleMode.Add ? (
                                    <Form.Item
                                        label={__('行/列规则名称')}
                                        name="name"
                                        rules={[
                                            {
                                                required:
                                                    getFieldValue('type') ===
                                                    OperateRuleMode.Add,
                                                transform: (val) => trim(val),
                                                message: __('输入不能为空'),
                                            },
                                            {
                                                pattern: keyboardCharactersReg,
                                                transform: (val) => trim(val),
                                                message: ErrorInfo.EXCEPTEMOJI,
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder={__('行/列规则名称')}
                                            className={
                                                styles['rule-name-input']
                                            }
                                            maxLength={128}
                                        />
                                    </Form.Item>
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.ruleId !== cur.ruleId ||
                                pre.type !== cur.type
                            }
                        >
                            {({ getFieldValue }) => {
                                const detailInfo = subViews.find(
                                    (item) =>
                                        item.id === getFieldValue('ruleId'),
                                )?.detail
                                return getFieldValue('type') ===
                                    OperateRuleMode.Choose ? (
                                    getFieldValue('ruleId') ? (
                                        <ViewRules
                                            fields={fields}
                                            detail={detailInfo}
                                        />
                                    ) : (
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__('暂无数据')}
                                        />
                                    )
                                ) : null
                            }}
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) => pre.type !== cur.type}
                        >
                            {({ getFieldValue }) => {
                                return getFieldValue('type') ===
                                    OperateRuleMode.Add ? (
                                    <RowAndColFilter
                                        ref={filterRef}
                                        value={detail}
                                        col={{
                                            title: headerRender(
                                                __('限定列'),
                                                __('勾选赋予权限的列字段'),
                                            ),
                                            field: { name: 'business_name' },
                                            value: (fields as any) || [],
                                            loading: fields === undefined,
                                            onChange: handleChange,
                                        }}
                                        row={{
                                            title: headerRender(
                                                __('限定行'),
                                                __('配置赋予权限的行数据'),
                                            ),
                                            value: (fields as any) || [],
                                            loading: fields === undefined,
                                            onChange: handleChange,
                                            exampleData,
                                            openProbe,
                                        }}
                                    />
                                ) : null
                            }}
                        </Form.Item>
                    </Form>
                    <div
                        style={{
                            height: currentStep === 0 ? 0 : 'unset',
                            overflow: currentStep === 0 ? 'hidden' : 'unset',
                        }}
                    >
                        <VisitorCard
                            applierId=""
                            onChange={(data) => setVisitors(data)}
                            value={visitors}
                            visitorPermission={visitorPermission}
                        />
                    </div>
                </div>
            </VisitorProvider>
        </Modal>
    )
}

export default ColumnRuleConfig
