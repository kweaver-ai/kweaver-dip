import { Badge, Button, Space, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { CloseOutlined, StandardOutlined } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { standardFields } from './const'
import {
    LoginEntityAttribute,
    StandardInfo,
    formsQueryStandardItem,
} from '@/core'

interface IStandardDetails {
    attribute: LoginEntityAttribute
    updateAttribute: (val: string | LoginEntityAttribute) => void
    isDetails?: boolean
}
const StandardDetails: React.FC<IStandardDetails> = ({
    attribute,
    updateAttribute,
    isDetails = false,
}) => {
    const [open, setOpen] = useState(false)

    // 不同的标准展示红点，打开弹窗后红点消失
    const [isShownBadge, setIsShownBadge] = useState(false)

    const isShowBadge = useMemo(() => {
        if (
            attribute.field_standard_info?.id &&
            attribute.standard_info?.id !== attribute.field_standard_info.id
        )
            return true
        return false
    }, [attribute.field_standard_info, attribute.standard_info])

    // 获取字段标准的信息
    const getFieldStandardInfo = async () => {
        const res = await formsQueryStandardItem({
            id: attribute.field_standard_info?.id,
        })
        updateAttribute({ ...attribute, field_standard_info: res })
    }

    useEffect(() => {
        if (!open) return
        if (!attribute.field_standard_info?.id) return
        getFieldStandardInfo()
    }, [open])

    const handleCancelStandard = () => {
        updateAttribute({ ...attribute, standard_id: '' })
    }

    // 1.当前标准未使用 2.属性是唯一标识 3.当前标准类型不满足唯一标识的要求  禁用
    const getDisabledStatus = (standardInfo: StandardInfo) => {
        return (
            attribute.standard_id !== standardInfo.id &&
            attribute.unique &&
            !['char', 'number'].includes(standardInfo.data_type)
        )
    }

    return (
        <Tooltip
            open={open}
            // autoAdjustOverflow={false}
            color="white"
            overlayClassName={styles.standardToolTip}
            title={
                <div className={styles.standardDetailsWrapper}>
                    <div className={styles.titles}>
                        {__('标准数据元详情')}
                        <CloseOutlined
                            className={styles.closeIcon}
                            onClick={() => {
                                setOpen(false)
                                if (isShowBadge) {
                                    setIsShownBadge(true)
                                }
                            }}
                        />
                    </div>
                    <Space className={styles.detailsWrapper} size={16}>
                        {attribute.standard_info?.id && (
                            <div
                                className={classnames(
                                    styles['details-info'],
                                    attribute.standard_id !==
                                        attribute.standard_info.id &&
                                        styles['unuse-details-info'],
                                )}
                            >
                                <div
                                    className={classnames(
                                        styles.radius,
                                        attribute.standard_id !==
                                            attribute.standard_info.id &&
                                            styles['unuse-radius'],
                                    )}
                                />
                                <Tooltip
                                    title={
                                        getDisabledStatus(
                                            attribute.standard_info,
                                        )
                                            ? __(
                                                  '属性已设置唯一标识，不能关联非数字型和字符型的标准',
                                              )
                                            : ''
                                    }
                                >
                                    <div
                                        className={classnames(
                                            styles.box,
                                            attribute.standard_id !==
                                                attribute.standard_info.id &&
                                                styles['unuse-box'],
                                        )}
                                        onClick={() => {
                                            if (
                                                getDisabledStatus(
                                                    attribute.standard_info as StandardInfo,
                                                ) ||
                                                isDetails
                                            )
                                                return
                                            const labelInfo = attribute
                                                .standard_info?.label_id
                                                ? {
                                                      label_id:
                                                          attribute
                                                              .standard_info
                                                              .label_id,
                                                      label_name:
                                                          attribute
                                                              .standard_info
                                                              .label_name,
                                                      label_icon:
                                                          attribute
                                                              .standard_info
                                                              .label_icon,
                                                      label_path:
                                                          attribute
                                                              .standard_info
                                                              .label_path,
                                                  }
                                                : {}
                                            updateAttribute({
                                                ...attribute,
                                                standard_id:
                                                    attribute.standard_info?.id,
                                                ...labelInfo,
                                            })
                                        }}
                                    >
                                        <p
                                            className={classnames(
                                                styles['status-text'],
                                                attribute.standard_id !==
                                                    attribute.standard_info
                                                        .id &&
                                                    styles['unuse-status-text'],

                                                getDisabledStatus(
                                                    attribute.standard_info,
                                                ) && styles['disabled-status'],
                                            )}
                                        >
                                            {attribute.standard_id ===
                                            attribute.standard_info.id
                                                ? __('使用中')
                                                : __('使用')}
                                        </p>
                                    </div>
                                </Tooltip>

                                <div className={styles['detail-title']}>
                                    {attribute.standard_info.is_field_standard
                                        ? __('使用业务表中配置的标准')
                                        : __('使用主题域中配置的标准')}
                                </div>

                                {standardFields.map((standard) => (
                                    <div
                                        className={styles.fieldItem}
                                        key={standard.key}
                                    >
                                        <div className={styles.label}>
                                            {standard.label}
                                        </div>
                                        <div
                                            className={styles.value}
                                            title={
                                                attribute.standard_info?.[
                                                    standard.key
                                                ]
                                            }
                                        >
                                            {
                                                attribute.standard_info?.[
                                                    standard.key
                                                ]
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {attribute.field_standard_info?.id &&
                            attribute.field_standard_info?.id !==
                                attribute.standard_info?.id && (
                                <div
                                    className={classnames(
                                        styles['details-info'],
                                        attribute.standard_id !==
                                            attribute.field_standard_info.id &&
                                            styles['unuse-details-info'],
                                    )}
                                >
                                    <div
                                        className={classnames(
                                            styles.radius,
                                            attribute.standard_id !==
                                                attribute.field_standard_info
                                                    .id &&
                                                styles['unuse-radius'],
                                        )}
                                    />
                                    <Tooltip
                                        title={
                                            getDisabledStatus(
                                                attribute.field_standard_info as StandardInfo,
                                            )
                                                ? __(
                                                      '属性已设置唯一标识，不能关联非数字型和字符型的标准',
                                                  )
                                                : ''
                                        }
                                    >
                                        <div
                                            className={classnames(
                                                styles.box,
                                                attribute.standard_id !==
                                                    attribute
                                                        .field_standard_info
                                                        .id &&
                                                    styles['unuse-box'],
                                            )}
                                            onClick={() => {
                                                if (
                                                    getDisabledStatus(
                                                        attribute.field_standard_info as StandardInfo,
                                                    ) ||
                                                    isDetails
                                                )
                                                    return
                                                // 点击使用则会使用标准中的标签
                                                const labelInfo = attribute
                                                    .field_standard_info
                                                    ?.label_id
                                                    ? {
                                                          label_id:
                                                              attribute
                                                                  .field_standard_info
                                                                  .label_id,
                                                          label_name:
                                                              attribute
                                                                  .field_standard_info
                                                                  .label_name,
                                                          label_icon:
                                                              attribute
                                                                  .field_standard_info
                                                                  .label_icon,
                                                          label_path:
                                                              attribute
                                                                  .field_standard_info
                                                                  .label_path,
                                                      }
                                                    : {}
                                                updateAttribute({
                                                    ...attribute,
                                                    standard_id:
                                                        attribute
                                                            .field_standard_info
                                                            ?.id,
                                                    ...labelInfo,
                                                })
                                            }}
                                        >
                                            <p
                                                className={classnames(
                                                    styles['status-text'],
                                                    attribute.standard_id !==
                                                        attribute
                                                            .field_standard_info
                                                            .id &&
                                                        styles[
                                                            'unuse-status-text'
                                                        ],
                                                    getDisabledStatus(
                                                        attribute.field_standard_info as StandardInfo,
                                                    ) &&
                                                        styles[
                                                            'disabled-status'
                                                        ],
                                                )}
                                            >
                                                {attribute.standard_id ===
                                                attribute.field_standard_info.id
                                                    ? __('使用中')
                                                    : __('使用')}
                                            </p>
                                        </div>
                                    </Tooltip>
                                    {!isShownBadge && (
                                        <div className={styles['new-flag']}>
                                            {__('新可用标准')}
                                        </div>
                                    )}

                                    <div className={styles['detail-title']}>
                                        {__('使用业务表中配置的标准')}
                                    </div>
                                    {standardFields.map((standard) => (
                                        <div
                                            className={styles.fieldItem}
                                            key={standard.key}
                                        >
                                            <div className={styles.label}>
                                                {standard.label}
                                            </div>
                                            <div
                                                className={styles.value}
                                                title={
                                                    attribute
                                                        ?.field_standard_info?.[
                                                        standard.key
                                                    ]
                                                }
                                            >
                                                {
                                                    attribute
                                                        ?.field_standard_info?.[
                                                        standard.key
                                                    ]
                                                }
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </Space>

                    {/* 只有一个标准且为字段带过来的标准时才展示该按钮 */}
                    {(!attribute.standard_info?.id &&
                        attribute.field_standard_info?.id) ||
                        (attribute.standard_info?.id &&
                            attribute.standard_info?.is_field_standard &&
                            !attribute.field_standard_info?.id && (
                                <Button
                                    className={styles.cancelBtn}
                                    disabled={!attribute.standard_id}
                                    onClick={handleCancelStandard}
                                >
                                    {__('取消关联标准')}
                                </Button>
                            ))}
                </div>
            }
            getPopupContainer={(node) => node.parentElement as HTMLElement}
            placement="topLeft"
        >
            <Tooltip title={__('标准详情')} placement="bottom">
                <div
                    className={styles.standardIconContainer}
                    onClick={(e) => {
                        e.stopPropagation()
                        setOpen(true)
                    }}
                >
                    {(attribute.standard_info?.id ||
                        attribute.field_standard_info?.id) && (
                        <div
                            className={classnames(
                                styles['standard-icon-container'],
                                !attribute.standard_id &&
                                    styles['standard-icon-container-disabled'],
                            )}
                        >
                            <Badge dot={isShowBadge && !isShownBadge}>
                                <StandardOutlined
                                    className={classnames(
                                        styles['standard-icon'],
                                        !attribute.standard_id &&
                                            styles['standard-icon-disabled'],
                                    )}
                                />
                            </Badge>
                        </div>
                    )}
                </div>
            </Tooltip>
        </Tooltip>
    )
}

export default StandardDetails
