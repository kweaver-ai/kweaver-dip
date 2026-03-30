import { Button, Form, Space, Steps, Tooltip, message } from 'antd'
import { isEqual, trim } from 'lodash'
import { memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import RowColView from '@/components/RowAndColFilter/RowColView'
import {
    AssetTypeEnum,
    ISubView,
    PolicyActionEnum,
    LoginPlatform,
    createAuthRequest,
    formatError,
    policyDetail,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Empty } from '@/ui'
import { SubViewOptType, SubviewMode } from '../../const'
import {
    appendArrProps,
    showRequestMessage,
    sortByAttr,
    transApplyData,
    transChangeData,
} from '../../helper'
import __ from '../../locale'
import VisitorCard from '../VisitorCard'
import { VisitorProvider } from '../VisitorProvider'
import ColRowPanel from './ColRowPanel'
import ReasonModel from './ReasonModel'
import styles from './styles.module.less'
import TipModal from '../TipModal'
import { MicroWidgetPropsContext } from '@/context'
import { getPlatformActualUrl } from '@/utils'

type VisitorItem = any
export const SubViewPrefix = 'subview'
type IFormData = { subView?: any; visitors?: any[] }

const ApplySubView = ({
    dataView,
    data,
    names,
    extendsVisitor,
    cols,
    onOperation,
    onDataChange,
    exampleData,
    openProbe,
    onClose,
    scopeOptions,
}: any) => {
    const [userId] = useCurrentUser('ID')
    const [current, setCurrent] = useState<number>(0)
    const [mode, setMode] = useState<SubviewMode>(SubviewMode.Create)
    const [formData, setFormData] = useState<IFormData>({})
    const colAndRowForm = Form.useForm()[0]
    const colAndRowRef = useRef<any>()
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [originData, setOriginData] = useState<any>({})
    const [ruleChange, setRuleChange] = useState<boolean>(false)
    const [visitorChange, setVisitorChange] = useState<boolean>(false)
    const [showReason, setShowReason] = useState<boolean>(false)
    const [canNext, setCanNext] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const navigate = useNavigate()
    // 原始数据  用来比对数据 pick授权、授权仅分配
    const [freezeData, setFreezeData] = useState<any>()

    const toast = useMemo(() => {
        return microWidgetProps?.components?.toast || message
    }, [microWidgetProps])

    // 加载子库表访问者
    const loadVisitor = async (item: ISubView) => {
        // 库表，暂不设置
        if (!item) {
            setFormData((prev) => ({
                ...prev,
                visitors: [],
            }))
            setOriginData((prev) => ({
                ...prev,
                visitors: [],
            }))
            return
        }

        // 新创建规则，从库表继承
        if (item?.id?.startsWith(SubViewPrefix)) {
            // 转换数据 申请暂时屏蔽 授权、授权仅分配
            const transData = transApplyData(item, [
                PolicyActionEnum.Auth,
                PolicyActionEnum.Allocate,
            ])

            setFreezeData(item)

            const originUser: any = (transData?.subjects || []).find(
                (o) => o.subject_id === userId,
            )
            const originSubjects = (transData?.subjects || [])
                .filter((o) => o.subject_id !== userId)
                .map((o) => ({
                    ...o,
                    // 针对读取/下载权限 禁止修改
                    isForbidden: o?.permissions?.length >= 2,
                }))

            const visitUser = [
                ...appendArrProps(originSubjects, { isOrigin: true }),
                // ...extendsVisitor, // 已有规则不显示数据Owner 或继承
            ]

            if (originUser) {
                if (originUser?.permissions?.length >= 2) {
                    originUser.isForbidden = true
                }
                originUser.isOrigin = true

                visitUser.unshift(originUser)
            }
            setFormData((prev) => ({
                ...prev,
                visitors: visitUser,
            }))
            setOriginData((prev) => ({
                ...prev,
                visitors: visitUser,
            }))
            return
        }

        // 已有规则，从授权结果中获取
        const ret = await policyDetail(item?.id, AssetTypeEnum.SubView)

        // 转换数据 申请暂时屏蔽 授权、授权仅分配
        const transData = transApplyData(ret, [
            PolicyActionEnum.Auth,
            PolicyActionEnum.Allocate,
        ])

        setFreezeData(ret)

        const originUser: any = (transData?.subjects || []).find(
            (o) => o.subject_id === userId,
        )
        const originSubjects = (transData?.subjects || [])
            .filter((o) => o.subject_id !== userId)
            .map((o) => ({
                ...o,
                // 针对读取/下载权限 禁止修改
                isForbidden: o?.permissions?.length >= 2,
            }))

        const visitUser = [
            ...appendArrProps(originSubjects, { isOrigin: true }),
            // ...extendsVisitor,  // 已有规则不显示数据Owner 或继承
        ]

        if (originUser) {
            if (originUser?.permissions?.length >= 2) {
                originUser.isForbidden = true
            }
            originUser.isOrigin = true
            visitUser.unshift(originUser)
        }

        setFormData((prev) => ({
            ...prev,
            visitors: visitUser,
        }))
        setOriginData((prev) => ({
            ...prev,
            visitors: visitUser,
        }))
    }

    // 加载行列授权数据
    const loadRowAndCol = (item: ISubView) => {
        const { name, detail, auth_scope_id } = item || {}

        const curFields = JSON.parse(detail || '{}')
        setCanNext(!!curFields?.fields?.length)
        setFormData((prev) => ({
            ...prev,
            subView: { name, detail, auth_scope_id },
        }))
        setOriginData((prev) => ({
            ...prev,
            subView: { name, detail, auth_scope_id },
        }))
    }

    const existNames = useMemo(() => {
        return names?.filter((o) => o !== data.name)
    }, [data, names])

    useEffect(() => {
        if (onDataChange) {
            onDataChange(isChanged)
        }
    }, [isChanged])

    // 子库表初始化操作
    useEffect(() => {
        setCurrent(0)
        const curViewId = data?.id
        const curMode =
            curViewId && !curViewId?.startsWith(SubViewPrefix)
                ? SubviewMode.Edit
                : SubviewMode.Create
        // 切换模式
        setMode(curMode)
        if (curMode === SubviewMode.Create) {
            setIsChanged(true)
        }
        // 设置行列授权规则
        loadRowAndCol(data)
        // 设置访问者
        loadVisitor(data)

        colAndRowRef.current?.reset()
    }, [data])

    // 下一步
    const handleNextStep = () => {
        // 编辑模式下  该功能仅展示
        if (mode === SubviewMode.Edit) {
            setCurrent(1)
        } else if (current === 0) {
            colAndRowForm.submit()
        }
    }

    // 上一步
    const handlePrevStep = async () => {
        if (current > 0) {
            setCurrent(current - 1)
        }
    }

    // 编辑更新确定  拆分为授权规则确定 、 访问者确定
    const handleEditSure = async (reason: string) => {
        setShowReason(false)
        try {
            // 访问者编辑
            if (visitorChange) {
                const addSubjects = (formData?.visitors || [])
                    ?.filter((o) => !o.isOwner && !o.isExtend && !o.isOrigin)
                    .map((obj) => {
                        const { department, ...rest } = obj
                        return rest
                    })

                const actionSubjects = (formData?.visitors || [])
                    ?.filter((o) => o.isOrigin)
                    .filter((o) => {
                        const it = (originData?.visitors || []).find(
                            (i) => i.subject_id === o.subject_id,
                        )
                        return (
                            !it ||
                            it.permissions?.length !== o.permissions?.length
                        )
                    })
                    .map((obj) => {
                        const { department, isForbidden, ...rest } = obj
                        return rest
                    })

                const hasNoPermission = addSubjects?.some(
                    (o) => !o.permissions?.length,
                )
                if (hasNoPermission) {
                    toast.warn(__('请设置访问权限'))
                    return
                }
                // 仅传递变更数据
                const changedSubjects = [
                    ...addSubjects,
                    ...actionSubjects,
                ].filter((o) => o.subject_id !== dataView?.owner_id)

                const policies = (changedSubjects || [])?.map((o) => {
                    return {
                        subject_type: o.subject_type,
                        subject_id: o.subject_id,
                        actions: (o.permissions || []).map((p) => p.action),
                    }
                })

                const spec = {
                    id: data?.logic_view_id,
                    sub_views: [
                        {
                            id: data?.id,
                            policies,
                        },
                    ],
                    reason,
                }

                await createAuthRequest({
                    spec,
                })
                showRequestMessage(() => {
                    const url = getPlatformActualUrl(
                        '/personal-center/doc-audit-client/?target=apply',
                        LoginPlatform.drmb, // 审核列表在资源管理平台
                    )
                    if (url.startsWith('/anyfabric')) {
                        window.open(url, '_blank', 'noopener,noreferrer')
                    } else {
                        navigate(url)
                    }
                }, microWidgetProps)
                // 申请流程中 重置
                loadVisitor(data)
                setRuleChange(false)
                onOperation?.(SubViewOptType.Update)
            }
        } catch (error) {
            if (
                error?.data?.code ===
                'AuthService.LogicViewAuthorizingRequest.AuditProcessNotFound'
            ) {
                TipModal({ onOK: () => onClose?.(true), microWidgetProps })
                return
            }

            formatError(error, toast)
        }
    }

    const handleSure = async (reason: string) => {
        setShowReason(false)
        // 新建  => 确认
        const subjects = (formData?.visitors || [])
            ?.filter((o) => !o.isOwner && !o.isExtend && !o.isOrigin)
            .map((obj) => {
                const { department, isForbidden, ...rest } = obj
                return rest
            })
        const hasNoPermission = subjects?.some((o) => !o.permissions?.length)
        if (hasNoPermission) {
            toast.warn(__('请设置访问权限'))
            return
        }
        try {
            const subViewParams = {
                ...formData.subView,
            }
            subViewParams.name = trim(subViewParams.name)

            // 仅传递变更数据
            const changedSubjects = (subjects || []).filter(
                (o) => o.subject_id !== dataView?.owner_id,
            )

            const applyChangeData = transChangeData(
                changedSubjects,
                freezeData?.subjects,
            )

            const policies = (applyChangeData || [])?.map((o) => {
                return {
                    subject_type: o.subject_type,
                    subject_id: o.subject_id,
                    actions: (o.permissions || []).map((p) => p.action),
                }
            })

            const spec = {
                id: data?.logic_view_id,
                sub_views: [
                    {
                        spec: subViewParams,
                        policies,
                    },
                ],
                reason,
            }

            await createAuthRequest({
                spec,
            })
            showRequestMessage(() => {
                const url = getPlatformActualUrl(
                    '/personal-center/doc-audit-client/?target=apply',
                    LoginPlatform.drmb, // 审核列表在资源管理平台
                )
                if (url.startsWith('/anyfabric')) {
                    window.open(url, '_blank', 'noopener,noreferrer')
                } else {
                    navigate(url)
                }
            }, microWidgetProps)
            // 新建申请回到库表
            onOperation?.(SubViewOptType.Create, { tempId: data.id })
        } catch (error) {
            if (
                error?.data?.code ===
                'AuthService.LogicViewAuthorizingRequest.AuditProcessNotFound'
            ) {
                TipModal({ onOK: () => onClose?.(true), microWidgetProps })
                return
            }
            formatError(error, toast)
        }
    }

    const onFinshCurrentForm = async (values, isPass) => {
        if (isPass) {
            setFormData({
                ...formData,
                subView: {
                    ...formData?.subView,
                    ...values,
                },
            })
            setCurrent(1)
        }
    }

    // 内容是否变更
    const handleChangedStatus = async () => {
        const ruleInfo = await colAndRowRef.current?.getRule(false)
        const curData = ruleInfo?.data || formData?.subView
        const curFields = JSON.parse(curData.detail || '{}')
        setCanNext(!!curFields?.fields?.length)
        const isRuleChange =
            curData?.name !== originData?.subView?.name ||
            curData?.auth_scope_id !== originData?.subView?.auth_scope_id ||
            curData?.detail !== originData?.subView?.detail

        const curVisitor = (formData?.visitors || []).filter(
            (o) => !o.isOwner && !o.isExtend,
        )
        const originVisitor = (originData?.visitors || []).filter(
            (o) => !o.isOwner && !o.isExtend,
        )
        // 因顺序调整  增加数组排序
        const isVisitorChange = !isEqual(
            curVisitor?.sort((a, b) => sortByAttr(a, b, 'subject_id')),
            [...(originVisitor || [])].sort((a, b) =>
                sortByAttr(a, b, 'subject_id'),
            ),
        )

        setRuleChange(isRuleChange)
        setVisitorChange(isVisitorChange)
        setIsChanged(isRuleChange || isVisitorChange)
    }

    useEffect(() => {
        handleChangedStatus()
    }, [formData, originData])

    const handleVisitorChange = (users: VisitorItem[]) => {
        setFormData((prev) => ({ ...prev, visitors: users }))
    }

    const handleCancel = () => {
        if (isChanged) {
            ReturnConfirmModal({
                title: __('确定要${type}本次申请吗？', {
                    type: mode === SubviewMode.Edit ? __('重置') : __('取消'),
                }),
                content: __(
                    '${type}后您本次发起申请的访问者权限将不会被保存 ，请确认操作。',
                    {
                        type:
                            mode === SubviewMode.Edit ? __('重置') : __('取消'),
                    },
                ),
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: async () => {
                    onOperation?.(SubViewOptType.Cancel, {
                        item: data,
                        mode,
                    })
                    if (mode === SubviewMode.Edit) {
                        // 重置后保留当前页
                        setCurrent(1)
                        setFormData(originData)
                        colAndRowRef.current?.reset()
                    }
                },
                microWidgetProps,
            })
        } else {
            onOperation?.(SubViewOptType.Cancel, {
                item: data,
                mode,
            })
        }
    }

    // 步骤
    const steps = [
        {
            title:
                mode === SubviewMode.Edit ? __('申请规则') : __('配置申请规则'),
            content:
                mode === SubviewMode.Edit ? (
                    <RowColView fields={cols} value={formData?.subView || {}} />
                ) : (
                    <ColRowPanel
                        ref={colAndRowRef}
                        form={colAndRowForm}
                        fields={cols}
                        names={existNames}
                        value={formData?.subView || {}}
                        onFinish={onFinshCurrentForm}
                        onDataChange={handleChangedStatus}
                        exampleData={exampleData}
                        openProbe={openProbe}
                        scopeOptions={scopeOptions}
                    />
                ),
        },
        {
            title: __('添加访问者'),
            content: (
                <VisitorProvider viewType={AssetTypeEnum.SubView}>
                    <VisitorCard
                        key="subview"
                        type={AssetTypeEnum.SubView}
                        value={formData?.visitors || []}
                        height="calc(100vh - 370px)"
                        onChange={handleVisitorChange}
                        applyMode
                        empty={
                            <Empty
                                desc={__(
                                    '可批量添加访问者，为访问者申请资源权限',
                                )}
                                iconSrc={dataEmpty}
                            />
                        }
                    />
                </VisitorProvider>
            ),
        },
    ]

    return (
        <div className={styles['process-panel']}>
            <div className={styles['process-panel-header']}>
                <Steps current={current} items={steps} />
            </div>
            <div className={styles['process-panel-content']}>
                {steps[current].content}
            </div>
            <div className={styles['process-panel-footer']}>
                <div className={styles['process-panel-footer-left']} />
                <div className={styles['process-panel-footer-right']}>
                    <Space>
                        {!(mode === SubviewMode.Edit && current === 0) && (
                            <Button
                                type={
                                    mode === SubviewMode.Create && current === 0
                                        ? 'default'
                                        : 'link'
                                }
                                onClick={handleCancel}
                                className={styles.cancel}
                                disabled={
                                    mode === SubviewMode.Edit && !isChanged
                                }
                            >
                                {mode === SubviewMode.Edit
                                    ? __('重置')
                                    : __('取消')}
                            </Button>
                        )}
                        {current > 0 ? (
                            <Button
                                type="default"
                                className={styles.prev}
                                onClick={handlePrevStep}
                            >
                                {__('上一步')}
                            </Button>
                        ) : null}
                        {current < 1 && (
                            <Tooltip
                                title={
                                    !canNext
                                        ? __('请勾选任意限定列字段')
                                        : undefined
                                }
                                placement="topRight"
                            >
                                <Button
                                    type={
                                        mode === SubviewMode.Create
                                            ? 'primary'
                                            : 'default'
                                    }
                                    className={styles.next}
                                    onClick={handleNextStep}
                                    disabled={!canNext}
                                >
                                    {__('下一步')}
                                </Button>
                            </Tooltip>
                        )}
                        {((mode === SubviewMode.Edit && current === 1) ||
                            (mode === SubviewMode.Create && current === 1)) && (
                            <Tooltip
                                title={
                                    mode === SubviewMode.Edit
                                        ? !isChanged
                                            ? __(
                                                  '添加访问者或重新申请权限后可点击提交申请权限',
                                              )
                                            : ''
                                        : !formData?.visitors?.length
                                        ? __('添加访问者后可点击提交申请')
                                        : ''
                                }
                                placement="topRight"
                            >
                                <Button
                                    type="primary"
                                    className={styles.sure}
                                    onClick={() => setShowReason(true)}
                                    disabled={
                                        mode === SubviewMode.Edit
                                            ? !isChanged
                                            : !formData?.visitors?.length
                                    }
                                >
                                    {__('提交')}
                                </Button>
                            </Tooltip>
                        )}
                    </Space>
                </div>
                {showReason && (
                    <ReasonModel
                        visible={showReason}
                        onClose={() => setShowReason(false)}
                        onSure={(reason) =>
                            mode === SubviewMode.Edit
                                ? handleEditSure(reason)
                                : handleSure(reason)
                        }
                    />
                )}
            </div>
        </div>
    )
}

export default memo(ApplySubView)
