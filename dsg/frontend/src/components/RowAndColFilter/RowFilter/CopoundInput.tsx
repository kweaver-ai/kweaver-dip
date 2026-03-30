import {
    AutoComplete,
    DatePicker,
    Input,
    InputNumber,
    Progress,
    Select,
} from 'antd'
import moment from 'moment'
import React, { memo, useEffect, useState } from 'react'
import { isEmpty } from 'lodash'
import classNames from 'classnames'
import { DATA_TYPE_MAP } from '@/utils'
import {
    BelongList,
    beforeDateOptions,
    beforeDateTimeOptions,
    beforeTime,
    currentDataTimeOptions,
    currentDateOptions,
    currentTime,
    limitBoolean,
    limitNumber,
    limitString,
    codeTableList,
    CopoundContentType,
    getCopoundContentType,
} from '../const'

import { formatError, getDictDetailById, getExploreFieldGroup } from '@/core'
import __ from '../locale'
import { tipLabel } from './CommonItem'
import styles from './styles.module.less'

const { RangePicker } = DatePicker
const { Option } = Select

// arr, codeArr均存在数据
const CopoundCombined = (
    arr: { label: string; value: string | number; percent: string }[],
    codeArr: { label: string; value: string }[],
) => {
    const commonOpt: any[] = []
    const elseOpt: any[] = []
    if (arr?.length >= codeArr?.length) {
        ;(arr || []).forEach((o) => {
            const it = (codeArr || []).find(
                (i) => `${i.value}` === `${o.value}`,
            )
            if (it) {
                commonOpt.push({ ...o, value: `${o.value}`, label: it.label })
            } else {
                elseOpt.push({ ...o, value: `${o.value}` })
            }
        })
        if (commonOpt?.length === 0) {
            // 无公用匹配直接返回
            return arr
        }
        return [...commonOpt, ...elseOpt]
    }
    ;(codeArr || []).forEach((o) => {
        const it = (arr || []).find((i) => `${i.value}` === `${o.value}`)
        if (it) {
            commonOpt.push({ ...it, value: `${o.value}`, label: o.label })
        } else {
            const item: any = {
                ...o,
                value: `${o?.value}`,
            }
            elseOpt.push(item)
        }
    })

    if (commonOpt?.length === 0) {
        // 无公用匹配直接返回
        return arr
    }
    return [...commonOpt, ...elseOpt]
}

interface ICopoundInput {
    value?: any
    width?: any
    onChange?: (val: any) => void
    fieldInfo?: any
    condition?: string
    exampleData?: any
    openProbe?: boolean
    isTemplateConfig?: boolean
    isExplorationModal?: boolean
    disabled?: boolean
}

