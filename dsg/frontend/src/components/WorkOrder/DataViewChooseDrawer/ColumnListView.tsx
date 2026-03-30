import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { CheckOutlined } from '@ant-design/icons'
import { Checkbox } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { ResourceType, typeOptoins } from '@/components/ResourcesDir/const'
import {
    formatError,
    getCommonDataType,
    getDataCatalogMount,
    getDatasheetViewDetails,
    getInfoItems,
} from '@/core'
import { Empty, Loader, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'

interface IProps {
    // 选择对象
    selectType: 'column' | 'catlg'
    // 数据资源目录
    selectForm?: any
    // 'column'模式下，选中信息项
    checkedItems?: any[]
    // 选择/取消选择信息项
    onChangeColumn: (value?: any, isSel?: boolean) => void
}
const ColumnListView = ({
    selectType,
    selectForm,
    checkedItems,
    onChangeColumn,
}: IProps) => {
    const [currentForm, setCurrentForm] = useState<any>()
    // 目录信息项加载中
    const [infoItemsLoading, setInfoItemsLoading] = useState(false)

    const [allFields, setAllFields] = useState<Array<any>>([])

    const [searchValue, setSearchValue] = useState('')
    // 获取目录信息项
    const getDirInfoItems = async (form: any) => {
        const formId = form?.id
        if (!formId) return
        try {
            const logicViewInfo = await getDatasheetViewDetails(formId)
            setCurrentForm((prev) => {
                return {
                    ...prev,
                    fields: logicViewInfo.fields || [],
                }
            })
            setAllFields(logicViewInfo?.fields || [])
        } catch (e) {
            formatError(e)
        } finally {
            setInfoItemsLoading(false)
        }
    }

    const infoItems = useMemo(() => {
        if (!searchValue) {
            return allFields
        }
        return allFields.filter((item) => {
            return (
                item.business_name
                    ?.toLowerCase()
                    .includes(searchValue.trim().toLowerCase()) ||
                item.technical_name
                    ?.toLowerCase()
                    .includes(searchValue.trim().toLowerCase())
            )
        })
    }, [allFields, searchValue])
    const columnValueBuilder = (item: any) => ({
        ...item,
        catalog_id: currentForm?.id,
        catalog_name: currentForm?.business_name,
        tableNameEn: currentForm?.technical_name,
    })

    const { isAllChecked, isPartChecked } = useMemo(() => {
        if (selectType !== 'column' || !infoItems?.length) {
            return {
                isAllChecked: false,
                isPartChecked: false,
            }
        }
        const checkedCount = infoItems.reduce((acc, item) => {
            const isSel = checkedItems?.some((_item) => _item.id === item.id)
            return acc + (isSel ? 1 : 0)
        }, 0)
        return {
            isAllChecked: checkedCount === infoItems.length,
            isPartChecked: checkedCount > 0 && checkedCount < infoItems.length,
        }
    }, [selectType, infoItems, checkedItems])

    const handleToggleAll = (checked: boolean) => {
        if (selectType !== 'column') return
        infoItems.forEach((item) => {
            const isSel = checkedItems?.some((_item) => _item.id === item.id)
            const columnValue = columnValueBuilder(item)
            if (checked && !isSel) {
                onChangeColumn(columnValue, true)
            }
            if (!checked && isSel) {
                onChangeColumn(columnValue, false)
            }
        })
    }

    useUpdateEffect(() => {
        if (currentForm?.id) {
            getDirInfoItems(currentForm)
        }
    }, [currentForm?.id])

    useEffect(() => {
        if (selectForm) {
            setCurrentForm(selectForm)
        }
    }, [selectForm])

    return (
        <div className={styles.columnListView}>
            <div className={styles.boxTitle}>
                <span>
                    {selectType === 'column' ? __('选择字段') : __('字段预览')}
                </span>
            </div>
            {allFields.length > 0 && (
                <div className={styles.boxContent}>
                    <SearchInput
                        placeholder={__('搜索字段业务名称、技术名称')}
                        onKeyChange={(kw) => {
                            setSearchValue(kw)
                        }}
                    />
                </div>
            )}

            {selectType === 'column' && allFields.length > 0 && (
                <div className={styles.selectAllWrapper}>
                    <Checkbox
                        indeterminate={isPartChecked}
                        checked={isAllChecked}
                        disabled={!infoItems.length}
                        onChange={(e) => {
                            handleToggleAll(e.target.checked)
                        }}
                    >
                        {__('全选')}
                    </Checkbox>
                </div>
            )}
            <div className={styles.infoItemListContent}>
                {infoItemsLoading ? (
                    <Loader />
                ) : infoItems?.length > 0 ? (
                    infoItems.map((item) => {
                        let isSel = false
                        if (selectType === 'column') {
                            isSel = checkedItems?.find(
                                (_item) => _item.id === item.id,
                            )
                        }
                        return (
                            <div
                                key={item.id}
                                className={classnames(styles.fieldInfo, {
                                    [styles.canSel]: selectType === 'column',
                                    [styles.selFieldInfo]: isSel,
                                })}
                                onClick={() => {
                                    if (selectType === 'column') {
                                        onChangeColumn(
                                            columnValueBuilder(item),
                                            !isSel,
                                        )
                                    }
                                }}
                            >
                                {selectType === 'column' && (
                                    <Checkbox
                                        checked={isSel}
                                        style={{
                                            marginRight: 8,
                                        }}
                                    />
                                )}
                                <span className={styles.icon}>
                                    {getFieldTypeEelment(
                                        {
                                            type: typeOptoins.find(
                                                (_item) =>
                                                    _item.strValue ===
                                                    getCommonDataType(
                                                        item?.data_type,
                                                    ),
                                            )?.strValue,
                                        },
                                        16,
                                    )}
                                </span>
                                <div className={styles.fieldNameWrapper}>
                                    <div
                                        className={styles.top}
                                        title={item.business_name}
                                    >
                                        {item.business_name || '--'}
                                    </div>
                                    <div
                                        className={styles.bottom}
                                        title={item.technical_name}
                                    >
                                        {item.technical_name || '--'}
                                    </div>
                                </div>
                                {/* {isSel && selectType === 'column' && (
                                    <CheckOutlined
                                        style={{ color: '#59A3FF' }}
                                    />
                                )} */}
                            </div>
                        )
                    })
                ) : (
                    <Empty
                        style={{
                            marginTop: 64,
                        }}
                        iconSrc={dataEmpty}
                        desc={__('暂无数据')}
                    />
                )}
            </div>
        </div>
    )
}

export default ColumnListView
