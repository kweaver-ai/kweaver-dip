import { Button, message } from 'antd'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isEqual } from 'lodash'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import {
    AssetTypeEnum,
    PolicyActionEnum,
    PolicyEffectEnum,
    VisitorTypeEnum,
    formatError,
    policyDetail,
    policyRemove,
    policyUpdate,
} from '@/core'
import __ from '../../locale'
import FooterBar from '../FooterBar'
import TopBar from '../TopBar'
import VisitorCard from '../VisitorCard'
import { VisitorProvider } from '../VisitorProvider'
import styles from './styles.module.less'
import ApiManage from './ApiManage'
import DataViewManage from './DataViewManage'
import { StatusProvider } from './StatusProvider'
import { Loader } from '@/ui'
import { MicroWidgetPropsContext } from '@/context'
import { appendArrProps, sortByAttr } from '../../helper'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import IndicatorManage from './IndicatorManage'
import { useUpdateStateContext } from '../../UpdateStateProvider'

interface IAccessProps {
    id: string
    type: AssetTypeEnum
    onClose?: (needRefresh?: boolean) => void
    indicatorType?: string
}
function AccessManage({ id, type, onClose, indicatorType }: IAccessProps) {
    const [data, setData] = useState<any>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [visitors, setVisitors] = useState<any[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [isChange, setIsChange] = useState<boolean>(false)
    const [isOwner, setIsOwner] = useState<boolean>(false)
    // 是否展示全部数据(库表 | 接口 | 指标)
    const [showAll, setShowAll] = useState<boolean>(true)
    const [regularVisitor, setRegularVisitor] = useState<any[]>()
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [userId] = useCurrentUser('ID')
    const { setHasAccessChange } = useUpdateStateContext()

    /**
     * 状态变量，用于控制是否允许批量添加。
     * @type {boolean}
     */
    const [isAllAdd, setIsAllAdd] = useState<boolean>(false)
    // const navigator = useNavigate()
    const goBack = () => {
        searchParams.delete('id')
        searchParams.delete('indicatorType')
        setSearchParams(searchParams)
        onClose?.()
    }

    const loadData = async (rid: string, rtype: AssetTypeEnum) => {
        try {
            const ret = await policyDetail(rid, rtype)
            setData(ret)
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
            const extendSubjects = (ret?.subjects_extend || []).map((o) => ({
                ...o,
                isExtend: true,
            }))
            // 过滤出除userId外的所有原始访问者信息，根据权限情况标记为禁止修改
            const originSubjects = (ret?.subjects || [])
                // .filter((o) => o.subject_id !== userId)
                .map((o) => ({
                    ...o,
                }))

            setVisitors([
                // ...owner,
                ...extendSubjects,
                ...appendArrProps(originSubjects, { isOrigin: true }),
            ])
            // setRegularVisitor([...owner, ...extendSubjects])
            setRegularVisitor([...extendSubjects])

            const belongOwner = (ret?.owners || []).some(
                (o) => o.owner_id === userId,
            )
            setIsOwner(belongOwner)
            // 用户对整表具有授权或分配权限
            const hasAuthAccess = [
                ...(ret?.subjects || []),
                ...(ret?.subjects_extend || []),
            ]
                .filter((o) => o.subject_id === userId)
                .some((o) =>
                    o.permissions?.some(
                        (p) =>
                            p.effect === PolicyEffectEnum.Allow &&
                            [
                                PolicyActionEnum.Allocate,
                                PolicyActionEnum.Auth,
                            ].includes(p.action),
                    ),
                )
            setShowAll(belongOwner || hasAuthAccess)
        } catch (error) {
            if (error?.data?.code === 'AuthService.Policy.ObjectIdNotExist') {
                goBack()
                // navigator(`/dataService/assetAccess?type=${type}`)
            }

            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    // 用户对整表具有查看数据权限
    const hasAllRead = useMemo(() => {
        return visitors
            .filter((o) => o.subject_id === userId)
            .some((o) =>
                o.permissions?.some(
                    (p) =>
                        p.effect === PolicyEffectEnum.Allow &&
                        p.action === PolicyActionEnum.Read,
                ),
            )
    }, [visitors, userId])

    useEffect(() => {
        const subjects = visitors?.filter((o) => !o.isOwner && !o.isExtend)
        // 移除isOrigin和isForbidden属性，得到当前主题对象
        // 移除origin判定
        const curSubjects = subjects?.map((o) => {
            const { isOrigin, isForbidden, ...rest } = o
            return rest
        })
        const compare = !isEqual(
            [...(data?.subjects || [])].sort((a, b) =>
                sortByAttr(a, b, 'subject_id'),
            ),
            curSubjects?.sort((a, b) => sortByAttr(a, b, 'subject_id')),
        )
        setIsChange(compare)
        // 判断是否存在扩展或原始访问者
        const hasOrigin = visitors?.some((o) => o.isExtend || o.isOrigin)
        // 设置是否所有访问者都是新增的状态
        setIsAllAdd(!hasOrigin)
    }, [data, visitors])
    useEffect(() => {
        if (id) {
            setLoading(true)
            loadData(id, type)
        }
    }, [id, type])

    const handleSure = async () => {
        const subjects = visitors
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
            await policyUpdate({
                object_id: id,
                object_type: type,
                subjects,
            })
            ;(microWidgetProps?.components?.toast || message).success(
                __('授权成功'),
            )
            setIsChange(false)

            loadData(id, type)

            setHasAccessChange?.(false)
            // goBack()
            // navigator(`/dataService/assetAccess?type=${type}`)
        } catch (error) {
            if (
                error?.data?.code === 'AuthService.Policy.SubjectIdNotExist' &&
                Array.isArray(error?.data?.detail)
            ) {
                const ids: string[] = error?.data?.detail || []
                const newVisitors = visitors?.map((o) =>
                    ids.includes(o.subject_id) ? { ...o, subject_name: '' } : o,
                )
                setVisitors(newVisitors)
            } else if (
                error?.data?.code === 'AuthService.Policy.ObjectIdNotExist'
            ) {
                goBack()
                // navigator(`/dataService/assetAccess?type=${type}`)
            }

            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const cancelAccess = async () => {
        try {
            await policyRemove({ object_id: id, object_type: type })
            ;(microWidgetProps?.components?.toast || message).success(
                '取消授权成功',
            )
            goBack()
            // navigator(`/dataService/assetAccess?type=${type}`)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    const handleUnAuth = () => {
        ReturnConfirmModal({
            title: __('确定要取消全部授权吗?'),
            content: __('取消后您赋予全部访问者的权限将均被删除，请确认操作。'),
            cancelText: __('取消'),
            okText: __('确定'),
            onOK: () => {
                cancelAccess()
                setHasAccessChange?.(true)
            },
            microWidgetProps,
        })
    }

    const canCancelAll = useMemo(() => {
        return !visitors?.filter((o) => !o.isOwner && !o.isExtend)?.length
    }, [visitors, data])

    // 取消当前访问者的访问权限
    const cancelCurrentAccess = () => {
        // 如果所有添加的访问者都新加到列表中的
        if (isAllAdd) {
            // 直接清空访问者列表
            setVisitors([])
        } else {
            // 获取原始列表中的，如果数据不存在，则默认为空数组
            const originSubjects = (data?.subjects || [])
                // 映射原始主题列表，此处代码已省略，原意为过滤掉当前用户的主题
                // .map((o) => ({...o,})) 对象解构用于复制对象并添加新属性
                .map((o) => ({
                    ...o,
                }))
            // 更新访问者列表，将过滤后的原始主题列表每个项添加一个isOrigin属性
            // appendArrProps是一个工具函数，用于向数组的每个项添加属性
            setVisitors([
                ...appendArrProps(originSubjects, {
                    isOrigin: true,
                }),
                // 将常规访问者列表添加回访问者列表
                ...(regularVisitor || []),
            ])
        }
    }

    const handleViewChange = () => {
        if (type === AssetTypeEnum.Api || type === AssetTypeEnum.Indicator) {
            ReturnConfirmModal({
                title: __('确定要${operation}本次授权吗？', {
                    operation: isAllAdd ? __('取消') : __('重置'),
                }),
                content: __(
                    '${operation}后您本次赋予访问者的权限将均不会被保存 ， 请确认操作。',
                    {
                        operation: isAllAdd ? __('取消') : __('重置'),
                    },
                ),
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: cancelCurrentAccess,
                microWidgetProps,
            })
        } else {
            ReturnConfirmModal({
                title: __('确定要${operation}本次授权吗？', {
                    operation: isAllAdd ? __('取消') : __('重置'),
                }),
                content: __(
                    '${operation}后您本次配置的授权行列规则及访问者权限将不会被保存，请确认操作。',
                    {
                        operation: isAllAdd ? __('取消') : __('重置'),
                    },
                ),
                cancelText: __('取消'),
                okText: __('确定'),
                onOK: cancelCurrentAccess,
                microWidgetProps,
            })
        }
    }

    return (
        <div className={styles['access-manage']}>
            <StatusProvider>
                <VisitorProvider viewType={type}>
                    <div className={styles['access-manage-top']}>
                        <TopBar
                            node={data}
                            type={type}
                            isChange={isChange}
                            onClose={onClose || goBack}
                            indicatorType={indicatorType}
                            ownerName={data?.owner_id ? data?.owner_name : ''}
                        />
                    </div>
                    <div className={styles['access-manage-content']}>
                        {loading ? (
                            <Loader />
                        ) : AssetTypeEnum.DataView === type ? (
                            <DataViewManage
                                showAll={showAll}
                                hasAllRead={hasAllRead}
                                isOwner={isOwner}
                                isChange={isChange}
                                data={data}
                                extendsVisitor={regularVisitor}
                                visitorComponent={
                                    <VisitorCard
                                        key="dataview"
                                        value={visitors}
                                        type={type}
                                        loading={loading}
                                        height="calc(100vh - 292px)"
                                        onChange={setVisitors}
                                        buttonText={__('添加应用账户')}
                                    />
                                }
                                bottomComponent={
                                    <FooterBar
                                        disabled={!isChange}
                                        leftDisabled={canCancelAll}
                                        onSure={handleSure}
                                        sureTip={
                                            isChange
                                                ? ''
                                                : __(
                                                      '添加访问者或更改现有权限后可点击保存',
                                                  )
                                        }
                                        onCancel={handleViewChange}
                                        onUnAuth={handleUnAuth}
                                        cancelText={
                                            isAllAdd ? __('取消') : __('重置')
                                        }
                                        sureText={__('保存')}
                                    />
                                }
                            />
                        ) : AssetTypeEnum.Indicator === type ? (
                            <IndicatorManage
                                showAll={showAll}
                                hasAllRead={hasAllRead}
                                isOwner={isOwner}
                                isChange={isChange}
                                data={data}
                                indicatorType={indicatorType}
                                extendsVisitor={regularVisitor}
                                visitorComponent={
                                    <VisitorCard
                                        key="dataview"
                                        value={visitors}
                                        type={type}
                                        loading={loading}
                                        height="calc(100vh - 292px)"
                                        onChange={setVisitors}
                                        buttonText={__('添加应用账户')}
                                    />
                                }
                                bottomComponent={
                                    <FooterBar
                                        disabled={!isChange}
                                        leftDisabled={canCancelAll}
                                        onSure={handleSure}
                                        sureTip={
                                            isChange
                                                ? ''
                                                : __(
                                                      '添加访问者或更改现有权限后可点击保存',
                                                  )
                                        }
                                        onCancel={handleViewChange}
                                        onUnAuth={handleUnAuth}
                                        cancelText={
                                            isAllAdd ? __('取消') : __('重置')
                                        }
                                        sureText={__('保存')}
                                    />
                                }
                            />
                        ) : (
                            <ApiManage
                                showAll
                                isOwner={isOwner}
                                isChange={isChange}
                                data={data}
                                extendsVisitor={regularVisitor}
                                visitorComponent={
                                    <VisitorCard
                                        value={visitors}
                                        type={type}
                                        onChange={setVisitors}
                                        buttonText={__('添加应用账户')}
                                    />
                                }
                                bottomComponent={
                                    <FooterBar
                                        disabled={!isChange}
                                        leftDisabled={canCancelAll}
                                        onSure={handleSure}
                                        onCancel={handleViewChange}
                                        onUnAuth={handleUnAuth}
                                        sureTip={
                                            isChange
                                                ? ''
                                                : type === AssetTypeEnum.Api
                                                ? __(
                                                      '添加应用或重新申请权限后可点击提交',
                                                  )
                                                : __(
                                                      '添加访问者或更改现有权限后可点击保存',
                                                  )
                                        }
                                        cancelText={
                                            isAllAdd ? __('取消') : __('重置')
                                        }
                                        sureText={__('保存')}
                                    />
                                }
                            />
                        )}
                    </div>
                </VisitorProvider>
            </StatusProvider>
        </div>
    )
}

export default AccessManage
