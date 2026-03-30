import React, { useMemo, CSSProperties } from 'react'
import { clone } from 'lodash'
import { Tooltip, message } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { DetailsLabel } from '@/ui'
import { applyResourceMap } from '../const'
import { FontIcon } from '@/icons'
import { ResourceInvalidTag, ResourceTag } from '../helper'
import FileIcon from '@/components/FileIcon'
import { formatTime, streamToFile } from '@/utils'
import {
    ISSZDDict,
    SSZDDictTypeEnum,
    downloadSSZDDemandFile,
    formatError,
} from '@/core'
import { applyTypeOps, logOpResultMap } from './const'

interface IDetailsGroup {
    data?: any
    config: any
    style?: CSSProperties
    labelWidth?: string
    wordBreak?: boolean
    overflowEllipsis?: boolean
    gutter?: number
    // 字典信息
    dict?: ISSZDDict
}

/**
 * 单组详情
 */
const DetailsGroup = ({
    data,
    config = [],
    style = {},
    labelWidth = '108px',
    wordBreak = true,
    overflowEllipsis = false,
    gutter = 0,
    dict,
}: IDetailsGroup) => {
    // 下载附件
    const download = async () => {
        if (!data?.attachment_id) return
        try {
            const { attachment_id, attachment_name } = data
            const res = await downloadSSZDDemandFile(attachment_id)
            streamToFile(res, attachment_name)
        } catch (error) {
            formatError(error)
        }
    }

    // 适配数据与展示方式
    const adaptiveData = useMemo(() => {
        if (data) {
            return config.map((item) => {
                let newItem = clone(item)

                // 更新显示值
                const value = data?.[newItem.key]
                switch (item.key) {
                    case 'resource_type':
                        newItem = {
                            ...newItem,
                            value: applyResourceMap[value]?.text || '--',
                        }
                        break
                    case 'apply_type':
                        newItem = {
                            ...newItem,
                            value:
                                applyTypeOps.find((op) => op.value === value)
                                    ?.label || '--',
                        }
                        break
                    case 'use_scope':
                        newItem = {
                            ...newItem,
                            value:
                                (
                                    dict?.dicts?.find(
                                        (d) =>
                                            d.dict_type ===
                                            SSZDDictTypeEnum.UseScope,
                                    )?.entries || []
                                ).find((d) => d.dict_key === value)
                                    ?.dict_value || '--',
                        }
                        break
                    case 'updated_at':
                    case 'created_at':
                    case 'subscribe_at':
                    case 'op_time':
                        newItem = {
                            ...newItem,
                            value: formatTime(value) || '--',
                        }
                        break
                    default:
                        newItem.value = value || '--'
                        break
                }

                // 更新显示 view
                switch (newItem.view_type) {
                    // 复制标识
                    case 'copy':
                        newItem = {
                            ...newItem,
                            render: () => (
                                <div className={styles.detailsGroup_copy}>
                                    <div className={styles.text}>{value}</div>
                                    <Tooltip
                                        title={__('复制')}
                                        getPopupContainer={(n) => n}
                                    >
                                        <FontIcon
                                            name="icon-fuzhi"
                                            className={styles.op_icon}
                                            onClick={() => {
                                                navigator.clipboard.writeText(
                                                    `${value}`,
                                                )
                                                message.success(__('复制成功'))
                                            }}
                                        />
                                    </Tooltip>
                                </div>
                            ),
                        }
                        break

                    // 数据目录名称
                    case 'catalogTitle':
                        newItem = {
                            ...newItem,
                            render: () => (
                                <div
                                    className={styles.detailsGroup_catalogTitle}
                                >
                                    <div className={styles.text}>{value}</div>
                                    {data?.catalog_status === 0 && (
                                        <ResourceInvalidTag />
                                    )}
                                </div>
                            ),
                        }
                        break

                    // 资源类型标签
                    case 'typeTag': {
                        const type = data?.resource_type
                        newItem = {
                            ...newItem,
                            render: () => (
                                <div className={styles.detailsGroup_typeTag}>
                                    <div className={styles.text} title={value}>
                                        {value || '--'}
                                    </div>
                                    <ResourceTag
                                        data={applyResourceMap[type]}
                                    />
                                </div>
                            ),
                        }
                        break
                    }

                    // 文件下载
                    case 'download': {
                        const suffix = value?.substring(
                            value.lastIndexOf('.') + 1,
                        )
                        newItem = {
                            ...newItem,
                            render: () =>
                                value ? (
                                    <div
                                        className={styles.detailsGroup_download}
                                        onClick={() => download()}
                                    >
                                        <FileIcon suffix={suffix} />
                                        <div
                                            className={styles.text}
                                            title={value}
                                        >
                                            {value}
                                        </div>
                                        <Tooltip
                                            title={__('下载')}
                                            getPopupContainer={(n) => n}
                                        >
                                            <FontIcon
                                                name="icon-xiazai"
                                                className={styles.op_icon}
                                            />
                                        </Tooltip>
                                    </div>
                                ) : (
                                    '--'
                                ),
                        }
                        break
                    }

                    // 结果标识
                    case 'result':
                        newItem = {
                            ...newItem,
                            render: () =>
                                logOpResultMap?.[value] ? (
                                    <div
                                        className={styles.detailsGroup_result}
                                        style={{
                                            color:
                                                logOpResultMap[value].color ||
                                                'rgb(0 0 0 / 85%)',
                                        }}
                                    >
                                        {logOpResultMap[value].text}
                                    </div>
                                ) : (
                                    '--'
                                ),
                        }
                        break

                    default:
                        break
                }
                return newItem
            })
        }
        return []
    }, [data, config])

    return (
        <DetailsLabel
            wordBreak={wordBreak}
            detailsList={adaptiveData}
            labelWidth={labelWidth}
            style={style}
            overflowEllipsis={overflowEllipsis}
            gutter={gutter}
        />
    )
}

export default DetailsGroup
