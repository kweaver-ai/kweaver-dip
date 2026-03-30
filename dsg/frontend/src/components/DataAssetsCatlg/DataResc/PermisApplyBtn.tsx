import { Button, Tooltip } from 'antd'
import classnames from 'classnames'
import { noop } from 'lodash'
import { useContext, useEffect, useMemo, useState } from 'react'
import { FontIcon } from '@/icons'
import { DataRescType } from '../ApplicationService/helper'
import { DataRescTypeMap } from './helper'
// import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { MicroWidgetPropsContext } from '@/context'
import { allRoleList, formatError, HasAccess, isMicroWidget } from '@/core'
import { IconType } from '@/icons/const'
import { getInnerUrl } from '@/utils'
import { checkAuditPolicyPermis } from '../helper'
import __ from './locale'
import styles from './styles.module.less'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IPermisApplyBtn {
    id: string
    type: string
    isOwner: boolean
    // 视图、接口需要根据上线状态显示，指标暂不需要可以不传
    isOnline?: boolean
    // 外界如已获取审核策略状态则传入，否则不要传值
    itemPermisAuditPolicy?: {
        // 是否设置了启用内置策略
        hasInnerEnablePolicy?: boolean
        // 是否同类型资源有启用策略
        hasCustomEnablePolicy?: boolean
        // hasAuditEnablePolicy 为true：资源设置了启用策略，可申请权限申请
        hasAuditEnablePolicy?: boolean
    }
    onApplyPermisClick: (flag?: boolean) => void
    isIconBtn?: boolean
}

const PermisApplyBtn = (props: IPermisApplyBtn) => {
    const {
        id,
        type,
        isOwner,
        isOnline = false,
        itemPermisAuditPolicy,
        onApplyPermisClick = noop,
        isIconBtn = true,
    } = props

    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const { checkPermission, checkPermissions } = useUserPermCtx()
    // 资源审核权限
    const [permisAuditPolicy, setPermisAuditPolicy] = useState<any>(
        itemPermisAuditPolicy,
    )
    const [hasInnerEnablePolicy, hasCustomEnablePolicy, hasAuditEnablePolicy] =
        useMemo(() => {
            return [
                permisAuditPolicy?.hasInnerEnablePolicy,
                permisAuditPolicy?.hasCustomEnablePolicy,
                permisAuditPolicy?.hasAuditEnablePolicy,
            ]
        }, [permisAuditPolicy])
    // isAccessBtnShowByPolicy-权限申请按钮显示
    // isAccessBtnDisableByPolicy-权限申请按钮禁用(无内置启用&无启用并绑定该资源的自定义策略)，其中上线逻辑之前的规则迁移过来的
    const [isAccessBtnShowByPolicy, isAccessBtnDisableByPolicy] =
        useMemo(() => {
            return [
                hasInnerEnablePolicy || hasCustomEnablePolicy,
                !(hasInnerEnablePolicy || hasAuditEnablePolicy),
            ]
        }, [permisAuditPolicy])

    const hasBusinessRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    const appDeveloper = useMemo(
        () => checkPermission(allRoleList.ApplicationDeveloper),
        [checkPermission],
    )

    const isShowRequestPath = [
        '/data-assets',
        '/cognitive-search',
        '/asset-center',
        '/my-assets',
        '/asset-view/architecture',
    ].includes(getInnerUrl(window.location.pathname))

    useEffect(() => {
        if (!id || itemPermisAuditPolicy) return
        getAuditProcess(id)
    }, [id, itemPermisAuditPolicy])

    // 获取是否配置权限申请审核策略
    const getAuditProcess = async (_id: string) => {
        try {
            // item.hasAuditPolicy为true：资源设置了启用策略，可申请权限申请
            const permisTemp = await checkAuditPolicyPermis([
                {
                    id: _id,
                    type,
                },
            ])
            setPermisAuditPolicy(
                permisTemp?.length
                    ? {
                          hasInnerEnablePolicy:
                              permisTemp?.[0]?.hasInnerEnablePolicy,
                          hasCustomEnablePolicy:
                              permisTemp?.[0]?.hasCustomEnablePolicy,
                          hasAuditEnablePolicy:
                              permisTemp?.[0]?.hasAuditEnablePolicy,
                      }
                    : {},
            )
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <>
            {isAccessBtnShowByPolicy &&
                !isOwner &&
                (isShowRequestPath || isMicroWidget({ microWidgetProps })) &&
                (type === DataRescType.LOGICALVIEW ||
                (type === DataRescType.INTERFACE && appDeveloper) ? (
                    <Tooltip
                        title={
                            isOnline
                                ? isAccessBtnDisableByPolicy &&
                                  hasCustomEnablePolicy
                                    ? __('无匹配的审核流程，不能进行权限申请')
                                    : type === DataRescType.INTERFACE
                                    ? __('为集成应用申请权限')
                                    : __('权限申请')
                                : __(
                                      '该${text}未发布或未上线，无法进行权限申请',
                                      {
                                          text: DataRescTypeMap[type],
                                      },
                                  )
                        }
                        placement={isOnline ? 'bottom' : 'bottomRight'}
                        overlayStyle={{ maxWidth: 500 }}
                    >
                        {isIconBtn ? (
                            <FontIcon
                                name="icon-quanxianshenqing1"
                                className={classnames(
                                    styles.itemOprIcon,
                                    (!isOnline || isAccessBtnDisableByPolicy) &&
                                        styles.itemOprDiabled,
                                )}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (!isOnline || isAccessBtnDisableByPolicy)
                                        return
                                    onApplyPermisClick(true)
                                }}
                            />
                        ) : (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onApplyPermisClick(true)
                                }}
                                icon={
                                    <FontIcon
                                        name="icon-quanxianshenqing1"
                                        type={IconType.FONTICON}
                                        style={{ lineHeight: 1 }}
                                    />
                                }
                                className={styles.itemOprBtn}
                                disabled={
                                    !isOnline || isAccessBtnDisableByPolicy
                                }
                            >
                                {__('权限申请')}
                            </Button>
                        )}
                    </Tooltip>
                ) : type === DataRescType.INDICATOR ? (
                    <Tooltip
                        title={
                            isAccessBtnDisableByPolicy && hasCustomEnablePolicy
                                ? __('无匹配的审核流程，不能进行权限申请')
                                : !hasBusinessRoles
                                ? __('为集成应用申请权限')
                                : __('权限申请')
                        }
                        placement="bottom"
                        overlayStyle={{ maxWidth: 500 }}
                    >
                        {isIconBtn ? (
                            <FontIcon
                                name="icon-quanxianshenqing1"
                                className={classnames(
                                    styles.itemOprIcon,
                                    isAccessBtnDisableByPolicy &&
                                        styles.itemOprDiabled,
                                )}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (isAccessBtnDisableByPolicy) return
                                    onApplyPermisClick(true)
                                }}
                            />
                        ) : (
                            <Button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    onApplyPermisClick(true)
                                }}
                                icon={
                                    <FontIcon
                                        name="icon-quanxianshenqing1"
                                        type={IconType.FONTICON}
                                        style={{ lineHeight: 1 }}
                                    />
                                }
                                className={styles.itemOprBtn}
                                disabled={isAccessBtnDisableByPolicy}
                            >
                                {__('权限申请')}
                            </Button>
                        )}
                    </Tooltip>
                ) : undefined)}
            {/* 权限申请 */}
        </>
    )
}

export default PermisApplyBtn
