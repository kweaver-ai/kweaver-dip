import { message } from 'antd'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isEqual } from 'lodash'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    AssetTypeEnum,
    PolicyActionEnum,
    HasAccess,
    LoginPlatform,
    VisitorTypeEnum,
    allRoleList,
    createApiAuthRequest,
    createAuthRequest,
    createIndicatorAuthRequest,
    formatError,
    policyDetail,
} from '@/core'
import { Empty } from '@/ui'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import {
    appendArrProps,
    showRequestMessage,
    sortByAttr,
    transApplyData,
    transChangeData,
} from '../../helper'
import __ from '../../locale'
import { StatusProvider } from '../AccessManage/StatusProvider'
import FooterBar from '../FooterBar'
import TopBar from '../TopBar'
import VisitorCard from '../VisitorCard'
import { VisitorProvider } from '../VisitorProvider'
import ApplyDataView from './ApplyDataView'
import ReasonModel from './ReasonModel'
import styles from './styles.module.less'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import TipModal from '../TipModal'
import { MicroWidgetPropsContext } from '@/context'
import CommonManage from './CommonManage'
import ApplyIndicator from './ApplyIndicator'
import { getPlatformActualUrl } from '@/utils'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IApplyManage {
    id: string
    type: AssetTypeEnum
    onClose?: (needRefresh?: any) => void
    indicatorType?: string
}
function ApplyManage({ id, type, onClose, indicatorType }: IApplyManage) {
    /**
     * 使用定制的hook获取当前用户的ID。
     * @returns {string} 当前用户的ID。
     */
    const [userId] = useCurrentUser('ID')
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    /**
     * 状态变量，用于存储数据。
     * @type {any}
     */
    const [data, setData] = useState<any>()

    const toast = useMemo(() => {
        return microWidgetProps?.components?.toast || message
    }, [microWidgetProps])
    /**
     * 使用URL查询参数hook来管理搜索参数。
     */
    const [searchParams, setSearchParams] = useSearchParams()

    /**
     * 状态变量，用于存储访客列表。
     * @type {any[]}
     */
    const [visitors, setVisitors] = useState<any[]>()

    /**
     * 状态变量，用于表示加载状态。
     * @type {boolean}
     */
    const [loading, setLoading] = useState<boolean>(false)

    /**
     * 状态变量，用于控制显示原因的界面元素。
     * @type {boolean}
     */
    const [showReason, setShowReason] = useState<boolean>(false)

    /**
     * 状态变量，用于标记是否发生了变化。
     * @type {boolean}
     */
    const [isChange, setIsChange] = useState<boolean>(false)

    /**
     * 状态变量，用于存储常客列表。
     * @type {any[]}
     */
    const [regularVisitor, setRegularVisitor] = useState<any[]>()

    /**
     * 状态变量，用于标记是否含有用户数据。
     * @type {boolean}
     */
    const [hasUser, setHasUser] = useState<boolean>(false)

    /**
     * 状态变量，用于控制是否仅限所有者操作。
     * @type {boolean}
     */
    const [isOnlyOwner, setIsOnlyOwner] = useState<boolean>(false)

    /**
     * 状态变量，用于控制是否允许批量添加。
     * @type {boolean}
     */
    const [isAllAdd, setIsAllAdd] = useState<boolean>(false)

    const { permissions, checkPermission, checkPermissions } = useUserPermCtx()
    // 原始数据  用来比对数据 pick授权、授权仅分配
    const [freezeData, setFreezeData] = useState<any>()
    /**
     * 使用React Router的navigate函数来实现导航功能。
     */
    const navigate = useNavigate()

    useEffect(() => {
        if (id && permissions) {
            checkCurrentUserIsSystemManager()
        }
    }, [permissions, id, type])
    /**
     * 重置数据函数，用于根据返回的结果调整访问者信息和权限。
     * @param ret 返回的数据对象，包含所有相关访问者的信息和权限。
     */
    const resetData = (ret: any) => {
        // 根据ret中是否存在owner_id来决定是否创建owner对象数组
        const owner = ret?.owner_id
            ? [
                  {
                      subject_id: ret?.owner_id,
                      subject_name: ret?.owner_name,
                      departments: ret?.owner_departments,
                      subject_type: VisitorTypeEnum.User,
                      isOwner: true,
                  },
              ]
            : []

        // 查找userId对应的扩展访问者信息
        const extendUser = (ret?.subjects_extend || []).find(
            (o) => o.subject_id === userId,
        )

        // 过滤出除userId外的所有扩展访问者信息，并标记为已扩展
        const extendSubjects = (ret?.subjects_extend || [])
            .filter((o) => o.subject_id !== userId)
            .map((o) => ({
                ...o,
                isExtend: true,
            }))

        // 查找userId对应的原始访问者信息
        const originUser = (ret?.subjects || []).find(
            (o) => o.subject_id === userId,
        )
        // 过滤出除userId外的所有原始访问者信息，根据权限情况标记为禁止修改
        const originSubjects = (ret?.subjects || [])
            // .filter((o) => o.subject_id !== userId)
            .map((o) => ({
                ...o,
                // 针对读取/下载权限 禁止修改
                isForbidden: o?.permissions?.length >= 2,
            }))

        // 初始化我的信息数组
        let myInfo: any[] = []
        // 如果extendUser存在，添加到myInfo数组并标记为已扩展
        if (extendUser) {
            myInfo = [
                ...myInfo,
                {
                    ...extendUser,
                    isExtend: true,
                },
            ]
        }
        // 如果originUser存在，添加到myInfo数组并标记为原始信息，根据权限情况标记为禁止修改
        if (originUser) {
            myInfo = [
                ...myInfo,
                {
                    ...originUser,
                    isOrigin: true,
                    ...(originUser?.permissions?.length >= 2
                        ? { isForbidden: true }
                        : {}),
                },
            ]
        }

        // 更新访问者列表，包括owner、我的信息、扩展访问者和原始访问者
        // 申请中已存在的访问者无法删除
        setVisitors([
            // ...owner,
            // ...myInfo,
            ...extendSubjects,
            ...appendArrProps(originSubjects, { isOrigin: true }),
        ])
        // 更新常规访问者列表，包括owner和扩展访问者
        setRegularVisitor([...extendSubjects])
    }

    /**
     * 异步函数checkCurrentUserIsSystemManager用于检查当前用户是否是系统管理员
     * 该函数通过获取当前用户的角色信息，并查找其中是否包含特定的系统管理员角色来实现判断
     * 最终通过调用setIsSystemManager来更新系统管理员状态
     */
    const checkCurrentUserIsSystemManager = () => {
        try {
            // 查找并判断用户角色中是否存在系统管理员角色
            const foundApplicationRole = checkPermission(
                allRoleList.ApplicationDeveloper,
            )

            const hasResourceAccess = checkPermissions(HasAccess.isHasBusiness)

            // 更新系统管理员状态，如果foundRole存在，则为true，否则为false
            loadData(id, type, hasResourceAccess, foundApplicationRole)
        } catch (err) {
            // 对错误进行格式化处理
            formatError(err)
        }
    }

    /**
     * 异步加载数据的函数，根据资源标识符（rid）和资源类型（rtype）来获取策略详情。
     *
     * @param rid 资源的唯一标识符，用于定位具体资源。
     * @param rtype 资源的类型，用于指定不同类型的操作策略。
     * @returns 无返回值，但会更新组件状态以显示加载的数据。
     */
    const loadData = async (
        rid: string,
        rtype: AssetTypeEnum,
        isApply,
        isAppDeveloper,
    ) => {
        try {
            // 设置加载状态为true，以显示加载中的指示器
            setLoading(true)
            // 调用policyDetail函数获取策略详情，并等待异步操作完成
            const ret = await policyDetail(rid, rtype)
            // 更新数据状态，将获取到的数据存储在组件状态中
            const newDataRet = {
                ...ret,
                subjects: ret.subjects.filter((o) => {
                    if (
                        !isApply &&
                        isAppDeveloper &&
                        o.subject_type === 'user'
                    ) {
                        return false
                    }
                    if (
                        isApply &&
                        !isAppDeveloper &&
                        o.subject_type === 'app'
                    ) {
                        return false
                    }
                    return true
                }),
            }
            // 转换数据 申请暂时屏蔽 授权、授权仅分配
            const transData = transApplyData(newDataRet, [
                PolicyActionEnum.Auth,
                PolicyActionEnum.Allocate,
            ])
            setFreezeData(newDataRet)
            setData(transData)
            // 重置数据状态，确保后续操作基于最新的数据状态
            resetData(transData)
        } catch (error) {
            if (error?.data?.code === 'AuthService.Policy.ObjectIdNotExist') {
                onClose?.()
            }
            formatError(error, toast)
        } finally {
            // 无论操作成功或失败，都设置加载状态为false，隐藏加载中的指示器
            setLoading(false)
        }
    }

    useEffect(() => {
        // 筛选出非所有者和非扩展的访问者
        const subjects = visitors?.filter((o) => !o.isOwner && !o.isExtend)
        // 移除isOrigin和isForbidden属性，得到当前主题对象
        // 移除origin判定
        const curSubjects = subjects?.map((o) => {
            const { isOrigin, isForbidden, ...rest } = o
            return rest
        })
        // 比较数据是否发生变化
        // 因顺序调整  增加数组排序
        const compare = !isEqual(
            [...(data?.subjects || [])].sort((a, b) =>
                sortByAttr(a, b, 'subject_id'),
            ),
            curSubjects?.sort((a, b) => sortByAttr(a, b, 'subject_id')),
        )
        // 设置是否有变化的状态
        setIsChange(compare)

        // 判断所有访问者是否都是所有者
        const onlyOwner = (visitors || []).every((o) => o.isOwner)
        // 设置是否只有所有者的状态
        setIsOnlyOwner(onlyOwner)
        // 设置是否有用户的狀態
        setHasUser(!!visitors?.length)
        // 判断是否存在拥有者、扩展或原始访问者
        const hasOrigin = visitors?.some(
            (o) => o.isOwner || o.isExtend || o.isOrigin,
        )
        // 设置是否所有访问者都是新增的状态
        setIsAllAdd(!hasOrigin)
    }, [data, visitors])

    /**
     * 处理确认操作，用于提交授权请求。
     * @param reason 授权变更的原因。
     * @async
     */
    const handleSure = async (reason: string) => {
        // 隐藏原因输入框
        setShowReason(false)
        // 筛选出需要添加的访问者主体，排除所有者、扩展和原始状态的访问者
        const addSubjects = (visitors || [])
            ?.filter((o) => !o.isOwner && !o.isExtend && !o.isOrigin)
            .map((obj) => {
                // 移除部门信息，因为部门信息不参与授权判断
                const { department, ...rest } = obj
                return rest
            })

        // 筛选出需要操作的原始访问者主体，即存在但权限不同的访问者
        const actionSubjects = (visitors || [])
            ?.filter((o) => o.isOrigin)
            .filter((o) => {
                // 查找数据中是否存在相同subject_id的访问者，并判断权限是否一致
                const it = (data?.subjects || []).find(
                    (i) => i.subject_id === o.subject_id,
                )
                return (
                    !it ||
                    it.permissions?.length !== o.permissions?.length ||
                    it.expired_at !== o.expired_at
                )
            })
            .map((obj) => {
                // 移除部门和禁止状态信息，因为这些信息不参与授权操作
                const { department, isForbidden, ...rest } = obj
                return rest
            })

        // 检查是否有权限为空的主体，如果有，则提示设置访问权限
        const hasNoPermission = addSubjects?.some((o) => !o.permissions?.length)
        if (hasNoPermission) {
            toast.warn(__('请设置访问权限'))
        }

        // 合并需要添加和操作的主体，并排除所有者ID
        // 仅传递变更数据
        const changedSubjects = [...addSubjects, ...actionSubjects]

        // 补全剔除的授权、分配权限
        const applyChangeData = transChangeData(
            changedSubjects,
            freezeData?.subjects,
        )

        // 构建策略信息，包括主体类型、主体ID和动作列表
        const policies = (applyChangeData || [])?.map((o) => {
            return {
                expired_at: o.expired_at,
                subject_type: o.subject_type,
                subject_id: o.subject_id,
                actions: (o.permissions || []).map((p) => p.action),
            }
        })

        // 构建授权变更的规范信息
        const spec = {
            id,
            policies,
            reason,
        }

        try {
            // 提交授权变更请求
            switch (type) {
                case AssetTypeEnum.DataView:
                    await createAuthRequest({
                        spec,
                    })
                    break
                case AssetTypeEnum.Indicator:
                    await createIndicatorAuthRequest({ spec })
                    break
                case AssetTypeEnum.Api:
                    await createApiAuthRequest({ spec })
                    break
                default:
                    break
            }

            // 提交成功后，显示请求消息并重置变更状态，然后跳转到审计页面
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
            setIsChange(false)
            resetData(data)
        } catch (error) {
            // 处理授权变更请求失败的情况
            if (
                error?.data?.code === 'AuthService.Policy.SubjectIdNotExist' &&
                Array.isArray(error?.data?.detail)
            ) {
                // 如果是主体ID不存在的错误，则清除对应主体的名称信息
                const ids: string[] = error?.data?.detail || []
                const newVisitors = visitors?.map((o) =>
                    ids.includes(o.subject_id) ? { ...o, subject_name: '' } : o,
                )
                setVisitors(newVisitors)
            } else if (
                error?.data?.code === 'AuthService.Policy.ObjectIdNotExist'
            ) {
                // 如果是对象ID不存在的错误，则直接关闭窗口
                onClose?.()
            }

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

    const canCancelAll = useMemo(() => {
        return !visitors?.filter((o) => !o.isOwner && !o.isExtend)?.length
    }, [visitors, data])

    const handleViewChange = () => {
        ReturnConfirmModal({
            title: __('确定要${type}本次申请吗？', {
                type: isAllAdd ? __('取消') : __('重置'),
            }),
            content: __(
                '${type}后您本次发起申请的访问者权限将不会被保存 ，请确认操作。',
                {
                    type: isAllAdd ? __('取消') : __('重置'),
                },
            ),
            cancelText: __('取消'),
            okText: __('确定'),
            onOK: () => {
                resetData(data)
            },
            microWidgetProps,
        })
    }

    return (
        <div className={styles['apply-manage']}>
            <StatusProvider>
                <VisitorProvider viewType={type}>
                    <div className={styles['apply-manage-top']}>
                        <TopBar
                            title={__('申请')}
                            node={data}
                            type={type}
                            isChange={isChange}
                            onClose={() => {
                                onClose?.()
                            }}
                            indicatorType={indicatorType}
                            ownerName={data?.owner_id ? data?.owner_name : ''}
                        />
                    </div>
                    <div className={styles['apply-manage-content']}>
                        {type === AssetTypeEnum.DataView ? (
                            <ApplyDataView
                                isChange={isChange}
                                data={data}
                                onClose={onClose}
                                extendsVisitor={regularVisitor}
                                visitorComponent={
                                    <VisitorCard
                                        key="dataview"
                                        value={visitors}
                                        type={type}
                                        height="calc(100vh - 292px)"
                                        onChange={setVisitors}
                                        applyMode
                                        loading={loading}
                                        empty={
                                            <Empty
                                                desc={__(
                                                    '可批量添加访问者，为访问者申请资源权限',
                                                )}
                                                iconSrc={dataEmpty}
                                            />
                                        }
                                    />
                                }
                                bottomComponent={
                                    hasUser ? (
                                        <FooterBar
                                            disabled={!isChange}
                                            leftDisabled={canCancelAll}
                                            cancelText={
                                                isAllAdd
                                                    ? __('取消')
                                                    : __('重置')
                                            }
                                            sureTip={
                                                !isChange
                                                    ? isOnlyOwner
                                                        ? __(
                                                              '添加访问者后可点击提交申请',
                                                          )
                                                        : __(
                                                              '添加访问者或重新申请权限后可点击提交申请权限',
                                                          )
                                                    : ''
                                            }
                                            sureText={__('提交')}
                                            onSure={() => setShowReason(true)}
                                            onCancel={handleViewChange}
                                        />
                                    ) : undefined
                                }
                            />
                        ) : type === AssetTypeEnum.Indicator ? (
                            <ApplyIndicator
                                isChange={isChange}
                                data={data}
                                onClose={onClose}
                                extendsVisitor={regularVisitor}
                                indicatorType={indicatorType}
                                visitorComponent={
                                    <VisitorCard
                                        key="indicator"
                                        value={visitors}
                                        type={type}
                                        height="calc(100vh - 292px)"
                                        onChange={setVisitors}
                                        applyMode
                                        loading={loading}
                                        empty={
                                            <Empty
                                                desc={__(
                                                    '可批量添加访问者，为访问者申请资源权限',
                                                )}
                                                iconSrc={dataEmpty}
                                            />
                                        }
                                    />
                                }
                                bottomComponent={
                                    hasUser ? (
                                        <FooterBar
                                            disabled={!isChange}
                                            leftDisabled={canCancelAll}
                                            cancelText={
                                                isAllAdd
                                                    ? __('取消')
                                                    : __('重置')
                                            }
                                            sureTip={
                                                !isChange
                                                    ? isOnlyOwner
                                                        ? __(
                                                              '添加访问者后可点击提交申请',
                                                          )
                                                        : __(
                                                              '添加访问者或重新申请权限后可点击提交申请权限',
                                                          )
                                                    : ''
                                            }
                                            sureText={__('提交')}
                                            onSure={() => setShowReason(true)}
                                            onCancel={handleViewChange}
                                        />
                                    ) : undefined
                                }
                            />
                        ) : (
                            <CommonManage
                                visitorComponent={
                                    <VisitorCard
                                        value={visitors}
                                        type={type}
                                        onChange={setVisitors}
                                        applyMode
                                        loading={loading}
                                        empty={
                                            <Empty
                                                desc={__(
                                                    '可批量添加访问者，为访问者申请资源权限',
                                                )}
                                                iconSrc={dataEmpty}
                                            />
                                        }
                                    />
                                }
                                bottomComponent={
                                    hasUser ? (
                                        <FooterBar
                                            disabled={!isChange}
                                            leftDisabled={canCancelAll}
                                            cancelText={
                                                isAllAdd
                                                    ? __('取消')
                                                    : __('重置')
                                            }
                                            sureTip={
                                                !isChange
                                                    ? isOnlyOwner
                                                        ? __(
                                                              '添加访问者后可点击提交申请',
                                                          )
                                                        : __(
                                                              '添加访问者或重新申请权限后可点击提交申请权限',
                                                          )
                                                    : ''
                                            }
                                            sureText={__('提交')}
                                            onSure={() => setShowReason(true)}
                                            onCancel={handleViewChange}
                                        />
                                    ) : undefined
                                }
                            />
                        )}
                    </div>

                    {showReason && (
                        <ReasonModel
                            visible={showReason}
                            onClose={() => setShowReason(false)}
                            onSure={handleSure}
                        />
                    )}
                </VisitorProvider>
            </StatusProvider>
        </div>
    )
}

export default ApplyManage
