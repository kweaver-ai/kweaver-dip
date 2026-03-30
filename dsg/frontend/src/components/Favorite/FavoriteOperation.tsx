import { Button, Tooltip, message } from 'antd'
import React, { Fragment } from 'react'
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
    onAddFavorite,
    onCancelFavorite,
}: IFavoriteOperation) => {
    const handleCollectionClick = async (e) => {
        e.preventDefault()
        e.stopPropagation()
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
                    className={classnames({
                        [`${iconClassName}`]: true,
                    })}
                    onClick={handleCollectionClick}
                />
            ),
        }
    }

    return (
        <Fragment key={item?.id}>
            <Tooltip title={getDisplayInfo({}).text} placement="bottom">
                {type === 'icon' ? (
                    getDisplayInfo({ iconClassName: className }).icon
                ) : (
                    <Button
                        className={classnames({
                            [`${className}`]: true,
                        })}
                        icon={getDisplayInfo({}).icon}
                        onClick={handleCollectionClick}
                    >
                        {getDisplayInfo({}).text}
                    </Button>
                )}
            </Tooltip>
        </Fragment>
    )
}

export default FavoriteOperation
