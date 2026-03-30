import React, { memo, useCallback, useState } from 'react'
import { Drawer, List } from 'antd'
import classnames from 'classnames'
import { Empty } from '@/ui'
import styles from './styles.module.less'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import DataCatlgContent from '../DataAssetsCatlg/DataCatlgContent'
import LogicViewDetail from '../DataAssetsCatlg/LogicViewDetail'

export interface IDataCatalogItem {
    /** 目录 ID */
    id: string
    /** 目录编码 */
    code: string
    /** 目录类型 */
    type: string
    /** 目录标题 */
    title: string
    /** 目录描述 */
    description?: string
}

export interface IDataCatlgDrawerProps {
    /** 控制抽屉显示/隐藏 */
    open: boolean
    /** 抽屉位置，可选值：'left' | 'right' | 'top' | 'bottom' */
    placement?: 'left' | 'right' | 'top' | 'bottom'
    /** 数据目录列表数据 */
    data: IDataCatalogItem[]
    /** 关闭抽屉回调 */
    onClose: () => void
}

const DataCatlgDrawer: React.FC<IDataCatlgDrawerProps> = ({
    open,
    placement = 'bottom',
    data,
    onClose,
}) => {
    const [selectedCatalogItem, setSelectedCatalogItem] =
        useState<IDataCatalogItem | null>(null)

    const [dataView, setDataView] = useState<IDataCatalogItem | null>(null)

    const [openDetailDrawer, setOpenDetailDrawer] = useState(false)
    const [openDataViewDrawer, setOpenDataViewDrawer] = useState(false)
    // 处理目录项点击
    const handleItemClick = (item: IDataCatalogItem) => {
        console.log('item', item)
        if (item.type === 'datacatalog') {
            setSelectedCatalogItem(item)
            setOpenDetailDrawer(true)
        } else {
            setDataView(item)
            setOpenDataViewDrawer(true)
        }
    }

    // 计算抽屉尺寸
    const drawerSize =
        placement === 'left' || placement === 'right'
            ? { width: 442 }
            : { height: 'auto' }

    // 底部抽屉特殊样式
    const isBottom = placement === 'bottom'

    return (
        <Drawer
            open={open}
            placement={placement}
            onClose={onClose}
            title={
                <div className={styles.drawerTitle}>
                    <FontIcon
                        name="icon-wenjianjia"
                        className={styles.titleIcon}
                        type={IconType.COLOREDICON}
                    />
                    <span className={styles.titleText}>
                        {__('${length}条数据资源', { length: data.length })}
                    </span>
                </div>
            }
            {...drawerSize}
            maskClosable={false}
            destroyOnClose={false}
            getContainer={false}
            className={classnames(styles.dataCatlgDrawer, {
                [styles.bottomDrawer]: isBottom,
            })}
            headerStyle={
                isBottom
                    ? {
                          padding: '16px 20px',
                          borderBottom: '1px solid #f0f0f0',
                      }
                    : undefined
            }
            bodyStyle={{
                padding: isBottom ? '0 16px 16px' : '16px',
            }}
            style={{
                top: 52,
            }}
            mask={false}
            push={false}
        >
            {data.length === 0 ? (
                <div className={styles.emptyContainer}>
                    <Empty desc={__('暂无数据目录')} />
                </div>
            ) : (
                <List
                    className={styles.catalogList}
                    dataSource={data}
                    renderItem={(item) => {
                        const displayTitle =
                            item.title || item.code || __('未命名目录')
                        return (
                            <div
                                key={item.id}
                                className={styles.catalogItem}
                                onClick={() => handleItemClick(item)}
                            >
                                <div className={styles.itemContent}>
                                    <div className={styles.itemIcon}>
                                        <FontIcon
                                            name={
                                                item.type === 'datacatalog'
                                                    ? 'icon-shujumuluguanli1'
                                                    : 'icon-shujubiaoshitu'
                                            }
                                            className={styles.titleIcon}
                                            type={IconType.COLOREDICON}
                                        />
                                    </div>
                                    <div
                                        className={styles.itemTitle}
                                        title={displayTitle}
                                    >
                                        {displayTitle}
                                    </div>
                                </div>
                            </div>
                        )
                    }}
                />
            )}
            {openDetailDrawer && (
                <DataCatlgContent
                    open={openDetailDrawer}
                    onClose={(dataCatlgCommonInfo) => {
                        setOpenDetailDrawer(false)
                    }}
                    assetsId={selectedCatalogItem?.id}
                    hasAsst={false}
                    getContainer={false}
                />
            )}
            {openDataViewDrawer && (
                <LogicViewDetail
                    open={openDataViewDrawer}
                    onClose={() => setOpenDataViewDrawer(false)}
                    id={dataView?.id}
                    hasAsst={false}
                    getContainer={false}
                />
            )}
        </Drawer>
    )
}

export default memo(DataCatlgDrawer)
