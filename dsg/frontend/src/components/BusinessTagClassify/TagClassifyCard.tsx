import React, { useEffect, useState } from 'react'
import { Space, Dropdown, Tree, Tooltip } from 'antd'
import classNames from 'classnames'
import { DownOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import __ from './locale'
import {
    detailsInfo,
    moreOpInfo,
    stateLableType,
    publishStatus,
    publishStatusList,
    unpublishedList,
    OperateType,
    isAuditingList,
    disableOpMap,
    draftTipsMap,
} from './const'
import { StateLabel } from './helper'
import { Loader } from '@/ui'
import { getState } from '../BusinessDiagnosis/helper'

interface ITagClassifyCard {
    item?: any
    loading: boolean
    showTitle?: boolean
    onOperate: (type: OperateType) => void
}

/**
 * 标签卡片
 */
const TagClassifyCard: React.FC<ITagClassifyCard> = ({
    item,
    loading,
    onOperate,
    showTitle = true,
}) => {
    const [detailsData, setDetailsData] = useState<any[]>()

    useEffect(() => {
        if (item?.name) {
            setDetailsData(
                detailsInfo.map((info) => {
                    const obj: any = {
                        ...info,
                    }
                    if (info.key === 'description') {
                        obj.value = (
                            <span
                                className={classNames(
                                    item[info.key]
                                        ? styles[
                                              'tagClassifyCard-details-row-content'
                                          ]
                                        : styles[
                                              'tagClassifyCard-details-row-title'
                                          ],
                                )}
                            >
                                {item[info.key] || __('[暂无用途描述]')}
                            </span>
                        )
                    }
                    if (info.key === 'audit_status') {
                        const showMsg =
                            item.reject_reason &&
                            [
                                publishStatus.ChangeReject,
                                publishStatus.DeleteReject,
                                publishStatus.PublishedAuditReject,
                            ].includes(item.audit_status)
                        obj.value = (
                            <Space size={8}>
                                <span>
                                    {getState(
                                        item[info.key],
                                        publishStatusList,
                                    )}
                                </span>
                                <span>
                                    {showMsg && (
                                        <Tooltip
                                            title={item.reject_reason}
                                            placement="bottom"
                                        >
                                            <FontIcon
                                                name="icon-shenheyijian"
                                                type={IconType.COLOREDICON}
                                                className={styles.icon}
                                                style={{
                                                    fontSize: 20,
                                                    marginLeft: 4,
                                                }}
                                            />
                                        </Tooltip>
                                    )}
                                </span>
                            </Space>
                        )
                    }
                    if (info.key === 'state') {
                        obj.value = (
                            <StateLabel
                                state={item[info.key]}
                                label={
                                    item.published_status ===
                                        publishStatus.Unpublished &&
                                    item.state === stateLableType.unenable
                                        ? __('未启用')
                                        : ''
                                }
                            />
                        )
                    }
                    return obj
                }),
            )
        }
    }, [item])

    const folderIcon = (
        <FontIcon
            name="icon-biaoqianicon"
            style={{
                marginTop: '2px',
                fontSize: '16px',
            }}
        />
    )

    const dropdownMenu = () => {
        return moreOpInfo
            .filter((it) =>
                it.key === OperateType.CANCEL
                    ? isAuditingList.includes(item.audit_status)
                    : true,
            )
            .map((it) => {
                const disable = disableOpMap?.[it.key]?.includes(
                    item.audit_status,
                )
                let title = ''
                switch (it.key) {
                    case OperateType.STATE:
                        title =
                            item?.state === stateLableType.enabled
                                ? __('停用')
                                : __('启用')
                        break
                    case OperateType.EDIT:
                        title = unpublishedList.includes(item.audit_status)
                            ? __('编辑')
                            : __('变更')
                        break
                    default:
                        title = it.title
                }
                return {
                    label: (
                        <Tooltip
                            key={it.key}
                            title={
                                disable
                                    ? isAuditingList.includes(item.audit_status)
                                        ? __('审核中不能做此操作')
                                        : __('未发布不能做此操作')
                                    : ''
                            }
                        >
                            <a
                                onClick={() => {
                                    if (disable) return
                                    onOperate(it.key)
                                }}
                                className={classNames(
                                    disable && styles.disabled,
                                )}
                            >
                                {title}
                            </a>
                        </Tooltip>
                    ),
                    key: it.key,
                }
            })
    }

    const updateTreeData = (list: any[]): DataNode[] =>
        list.map((node) => {
            if (node.children) {
                return {
                    ...node,
                    key: node.id,
                    title: node.name,
                    icon: folderIcon,
                    children: updateTreeData(node.children),
                }
            }
            return {
                ...node,
                key: node.id,
                title: node.name,
                icon: folderIcon,
            }
        })

    return (
        <div
            className={classNames(
                styles.tagClassifyCard,
                !showTitle && styles.hideTitle,
            )}
        >
            {showTitle && (
                <div className={styles['tagClassifyCard-top']}>
                    <div className={styles['tagClassifyCard-top-title']}>
                        <span className={styles['tagClassifyCard-top-nameBox']}>
                            <span
                                title={item?.name}
                                onClick={() => onOperate(OperateType.MORE)}
                                className={styles['tagClassifyCard-top-name']}
                            >
                                {item?.name}
                            </span>
                            {item.has_draft && (
                                <StateLabel
                                    state={
                                        item.audit_status ===
                                        publishStatus.Unpublished
                                            ? stateLableType.draft
                                            : stateLableType.hasDraft
                                    }
                                    tips={
                                        draftTipsMap[
                                            item.audit_status ===
                                            publishStatus.Unpublished
                                                ? stateLableType.draft
                                                : stateLableType.hasDraft
                                        ]
                                    }
                                />
                            )}
                        </span>
                        <Dropdown
                            menu={{
                                items: dropdownMenu(),
                            }}
                            overlayStyle={{
                                width: '160px',
                                marginLeft: '10px',
                            }}
                            placement="bottomRight"
                        >
                            <FontIcon
                                name="icon-gengduo1"
                                className={styles['tagClassifyCard-top-tip']}
                            />
                        </Dropdown>
                    </div>
                    <div className={styles['tagClassifyCard-details']}>
                        {detailsData?.map((info) => {
                            return (
                                <div
                                    className={
                                        styles['tagClassifyCard-details-row']
                                    }
                                    key={info.key}
                                >
                                    <div
                                        className={
                                            styles[
                                                'tagClassifyCard-details-row-title'
                                            ]
                                        }
                                    >
                                        {info.title}
                                    </div>
                                    <div>{info.value}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            <div className={styles['tagClassifyCard-content']}>
                <div className={styles['tagClassifyCard-content-customTree']}>
                    <Tree
                        blockNode
                        showIcon
                        switcherIcon={<DownOutlined />}
                        treeData={updateTreeData(item?.label_tree_resp || [])}
                    />
                </div>
            </div>
            {loading && (
                <div className={styles['tagClassifyCard-load']}>
                    <Loader tip={__('正在加载类目树...')} />
                </div>
            )}
        </div>
    )
}

export default TagClassifyCard
