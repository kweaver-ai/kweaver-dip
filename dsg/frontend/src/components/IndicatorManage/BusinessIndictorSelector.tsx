import { Button, Select, Spin } from 'antd'
import { FC, useContext, useEffect, useState } from 'react'
import { useDebounce } from 'ahooks'
import { noop } from 'lodash'
import classnames from 'classnames'
import {
    formatError,
    getCoreBusinessIndicatorDetail,
    getCoreBusinessIndicators,
    getUsedBusinessIndicatorsId,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import { TaskInfoContext } from '@/context'
import Detail from '../BusinessModeling/CoreBusinessIndicator/Detail'

type QueryCondition = {
    offset: number
    name: string
    limit: number
}

const DefaultQueryCondition = {
    offset: 1,
    name: '',
    limit: 2000,
}

interface IBusinessIndictorSelector {
    value?: {
        business_indicator_id: string
        business_indicator_name: string
    }

    onChange?: (
        value: {
            business_indicator_id: string
            business_indicator_name: string
        },
        detail,
    ) => void

    isError?: boolean
    usedBusinessIndicatorsId: Array<string>
}
const BusinessIndictorSelector: FC<IBusinessIndictorSelector> = ({
    value,
    onChange = noop,
    isError = false,
    usedBusinessIndicatorsId,
}) => {
    // 业务表数据
    const [businessIndictors, setBusinessIndictor] = useState<Array<any>>([])

    // 加载中的状态
    const [loading, setLoading] = useState<boolean>(false)

    // 搜索关键字
    const [keyword, setKeyword] = useState<string>('')

    const keywordDebounce = useDebounce(keyword, {
        wait: 500,
    })

    const [total, setTotal] = useState<number>(0)

    const [condition, setCondition] = useState<QueryCondition>(
        DefaultQueryCondition,
    )

    const { taskInfo } = useContext(TaskInfoContext)

    const [viewBusinessId, setViewBusinessId] = useState<string>('')

    useEffect(() => {
        if (taskInfo?.id) {
            getTaskBusinessIndictors()
        } else {
            getBusinessIndictors(condition, [])
        }
    }, [taskInfo?.id, usedBusinessIndicatorsId, value])

    useEffect(() => {
        setCondition({
            ...condition,
            offset: 1,
            name: keywordDebounce,
        })
    }, [keywordDebounce])

    useEffect(() => {
        if (taskInfo?.id) {
            getTaskBusinessIndictors(condition.name)
        } else {
            getBusinessIndictors(condition, [])
        }
    }, [condition])

    /**
     * 获取业务指标列表
     * @param params
     * @param initData
     */
    const getBusinessIndictors = async (params: QueryCondition, initData) => {
        try {
            setLoading(true)
            const { entries, total_count } = await getCoreBusinessIndicators({
                ...params,
            })

            setBusinessIndictor([
                ...initData,
                ...entries.filter(
                    (item) => !usedBusinessIndicatorsId.includes(item.id),
                ),
            ])
            setTotal(total_count)
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }

    /**
     *
     */
    const getTaskBusinessIndictors = async (searchKey = '') => {
        try {
            const taskIndicatorData = value?.business_indicator_id
                ? [
                      ...taskInfo.data,
                      {
                          id: value.business_indicator_id,
                          name: value.business_indicator_name,
                      },
                  ]
                : taskInfo.data

            const unUseBusinessIndicators = taskIndicatorData.filter(
                (item) => !usedBusinessIndicatorsId.includes(item.id),
            )
            setBusinessIndictor(
                searchKey
                    ? unUseBusinessIndicators.filter((currentIndictor) =>
                          currentIndictor.name
                              ?.toLocaleLowerCase()
                              .includes(searchKey.trim().toLocaleLowerCase()),
                      )
                    : unUseBusinessIndicators,
            )
            setTotal(unUseBusinessIndicators || 0)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 滚动加载e
     */
    // const getBusinessIndictorByScroll = (e) => {
    //     const { target } = e
    //     if (
    //         target.scrollTop + target.offsetHeight === target.scrollHeight &&
    //         total > businessIndictors.length
    //     ) {
    //         setCondition({
    //             ...condition,
    //             offset: condition.offset + 1,
    //         })
    //     }
    // }

    const handleChangeValue = async (newValue, option) => {
        if (taskInfo.id && newValue) {
            try {
                const detail = await getCoreBusinessIndicatorDetail(newValue)
                onChange(
                    {
                        business_indicator_id: newValue,
                        business_indicator_name: detail?.name || '',
                    },
                    detail || null,
                )
            } catch (err) {
                formatError(err)
            }
        } else {
            onChange(
                {
                    business_indicator_id: newValue,
                    business_indicator_name: option?.detail?.name || '',
                },
                option?.detail || null,
            )
        }
    }

    return (
        <div className={styles.businessContainer}>
            <div
                className={classnames(
                    styles.selectedContainer,
                    isError ? styles.errorStatus : '',
                )}
            >
                <Select
                    options={businessIndictors.map((currentIndictor) => ({
                        label: (
                            <div className={styles.optionItem}>
                                <div
                                    className={styles.itemName}
                                    title={currentIndictor.name}
                                >
                                    {currentIndictor.name}
                                </div>
                            </div>
                        ),
                        name: currentIndictor.name,
                        value: currentIndictor.id,
                        detail: currentIndictor,
                    }))}
                    style={{ flex: 1, width: 0 }}
                    placeholder={__('关联业务指标')}
                    allowClear
                    showSearch
                    value={value?.business_indicator_id || undefined}
                    onSearch={(key) => {
                        if (key.length <= 128) {
                            setKeyword(key)
                        }
                    }}
                    onChange={handleChangeValue}
                    searchValue={keyword}
                    // onPopupScroll={getBusinessIndictorByScroll}
                    filterOption={false}
                    getPopupContainer={(node) => node.parentNode}
                    notFoundContent={
                        loading ? (
                            <Spin />
                        ) : keyword ? (
                            __('抱歉，未找到匹配的结果')
                        ) : (
                            __('暂无数据')
                        )
                    }
                    bordered={false}
                    showArrow={false}
                />
                <Button
                    type="link"
                    onClick={(e) => {
                        // 设置预览窗口
                        e.preventDefault()
                        e.stopPropagation()
                        setViewBusinessId(value?.business_indicator_id || '')
                        return false
                    }}
                    hidden={!value?.business_indicator_id}
                    className={styles.itemBtn}
                >
                    {__('查看')}
                </Button>
            </div>
            {viewBusinessId ? (
                <Detail
                    id={viewBusinessId}
                    onClose={() => {
                        setViewBusinessId('')
                    }}
                    mask
                    getContainer={document.getElementById('root')}
                    style={{ position: 'absolute', top: 0 }}
                />
            ) : null}
        </div>
    )
}

export default BusinessIndictorSelector
