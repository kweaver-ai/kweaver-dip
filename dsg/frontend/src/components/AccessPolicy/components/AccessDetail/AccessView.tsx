import { Button } from 'antd'
import { memo, useContext, useEffect, useMemo, useState } from 'react'
import {
    AssetTypeEnum,
    IVisitor,
    ISubView,
    formatError,
    getSubViews,
    policyDetail,
    VisitorTypeEnum,
    allRoleList,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader } from '@/ui'
import { AccessUserItem } from '.'
import __ from '../../locale'
import SubviewAccess from './SubviewAccess'
import styles from './styles.module.less'
import { MicroWidgetPropsContext } from '@/context'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const Items = [
    {
        key: AssetTypeEnum.DataView,
        label: __('库表权限'),
    },
    {
        key: AssetTypeEnum.SubView,
        label: __('行列权限'),
    },
]

/** 权限库表 */
function AccessView({ id, type }: any) {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [userInfo] = useCurrentUser()
    const [data, setData] = useState<any>()
    const [permissions, setPermissions] = useState<IVisitor[]>()
    const [extendPermissions, setExtendPermissions] = useState<IVisitor[]>()
    const [loading, setLoading] = useState<boolean>(false)
    const [hasAccessInfo, setHasAccessInfo] = useState<boolean>(false)
    const [noViewAccess, setNoViewAccess] = useState<boolean>(false)
    // 是否展示行列权限
    const [noSubviewAccess, setNoSubviewAccess] = useState<boolean>(false)
    const [myInfo, setMyInfo] = useState<any>()
    const [subviews, setSubviews] = useState<ISubView[]>([])
    const [activeKey, setActiveKey] = useState<AssetTypeEnum>(
        AssetTypeEnum.DataView,
    )
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

            const [ret, subviewResult] = await Promise.all([
                policyDetail(rid, rtype),
                getSubViews({
                    limit: 1000,
                    offset: 1,
                    logic_view_id: rid,
                    sort: 'is_authorized',
                    direction: 'desc',
                }),
            ])

            setSubviews(subviewResult?.entries || [])
            const viewAccess =
                !!ret?.owner_id ||
                !!ret?.subjects?.length ||
                !!ret?.subjects_extend?.length ||
                userDevelopEngineer ||
                userOperationEngineer

            const subViewAccess = !!subviewResult?.entries?.length
            // 存在Owner或授权信息
            setHasAccessInfo(viewAccess || subViewAccess)
            setNoViewAccess(!viewAccess)
            setNoSubviewAccess(!subViewAccess)
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
            [AssetTypeEnum.DataView]: getAllPermissions(),
            [AssetTypeEnum.SubView]: (
                <SubviewAccess
                    id={id}
                    ownerId={data?.owner_id}
                    userId={userId}
                    subViews={subviews}
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
            {/* <div className={styles['access-content-empty']} hidden={loading}>
                {__('暂无权限信息')}
            </div> */}
            <div className={styles['access-content']} hidden={loading}>
                {type === AssetTypeEnum.DataView ? (
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
                                        o.key === AssetTypeEnum.SubView &&
                                        noSubviewAccess
                                    }
                                    title={
                                        o.key === AssetTypeEnum.SubView &&
                                        noSubviewAccess
                                            ? __('暂无行列权限')
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

export default memo(AccessView)
