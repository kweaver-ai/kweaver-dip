import React, { useEffect, useMemo, useState } from 'react'
import { Select, Row, Col, Button, Input } from 'antd'
import classnames from 'classnames'
import { isEqual } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import styles from './styles.module.less'
import __ from '../locale'
import { AddOutlined, DeleteOutLined } from '@/icons'
import CodeTableDetails from '@/components/CodeTableManage/Details'
import DataEleDetails from '@/components/DataEleManage/Details'
import {
    getDictList,
    getDataElement,
    formatError,
    getDirDataByTypeOrId,
    getDictDetailById,
} from '@/core'
import { useDataViewContext } from '../../DataViewProvider'
import { stardOrignizeTypeList } from '@/utils'

const { Option } = Select

interface ICodeAndStandard {
    value?: any
    onChange?: (o) => void
    // 码表、标准数据源
    type: 'code' | 'standard'
    // 是否编辑
    isEdit?: boolean
}

const CodeAndStandard: React.FC<ICodeAndStandard> = ({
    value,
    onChange,
    type,
    isEdit,
}) => {
    const { explorationData } = useDataViewContext()
    const [options, setOptions] = useState<any[]>([])
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 码表详情
    const [codeTbDetailVisible, setCodeTbDetailVisible] =
        useState<boolean>(false)
    const [selectedId, setSelectedId] = useState<string | undefined>()
    const [preSelectedId, setPreSelectedId] = useState<string | undefined>('')
    const [total, setTotal] = useState<number>(0)
    const [currentOffset, setCurrentOffset] = useState<number>(1)
    const [currentDict, setCurrentDict] = useState<any>({})
    const [catalogId, setCatalogId] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [originDictList, setOriginDictList] = useState<any[]>([])
    const [detailsList, setDetailsList] = useState<any[]>([])
    const [isCustom, setIsCustom] = useState<boolean>(false)
    const [isChange, setIsChange] = useState<boolean>(false)

    useMemo(() => {
        if (isChange) {
            const flag = !isEqual(
                originDictList?.map((item, index) => ({
                    id: `${index}`,
                    code: item.code,
                    value: item.value,
                })),
                detailsList,
            )
            setSelectedId(flag ? undefined : preSelectedId)
            setIsCustom(flag)
        }
    }, [originDictList, detailsList, isChange])

    const addDefault = {
        code: '',
        dict_id: uuidv4(),
        id: uuidv4(),
        value: '',
    }

    const [params, setParams] = useState<any>({
        keyword: '',
        offset: 1,
        limit: 20,
        state: 'enable',
    })

    useEffect(() => {
        getList()
        if (!isEdit) {
            getDefaultDict()
        }
    }, [])

    useEffect(() => {
        if (value?.data?.length) {
            const list = value?.data.map((item, index) => ({
                ...item,
                id: `${index}`,
            }))
            setDetailsList(list)
            setIsCustom(!value?.dict_id)
        }
        if (value?.dict_id) {
            setSelectedId(value?.dict_id)
            setPreSelectedId(value?.dict_id)
        }
    }, [value])

    useEffect(() => {
        if (value?.dict_id && isEdit && !options?.length) {
            getList({ state: undefined, keyword: value?.dict_name })
        }
    }, [value, isEdit, options])

    useEffect(() => {
        if (detailsList.length > 0) {
            const data = detailsList.map((item) => {
                return {
                    code: item.code,
                    value: item.value,
                }
            })

            const dict = {
                dict_id: isCustom ? '' : selectedId || '',
                dict_name: isCustom
                    ? ''
                    : currentDict?.ch_name || currentDict?.label,
                data,
            }
            onChange?.({ dict })
        }
    }, [detailsList])

    const onPopupScroll = (event) => {
        const { target } = event
        // 判断是否滚动到底部
        if (
            target.scrollTop + target.offsetHeight >=
                target.scrollHeight - 100 &&
            !loading
        ) {
            // 执行加载更多数据的逻辑
            loadMore()
        }
    }

    const getList = async (param?: any) => {
        try {
            const action = type === 'code' ? getDictList : getDataElement
            const { data } = await getDirDataByTypeOrId(type === 'code' ? 2 : 1)
            const [catalog] = data
            setCatalogId(catalog?.id)
            const res = await action({
                ...params,
                catalog_id: catalog?.id,
                ...param,
            })
            setOptions(res?.data)
            setTotal(res.total_count || 0)
        } catch (err) {
            formatError(err)
        }
    }

    const loadMore = async () => {
        if (options.length === total) return
        const offset = currentOffset + 1
        setCurrentOffset(offset)
        try {
            setLoading(true)
            const action = type === 'code' ? getDictList : getDataElement
            const res = await action({
                ...params,
                catalog_id: catalogId,
                offset,
            })
            setOptions([...options, ...res.data])
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const getDefaultDict = async () => {
        const dict_id = explorationData?.activeField?.code_table_id
        const ch_name = explorationData?.activeField?.code_table
        // 关联码表，根据码表id查询码表详情
        if (dict_id) {
            handleChange(dict_id, { ch_name, id: dict_id })
        }
    }

    const handleChange = (val: any, option: any) => {
        setSelectedId(val)
        setPreSelectedId(val)
        getDetails(val)
        setCurrentDict(option)
        setIsCustom(false)
    }

    const getDetails = async (id: string) => {
        try {
            const res = await getDictDetailById(id)
            setOriginDictList(res?.data?.enums)
            setDetailsList(res?.data?.enums)
        } catch (err) {
            formatError(err)
        }
    }

    const validStr = (label: string | undefined) => {
        return label || '--'
    }

    const onInpChange = (key: string, e: any, id: string) => {
        const text = e.target.value?.trim()
        setDetailsList((pre) =>
            pre.map((item) => {
                const obj = {
                    ...item,
                    [key]: id && item.id === id ? text : item[key],
                }
                return obj
            }),
        )
    }

    return (
        <div className={styles.codeAndStandardWrapper}>
            <Select
                showSearch
                placeholder={
                    isCustom ? (
                        <span style={{ color: 'rgb(0 0 0 / 85%)' }}>
                            {__('自定义')}
                        </span>
                    ) : (
                        `${__('请选择')}${
                            type === 'code' ? __('码表') : __('数据元')
                        }`
                    )
                }
                value={selectedId}
                listHeight={300}
                optionFilterProp="label"
                optionLabelProp="label"
                onChange={handleChange}
                onPopupScroll={onPopupScroll}
                popupClassName={styles.selectWrapper}
            >
                {options.map((item) => {
                    const { ch_name, en_name, org_type, deleted, state, id } =
                        item

                    const typeItem = stardOrignizeTypeList.find(
                        (it) => it.value === org_type,
                    )
                    return (
                        <Option key={id} value={id} label={ch_name}>
                            <div className={styles.showTableInfo}>
                                <div className={styles.detailInfo}>
                                    <div className={styles.org_type}>
                                        {validStr(typeItem?.label)}
                                    </div>
                                    <div className={styles.titleInfo}>
                                        <div
                                            className={styles.name}
                                            title={validStr(ch_name)}
                                        >
                                            {validStr(ch_name)}
                                        </div>
                                        <div
                                            className={styles.otherInfo}
                                            title={validStr(en_name)}
                                        >
                                            {validStr(en_name)}
                                        </div>
                                    </div>
                                </div>
                                {/* <div className={styles.status}>
                                    {state === StateType.DISABLE && (
                                        <DisableStateColored />
                                    )}
                                </div> */}
                                <span
                                    onClick={(e) => {
                                        // e.stopPropagation()
                                        setSelectedId(id)
                                        if (type === 'code') {
                                            setCodeTbDetailVisible(true)
                                        } else {
                                            setDataEleDetailVisible(true)
                                        }
                                    }}
                                    className={styles.link}
                                >
                                    {__('详情')}
                                </span>
                            </div>
                        </Option>
                    )
                })}
            </Select>
            {detailsList?.length > 0 && (
                <div className={styles.detailBox}>
                    <div className={styles.detailItem}>
                        <div className={styles.code}>
                            <span className={styles.requiredFlag}>*</span>
                            {__('码值')}
                        </div>
                        <div className={styles.des}>
                            <span className={styles.requiredFlag}>*</span>
                            {__('码值描述')}
                        </div>
                    </div>
                    <div>
                        {detailsList?.map((item) => {
                            return (
                                <div key={item.id}>
                                    <div className={styles.detailItem}>
                                        <div className={styles.code}>
                                            <Input
                                                placeholder={__('请输入码值')}
                                                value={item.code}
                                                onChange={(e) =>
                                                    onInpChange(
                                                        'code',
                                                        e,
                                                        item.id,
                                                    )
                                                }
                                                maxLength={128}
                                            />
                                        </div>
                                        <div className={styles.des}>
                                            <Input
                                                placeholder={__(
                                                    '请输入码值描述',
                                                )}
                                                value={item.value}
                                                onChange={(e) =>
                                                    onInpChange(
                                                        'value',
                                                        e,
                                                        item.id,
                                                    )
                                                }
                                                maxLength={128}
                                            />
                                            <DeleteOutLined
                                                className={styles.opertionIcon}
                                                onClick={() => {
                                                    setIsChange(true)
                                                    if (
                                                        detailsList?.length ===
                                                        1
                                                    ) {
                                                        setDetailsList((pre) =>
                                                            pre.map((it) => ({
                                                                ...it,
                                                                code: '',
                                                                value: '',
                                                            })),
                                                        )
                                                    } else {
                                                        setDetailsList((pre) =>
                                                            pre.filter((it) =>
                                                                it?.id
                                                                    ? it.id !==
                                                                      item.id
                                                                    : it.code !==
                                                                      item.code,
                                                            ),
                                                        )
                                                    }
                                                }}
                                            />
                                            <AddOutlined
                                                className={styles.opertionIcon}
                                                onClick={() => {
                                                    setIsChange(true)
                                                    setDetailsList((pre) => [
                                                        ...pre,
                                                        addDefault,
                                                    ])
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {/* 查看码表详情 */}
            {selectedId && codeTbDetailVisible && (
                <CodeTableDetails
                    visible={codeTbDetailVisible}
                    dictId={selectedId}
                    onClose={() => setCodeTbDetailVisible(false)}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!selectedId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={selectedId}
                    onClose={() => setDataEleDetailVisible(false)}
                />
            )}
        </div>
    )
}

export default CodeAndStandard
