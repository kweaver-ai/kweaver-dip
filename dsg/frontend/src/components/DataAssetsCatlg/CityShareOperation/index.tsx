import { Badge, Button, message, Space, Tooltip } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import React, { useMemo } from 'react'
import classnames from 'classnames'
import { CheckCircleFilled } from '@ant-design/icons'
import { formatCatlgError } from '../helper'
import __ from './locale'
import actionType from '@/redux/actionType'
import { FontIcon } from '@/icons'
import {
    deleteApplicationCatalog,
    OnlineStatus,
    postApplicationCatalog,
    ShareApplyResourceTypeEnum,
} from '@/core'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface ICityShareOperation {
    catalog: any // 数据目录
    type?: 'icon' | 'button' // 功能是否以按钮形式显示
    className?: string
    disabledClassName?: string
    showClassName?: string
    isMarketCard?: boolean
    offset?: [number, number]
    onApply?: (value) => void
}

/**
 * 申请共享操作
 */
const CityShareOperation = ({
    catalog,
    type = 'icon',
    className,
    disabledClassName,
    showClassName,
    isMarketCard = false,
    offset = [0, 0],
    onApply,
}: ICityShareOperation) => {
    const dispatch = useDispatch()
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )

    const { checkPermission } = useUserPermCtx()

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
            // api_type:  "service_register"
            res_type:
                catalog.type === 'interface_svc'
                    ? ShareApplyResourceTypeEnum.Api
                    : ShareApplyResourceTypeEnum.Catalog,
        }),
        [catalog],
    )

    // 申请共享点击事件
    const handleCityShareClick = async (key) => {
        switch (key) {
            case 'add':
                try {
                    await postApplicationCatalog(
                        catalog.id,
                        catalog.type === 'interface_svc'
                            ? ShareApplyResourceTypeEnum.Api
                            : ShareApplyResourceTypeEnum.Catalog,
                    )
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
                onApply?.([catalogData])
                break
            default:
                break
        }
    }

    // 是否在共享清单中
    const isInCitySharing = useMemo(() => {
        return citySharingData?.data.find(
            (cityItem) => cityItem.res_id === catalog.id,
        )
    }, [citySharingData?.data, catalog])

    return checkPermission('initiateSharedApplication') ? (
        type === 'icon' ? (
            <Space size={isMarketCard ? 10 : 2}>
                <Tooltip
                    title={
                        isInCitySharing
                            ? __('移出待共享申请清单')
                            : __('添加到待共享申请清单')
                    }
                    placement="bottom"
                >
                    <Badge
                        count={
                            isInCitySharing ? (
                                <CheckCircleFilled
                                    style={{
                                        color: '#52c41b',
                                        fontSize: 8,
                                    }}
                                />
                            ) : (
                                0
                            )
                        }
                        className={showClassName}
                        offset={offset}
                    >
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
                            className={classnames({
                                [styles.oprIcon]: true,
                                [`${className}`]: true,
                                [styles.isInCitySharing]: isInCitySharing,
                            })}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // if (isApply) {
                                //     return
                                // }
                                handleCityShareClick(
                                    isInCitySharing ? 'remove' : 'add',
                                )
                            }}
                        />
                    </Badge>
                </Tooltip>
                <Tooltip title={__('发起共享申请')} placement="bottom">
                    <FontIcon
                        name="icon-faqigongxiangshenqing"
                        className={classnames({
                            [styles.oprIcon]: true,
                            [`${className}`]: true,
                        })}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleCityShareClick('apply')
                        }}
                    />
                </Tooltip>
            </Space>
        ) : (
            <Space size={10}>
                <Button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCityShareClick(isInCitySharing ? 'remove' : 'add')
                    }}
                    className={styles.oprBtn}
                >
                    <Tooltip
                        title={
                            isInCitySharing
                                ? __('移出共享清单')
                                : __('加入共享清单')
                        }
                        placement="bottom"
                    >
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
                            className={classnames({
                                [`${className}`]: true,
                                [styles.isInCitySharing]: isInCitySharing,
                            })}
                            style={{
                                display: 'inline-flex',
                            }}
                        />
                    </Tooltip>
                    <span>
                        {isInCitySharing
                            ? __('移出共享清单')
                            : __('加入共享清单')}
                    </span>
                </Button>

                <Button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCityShareClick('apply')
                    }}
                    type="primary"
                    className={styles.oprBtn}
                >
                    <Tooltip title={__('共享申请')} placement="bottom">
                        <FontIcon
                            name="icon-faqigongxiangshenqing"
                            className={classnames({
                                [`${className}`]: true,
                            })}
                        />
                    </Tooltip>
                    <span>{__('共享申请')}</span>
                </Button>
            </Space>
        )
    ) : (
        ''
    )
}

export default CityShareOperation
