import { Drawer, Tabs, Tooltip } from 'antd'
import { Children, memo, useEffect, useMemo, useRef, useState } from 'react'
import moment from 'moment'
import { useClickAway } from 'ahooks'
import { Loader } from '@/ui'
import {
    AssetTypeEnum,
    IPolicyInfo,
    IVisitor,
    formatError,
    policyDetail,
} from '@/core'
import __ from '../../locale'
import {
    AccessOptsList,
    AccessType,
    permissionOrderCompare,
} from '../VisitAccessSelect/helper'
import styles from './styles.module.less'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { ResIcon } from '../../helper'
import { FontIcon, UserOutlined } from '@/icons'

export const AccessUserItem = memo(({ item, isOwner, isMe }: any) => {
    const access = useMemo(() => {
        const allowArr: any[] = []
        const denyArr: any[] = []
        item?.permissions?.forEach((it) => {
            const label =
                AccessOptsList.find((o) => o.value === it.action)?.label ?? '--'
            if (it.effect === AccessType.Allow) {
                allowArr.push(label)
            } else {
                denyArr.push(label)
            }
        })
        const labelAllow = allowArr.sort(permissionOrderCompare).join('/')
        const labelDeny = denyArr.sort(permissionOrderCompare).join('/')
        return [labelAllow, labelDeny]
    }, [item?.permissions])

    return (
        <div className={styles['access-item']}>
            <div className={styles['access-item-name']}>
                <div className={styles['name-box']}>
                    <span className={styles['icon-box']}>
                        {item.subject_type === 'app' ? (
                            <FontIcon name="icon-jichengyingyong-xianxing" />
                        ) : (
                            <UserOutlined style={{ fontSize: '18px' }} />
                        )}
                    </span>
                    <span
                        className={styles['name-box-text']}
                        title={item?.subject_name}
                    >
                        {item?.subject_name}
                    </span>
                    {item?.user_status === 'Deleted' && (
                        <Tooltip
                            placement="topRight"
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            title={__(
                                '当前用户不在组织架构中，可将其权限进行删除操作',
                            )}
                        >
                            <span className={styles['name-box-deleted']}>
                                {__('已删除')}
                            </span>
                        </Tooltip>
                    )}
                </div>

                {isMe && <span>{__('我')}</span>}
            </div>
            <div className={styles['access-item-access']}>
                {isOwner ? (
                    <div>{__('数据Owner')}</div>
                ) : (
                    <div>
                        {access?.[0] && (
                            <div>
                                <span>{__('允许')}</span>
                                <span>{access?.[0]}</span>
                                {item.expired_at && (
                                    <span style={{ marginLeft: '8px' }}>
                                        {__('过期时间:')}
                                        {moment(item.expired_at).format(
                                            'YYYY-MM-DD HH:mm',
                                        )}
                                    </span>
                                )}
                                {moment(item.expired_at).valueOf() <
                                    moment().valueOf() && (
                                    <span
                                        style={{
                                            color: '#ff4d4f',
                                            marginLeft: '8px',
                                        }}
                                    >
                                        {__('已失效')}
                                    </span>
                                )}
                            </div>
                        )}
                        {access?.[1] && (
                            <div>
                                <span>{__('拒绝')}</span>
                                <span>{access?.[1]}</span>
                            </div>
                        )}
                        {!access?.[0] && !access?.[1] && (
                            <div>
                                <span>{__('权限')}</span>
                                <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                    {__('暂无权限')}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
})

function AccessDetail({ onClose, open, id, type }: any) {
    const [userId] = useCurrentUser('ID')
    const [data, setData] = useState<any>()
    const [permissions, setPermissions] = useState<IVisitor[]>()
    const [extendPermissions, setExtendPermissions] = useState<IVisitor[]>()
    const [loading, setLoading] = useState<boolean>(false)
    const [activeKey, setActiveKey] = useState<AssetTypeEnum>(
        AssetTypeEnum.DataView,
    )

    const getData = async (rid: string, rtype: AssetTypeEnum) => {
        try {
            setLoading(true)
            const ret: IPolicyInfo = await policyDetail(rid, rtype)

            setData(ret)
            setPermissions(ret?.subjects as any)
            setExtendPermissions(ret?.subjects_extend as any)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open && id) {
            getData(id, type)
        }
    }, [open, id, type])

    const clickRef = useRef<HTMLDivElement>(null)
    useClickAway(() => {
        if (open) {
            onClose()
        }
    }, clickRef)

    const getAllPermissions = () => {
        return (
            <div className={styles['access-list']}>
                {data?.owner_id && (
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

    const items = [
        {
            key: AssetTypeEnum.DataView,
            label: __('库表权限'),
            children: getAllPermissions(),
        },
        // {
        //     key: AssetTypeEnum.SubView,
        //     label: __('行列权限'),
        //     children: (
        //         <SubviewAccess
        //             id={id}
        //             ownerId={data?.owner_id}
        //             userId={userId}
        //         />
        //     ),
        // },
    ]

    return (
        <div ref={clickRef}>
            <Drawer
                width={400}
                title={
                    data ? (
                        <div className={styles['drawer-title']}>
                            <span className={styles.icon}>
                                {ResIcon?.[data?.object_type]}
                            </span>
                            <span
                                className={styles.title}
                                title={data?.object_name}
                            >
                                {data?.object_name}
                            </span>
                        </div>
                    ) : (
                        __('权限信息')
                    )
                }
                placement="right"
                closable
                onClose={() => {
                    onClose()
                }}
                open={open}
                mask={false}
                style={{ position: 'absolute', top: '1px' }}
                className={styles['detail-wrapper']}
                footer={null}
                destroyOnClose
                getContainer={() => {
                    return (clickRef?.current as HTMLElement) || window
                }}
            >
                {loading && <Loader />}
                <div
                    className={styles['detail-wrapper-content']}
                    hidden={loading}
                >
                    {type === AssetTypeEnum.DataView ? (
                        <Tabs
                            defaultActiveKey={activeKey}
                            onChange={(k) => setActiveKey(k as AssetTypeEnum)}
                            centered
                            items={items}
                        />
                    ) : (
                        getAllPermissions()
                    )}
                </div>
            </Drawer>
        </div>
    )
}
export default AccessDetail
