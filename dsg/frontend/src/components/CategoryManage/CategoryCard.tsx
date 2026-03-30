import React, { useState } from 'react'
import { Popover, Tooltip, Tree } from 'antd'
import { DownOutlined, FolderFilled } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import { InfotipOutlined } from '@/icons'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import __ from './locale'
import { OperateType, StateLabel } from './helper'
import { Empty, Loader, OptionBarTool, OptionMenuType } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import InfoSystem from './InfoSystem'
import {
    CategoryType,
    ICategoryItem,
    ISystemItem,
    SystemCategory,
} from '@/core'
import GlossaryDirTree from '../BusinessDomain/GlossaryDirTree'

interface ICategoryCard {
    item: ICategoryItem
    systems: ISystemItem[]
    loading: boolean
    onOperate: (type: OperateType) => void
}

/**
 * 类目卡片
 */
const CategoryCard: React.FC<ICategoryCard> = ({
    item,
    systems,
    loading,
    onOperate,
}) => {
    // 操作项
    const getOptionMenus = () => {
        if (item.type === CategoryType.SYSTEM) {
            if (
                [
                    SystemCategory.Organization,
                    SystemCategory.SubjectDomain,
                ].includes(item.id as SystemCategory)
            ) {
                return [
                    // {
                    //     key: OperateType.JUMP,
                    //     label: __('跳转编辑'),
                    //     menuType: OptionMenuType.Menu,
                    // },
                ]
            }
            return [
                {
                    key: OperateType.STATE,
                    label: item.using ? __('停用') : __('启用'),
                    menuType: OptionMenuType.Menu,
                },
                // {
                //     key: OperateType.JUMP,
                //     label: __('跳转编辑'),
                //     menuType: OptionMenuType.Menu,
                // },
            ]
        }
        return [
            {
                key: OperateType.STATE,
                label: item.using ? __('停用') : __('启用'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.EDIT,
                label: __('编辑'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.CONFIGTREE,
                label: __('配置类目树'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
                disabled: item.using,
                title: item.using ? __('请先停用后，再进行删除操作') : '',
            },
        ]
    }

    // 详细信息
    const detailsInfo = [
        { title: __('描述'), key: 'describe' },
        { title: __('创建人/时间'), key: 'created_by', secKey: 'created_at' },
        {
            title: __('更新人/时间'),
            key: 'updated_by',
            secKey: 'updated_at',
        },
    ]

    const detailsView = (
        <div className={styles['categoryCard-details']}>
            {detailsInfo.map((info) => {
                return (
                    <div
                        className={styles['categoryCard-details-row']}
                        key={info.key}
                    >
                        <div
                            className={styles['categoryCard-details-row-title']}
                        >
                            {info.title}
                        </div>
                        <div
                            className={
                                styles['categoryCard-details-row-content']
                            }
                            style={{
                                color:
                                    info.key === 'describe' && item[info.key]
                                        ? '#000'
                                        : 'rgb(0 0 0 / 65%)',
                            }}
                        >
                            {item[info.key] ||
                                (info.key === 'describe'
                                    ? __('[暂无描述]')
                                    : '--')}
                            <div>
                                {info.secKey && formatTime(item[info.secKey])}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )

    const emptyView = (
        <Empty
            desc={
                item.type === CategoryType.SYSTEM
                    ? __('暂无数据')
                    : __('还未创建目录～')
            }
            iconSrc={dataEmpty}
        />
    )

    const folderIcon = (
        <FolderFilled
            style={{
                color: '#59A3FF',
                marginTop: '2px',
                fontSize: '16px',
            }}
        />
    )

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

    const contentView = () => {
        if (item.type === CategoryType.SYSTEM) {
            if (item.id === SystemCategory.Organization) {
                return (
                    <div className={styles['categoryCard-content-orgTree']}>
                        <ArchitectureDirTree
                            getSelectedNode={() => {}}
                            isShowSearch={false}
                            isShowAll={false}
                            filterType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                        />
                    </div>
                )
            }
            if (item.id === SystemCategory.InformationSystem) {
                return <InfoSystem systems={systems} />
            }
            if (item.id === SystemCategory.SubjectDomain) {
                return (
                    <div className={styles['categoryCard-content-sbjTree']}>
                        <GlossaryDirTree
                            isShowSearch={false}
                            isShowAll={false}
                        />
                    </div>
                )
            }
        } else if (item.tree_node && item.tree_node.length > 0) {
            return (
                <div className={styles['categoryCard-content-customTree']}>
                    <Tree
                        blockNode
                        showIcon
                        switcherIcon={<DownOutlined />}
                        treeData={updateTreeData(item.tree_node)}
                    />
                </div>
            )
        }

        return emptyView
    }

    return (
        <div className={styles.categoryCard}>
            <div
                className={styles['categoryCard-mark']}
                hidden={item.type !== CategoryType.SYSTEM}
            >
                <p className={styles['categoryCard-mark-text']}>{__('系统')}</p>
            </div>
            <div className={styles['categoryCard-top']}>
                <StateLabel state={item.using} />
                <span
                    title={item.name}
                    className={styles['categoryCard-top-name']}
                >
                    {item.name}
                </span>
                <Popover content={detailsView} placement="bottom">
                    <InfotipOutlined
                        className={styles['categoryCard-top-tip']}
                        hidden={item.type === CategoryType.SYSTEM}
                    />
                </Popover>
            </div>
            <div className={styles['categoryCard-content']}>
                {contentView()}
            </div>
            <div className={styles['categoryCard-bottom']}>
                {[
                    SystemCategory.Organization,
                    SystemCategory.SubjectDomain,
                ].includes(item.id as SystemCategory) && (
                    <span className={styles['categoryCard-bottom-tip']}>
                        {__('默认开启，无法停用')}
                    </span>
                )}
                <div className={styles['categoryCard-bottom-menu']}>
                    <OptionBarTool
                        menus={getOptionMenus()}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onOperate(key as OperateType)
                        }}
                    />
                </div>
            </div>
            {loading && (
                <div className={styles['categoryCard-load']}>
                    <Loader tip={__('正在加载类目树...')} />
                </div>
            )}
        </div>
    )
}

export default CategoryCard
