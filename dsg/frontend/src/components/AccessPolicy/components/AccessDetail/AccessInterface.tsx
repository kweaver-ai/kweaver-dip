import { Button, Tabs } from 'antd'
import { memo, useContext, useEffect, useMemo, useState } from 'react'
import {
    AssetTypeEnum,
    IPolicyInfo,
    IVisitor,
    formatError,
    getSubViews,
    policyDetail,
    VisitorTypeEnum,
    ISubView,
    allRoleList,
    getSubServices,
} from '@/core'
import { Loader } from '@/ui'
import { AccessUserItem } from '.'
import __ from '../../locale'
import styles from './styles.module.less'
import SubServiceAccess from './SubServiceAccess'
import { MicroWidgetPropsContext } from '@/context'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const Items = [
    {
        key: AssetTypeEnum.Api,
        label: __('接口权限'),
    },
    {
        key: AssetTypeEnum.SubService,
        label: __('限定规则权限'),
    },
]
/** 权限接口 */
function AccessInterface({ id, type }: any) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [userInfo] = useCurrentUser()
    const [data, setData] = useState<any>()
    const [permissions, setPermissions] = useState<IVisitor[]>()
    const [extendPermissions, setExtendPermissions] = useState<IVisitor[]>()
    const [loading, setLoading] = useState<boolean>(false)
    const [hasAccessInfo, setHasAccessInfo] = useState<boolean>(false)
    const [noViewAccess, setNoViewAccess] = useState<boolean>(false)
    const [noSubServiceAccess, setNoSubServiceAccess] = useState<boolean>(false)
    const [myInfo, setMyInfo] = useState<any>()
    const [subServices, setSubServices] = useState<ISubView[]>([])
    const [activeKey, setActiveKey] = useState<AssetTypeEnum>(AssetTypeEnum.Api)
    const { checkPermission } = useUserPermCtx()
    // 获取当前数据运营工程师
    const userOperationEngineer = useMemo(() => {
        return checkPermission(allRoleList.TCDataOperationEngineer) ?? false
    }, [checkPermission])
    // 获取当前数据开发工程师
    const userDevelopEngineer = useMemo(() => {
        return checkPermission(allRoleList.TCDataGovernEngineer) ?? false
    }, [checkPermission])

    const userId = userInfo?.ID
    const userName = userInfo?.VisionName

    const getData = async (rid: string, rtype: AssetTypeEnum) => {
        try {
            setLoading(true)

            const [ret, subServiceResult] = await Promise.all([
                policyDetail(rid, rtype),
                getSubServices({
                    limit: 1000,
                    offset: 1,
                    service_id: rid,
                    sort: 'is_authorized',
                    direction: 'desc',
                }),
            ])

            setSubServices(subServiceResult?.entries || [])
            const viewAccess =
                !!ret?.owner_id ||
                !!ret?.subjects?.length ||
                !!ret?.subjects_extend?.length ||
                userDevelopEngineer ||
                userOperationEngineer

            const subServiceAccess = !!subServiceResult?.entries?.length
            // 存在Owner或授权信息
            setHasAccessInfo(viewAccess || subServiceAccess)
            setNoViewAccess(!viewAccess)
            setNoSubServiceAccess(!subServiceAccess)
            setData(ret)

            const curUser = ret?.subjects?.find((o) => o.subject_id === userId)
            const curUserExtend: any = ret?.subjects_extend?.find(
                (o) => o.subject_id === userId,
            )
            if (curUserExtend) {
                curUserExtend.isOwner = true
            }

            const subjectUsers = ret?.subjects?.filter(
                (o) => o.subject_id !== userId,
            )
            const extendUsers = ret?.subjects_extend?.filter(
                (o) => o.subject_id !== userId,
            )
            const defaultMe = {
                subject_id: userId,
                subject_name: userName,
                departments: [],
                permissions:
                    userDevelopEngineer || userOperationEngineer
                        ? [{ action: 'read', effect: 'allow' }]
                        : [],
                subject_type: VisitorTypeEnum.User,
                isOwner: false,
            }

            setMyInfo(curUser || curUserExtend || defaultMe)
            setPermissions(subjectUsers as any)
            setExtendPermissions(extendUsers as any)
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            getData(id, type)
        }
    }, [id, type, userDevelopEngineer, userOperationEngineer])

    const getAllPermissions = () => {
        return (
            <div className={styles['access-list']}>
                {myInfo && myInfo.subject_id === data?.owner_id && (
                    <AccessUserItem
                        key="owner"
                        item={{
                            subject_id: data?.owner_id,
                            subject_name: data?.owner_name,
                            user_status: data?.user_status,
                        }}
                        isOwner
                        isMe={data?.owner_id === userId}
                    />
                )}
                {myInfo && myInfo.subject_id !== data?.owner_id && (
                    <AccessUserItem
                        key={myInfo.subject_id}
                        item={myInfo}
                        isOwner={myInfo?.isOwner}
                        isMe={myInfo.subject_id === userId}
                    />
                )}
                {extendPermissions?.map((item) => (
                    <AccessUserItem
                        key={item.subject_id}
                        item={item}
                        isOwner
                        isMe={item.subject_id === userId}
                    />
                ))}
                {permissions
                    ?.filter((o) => o.subject_id !== data?.owner_id)
                    ?.map((item) => (
                        <AccessUserItem
                            key={item.subject_id}
                            item={item}
                            isMe={item.subject_id === userId}
                        />
                    ))}
            </div>
        )
    }

    const contents = useMemo(() => {
        return {
            [AssetTypeEnum.Api]: getAllPermissions(),
            [AssetTypeEnum.SubService]: (
                <SubServiceAccess
                    id={id}
                    ownerId={data?.owner_id}
                    userId={userId}
                    subServices={subServices}
                />
            ),
        }
    }, [data, userId, permissions, extendPermissions])

    return (
        <div>
            {loading && (
                <div style={{ paddingTop: '32px' }}>
                    <Loader />
                </div>
            )}

            <div className={styles['access-content']} hidden={loading}>
                {type === AssetTypeEnum.Api ? (
                    <>
                        <div className={styles['access-content-switcher']}>
                            {Items?.map((o) => (
                                <Button
                                    key={o.key}
                                    onClick={() => setActiveKey(o.key)}
                                    className={
                                        activeKey === o.key
                                            ? styles.isActive
                                            : undefined
                                    }
                                    type="link"
                                    ghost
                                    disabled={
                                        o.key === AssetTypeEnum.SubService &&
                                        noSubServiceAccess
                                    }
                                    title={
                                        o.key === AssetTypeEnum.SubService &&
                                        noSubServiceAccess
                                            ? __('暂无限定规则权限')
                                            : ''
                                    }
                                >
                                    {o.label}
                                </Button>
                            ))}
                        </div>
                        <div className={styles['access-content-child']}>
                            {contents[activeKey]}
                        </div>
                    </>
                ) : (
                    getAllPermissions()
                )}
            </div>
        </div>
    )
}

export default memo(AccessInterface)
