import React, { useState, useEffect, forwardRef } from 'react'
import { Pagination } from 'antd'
import { IFormData, IQueryForms } from '@/core'
import DropDownFilter from '../DropDownFilter'
import { menus, defaultMenu, getStandradRate } from './const'
import styles from './styles.module.less'
import { Empty, SearchInput } from '@/ui'

interface IBusinessModal {
    ref: any
    total: number
    selectedForm: IFormData
    forms: IFormData[]
    searchCondition: IQueryForms
    setSearchCondition: (condition: IQueryForms) => void
    setSelectedForm: (form: IFormData) => void
}

const BusinessForm: React.FC<IBusinessModal> = forwardRef((props: any, ref) => {
    const {
        total,
        forms,
        selectedForm,
        setSelectedForm,
        searchCondition,
        setSearchCondition,
    } = props

    const [searchValue, setSearchValue] = useState('')

    // 点击模型时 向父级传递选中数据
    const handleClickModal = (item: IFormData, index: number) => {
        setSelectedForm(item)
    }

    // 输入框改变回调
    const handleSearchChange = (value: string) => {
        if (!value) {
            const params = JSON.parse(JSON.stringify(searchCondition))
            params.keyword = value
            setSearchCondition(params)
        }
        setSearchValue(value)
    }

    // 回车搜索
    const handlePressEnter = (e: any) => {
        const params = JSON.parse(JSON.stringify(searchCondition))
        params.keyword = e.target.value
        params.offset = 1
        setSearchCondition(params)
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        const params = JSON.parse(JSON.stringify(searchCondition))
        params.sort = selectedMenu.key
        params.direction = selectedMenu.sort
        setSearchCondition(params)
    }

    // 页码变化
    const handlePageChange = (page) => {
        const params = JSON.parse(JSON.stringify(searchCondition))
        params.offset = page
        setSearchCondition(params)
    }

    const getHightLightInfo = (data: string) => {
        if (searchCondition.keyword && data) {
            const index = data.indexOf(searchCondition.keyword)
            const beforeStr = data.substring(0, index)
            const afterStr = data.slice(index + searchCondition.keyword.length)
            return { index, beforeStr, afterStr }
        }
        return { index: -1 }
    }

    return (
        <div className={styles.formWrapper}>
            <div className={styles.topSide}>
                <SearchInput
                    placeholder="业务表单名称"
                    value={searchValue}
                    onKeyChange={handleSearchChange}
                    onPressEnter={handlePressEnter}
                />
                <div className={styles.titleWrapper}>
                    <span className={styles.formTitle}>业务表</span>
                    {forms.length > 0 && (
                        <DropDownFilter
                            menus={menus}
                            defaultMenu={defaultMenu}
                            menuChangeCb={handleMenuChange}
                        />
                    )}
                </div>
            </div>
            <div className={styles.formList}>
                {forms.map((item, index) => {
                    const nameInfo = getHightLightInfo(item.name)
                    return (
                        <div
                            className={`${styles.form} ${
                                selectedForm?.id === item.id &&
                                styles.selectedForm
                            }`}
                            key={item.id}
                            onClick={() => handleClickModal(item, index)}
                        >
                            <div className={styles.textWrapper}>
                                <div className={styles.name} title={item.name}>
                                    {nameInfo.index > -1 ? (
                                        <span>
                                            {nameInfo.beforeStr}
                                            <span
                                                className={
                                                    styles.hightLightText
                                                }
                                            >
                                                {searchCondition.keyword}
                                            </span>
                                            {nameInfo.afterStr}
                                        </span>
                                    ) : (
                                        <span>{item.name}</span>
                                    )}
                                </div>
                                <div className={styles.creator}>
                                    字段标准化率：&nbsp;
                                    <span>
                                        {getStandradRate(
                                            item.field_standard_rate,
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
                {forms.length === 0 && <Empty />}
                <Pagination
                    className={styles.pagination}
                    current={searchCondition.offset}
                    defaultPageSize={20}
                    total={total}
                    hideOnSinglePage
                    showSizeChanger={false}
                    onChange={handlePageChange}
                    simple
                />
            </div>
        </div>
    )
})
export default BusinessForm
