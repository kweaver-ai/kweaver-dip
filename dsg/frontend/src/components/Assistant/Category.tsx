import React, { useState, useEffect, useMemo, useRef } from 'react'
import __ from './locale'
import styles from './styles.module.less'
import {
    getWsCategoryList,
    formatError,
    IWsCategoryListData,
    IWsCategoryItem,
} from '@/core'

interface ICategoryProps {
    // 选择变化时回调，key 为中文类目，value 为选中项的 id（选中类目本身则为 null）
    onChange?: (selected: Record<string, string | null>) => void
}

const Category: React.FC<ICategoryProps> = ({ onChange }) => {
    // 助手分类列表
    const [categoryMap, setCategoryMap] = useState<IWsCategoryListData>({})
    // 选中项（存储 id）
    const [selectedIdMap, setSelectedIdMap] = useState<
        Record<string, string | null>
    >({})

    // 用于避免首次加载时多次触发 onChange 导致循环请求
    const initRef = useRef(false)

    // 获取助手分类列表
    const getCategoryList = async () => {
        try {
            const res = await getWsCategoryList()
            setCategoryMap(res?.data || {})
        } catch (error) {
            formatError(error)
        }
    }

    // 获取助手分类列表
    useEffect(() => {
        getCategoryList()
    }, [])

    // 助手分类列表
    const categoryList = useMemo(
        () =>
            Object.entries(categoryMap).map(([label, items]) => ({
                label,
                items: items as IWsCategoryItem[],
            })),
        [categoryMap],
    )

    // 检查是否有有效数据
    const hasValidData = useMemo(
        // 检查是否有有效数据：categoryList 不为空且至少有一个非空数组
        () => categoryList.some((group) => group.items.length > 0),
        [categoryList],
    )

    // 初始化选择为中文key本身（id 为 null）
    useEffect(() => {
        if (!hasValidData || initRef.current) {
            return
        }
        const defaults = categoryList.reduce<Record<string, string | null>>(
            (acc, cur) => {
                acc[cur.label] = null
                return acc
            },
            {},
        )
        setSelectedIdMap(defaults)
        onChange?.(defaults)
        initRef.current = true
    }, [categoryList, onChange, hasValidData])

    // 处理选择
    const handleSelect = (label: string, id: string | null) => {
        setSelectedIdMap((prev) => {
            const next = { ...prev, [label]: id }
            onChange?.(next)
            return next
        })
    }

    // 如果没有有效数据，不显示组件
    if (!hasValidData) {
        return null
    }

    return (
        <div className={styles.categoryWrapper}>
            {categoryList.map((group) => {
                return (
                    <div className={styles.categoryRow} key={group.label}>
                        <div className={styles.categoryOptions}>
                            <span
                                className={
                                    selectedIdMap[group.label] === null
                                        ? `${styles.categoryTag} ${styles.categoryTagSelected}`
                                        : styles.categoryTag
                                }
                                onClick={() => handleSelect(group.label, null)}
                            >
                                {group.label}
                            </span>
                            {group.items.map((item) => (
                                <span
                                    className={
                                        selectedIdMap[group.label] ===
                                        item.config_id
                                            ? `${styles.categoryTag} ${styles.categoryTagSelected}`
                                            : styles.categoryTag
                                    }
                                    key={item.config_key}
                                    onClick={() =>
                                        handleSelect(
                                            group.label,
                                            item.config_id,
                                        )
                                    }
                                >
                                    {item.config_value}
                                </span>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default Category