const CopoundInput: React.FC<ICopoundInput> = ({
    value,
    onChange,
    width,
    fieldInfo,
    condition = '',
    exampleData = {},
    openProbe,
    isTemplateConfig,
    isExplorationModal,
    disabled = false,
}) => {
    const [data, setData] = useState<any>()
    const [firstData, setFirstData] = useState<number>()
    const [secData, setSecData] = useState<string>()
    const [isRadio, setIsRadio] = useState<boolean>(true)
    const [listData, setListData] = useState<string[]>([])
    const [pickData, setPickData] = useState<[moment.Moment, moment.Moment]>()
    // 码值
    const [codeOptions, setCodeOptions] = useState<any[]>([])
    // 样例数据
    const [sampleOptions, setSampleOptions] = useState<any[]>([])
    // 探查数据
    const [probeOptions, setProbeOptions] = useState<any[]>([])
    // 区分组件显示探查数据or样例数据
    const [isPorbe, setIsPorbe] = useState<boolean>(false)
    const [copoundOptions, setCopoundOptions] = useState<any[]>([])

    useEffect(() => {
        setCodeOptions([])
        setCopoundOptions([])
        if (beforeTime.includes(condition)) {
            setFirstData(undefined)
            setSecData(undefined)
        }

        // 数字型 | 字符型
        if (
            [...DATA_TYPE_MAP.number, ...DATA_TYPE_MAP.char].includes(
                fieldInfo?.data_type,
            )
        ) {
            // 存在码表且符合条件
            if (fieldInfo?.code_table_id && codeTableList.includes(condition)) {
                // 码值数据
                getCodeData()
            }

            // 开启探查
            if (openProbe) {
                // 探查数据
                getProbeData()
            }
        }
        // TODO： 日期型探查-待定
    }, [fieldInfo, condition])

    /** 样例数据格式化 */
    useEffect(() => {
        // 存在样例数据
        if (!isEmpty(exampleData)) {
            const curSample = (exampleData?.[fieldInfo?.technical_name] || [])
                .filter((o) => ![null, ''].includes(o))
                .map((item) => ({
                    label: item,
                    value: `${item}`,
                }))
            setSampleOptions(curSample)
        }
    }, [fieldInfo, exampleData])

    /** 获取码值数据 */
    const getCodeData = async () => {
        try {
            const res = await getDictDetailById(fieldInfo?.code_table_id)
            setCodeOptions(
                res?.data?.enums?.map((item) => ({
                    value: `${item.code}`,
                    label: `${item.code}(${item.value})`,
                })) || [],
            )
        } catch (err) {
            formatError(err)
        }
    }
    /** 获取探查数据 */
    const getProbeData = async () => {
        try {
            const res = await getExploreFieldGroup({ field_id: fieldInfo?.id })
            // 字符、数字探查结果
            const fieldGroup = res?.group || []
            // 是否展示探查标志
            const flag =
                fieldGroup.length > 0 &&
                getCopoundContentType(fieldInfo, condition) ===
                    CopoundContentType.Porbe
            setIsPorbe(flag)

            if (flag) {
                const curProbe = fieldGroup
                    .filter((o) => ![null, ''].includes(o.value))
                    .map((item) => ({
                        ...item,
                        value: `${item.value}`,
                        label: item.value,
                        percent: item.count,
                    }))
                setProbeOptions(curProbe)
            }
        } catch (err) {
            formatError(err)
        }
    }

    const switchDataShow = () => {
        const hasCode = codeOptions?.length > 0
        if (isPorbe) {
            // 探查
            if (hasCode) {
                const ret = CopoundCombined(probeOptions, codeOptions)
                setCopoundOptions(ret)
                return
            }
            setCopoundOptions(probeOptions)
            return
        }
        if (sampleOptions?.length) {
            // 样例
            if (hasCode) {
                const ret = CopoundCombined(sampleOptions, codeOptions)
                setCopoundOptions(ret)
                return
            }
            setCopoundOptions(sampleOptions)
            return
        }

        if (hasCode) {
            // 展示码表
            setCopoundOptions(codeOptions)
            return
        }
        setCopoundOptions([])
    }

    useEffect(() => {
        switchDataShow()
    }, [codeOptions, sampleOptions, probeOptions, isPorbe])

    useEffect(() => {
        if (
            value &&
            [
                ...DATA_TYPE_MAP.date,
                ...DATA_TYPE_MAP.datetime,
                ...DATA_TYPE_MAP.timestamp,
            ].includes(fieldInfo?.data_type) &&
            condition &&
            ![...currentTime, ...beforeTime].includes(condition)
        ) {
            const timeStr = DATA_TYPE_MAP.date.includes(fieldInfo?.data_type)
                ? 'YYYY-MM-DD'
                : 'YYYY-MM-DD HH:mm:ss'
            const [st, et] = value ? value.split(',') : [undefined, undefined]
            setPickData([moment(st, timeStr), moment(et, timeStr)])
        }
        setData(value)
        if (beforeTime.includes(condition)) {
            const [fir, sec] = value ? value.split(' ') : [undefined, undefined]
            setFirstData(fir)
            setSecData(sec)
        }
        if (
            DATA_TYPE_MAP.number.includes(fieldInfo?.data_type) ||
            DATA_TYPE_MAP.char.includes(fieldInfo?.data_type)
            // && !isEmpty(exampleData)  // 因无样例数据也能输入属于条件多选  故屏蔽该条件
        ) {
            const unRadio = BelongList.includes(condition)
            setIsRadio(!unRadio)
            // 属于为多选
            if (unRadio) {
                setListData(value ? value.split(',') : [])
            }
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

    useEffect(() => {}, [codeOptions])

    const defaultInputNode = (isdisabled?: boolean, placeholder?: string) => {
        return (
            <Input
                disabled={!condition || isdisabled || disabled}
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
                disabled={!condition || disabled}
                value={data}
                placeholder={placeholder || __('请输入限定内容')}
                keyboard
                stringMode
                style={{ width: wid || width }}
                onChange={(e) => {
                    setData(e)
                    onChange?.(`${e}`)
                }}
            />
        )
    }
    const inListSelectNode = () => {
        return (
            <Select
                disabled={disabled}
                value={listData}
                onChange={(e) => {
                    setListData(e)
                    onChange?.(e?.join())
                }}
                placeholder={__('请选择限定内容')}
                mode="tags"
                options={codeOptions}
                maxTagCount={isExplorationModal ? 'responsive' : 2}
                maxTagTextLength={10}
                style={{ width }}
                getPopupContainer={(n) => n.parentNode}
                notFoundContent={tipLabel(__('暂无数据'))}
            />
        )
    }
    const dateSelectNode = (options: any[], wid?: string) => {
        return (
            <Select
                disabled={disabled}
                value={data}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e)
                }}
                maxTagCount={isExplorationModal ? 'responsive' : undefined}
                placeholder={__('请选择限定内容')}
                options={options}
                getPopupContainer={(n) => n.parentNode}
                style={{ width: wid || width }}
            />
        )
    }

    const customDropdown = (menu) => (
        <>
            <div className={styles.rowWrapper}>
                <div>{isPorbe ? __('数据探查结果') : __('样例数据展示')}：</div>
                {isPorbe && <div>{__('出现次数')}</div>}
            </div>
            {menu}
        </>
    )

    const singleOrInput = () => {
        return (
            <AutoComplete
                disabled={disabled}
                showSearch
                value={data}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e)
                }}
                placeholder={__('请选择限定内容或输入限定内容后回车添加')}
                style={{ width }}
                dropdownRender={customDropdown}
                getPopupContainer={(n) => n.parentNode}
                className={classNames(
                    isExplorationModal && styles.explorationAuto,
                )}
            >
                {copoundOptions?.map((item) => {
                    return isPorbe ? (
                        <AutoComplete.Option
                            key={item.value}
                            value={item.value}
                            label={item.label}
                            className={styles.selectOpWrapper}
                        >
                            <span
                                className={styles.selectOpLabel}
                                title={item.label}
                            >
                                {item.label}
                            </span>
                            {/* <Progress
                                strokeLinecap="butt"
                                percent={item.percent}
                                strokeWidth={32}
                                strokeColor="rgba(18, 110, 227, 0.06)"
                                trailColor="rgba(255, 255, 255, 0)"
                                className={styles.selectProgress}
                                format={() => ''}
                            /> */}
                            <span
                                className={styles.selectPercent}
                                title={item.percent || 0}
                            >
                                {item.percent || 0}
                            </span>
                        </AutoComplete.Option>
                    ) : (
                        <AutoComplete.Option
                            key={item.value}
                            value={item.value}
                            label={item.label}
                        >
                            {item.label}
                        </AutoComplete.Option>
                    )
                })}
            </AutoComplete>
        )
    }

    const exploreSelectNode = () => {
        return isRadio ? (
            singleOrInput()
        ) : (
            <Select
                disabled={disabled}
                mode="tags"
                showSearch
                value={listData}
                onChange={(e) => {
                    setData(e)
                    onChange?.(e?.join())
                }}
                placeholder={__('请选择限定内容')}
                style={{ width }}
                maxTagCount={isExplorationModal ? 'responsive' : undefined}
                dropdownRender={
                    copoundOptions?.length ? customDropdown : undefined
                }
                optionLabelProp="label"
                getPopupContainer={(n) => n.parentNode}
            >
                {copoundOptions?.map((item) => {
                    return isPorbe ? (
                        <Option
                            key={item.value}
                            value={`${item.value}`}
                            label={item.label}
                            className={styles.selectOpWrapper}
                        >
                            <span className={styles.selectOpLabel}>
                                {item.label}
                            </span>
                            {/* <Progress
                                strokeLinecap="butt"
                                percent={item.percent}
                                strokeWidth={32}
                                strokeColor="rgba(18, 110, 227, 0.06)"
                                trailColor="rgba(255, 255, 255, 0)"
                                className={styles.selectProgress}
                                format={() => ''}
                            /> */}
                            <span
                                className={styles.selectPercent}
                                title={item.percent || 0}
                            >
                                {item.percent || 0}
                            </span>
                        </Option>
                    ) : (
                        <Option
                            key={item.value}
                            value={`${item.value}`}
                            label={item.label}
                        >
                            {item.label}
                        </Option>
                    )
                })}
            </Select>
        )
    }

    const getContentByType = (valueType: string) => {
        if (isTemplateConfig) {
            const noLimit = limitBoolean.includes(condition) || !condition
            return defaultInputNode(
                noLimit,
                noLimit ? '' : __('请输入限定内容'),
            )
        }
        // 数字型
        if (DATA_TYPE_MAP.number.includes(valueType)) {
            // 为空 | 不为空 | 无条件 禁用限定内容
            if (limitBoolean.includes(condition) || !condition) {
                return defaultInputNode(true)
            }
            // 表内无数据 （无探查结果  无样例数据）
            if (isEmpty(exampleData)) {
                // 有码值
                if (
                    codeTableList.includes(condition) &&
                    fieldInfo?.code_table_id
                ) {
                    return inListSelectNode()
                }
                // 属于仅支持选择  不支持自行输入
                if (BelongList.includes(condition)) {
                    return inListSelectNode()
                }

                // 无码值
                return inputNumberNode()
            }

            // 表内有数据
            return copoundOptions?.length || BelongList.includes(condition)
                ? exploreSelectNode()
                : inputNumberNode()
        }

        // 字符型
        if (DATA_TYPE_MAP.char.includes(valueType)) {
            // 为空 | 不为空 | 无条件 禁用限定内容
            if (limitBoolean.includes(condition) || !condition) {
                return defaultInputNode(true)
            }
            // 表内无数据 （无探查结果  无样例数据）
            if (isEmpty(exampleData)) {
                // 有码值
                if (
                    codeTableList.includes(condition) &&
                    fieldInfo?.code_table_id
                ) {
                    return inListSelectNode()
                }

                // 属于仅支持选择  不支持自行输入
                if (BelongList.includes(condition)) {
                    return inListSelectNode()
                }

                // 无码值
                return (
                    <Input
                        disabled={disabled}
                        placeholder={__('请输入限定内容')}
                        maxLength={128}
                        style={{ width }}
                        value={data}
                        onChange={(e) => {
                            setData(e)
                            onChange?.(e)
                        }}
                    />
                )
            }

            // 表内有数据
            return copoundOptions?.length || BelongList.includes(condition) ? (
                exploreSelectNode()
            ) : (
                <Input
                    disabled={disabled}
                    placeholder={__('请输入限定内容')}
                    maxLength={128}
                    style={{ width }}
                    value={data}
                    onChange={(e) => {
                        setData(e)
                        onChange?.(e)
                    }}
                />
            )
        }

        // Bool型
        if (DATA_TYPE_MAP.bool.includes(valueType)) {
            return defaultInputNode(true)
        }

        if (
            [
                ...DATA_TYPE_MAP.date,
                ...DATA_TYPE_MAP.datetime,
                ...DATA_TYPE_MAP.timestamp,
            ].includes(valueType)
        ) {
            if (beforeTime.includes(condition)) {
                return (
                    <div style={{ display: 'flex', width }}>
                        <InputNumber
                            disabled={!condition || disabled}
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
                            disabled={disabled}
                            value={secData}
                            onChange={(e) => {
                                setSecData(e)
                            }}
                            placeholder={__('请选择')}
                            options={
                                DATA_TYPE_MAP.date.includes(valueType)
                                    ? beforeDateOptions
                                    : beforeDateTimeOptions
                            }
                            style={{ width: '30%', minWidth: '70px' }}
                            getPopupContainer={(n) => n.parentNode}
                        />
                    </div>
                )
            }

            if (currentTime.includes(condition)) {
                return dateSelectNode(
                    DATA_TYPE_MAP.date.includes(valueType)
                        ? currentDateOptions
                        : currentDataTimeOptions,
                )
            }

            if (!condition) {
                return defaultInputNode(true)
            }

            return (
                <div
                    style={{ width: '100%' }}
                    title={
                        pickData
                            ? `${moment(pickData[0]).format(
                                  'YYYY-MM-DD HH:mm',
                              )} - ${moment(pickData[1]).format(
                                  'YYYY-MM-DD HH:mm',
                              )}`
                            : ''
                    }
                >
                    <RangePicker
                        disabled={disabled}
                        style={{ width: '100%' }}
                        value={pickData}
                        placeholder={
                            DATA_TYPE_MAP.date.includes(valueType)
                                ? [__('开始日期'), __('结束日期')]
                                : [__('开始时间'), __('结束时间')]
                        }
                        showTime={
                            DATA_TYPE_MAP.date.includes(valueType)
                                ? false
                                : { format: 'HH:mm' }
                        }
                        format={
                            DATA_TYPE_MAP.date.includes(valueType)
                                ? 'YYYY-MM-DD'
                                : 'YYYY-MM-DD HH:mm'
                        }
                        onChange={(e) => {
                            const st = moment(e?.[0]).format(
                                DATA_TYPE_MAP.date.includes(valueType)
                                    ? 'YYYY-MM-DD 00:00:00'
                                    : 'YYYY-MM-DD HH:mm:ss',
                            )
                            const et = moment(e?.[1]).format(
                                'YYYY-MM-DD 23:59:59',
                            )
                            const dates = `${st},${et}`
                            onChange?.(dates)
                        }}
                    />
                </div>
            )
        }
        return defaultInputNode()
    }

    return (
        <div className={styles['limit-content-wrapper']}>
            {getContentByType(fieldInfo?.data_type)}
        </div>
    )
}

export default memo(CopoundInput)
