import { Button, Tabs } from 'antd'
import { memo, useEffect, useMemo, useState } from 'react'
import {
    AssetTypeEnum,
    IPolicyInfo,
    IVisitor,
    ISubView,
    formatError,
    getSubViews,
    policyDetail,
    VisitorTypeEnum,
    allRoleList,
    getDimRules,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Loader } from '@/ui'
import { AccessUserItem } from '.'
import __ from '../../locale'
import styles from './styles.module.less'
import SubDimAccess from './SubDimAccess'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const Items = [
    {
        key: AssetTypeEnum.Indicator,
        label: __('指标权限'),
    },
    {
        key: AssetTypeEnum.Dim,
        label: __('维度权限'),
    },
]

/** 指标权限 */
function AccessIndicator({ id, type }: any) {
    const [userInfo] = useCurrentUser()
    const [data, setData] = useState<any>()
    const [permissions, setPermissions] = useState<IVisitor[]>()
    const [extendPermissions, setExtendPermissions] = useState<IVisitor[]>()
    const [loading, setLoading] = useState<boolean>(false)
    const [hasAccessInfo, setHasAccessInfo] = useState<boolean>(false)
    const [noSubDimAccess, setNoSubDimAccess] = useState<boolean>(false)
    const [subDims, setSubDims] = useState<ISubView[]>([])
    const [myInfo, setMyInfo] = useState<any>()
    const [activeKey, setActiveKey] = useState<AssetTypeEnum>(
        AssetTypeEnum.Indicator,
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

    const getData = async (rid: string, rType: AssetTypeEnum) => {
        try {
            setLoading(true)

            const [ret, subDimResult] = await Promise.all([
                policyDetail(rid, rType),
                getDimRules({
                    limit: 1000,
                    offset: 1,
                    indicator_id: rid,
                    sort: 'is_authorized',
                    direction: 'desc',
                }),
            ])

            const entries = (subDimResult?.entries || []).map((item) => {
                const { metadata, spec } = item
                const obj = {
                    detail: JSON.stringify({
                        fields: spec?.fields || [],
                        row_filters: spec?.row_filters || {},
                    }),
                    id: metadata?.id,
                    name: spec?.name,
                    logic_view_id: spec?.indicator_id,
                }
                return obj
            })
            setSubDims(entries)

            const viewAccess =
                !!ret?.owner_id ||
                !!ret?.subjects?.length ||
                !!ret?.subjects_extend?.length ||
                userDevelopEngineer ||
                userOperationEngineer

            const subDimAccess = !!entries.length
            // 存在Owner或授权信息
            setHasAccessInfo(viewAccess)
            setNoSubDimAccess(!subDimAccess)
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
            formatError(error)
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
            [AssetTypeEnum.Indicator]: getAllPermissions(),
            [AssetTypeEnum.Dim]: (
                <SubDimAccess
                    id={id}
                    ownerId={data?.owner_id}
                    userId={userId}
                    subDims={subDims}
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
            {/* <div
                className={styles['access-content-empty']}
                hidden={loading || hasAccessInfo}
            >
                {__('暂无权限信息')}
            </div> */}
            <div className={styles['access-content']} hidden={loading}>
                {type === AssetTypeEnum.Indicator ? (
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
                                        o.key === AssetTypeEnum.Dim &&
                                        noSubDimAccess
                                    }
                                    title={
                                        o.key === AssetTypeEnum.Dim &&
                                        noSubDimAccess
                                            ? __('暂无维度权限')
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

export default memo(AccessIndicator)
