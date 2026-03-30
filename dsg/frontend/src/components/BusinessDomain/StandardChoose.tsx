import React, { useEffect, useRef, useState } from 'react'
import { AutoComplete, Input, Modal, Spin } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDebounceFn } from 'ahooks'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { StandardLabel } from '../Forms/helper'
import {
    IFormEnumConfigModel,
    formatError,
    formsEnumConfig,
    formsQueryStandardItem,
    formsQueryStandards,
} from '@/core'
import __ from './locale'
import { standardFields } from './const'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'

interface IStandardChoose {
    open: boolean
    onClose: () => void
    onOk: (data) => void
    isUnique?: boolean
}
const StandardChoose: React.FC<IStandardChoose> = ({
    open,
    onClose,
    onOk,
    isUnique,
}) => {
    // 标准集
    const [standards, setStandards] = useState<any[] | undefined>(undefined)
    const [config, setConfig] = useState<IFormEnumConfigModel>()
    // loading
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const searchRef = useRef<boolean>(false)
    // 搜索值
    const [search, setSearch] = useState('')

    // 搜索选中值
    const [searchSel, setSearchSel] = useState<any>()
    const [details, setDetails] = useState<any>()

    useEffect(() => {
        if (!open) {
            setDetails(undefined)
            setSearch('')
        } else {
            getEnumConfig()
        }
    }, [open])

    // 获取配置信息
    const getEnumConfig = async () => {
        try {
            const res = await formsEnumConfig()
            setConfig(res)
        } catch (e) {
            formatError(e)
        }
    }

    // 搜索标准
    const handleSearch = async (value) => {
        if (typeof value !== 'string' || !value?.length) return
        try {
            setFetching(true)
            const res = await formsQueryStandards({
                keyword: value,
                limit: 1000,
            })
            if (!value || value === '') {
                setStandards(undefined)
            } else {
                setStandards(res || [])
            }
        } catch (error) {
            setStandards([])
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 搜索防抖
    const { run } = useDebounceFn(handleSearch, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    const handleCompositionStart = () => {
        searchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        searchRef.current = false
        // webkit：compositionstart onChange compositionend
        // firefox：compositionstart compositionend onChange
        if (navigator.userAgent.indexOf('WebKit') > -1) {
            handleSearch(e)
        }
    }

    const handleSelected = async (value) => {
        if (isUnique) {
            const res = standards?.find((s) => s.id === value)
            if (!['char', 'number'].includes(res.data_type)) {
                return
            }
        }
        try {
            setLoading(true)
            const res = await formsQueryStandardItem({ id: value })
            if (res) {
                setDetails(res)
            }
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            width={640}
            bodyStyle={{ height: 299 }}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            onOk={() => onOk(details)}
            okButtonProps={{ disabled: !details }}
            destroyOnClose
            title="选择标准数据元"
        >
            <div className={styles.chooseStandardWrapper}>
                <AutoComplete
                    className={styles.searchInput}
                    options={standards?.map((s) => ({
                        label: (
                            <StandardLabel
                                name={s.name}
                                nameEn={s.name_en}
                                basis={
                                    config?.formulate_basis.find(
                                        (currentData) =>
                                            currentData.value_en ===
                                            s.std_type_name,
                                    )?.value || ''
                                }
                                bg={searchSel === s.id ? '#E6F5FF' : undefined}
                                disabled={
                                    isUnique &&
                                    !['char', 'number'].includes(s.data_type)
                                }
                                disabledTip={__(
                                    '唯一标识属性只能关联字符型或数字型的标准',
                                )}
                            />
                        ),
                        value: s.id,
                        show: s.name,
                        disabled:
                            isUnique &&
                            !['char', 'number'].includes(s.data_type),
                    }))}
                    notFoundContent={
                        fetching ? (
                            <Spin size="small" />
                        ) : standards &&
                          standards.length === 0 &&
                          search?.length ? (
                            <div style={{ color: 'rgba(0, 0, 0, 0.85)' }}>
                                {__('抱歉，没有找到相关内容')}
                            </div>
                        ) : undefined
                    }
                    onSelect={handleSelected}
                    maxLength={128}
                    getPopupContainer={(n) => n}
                    // onClear={() => {
                    //     setSearch('')
                    //     setStandards(undefined)
                    // }}
                    onChange={(val) => {
                        // 重置下拉面板内容
                        if (!trim(val)) {
                            setStandards(undefined)
                        }
                    }}
                    value={search}
                    popupClassName={styles.ppopup}
                >
                    <SearchInput
                        placeholder={__('搜索标准数据元的中英文名称')}
                        onKeyChange={(kw: string) => {
                            // 解决AutoComponent下onCompositionStart/End触发问题
                            if (!searchRef.current) {
                                // 搜索值
                                setSearch(kw)
                                handleSearch(kw)
                            }
                        }}
                        onCompositionStart={handleCompositionStart}
                        onCompositionEnd={handleCompositionEnd}
                    />
                </AutoComplete>
                {loading && (
                    <div className={styles.loading}>
                        <Loader />
                    </div>
                )}
                <div
                    className={styles.detailsWrapper}
                    hidden={!details || loading}
                >
                    <div className={styles.title}>标准数据元详情</div>
                    <div className={styles.content}>
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
                                    title={details?.[standard.key]}
                                >
                                    {details?.[standard.key]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default StandardChoose
