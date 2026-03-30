import React, { useEffect, useState } from 'react'
import { Input, Select, DatePicker, InputNumber, Progress } from 'antd'
import moment from 'moment'
import { isEmpty } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { codeTableList, getLimitContentType, LimitContentType } from './const'
import {
    dataTypeMapping,
    formatError,
    getDictDetailById,
    getExploreFieldGroup,
} from '@/core'
import {
    limitBoolean,
    beforeTime,
    currentTime,
    beforeDateOptions,
    currentDateOptions,
    beforeDateTimeOptions,
    currentDataTimeOptions,
} from '../BussinessConfigure/const'
import { tipLabel } from '../SceneAnalysis/UnitForm/helper'

const { RangePicker } = DatePicker
const { Option } = Select
/**
 * @param {isExistData} 数据表库表是否存在数据
 */
interface ILimitContent {
    value?: any
    width: number | string
    onChange?: (val: any) => void
    fieldInfo?: any
    condition?: string
    exampleData?: any
}
const LimitContent: React.FC<ILimitContent> = ({
    value,
    onChange,
    width,
    fieldInfo,
    condition = '',
    exampleData = {},
}) => {
    const [data, setData] = useState<any>()
    const [firstData, setFirstData] = useState<number>()
    const [secData, setSecData] = useState<string>()
    const [listData, setListData] = useState<string[]>()
    const [listDataOptions, setListDataOptions] = useState<any[]>([])
    const [exploreFieldOptions, setExploreFieldOptions] = useState<any[]>([])
    const [isPorbe, setIsPorbe] = useState<boolean>(false)

    useEffect(() => {
        if (beforeTime.includes(condition)) {
            setFirstData(undefined)
            setSecData(undefined)
        }
        if (
            fieldInfo?.code_table_id &&
            codeTableList.includes(condition) &&
            (dataTypeMapping.number.includes(fieldInfo?.data_type) ||
                dataTypeMapping.char.includes(fieldInfo?.data_type))
        ) {
            getlistDataOptions()
        }
        if (
            dataTypeMapping.number.includes(fieldInfo?.data_type) ||
            dataTypeMapping.char.includes(fieldInfo?.data_type)
        ) {
            getfieldGroupList()
        }
    }, [fieldInfo, condition])

    useEffect(() => {
        setData(value)
        if (
            (dataTypeMapping.number.includes(fieldInfo?.data_type) ||
                dataTypeMapping.char.includes(fieldInfo?.data_type)) &&
            !isEmpty(exampleData)
        ) {
            setListData(value ? value.split(',') : [])
        }
    }, [value, condition])

    useEffect(() => {
        if (firstData && secData) {
            onChange?.(`${firstData} ${secData}`)
        }
        if (!firstData && secData) {
            onChange?.(undefined)
        }
    }, [firstData, secData])

    const getlistDataOptions = async () => {
        try {
            const res = await getDictDetailById(fieldInfo?.code_table_id)
            setListDataOptions(
                res?.data?.enums?.map((item) => ({
                    value: item.code,
                    label: `${item.code}（${item.value}）`,
                })) || [],
            )
        } catch (err) {
            formatError(err)
        }
    }

    const getfieldGroupList = async () => {
        try {
            const res = await getExploreFieldGroup({ field_id: fieldInfo?.id })
            let list: any = []
            const flag =
                getLimitContentType(fieldInfo, condition) ===
                    LimitContentType.Porbe && !!res?.group
            setIsPorbe(flag)
            if (flag) {
                list = res?.group?.map((item) => ({
                    ...item,
                    label: item.value,
                    percent:
                        Math.round((item.count / res.total_count) * 10000) /
                        100,
                }))
            } else {
                list = exampleData?.[fieldInfo.technical_name]?.map((item) => ({
                    label: item,
                    value: item,
                }))
            }
            setExploreFieldOptions(list)
        } catch (err) {
            formatError(err)
        }
    }

    const defaultInputNode = (isdisabled?: boolean, placeholder?: string) => {
        return (
            <Input
                disabled={!condition || isdisabled}
                value={data}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder={placeholder || __('无需填写限定内容')}
                style={{ width }}
            />
        )
    }
    const inputNumberNode = (placeholder?: string, wid?: string) => {
        return (
            <InputNumber
                disabled={!condition}
                value={data}
                placeholder={placeholder || __('请输入限定内容')}
                keyboard
                stringMode
                style={{ width: wid || width }}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e)
                }}
            />
        )
    }
    const inListSelectNode = () => {
        return (
            <Select
                value={listData}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e?.join())
                }}
                placeholder={__('请选择限定内容或输入限定内容后回车添加')}
                mode="tags"
                options={listDataOptions}
                maxTagCount={2}
                maxTagTextLength={10}
                style={{ width }}
                notFoundContent={tipLabel(__('暂无数据'))}
            />
        )
    }
    const dateSelectNode = (options: any[], wid?: string) => {
        return (
            <Select
                value={listData}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e)
                }}
                placeholder={__('请选择限定内容')}
                options={options}
                style={{ width: wid || width }}
            />
        )
    }
    const customDropdown = (menu) => (
        <>
            <div className={styles.rowWrapper}>
                <div>
                    {isPorbe ? __('数据探查结果：') : __('样例数据展示：')}
                </div>
                {isPorbe && (
                    <div>
                        {__('共')}
                        <span className={styles.totle}>
                            {exploreFieldOptions?.length}
                        </span>
                        {__('条')}
                    </div>
                )}
            </div>
            {menu}
        </>
    )
    const exploreSelectNode = () => {
        return (
            <Select
                mode="multiple"
                showSearch
                value={listData}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e?.join())
                }}
                placeholder={__('请选择限定内容')}
                style={{ width }}
                dropdownRender={customDropdown}
                optionLabelProp="label"
                getPopupContainer={(n) => n.parentNode}
                className={styles.exploreSelect}
            >
                {exploreFieldOptions.map((item) => {
                    return isPorbe ? (
                        <Option
                            key={item.value}
                            value={item.value}
                            label={item.label}
                            className={styles.selectOpWrapper}
                        >
                            <span className={styles.selectOpLabel}>
                                {item.label}
                            </span>
                            <Progress
                                strokeLinecap="butt"
                                percent={item.percent}
                                strokeWidth={32}
                                strokeColor="rgba(18, 110, 227, 0.06)"
                                trailColor="rgba(255, 255, 255, 0)"
                                className={styles.selectProgress}
                                format={() => ''}
                            />
                            <span className={styles.selectPercent}>
                                {item.percent}%
                            </span>
                        </Option>
                    ) : (
                        <Option
                            key={item.value}
                            value={item.value}
                            label={item.label}
                        >
                            {item.label}
                        </Option>
                    )
                })}
            </Select>
        )
    }
    return (
        <div className={styles['limit-content-wrapper']}>
            {dataTypeMapping.number.includes(fieldInfo?.data_type) ? (
                isEmpty(exampleData) ? (
                    inputNumberNode()
                ) : codeTableList.includes(condition) &&
                  fieldInfo?.code_table_id ? (
                    inListSelectNode()
                ) : limitBoolean.includes(condition) ? (
                    defaultInputNode(true)
                ) : (
                    exploreSelectNode()
                )
            ) : dataTypeMapping.char.includes(fieldInfo?.data_type) ? (
                isEmpty(exampleData) ? (
                    <Input
                        placeholder={__('请输入限定内容')}
                        maxLength={128}
                        style={{ width }}
                        value={data}
                        onChange={(e) => {
                            setData(e)
                            onChange?.(e)
                        }}
                    />
                ) : codeTableList.includes(condition) &&
                  fieldInfo?.code_table_id ? (
                    inListSelectNode()
                ) : limitBoolean.includes(condition) ? (
                    defaultInputNode(true)
                ) : (
                    exploreSelectNode()
                )
            ) : dataTypeMapping.bool.includes(fieldInfo?.data_type) ? (
                defaultInputNode(true)
            ) : [
                  ...dataTypeMapping.date,
                  ...dataTypeMapping.datetime,
                  ...dataTypeMapping.time,
              ].includes(fieldInfo?.data_type) ? (
                beforeTime.includes(condition) ? (
                    <div style={{ display: 'flex', width }}>
                        <InputNumber
                            disabled={!condition}
                            value={firstData}
                            placeholder={__('请输入数字')}
                            keyboard
                            min={0}
                            stringMode
                            style={{ width: '70%' }}
                            onChange={(e) => {
                                setFirstData(e || undefined)
                            }}
                        />
                        <Select
                            value={secData}
                            onChange={(e) => {
                                setSecData(e)
                            }}
                            placeholder={__('请选择')}
                            options={
                                dataTypeMapping.date.includes(
                                    fieldInfo?.data_type,
                                )
                                    ? beforeDateOptions
                                    : beforeDateTimeOptions
                            }
                            style={{ width: '30%' }}
                        />
                    </div>
                ) : currentTime.includes(condition) ? (
                    dateSelectNode(
                        dataTypeMapping.date.includes(fieldInfo?.data_type)
                            ? currentDateOptions
                            : currentDataTimeOptions,
                    )
                ) : !condition ? (
                    defaultInputNode(true)
                ) : (
                    <RangePicker
                        style={{ width: '100%' }}
                        placeholder={
                            dataTypeMapping.date.includes(fieldInfo?.data_type)
                                ? [__('开始日期'), __('结束日期')]
                                : [__('开始时间'), __('结束时间')]
                        }
                        showTime={
                            dataTypeMapping.date.includes(fieldInfo?.data_type)
                                ? false
                                : { format: 'HH:mm' }
                        }
                        onChange={(e) => {
                            const st = moment(e?.[0]).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )
                            const et = moment(e?.[1]).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )
                            const dates = `${st},${et}`
                            onChange?.(dates)
                        }}
                    />
                )
            ) : (
                defaultInputNode()
            )}
        </div>
    )
}

export default LimitContent
