import { useDispatch, useSelector } from 'react-redux'
import {
    DownOutlined,
    StarFilled,
    StarOutlined,
    UserOutlined,
} from '@ant-design/icons'
import { message, Button, Dropdown } from 'antd'
import React, { useMemo, useState } from 'react'
import { noop } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import {
    postApplicationCatalog,
    deleteApplicationCatalog,
    OnlineStatus,
    addFavorite,
    deleteFavorite,
    formatError,
    ResType,
    LoginPlatform,
    ShareApplyResourceTypeEnum,
} from '@/core'
import actionType from '@/redux/actionType'
import { formatCatlgError } from '../helper'
import { CreateFeadback } from '@/components/DataCatalogFeedback'
import CreateFeadbackResMode from '@/components/FeedbackResMode/operate/CreateFeadback'
import { DCatlgOprType } from './const'
import { getPlatformNumber } from '@/utils'
import { IconType } from '@/icons/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { UpdateFavoriteParams } from '@/components/Favorite/FavoriteOperation'

interface IOprDropDownProps {
    catalog: any
    filterOperationList?: string[]
    resType?: ShareApplyResourceTypeEnum
    showShareApplyBtn?: boolean
    onCallback?: (oprKey: DCatlgOprType, value: any) => void
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
}

const OprDropDown: React.FC<IOprDropDownProps> = ({
    catalog = {},
    filterOperationList = [],
    showShareApplyBtn = true,
    onCallback = noop,
    resType = ShareApplyResourceTypeEnum.Catalog,
    onAddFavorite,
    onCancelFavorite,
}: IOprDropDownProps) => {
    const dispatch = useDispatch()
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )

    const { checkPermission } = useUserPermCtx()

    // 是否在共享清单中
    const isInCitySharing = useMemo(() => {
        return citySharingData?.data.find(
            (cityItem) => cityItem.res_id === catalog.id,
        )
    }, [citySharingData?.data])

    const platform = getPlatformNumber()

    // 新建反馈
    const [createVisible, setCreateVisible] = useState(false)

    const handleCreateSuccess = () => {
        setCreateVisible(false)
    }

    const handleFeedbackClick = (e) => {
        e?.domEvent?.preventDefault?.()
        e?.domEvent?.stopPropagation?.()
        setCreateVisible(true)
    }

    // 目录数据
    const catalogData = useMemo(
        () => ({
            res_code: catalog.code,
            res_id: catalog.id,
            res_description: catalog.description,
            res_name: catalog.raw_name || catalog.raw_title,
            department_path: catalog.department_path,
            is_online: [
                OnlineStatus.ONLINE,
                OnlineStatus.DOWN_AUDITING,
                OnlineStatus.DOWN_REJECT,
            ].includes(catalog.online_status),
            res_type: resType,
        }),
        [catalog],
    )

    // 申请共享点击事件
    const handleCityShareClick = async (key) => {
        switch (key) {
            case 'add':
                try {
                    await postApplicationCatalog(catalog.id, resType)
                    message.success({
                        className: styles.msgNoticeWrapper,
                        content: (
                            <div className={styles.msgContent}>
                                {__('已加入')}
                                <span
                                    className={styles.link}
                                    onClick={() => {
                                        dispatch({
                                            type: actionType.OPEN_SHARELIST,
                                            payload: {
                                                ...citySharingData,
                                                data: [
                                                    ...citySharingData.data,
                                                    catalogData,
                                                ],
                                                open: true,
                                            },
                                        })
                                    }}
                                >
                                    {__('共享申请清单')}
                                </span>
                            </div>
                        ),
                    })
                    dispatch({
                        type: actionType.CITY_SHARING,
                        payload: {
                            data: [...citySharingData.data, catalogData],
                        },
                    })
                } catch (error) {
                    formatCatlgError(error)
                }
                break
            case 'remove':
                try {
                    await deleteApplicationCatalog(catalog.id)
                    // message.success(__('移出成功'))
                    message.success({
                        className: styles.msgNoticeWrapper,
                        content: (
                            <div className={styles.msgContent}>
                                {__('已移出')}
                                <span
                                    className={styles.link}
                                    onClick={() => {
                                        dispatch({
                                            type: actionType.OPEN_SHARELIST,
                                            payload: {
                                                ...citySharingData,
                                                data: citySharingData?.data.filter(
                                                    (cityItem) =>
                                                        cityItem.res_id !==
                                                        catalog.id,
                                                ),
                                                open: true,
                                            },
                                        })
                                    }}
                                >
                                    {__('共享申请清单')}
                                </span>
                            </div>
                        ),
                    })
                    dispatch({
                        type: actionType.CITY_SHARING,
                        payload: {
                            data: citySharingData?.data.filter(
                                (cityItem) => cityItem.res_id !== catalog.id,
                            ),
                        },
                    })
                } catch (error) {
                    formatCatlgError(error)
                }
                break
            case 'apply':
                onCallback?.(DCatlgOprType.ShareApply, [catalogData])
                break
            default:
                break
        }
    }

    const handleCollectionClick = async (e) => {
        e?.domEvent?.preventDefault?.()
        e?.domEvent?.stopPropagation?.()
        try {
            if (catalog?.is_favored) {
                await deleteFavorite(catalog?.favor_id)
                message.success(__('取消收藏'))
                // onCallback?.(DCatlgOprType.Favorite, {
                //     is_favored: false,
                //     favor_id: '',
                // })
                onCancelFavorite?.({
                    is_favored: false,
                    favor_id: '',
                })
            } else {
                const res = await addFavorite({
                    res_type:
                        resType === ShareApplyResourceTypeEnum.Catalog
                            ? ResType.DataCatalog
                            : ResType.InterfaceSvc,
                    res_id: catalog.id,
                })
                message.success(__('收藏成功'))
                // onCallback?.(DCatlgOprType.Favorite, {
                //     is_favored: true,
                //     favor_id: res?.id,
                // })
                onAddFavorite?.({
                    is_favored: true,
                    favor_id: res?.id,
                })
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 获取显示文本
    const getDisplayInfo = ({ iconClassName }: { iconClassName?: string }) => {
        if (catalog?.is_favored) {
            return {
                text: __('取消收藏'),
                icon: (
                    <StarFilled
                        // className={classnames({
                        //     [`${iconClassName}`]: true,
                        // })}
                        style={{
                            color: 'rgba(250, 173, 20, 1)',
                        }}
                        onClick={handleCollectionClick}
                    />
                ),
            }
        }
        return {
            text: __('收藏'),
            icon: (
                <StarOutlined
                    // className={classnames({
                    //     [`${iconClassName}`]: true,
                    // })}
                    onClick={handleCollectionClick}
                />
            ),
        }
    }

    const getOprItems = (listItem: any) => {
        // 收藏
        const favorItem = getDisplayInfo({})

        return [
            {
                label: __('共享申请'),
                key: DCatlgOprType.ShareApply,
                icon: <FontIcon name="icon-faqigongxiangshenqing" />,
                // onClick: (e) => {
                //     e.domEvent?.preventDefault?.()
                //     e.domEvent?.stopPropagation?.()
                //     handleCityShareClick('apply')
                // },
                isShow:
                    catalog.is_online &&
                    platform === LoginPlatform.drmp &&
                    showShareApplyBtn &&
                    hasShareApply &&
                    !filterOperationList?.includes(DCatlgOprType.ShareApply),
            },
            {
                label: isInCitySharing
                    ? __('移出共享清单')
                    : __('加入共享清单'),
                key: DCatlgOprType.AddShareList,
                icon: (
                    <FontIcon
                        name={
                            isInCitySharing
                                ? 'icon-gouwuche2'
                                : 'icon-gouwuche1'
                        }
                        type={
                            isInCitySharing
                                ? IconType.COLOREDICON
                                : IconType.FONTICON
                        }
                        className={
                            isInCitySharing ? styles.isInCitySharing : ''
                        }
                    />
                ),
                // onClick: (e) => {
                //     e?.domEvent?.preventDefault?.()
                //     e?.domEvent?.stopPropagation?.()
                //     handleCityShareClick(isInCitySharing ? 'remove' : 'add')
                // },
                isShow:
                    catalog.is_online &&
                    platform === LoginPlatform.drmp &&
                    showShareApplyBtn &&
                    hasShareApply &&
                    !filterOperationList?.includes(DCatlgOprType.AddShareList),
            },
            {
                label: favorItem.text,
                key: DCatlgOprType.Favorite,
                icon: favorItem.icon,
                // onClick: handleCollectionClick,
                isShow:
                    catalog.is_online &&
                    !filterOperationList?.includes(DCatlgOprType.Favorite),
            },
            {
                label: __('反馈'),
                key: DCatlgOprType.Feedback,
                icon: <FontIcon name="icon-fankui" />,
                // onClick: handleFeedbackClick,
                isShow:
                    catalog.is_online &&
                    !filterOperationList?.includes(DCatlgOprType.Feedback),
            },
        ].filter((item) => item.isShow)
    }

    const hasShareApply = useMemo(() => {
        return checkPermission('initiateSharedApplication') ?? false
    }, [checkPermission])

    const optItems = useMemo(() => {
        return getOprItems(catalog)
    }, [catalog, isInCitySharing, hasShareApply])

    const handleMenuClick = (e) => {
        switch (e.key) {
            case DCatlgOprType.ShareApply:
                handleCityShareClick('apply')
                break
            case DCatlgOprType.AddShareList:
                handleCityShareClick?.(isInCitySharing ? 'remove' : 'add')
                break
            case DCatlgOprType.Feedback:
                handleFeedbackClick(e)
                break
            case DCatlgOprType.Favorite:
                handleCollectionClick(e)
                break
            default:
                break
        }
    }

    return optItems?.length ? (
        <>
            <Dropdown
                menu={{ items: optItems, onClick: handleMenuClick }}
                placement="bottom"
                arrow={{ pointAtCenter: true }}
            >
                <Button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    {__('操作')}
                    <DownOutlined />
                </Button>
            </Dropdown>
            {createVisible &&
                (resType === ShareApplyResourceTypeEnum.Catalog ? (
                    <CreateFeadback
                        open={createVisible}
                        item={catalog}
                        onCreateClose={() => setCreateVisible(false)}
                        onCreateSuccess={handleCreateSuccess}
                    />
                ) : (
                    <CreateFeadbackResMode
                        open={createVisible}
                        item={catalog}
                        resType={ResType.InterfaceSvc}
                        onCreateClose={() => setCreateVisible(false)}
                        onCreateSuccess={handleCreateSuccess}
                    />
                ))}
        </>
    ) : undefined
}

export default OprDropDown
