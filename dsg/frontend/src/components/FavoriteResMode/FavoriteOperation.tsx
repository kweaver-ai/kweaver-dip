import { Button, Tooltip, message } from 'antd'
import React, { Fragment, useMemo, useState } from 'react'
import { StarOutlined, StarFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { addFavorite, deleteFavorite, ResType, formatError } from '@/core'
import __ from './locale'

export interface UpdateFavoriteParams {
    // 是否收藏
    is_favored: boolean
    // 收藏id
    favor_id: string
}

interface IFavoriteOperation {
    // 类型
    type?: 'icon' | 'button'
    // 收藏资源数据
    item: any
    // 收藏资源类型
    resType: ResType
    // 样式
    className?: string
    // 是否禁用
    disabled?: boolean
    // 禁用提示
    disabledTooltip?: string
    // 添加收藏回调
    onAddFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
    // 取消收藏回调
    onCancelFavorite?: ({ is_favored, favor_id }: UpdateFavoriteParams) => void
}

/**
 * 收藏、取消收藏操作
 */
const FavoriteOperation = ({
    type = 'icon',
    item,
    resType,
    className,
    disabled,
    disabledTooltip,
    onAddFavorite,
    onCancelFavorite,
}: IFavoriteOperation) => {
    // 请求执行状态
    const [isLoading, setIsLoading] = useState(false)

    // 加载中或禁用按钮不可点击
    const notAllowed = useMemo(() => {
        return disabled || isLoading
    }, [disabled, isLoading])

    const handleCollectionClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()

        // 如果正在请求中，直接返回
        if (isLoading) return

        setIsLoading(true)
        try {
            if (item?.is_favored) {
                await deleteFavorite(item?.favor_id)
                message.success(__('取消收藏'))
                onCancelFavorite?.({
                    is_favored: false,
                    favor_id: '',
                })
            } else {
                const res = await addFavorite({
                    res_type: resType,
                    res_id: item.id,
                })
                message.success(__('收藏成功'))
                onAddFavorite?.({
                    is_favored: true,
                    favor_id: res?.id,
                })
            }
        } catch (error) {
            formatError(error)
        } finally {
            setIsLoading(false)
        }
    }

    // 获取显示文本
    const getDisplayInfo = ({ iconClassName }: { iconClassName?: string }) => {
        if (item?.is_favored) {
            return {
                text: __('取消收藏'),
                icon: (
                    <StarFilled
                        className={classnames({
                            [`${iconClassName}`]: true,
                        })}
                        style={{
                            color: notAllowed
                                ? 'rgba(0, 0, 0, 0.25)'
                                : 'rgba(250, 173, 20, 1)',
                            cursor: notAllowed ? 'not-allowed' : 'pointer',
                        }}
                        disabled={notAllowed}
                        onClick={notAllowed ? undefined : handleCollectionClick}
                    />
                ),
            }
        }
        return {
            text: __('收藏'),
            icon: (
                <StarOutlined
                    className={classnames({
                        [`${iconClassName}`]: true,
                    })}
                    style={{
                        color: notAllowed ? 'rgba(0, 0, 0, 0.25)' : undefined,
                        cursor: notAllowed ? 'not-allowed' : 'pointer',
                    }}
                    disabled={notAllowed}
                    onClick={notAllowed ? undefined : handleCollectionClick}
                />
            ),
        }
    }

    return (
        <Fragment key={item?.id}>
            <Tooltip
                title={disabled ? disabledTooltip : getDisplayInfo({}).text}
                placement="bottom"
            >
                {type === 'icon' ? (
                    getDisplayInfo({ iconClassName: className }).icon
                ) : (
                    <Button
                        className={classnames({
                            [`${className}`]: true,
                        })}
                        icon={getDisplayInfo({}).icon}
                        onClick={handleCollectionClick}
                        disabled={notAllowed}
                        loading={isLoading}
                    >
                        {getDisplayInfo({}).text}
                    </Button>
                )}
            </Tooltip>
        </Fragment>
    )
}

export default FavoriteOperation
