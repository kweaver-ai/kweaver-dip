import { Button, Form, Space, Steps, Tooltip, message } from 'antd'
import {
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { debounce, isEqualWith, trim } from 'lodash'
import {
    AssetTypeEnum,
    ISubView,
    PolicyActionEnum,
    PolicyEffectEnum,
    createSubViews,
    formatError,
    policyCreate,
    policyDetail,
    policyUpdate,
    updateSubViews,
} from '@/core'
import {
    ScopeType,
    SubViewOptType,
    SubviewMode,
    UpdateOptType,
} from '../../const'
import __ from '../../locale'
import ColAndRowPanel, { IScopeItem } from './ColAndRowPanel'
import styles from './styles.module.less'
import { VisitorProvider } from '../VisitorProvider'
import VisitorCard from '../VisitorCard'
import { Empty, ReturnConfirmModal } from '@/ui'
import { MicroWidgetPropsContext } from '@/context'
import ViewAccessData from '../ViewAccessData'
import dataEmpty from '@/assets/dataEmpty.svg'
import { useUpdateStateContext } from '../../UpdateStateProvider'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type VisitorItem = any
export const SubViewPrefix = 'subview'
type IFormData = { subView?: any; visitors?: any[] }

const SubViewManage = ({
    isOwner,
    hasAllRead,
    data,
    names,
    extendsVisitor,
    cols,
    onOperation,
    onDataChange,
    exampleData,
    openProbe,
    formId,
    scopeOptions,
}: any) => {
    const [current, setCurrent] = useState<number>(0)
    const [mode, setMode] = useState<SubviewMode>(SubviewMode.Create)
    const [formData, setFormData] = useState<IFormData>({})
    const colAndRowForm = Form.useForm()[0]
    const colAndRowRef = useRef<any>()
    const [isChanged, setIsChanged] = useState<boolean>(false)
    const [originData, setOriginData] = useState<any>({})
    const [ruleChange, setRuleChange] = useState<boolean>(false)
    const [visitorChange, setVisitorChange] = useState<boolean>(false)
    const [canNext, setCanNext] = useState<boolean>(false)
    const [policyLoading, setPolicyLoading] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [viewAccessDataParams, setViewAccessDataParams] = useState<any>({})
    const [userId] = useCurrentUser('ID')
    const { setHasAccessChange } = useUpdateStateContext()
    const [scopeSubject, setScopeSubject] = useState<any>()
    const [scopeMap, setScopeMap] = useState<any>({})
    const currentScopeIdRef = useRef<string>()
    // 保留当前已存在的授权范围和可选的授权范围
    const CurrentScopeOptions = useMemo(() => {
        return (scopeOptions || []).filter(
            (o) => !o.disabled || o.key === data?.auth_scope_id,
        )
    }, [scopeOptions, data?.auth_scope_id])

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
            const visitUser = [...(item?.subjects || []), ...extendsVisitor]
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
        const visitUser = [...(ret?.subjects ?? []), ...extendsVisitor]
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

    // 是否有查看数据权限
    const hasVisitAccess = useMemo(() => {
        // owner或者具有授权权限
        const hasReadAccess = (originData?.visitors || [])
            .filter((o) => o.subject_id === userId)
            .some((o) =>
                o.permissions?.some(
                    (p) =>
                        p.effect === PolicyEffectEnum.Allow &&
                        p.action === PolicyActionEnum.Read,
                ),
            )
        const scopeReadAccess = scopeSubject?.permissions?.some(
            (p) =>
                p.effect === PolicyEffectEnum.Allow &&
                p.action === PolicyActionEnum.Read,
        )
        // Owner | 当前用户具备读权限 | 具备整体读权限 | 授权范围具备读权限
        return isOwner || hasReadAccess || hasAllRead || scopeReadAccess
    }, [isOwner, originData, hasAllRead, userId, scopeSubject])

    // 是否为仅分配
    const isOnlyAllocate = useMemo(() => {
        const allocateAccess = (originData?.visitors || [])
            .filter((o) => o.subject_id === userId)
            .some((o) =>
                o.permissions?.some(
                    (p) =>
                        p.effect === PolicyEffectEnum.Allow &&
                        p.action === PolicyActionEnum.Allocate,
                ),
            )
        return !isOwner && allocateAccess
    }, [originData, isOwner, userId])

    // 子视图初始化操作
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
        if (current === 0) {
            colAndRowForm.submit()
        }
        if (current === 1) {
            setCurrent(2)
        }
    }

    // 上一步
    const handlePrevStep = async () => {
        if (current > 0) {
            setCurrent(current - 1)
        }
    }

    // 编辑更新确定  拆分为授权规则确定 、 访问者确定
    const handleEditSure = async () => {
        try {
            // 授权范围变更  需追加访问者
            const hasScopeChange =
                data?.auth_scope_id !== formData?.subView?.auth_scope_id

            // 访问者编辑
            if (visitorChange || hasScopeChange) {
                const visitors =
                    !isOwner &&
                    hasScopeChange &&
                    scopeSubject &&
                    !(formData?.visitors || [])?.some(
                        (o) => o.subject_id === userId,
                    )
                        ? [...(formData?.visitors || []), scopeSubject]
                        : formData?.visitors

                const subjects = (visitors || [])
                    ?.filter((o) => !o.isOwner && !o.isExtend)
                    .map((obj) => {
                        const { department, ...rest } = obj
                        return rest
                    })

                const hasNoPermission = subjects?.some(
                    (o) => !o.permissions?.length,
                )
                if (hasNoPermission) {
                    ;(microWidgetProps?.components?.toast || message).warn(
                        __('请设置访问权限'),
                    )
                    return
                }

                const policyParams = {
                    object_id: data?.id,
                    object_type: AssetTypeEnum.SubView,
                    subjects,
                }
                await policyUpdate(policyParams)
                onOperation?.(SubViewOptType.Update, {
                    updateType: UpdateOptType.Visitor,
                    id: data?.id,
                })
                ;(microWidgetProps?.components?.toast || message).success(
                    __('更新成功'),
                )

                setOriginData((prev) => ({
                    ...prev,
                    visitors: formData.visitors,
                }))
                setRuleChange(false)
            }
            // 规则编辑
            if (ruleChange) {
                const ruleInfo = await colAndRowRef.current?.getRule(true)
                const pageInfo = ruleInfo || {
                    data: formData.subView,
                    isPass: true,
                }
                if (pageInfo?.isPass) {
                    const subViewParams = {
                        ...data,
                        ...(pageInfo?.data || {}),
                    }
                    subViewParams.name = trim(subViewParams.name)
                    const { id, ...params } = subViewParams
                    const subview = await updateSubViews(id, params)
                    onOperation?.(SubViewOptType.Update, {
                        id,
                        item: subview,
                        updateType: UpdateOptType.Rule,
                    })
                    ;(microWidgetProps?.components?.toast || message).success(
                        __('更新成功'),
                    )
                    setOriginData((prev) => ({
                        ...prev,
                        subView: pageInfo.data,
                    }))
                    setVisitorChange(false)
                }
            }

            setHasAccessChange?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const handleSure = async () => {
        const visitors =
            !isOwner &&
            scopeSubject &&
            !(formData?.visitors || [])?.some((o) => o.subject_id === userId)
                ? [...(formData?.visitors || []), scopeSubject]
                : formData?.visitors

        // 新建  => 确认
        const subjects = (visitors || [])
            ?.filter((o) => !o.isOwner && !o.isExtend)
            .map((obj) => {
                const { department, ...rest } = obj
                return rest
            })

        const hasNoPermission = subjects?.some((o) => !o.permissions?.length)
        if (hasNoPermission) {
            ;(microWidgetProps?.components?.toast || message).warn(
                __('请设置访问权限'),
            )
            return
        }
        try {
            if (mode === SubviewMode.Create) {
                const subViewParams = {
                    ...formData.subView,
                    logic_view_id: data.logic_view_id,
                }
                subViewParams.name = trim(subViewParams.name)
                const subview = await createSubViews(subViewParams)

                if (subjects?.length) {
                    const policyParams = {
                        object_id: subview?.id,
                        object_type: AssetTypeEnum.SubView,
                        subjects,
                    }
                    await policyCreate(policyParams)
                }
                ;(microWidgetProps?.components?.toast || message).success(
                    __('添加成功'),
                )
                onOperation?.(SubViewOptType.Create, {
                    tempId: data?.id,
                    item: subview,
                })
                setOriginData((prev) => ({
                    ...prev,
                    subView: formData?.subView,
                }))
            } else if (mode === SubviewMode.Edit) {
                const subViewParams = {
                    ...data,
                    ...formData.subView,
                }
                subViewParams.name = trim(subViewParams.name)
                const { id, ...params } = subViewParams
                const subview = await updateSubViews(id, params)
                const policyParams = {
                    object_id: subview?.id,
                    object_type: AssetTypeEnum.SubView,
                    subjects,
                }
                await policyUpdate(policyParams)
                ;(microWidgetProps?.components?.toast || message).success(
                    __('更新成功'),
                )

                onOperation?.(SubViewOptType.Update, {
                    id,
                    item: subview,
                    updateType: UpdateOptType.All,
                })
                setOriginData((prev) => ({
                    ...prev,
                    visitors: formData.visitors,
                }))
            }
            setRuleChange(false)
            setVisitorChange(false)
            setIsChanged(false)
            setCurrent(0)

            setHasAccessChange?.(true)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
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
            setTimeout(() => {
                setCurrent(1)
            }, 0)
        }
    }

    // 根据授权范围调整访问者及查看数据权限
    const changeVisitor = async (authScopeId: string) => {
        if (Object.keys(scopeMap || {}).includes(authScopeId)) {
            setScopeSubject(scopeMap[authScopeId])
            return
        }
        try {
            setPolicyLoading(true)
            const isSub =
                scopeOptions?.find((o) => o.value === authScopeId)?.type ===
                ScopeType.Rule
            const policyType = isSub
                ? AssetTypeEnum.SubView
                : AssetTypeEnum.DataView
            const ret = await policyDetail(authScopeId, policyType)
            currentScopeIdRef.current = authScopeId
            const curSubjects = ret?.subjects?.find(
                (o) => o.subject_id === userId,
            )
            setScopeMap((prev) => ({
                ...prev,
                [authScopeId]: curSubjects,
            }))
            setScopeSubject(curSubjects)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setPolicyLoading(false)
        }
    }

    const debounceChangeVisitor = useCallback(debounce(changeVisitor, 400), [
        scopeOptions,
    ])

    // 内容是否变更
    const handleChangedStatus = async () => {
        const ruleInfo = await colAndRowRef.current?.getRule(false)
        const curData = ruleInfo?.data || formData?.subView
        const curFields = JSON.parse(curData.detail || '{}')
        setCanNext(!!curFields?.fields?.length)

        const isRuleChange =
            curData?.name !== originData?.subView?.name ||
            curData?.auth_scope_id !== originData?.subView?.auth_scope_id ||
            !isEqualWith(
                JSON.parse(curData?.detail || '{}'),
                JSON.parse(originData?.subView?.detail || '{}'),
            )

        // 非Owner 根据授权范围调整查看数据权限
        if (
            !isOwner &&
            isRuleChange &&
            curData?.auth_scope_id &&
            currentScopeIdRef.current !== curData?.auth_scope_id &&
            !policyLoading
        ) {
            debounceChangeVisitor(curData?.auth_scope_id)
        }

        const curVisitor = (formData?.visitors || []).filter(
            (o) => !o.isOwner && !o.isExtend,
        )
        const originVisitor = (originData?.visitors || []).filter(
            (o) => !o.isOwner && !o.isExtend,
        )
        const isVisitorChange = !isEqualWith(curVisitor, originVisitor)

        setRuleChange(isRuleChange)
        setVisitorChange(isVisitorChange)
        setIsChanged(isRuleChange || isVisitorChange)
    }

    useEffect(() => {
        setTimeout(() => {
            setViewAccessDataParams({})
        }, 0)
    }, [data.name])

    useEffect(() => {
        handleChangedStatus()
    }, [formData, originData])

    const handleVisitorChange = (users: VisitorItem[]) => {
        setFormData((prev) => ({ ...prev, visitors: users }))
    }

    const handleCancel = () => {
        if (isChanged) {
            ReturnConfirmModal({
                title: __('确定要取消本次授权吗？'),
                content: __(
                    '取消后您本次配置的授权行列规则及访问者权限将不会被保存，请确认操作。',
                ),
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: async () => {
                    onOperation?.(SubViewOptType.Cancel, {
                        item: data,
                        mode,
                    })
                    if (mode === SubviewMode.Edit) {
                        setCurrent(0)
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
    const steps = useMemo(
        () => [
            {
                title: __('配置授权规则'),
                content: (
                    <ColAndRowPanel
                        ref={colAndRowRef}
                        form={colAndRowForm}
                        fields={cols}
                        names={existNames}
                        value={formData?.subView || {}}
                        onFinish={onFinshCurrentForm}
                        onDataChange={handleChangedStatus}
                        exampleData={exampleData}
                        openProbe={openProbe}
                        scopeOptions={CurrentScopeOptions}
                        onlyAllocate={isOnlyAllocate}
                    />
                ),
            },
            {
                title: __('查看数据'),
                content: hasVisitAccess ? (
                    <ViewAccessData
                        allFields={cols}
                        formData={formData}
                        formId={formId}
                        exampleData={exampleData}
                        openProbe={openProbe}
                        onDataChange={handleChangedStatus}
                        initialParams={viewAccessDataParams}
                        passParams={setViewAccessDataParams}
                    />
                ) : (
                    <div style={{ width: '100%', paddingTop: '15vh' }}>
                        <Empty
                            iconSrc={dataEmpty}
                            desc={
                                <div
                                    style={{
                                        textAlign: 'center',
                                    }}
                                >
                                    <div>
                                        您仅有当前行列规则的&quot;授权&quot;权限
                                    </div>
                                    <div>暂时无法查看数据</div>
                                </div>
                            }
                        />
                    </div>
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
                            isCreate={mode === SubviewMode.Create}
                        />
                    </VisitorProvider>
                ),
            },
        ],
        [cols, formData, viewAccessDataParams],
    )

    return (
        <div className={styles['process-panel']}>
            <div className={styles['process-panel-header']}>
                <Steps current={current} items={steps} />
            </div>
            {current === 1 && (
                <div className={styles['process-panel-tips']}>
                    {__(
                        '说明：用户实际可见数据会受安全策略限制，可能会少于当前数据。',
                    )}
                </div>
            )}
            <div className={styles['process-panel-content']}>
                {current === 1 && hasVisitAccess && (
                    <div className={styles['process-panel-content-tips']}>
                        {__(
                            '说明：用户实际可见数据会受安全策略限制，可能会少于当前数据。',
                        )}
                    </div>
                )}
                {steps[current].content}
            </div>
            <div className={styles['process-panel-footer']}>
                <div className={styles['process-panel-footer-left']}>
                    {mode === SubviewMode.Edit && (
                        <Button
                            type="link"
                            className={styles.upBtn}
                            onClick={() =>
                                onOperation?.(SubViewOptType.Delete, {
                                    id: data?.id,
                                })
                            }
                        >
                            {__('删除授权行/列规则')}
                        </Button>
                    )}
                </div>
                <div className={styles['process-panel-footer-right']}>
                    <Space>
                        <Button
                            type={
                                mode === SubviewMode.Edit
                                    ? 'text'
                                    : mode === SubviewMode.Create &&
                                      current === 0
                                    ? 'default'
                                    : 'link'
                            }
                            onClick={handleCancel}
                            className={styles.cancel}
                            disabled={mode === SubviewMode.Edit && !isChanged}
                        >
                            {mode === SubviewMode.Create
                                ? __('取消')
                                : __('重置')}
                        </Button>
                        {current > 0 ? (
                            <Button
                                type="default"
                                className={styles.prev}
                                onClick={handlePrevStep}
                            >
                                {__('上一步')}
                            </Button>
                        ) : null}
                        {current < 2 && (
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
                                        mode === SubviewMode.Create ||
                                        current === 1
                                            ? 'primary'
                                            : 'default'
                                    }
                                    ghost={
                                        mode === SubviewMode.Create ||
                                        current === 1
                                    }
                                    className={styles.next}
                                    onClick={handleNextStep}
                                    disabled={!canNext}
                                >
                                    {__('下一步')}
                                </Button>
                            </Tooltip>
                        )}
                        {(mode === SubviewMode.Edit ||
                            (mode === SubviewMode.Create && current === 2)) && (
                            <Button
                                type="primary"
                                className={styles.sure}
                                onClick={() =>
                                    mode === SubviewMode.Edit
                                        ? handleEditSure()
                                        : handleSure()
                                }
                                disabled={
                                    mode === SubviewMode.Edit
                                        ? !isChanged || !canNext
                                        : false
                                }
                            >
                                {mode === SubviewMode.Edit
                                    ? __('保存')
                                    : __('确定')}
                            </Button>
                        )}
                    </Space>
                </div>
            </div>
        </div>
    )
}

export default SubViewManage
