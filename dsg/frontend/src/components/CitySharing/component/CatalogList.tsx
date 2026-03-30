import React, { useEffect, useState } from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { Tooltip } from 'antd'
import { useUpdateEffect } from 'ahooks'
import styles from './styles.module.less'
import __ from '../locale'
import { AppDataContentColored, FontIcon } from '@/icons'
import { SearchInput } from '@/ui'
import { IconType } from '@/icons/const'
import { ResTypeEnum } from '../helper'

enum CatalogItemType {
    NORMAL = 'normal',
    ORIGINAL = 'original',
    REPLACE = 'replace',
    NEW = 'new',
}
interface CatalogListProps {
    items?: any[] // 目录列表
    onItemClick?: (item: any, isReplace?: boolean) => void // 点击目录
    selectedCatalog?: any // 选中目录
    style?: React.CSSProperties
}

/**
 * 目录列表
 */
const CatalogList: React.FC<CatalogListProps> = ({
    items = [],
    onItemClick,
    selectedCatalog = undefined,
    style,
}) => {
    const [keyword, setKeyword] = useState('')
    const [showItems, setShowItems] = useState(items)

    useEffect(() => {
        setShowItems(items)
    }, [items])

    useUpdateEffect(() => {
        setShowItems(
            items.filter(
                (item) =>
                    item.res_name.includes(keyword) ||
                    item.res_code.includes(keyword),
            ),
        )
    }, [keyword])

    const getCatalogItem = (
        item,
        type: CatalogItemType = CatalogItemType.NORMAL,
    ) => {
        const isSelected = selectedCatalog?.res_id === item.res_id
        return (
            <div
                key={item.res_id}
                className={classnames(styles.catalogItem, {
                    [styles.checked]: isSelected,
                    [styles.originItem]: type === CatalogItemType.ORIGINAL,
                    [styles.replaceItem]: type === CatalogItemType.REPLACE,
                    [styles.checkedOriginItem]:
                        type === CatalogItemType.ORIGINAL && isSelected,
                    [styles.checkedReplaceItem]:
                        type === CatalogItemType.REPLACE && isSelected,
                })}
                onClick={() =>
                    onItemClick?.(item, type === CatalogItemType.REPLACE)
                }
            >
                <div className={styles.catalogItem_content}>
                    {/* <AppDataContentColored className={styles.catalogIcon} /> */}
                    <FontIcon
                        name={
                            item.res_type === ResTypeEnum.Catalog
                                ? 'icon-shujumuluguanli1'
                                : 'icon-jiekoufuwuguanli'
                        }
                        className={styles.catalogIcon}
                        type={IconType.COLOREDICON}
                        // style={{ fontSize: 20 }}
                    />
                    <div className={styles.catalogNameWrap}>
                        <span className={styles.catalogName}>
                            <span className={styles.name} title={item.res_name}>
                                {item.res_name}
                            </span>
                            {item.configFinish && (
                                <Tooltip
                                    title={__('资源配置已完成')}
                                    placement="bottom"
                                >
                                    <CheckCircleFilled
                                        className={styles.finishedIcon}
                                    />
                                </Tooltip>
                            )}
                            {type === CatalogItemType.ORIGINAL && (
                                <FontIcon
                                    name="icon-yuan"
                                    type={IconType.COLOREDICON}
                                    className={styles.originalFlag}
                                />
                            )}
                            {type === CatalogItemType.REPLACE && (
                                <FontIcon
                                    name="icon-ti"
                                    type={IconType.COLOREDICON}
                                    className={styles.replaceFlag}
                                />
                            )}
                            {type === CatalogItemType.NORMAL &&
                                item.new_res_id && (
                                    <FontIcon
                                        name="icon-new"
                                        type={IconType.COLOREDICON}
                                        className={styles.newCatalogIcon}
                                    />
                                )}
                        </span>
                        <span
                            className={styles.catalogCode}
                            title={item.res_code}
                        >
                            {item.res_code}
                        </span>
                    </div>
                </div>
                {type === CatalogItemType.REPLACE && (
                    <>
                        <div className={styles.replaceItemConnector}>
                            <div className={styles.replaceItemLine}>
                                <div className={styles.replaceItemBall} />
                            </div>
                        </div>
                        <div className={styles.replaceItemText}>
                            {__('替换')}
                        </div>
                        <FontIcon
                            name="icon-heli1"
                            type={IconType.FONTICON}
                            className={styles.unreasonableIcon}
                        />
                    </>
                )}
                {type === CatalogItemType.ORIGINAL && (
                    <FontIcon
                        name="icon-buheli1"
                        type={IconType.FONTICON}
                        className={styles.reasonableIcon}
                    />
                )}
            </div>
        )
    }

    return (
        <div className={styles.catalogList} style={style}>
            <SearchInput
                onKeyChange={(val) => setKeyword(val)}
                placeholder={__('搜索资源名称、资源编码')}
                style={{ marginBottom: 16 }}
            />
            {showItems.map((item) => (
                <React.Fragment key={item.res_id}>
                    {getCatalogItem(
                        item,
                        item.replace_res
                            ? CatalogItemType.ORIGINAL
                            : CatalogItemType.NORMAL,
                    )}
                    {item.replace_res &&
                        getCatalogItem(
                            item.replace_res,
                            CatalogItemType.REPLACE,
                        )}
                </React.Fragment>
            ))}
        </div>
    )
}

export default CatalogList
