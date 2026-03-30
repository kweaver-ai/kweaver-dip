import React, { useEffect, useState } from 'react'
import styles from '../styles.module.less'
import __ from '../locale'
import Item, { IField } from './Item'
import { IForm } from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import PageTurning from './PageTurning'

interface IStandard {
    forms?: IForm[]
    modelId: string
    onChecked: () => void
    onReselect: () => void
}

interface IAllData {
    business_form_id: string
    business_form_name: string
    field: IField
}

const defaultShowItems = 10

const Standard: React.FC<IStandard> = ({
    forms,
    modelId,
    onChecked,
    onReselect,
}) => {
    const [allData, setAllData] = useState<IAllData[]>()
    const [pageInfo, setPageInfo] = useState({ showItems: 0, totalItems: 0 })

    useEffect(() => {
        setAllData(transformData())
    }, [])

    const transformData = () => {
        return forms?.reduce((preForm: IAllData[], curForm: IForm) => {
            const {
                business_form_id,
                business_form_name,
                fields_check_result,
            } = curForm
            const res = fields_check_result.map((field) => {
                return {
                    business_form_id,
                    business_form_name,
                    field,
                }
            })
            return [...preForm, ...res]
        }, [])
    }

    useEffect(() => {
        let totalItems = 0
        forms?.forEach((form) => {
            totalItems += form?.fields_check_result?.length || 0
        })
        setPageInfo({
            showItems:
                totalItems > defaultShowItems ? defaultShowItems : totalItems,
            totalItems,
        })
    }, [])

    const refreshData = (field, hide) => {
        return allData?.map((item) => {
            if (item?.field?.field_id === field?.field_id) {
                return {
                    ...item,
                    field: {
                        ...item?.field,
                        hide,
                    },
                }
            }
            return item
        })
    }

    const handleChecked = (field) => {
        // 找到操作过一致性状态的项，并把他标记为隐藏
        const newData = refreshData(field, true)
        setAllData(newData)
        if (onChecked) {
            onChecked()
        }
    }

    const handleReselect = (field) => {
        // 找到还原一致性状态的项，并把他标记为显示
        const newData = refreshData(field, false)
        setAllData(newData)
        if (onReselect) {
            onReselect()
        }
    }

    const handleShowMore = () => {
        const { showItems, totalItems } = pageInfo

        setPageInfo({
            ...pageInfo,
            showItems:
                showItems +
                (totalItems - showItems < defaultShowItems
                    ? totalItems - showItems
                    : defaultShowItems),
        })
    }

    const handleShowLess = () => {
        setPageInfo({
            ...pageInfo,
            showItems: 0,
        })
    }

    return (
        <div id="components-anchor-standard" className={styles.standardWrapper}>
            <div className={styles.standardTitle}>{__('标准检测结果')}</div>
            {allData?.length === 0 ? (
                <div className={styles.resultEmpty}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('未检测到字段标准不一致')}
                    />
                </div>
            ) : (
                allData
                    ?.slice(0, pageInfo?.showItems)
                    .map(
                        (
                            { business_form_id, business_form_name, field },
                            index,
                        ) => {
                            return (
                                <Item
                                    key={index}
                                    modelId={modelId}
                                    formId={business_form_id}
                                    formName={business_form_name}
                                    field={field}
                                    onChecked={() => handleChecked(field)}
                                    onReselect={() => handleReselect(field)}
                                />
                            )
                        },
                    )
            )}
            <PageTurning
                pageInfo={pageInfo}
                defaultShowItems={defaultShowItems}
                onShowLess={handleShowLess}
                onShowMore={handleShowMore}
            />
        </div>
    )
}

export default Standard
