import { FC, useEffect, useState } from 'react'
import {
    AutoComplete,
    DatePicker,
    Input,
    InputNumber,
    Modal,
    Select,
    Space,
} from 'antd'
import moment from 'moment'
import { isNumber } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'
import { getFieldTypeIcon } from '@/components/IndicatorManage/helper'
import {
    BelongList,
    FieldTypes,
    beforeTime,
    changeFormatToType,
    currentTime,
    fieldInfos,
    limitBoolean,
    limitList,
    limitNumber,
    limitString,
} from '@/components/IndicatorManage/const'
import { TimeDateOptions } from './const'
import { getDimensionModelFields } from '@/core'
import NumberInput from '@/ui/NumberInput'

const { RangePicker } = DatePicker
interface IConfigFilter {
    data: any
    open: boolean
    tableId: string
    onClose: () => void
    onOk: (newData) => void
}

const ConfigFilter: FC<IConfigFilter> = ({
    data,
    open,
    tableId,
    onClose,
    onOk,
}) => {
    const [operator, setOperator] = useState<string>('')
    const [valueData, setValueData] = useState<Array<string>>([])
    const [dateType, setDateType] = useState<string>('')
    const [dateLabel, setDateLabel] = useState<string>('')
    const [formatRegx, setFormatRegx] = useState<string>('YYYY-MM-DD')

    // 字段值自动补全
    const [autoCompleteOptions, setAutoCompleteOptions] = useState<
        Array<{
            label: string
            value: string
        }>
    >([])

    useEffect(() => {
        if (changeFormatToType(data?.data_type) === FieldTypes.CHAR) {
            getCurrentFieldValues()
        }

        if (currentTime.includes(data?.operator)) {
            const foundDateOptions = TimeDateOptions.find(
                (currentTimeOptions) =>
                    currentTimeOptions.value === data?.value?.[0],
            )
            if (foundDateOptions) {
                setDateType(foundDateOptions.dateType)
                setDateLabel(foundDateOptions.label)
                setFormatRegx(foundDateOptions.formatRegx)
            }
        }
        setOperator(data?.operator)
        setValueData(data?.value)
    }, [data])

    /**
     * 获取字符的字段的推荐数据
     */
    const getCurrentFieldValues = async () => {
        const { id } = data
        const res = await getDimensionModelFields({
            table_id: tableId,
            field_id: id,
        })
        setAutoCompleteOptions(
            res.data.flat().map((currentData) => ({
                label: currentData,
                value: currentData,
            })),
        )
    }

    // 隐藏 tag 时显示的内容
    const maxTagContent = (omittedValues) => (
        <div title={omittedValues.map((o) => o.label).join('；')}>
            + {omittedValues.length} ...
        </div>
    )

    const handleCurrentChange = (val) => {
        const foundDateOptions = TimeDateOptions.find(
            (currentTimeOptions) => currentTimeOptions.value === val,
        )
        if (foundDateOptions) {
            setDateType(foundDateOptions.dateType)
            setDateLabel(foundDateOptions.label)
            setFormatRegx(foundDateOptions.formatRegx)
        }
        setValueData(val ? [val] : [])
    }

    const getConfigOptionTemplate = () => {
        const defaultNode: any = (
            <Input
                disabled
                placeholder={__('无需填写限定内容')}
                style={{ width: '304px' }}
            />
        )
        switch (changeFormatToType(data?.data_type)) {
            case FieldTypes.INT:
            case FieldTypes.FLOAT:
            case FieldTypes.DECIMAL:
            case FieldTypes.NUMBER:
                if (
                    limitNumber.includes(operator) ||
                    limitList.includes(operator)
                ) {
                    return (
                        <NumberInput
                            style={{ width: '304px' }}
                            placeholder={__('请输入限定内容')}
                            maxLength={65}
                            value={valueData[0] || ''}
                            onChange={(val) => {
                                setValueData(
                                    val || isNumber(val)
                                        ? [val.toString()]
                                        : [],
                                )
                            }}
                        />
                    )
                }
                if (BelongList.includes(operator)) {
                    return (
                        <Select
                            placeholder={__('输入限定内容后点击回车添加')}
                            mode="tags"
                            maxTagCount={1}
                            maxTagTextLength={10}
                            maxTagPlaceholder={(omittedValues) =>
                                maxTagContent(omittedValues)
                            }
                            onChange={(val) => {
                                if (
                                    !Number.isNaN(
                                        Number(val[val.length - 1]),
                                    ) ||
                                    !val.length
                                ) {
                                    setValueData(val)
                                }
                            }}
                            value={valueData || []}
                            style={{ width: '304px' }}
                            notFoundContent={null}
                            getPopupContainer={(n) => n.parentNode}
                        />
                    )
                }

                return defaultNode
            case FieldTypes.CHAR:
                if (limitString.includes(operator)) {
                    return autoCompleteOptions?.length ? (
                        // <div style={{ width: '304px' }}>
                        //     <SelectRestrict
                        //         options={autoCompleteOptions || []}
                        //         placeholder={__('请输入限定内容')}
                        //         onChange={(currentValue) => {
                        //             setValueData([currentValue])
                        //         }}
                        //         value={valueData[0]}
                        //     />

                        // </div>
                        <AutoComplete
                            placeholder={__('请输入限定内容')}
                            maxLength={128}
                            options={autoCompleteOptions}
                            filterOption
                            value={valueData[0]}
                            getPopupContainer={(n) => n.parentNode}
                            onChange={(currentValue) => {
                                setValueData(currentValue ? [currentValue] : [])
                            }}
                            style={{ width: '304px' }}
                        />
                    ) : (
                        <Input
                            placeholder={__('请输入限定内容')}
                            onChange={(e) => {
                                setValueData(
                                    e.target.value ? [e.target.value] : [],
                                )
                            }}
                            style={{ width: '304px' }}
                            value={valueData[0]}
                        />
                    )
                    // return (
                    //     <Input
                    //         placeholder={__('请输入限定内容')}
                    //         style={{ width: '304px' }}
                    //     />
                    // )
                }
                if (limitList.includes(operator)) {
                    return (
                        <Input
                            placeholder={__('请输入限定内容')}
                            maxLength={128}
                            onChange={(e) =>
                                setValueData(
                                    e.target.value ? [e.target.value] : [],
                                )
                            }
                            style={{ width: '304px' }}
                        />
                    )
                }
                if (BelongList.includes(operator)) {
                    return (
                        <Select
                            placeholder={__('输入限定内容后点击回车添加')}
                            mode="tags"
                            maxTagCount={1}
                            maxTagTextLength={10}
                            maxTagPlaceholder={(omittedValues) =>
                                maxTagContent(omittedValues)
                            }
                            onChange={(val) => {
                                setValueData(val)
                            }}
                            value={valueData || []}
                            notFoundContent={null}
                            getPopupContainer={(n) => n.parentNode}
                            style={{ width: '304px' }}
                        />
                    )
                }
                return defaultNode
            case FieldTypes.BOOL:
                return defaultNode
            case FieldTypes.DATE:
            case FieldTypes.DATETIME:
                if (beforeTime.includes(operator)) {
                    return (
                        <Space.Compact block>
                            <InputNumber
                                style={{ width: '304px' }}
                                placeholder={__('请输入数字')}
                                keyboard
                                min={0}
                                stringMode
                                max={65535}
                                onChange={(val) => {
                                    if (val) {
                                        setValueData([
                                            `${val.toString()}`,
                                            dateType,
                                        ])
                                    } else {
                                        setValueData([])
                                    }
                                }}
                                addonAfter={<div>{dateLabel}</div>}
                                value={
                                    valueData?.[0]
                                        ? Number(valueData[0].split(' ')?.[0])
                                        : undefined
                                }
                            />
                        </Space.Compact>
                    )
                }
                if (currentTime.includes(operator)) {
                    return (
                        <Select
                            options={TimeDateOptions}
                            onChange={handleCurrentChange}
                            value={dateLabel}
                            style={{ width: '304px' }}
                        />
                    )
                }
                return (
                    <RangePicker
                        style={{ width: '304px' }}
                        showTime={false}
                        placeholder={[__('开始日期'), __('结束日期')]}
                        onChange={(val) => {
                            if (val && val.length) {
                                setValueData(
                                    val.map((currentVal, index) =>
                                        index === 0
                                            ? moment(currentVal)
                                                  ?.startOf(dateType as any)
                                                  .format(
                                                      'YYYY-MM-DD HH:mm:ss',
                                                  ) || ''
                                            : moment(currentVal)
                                                  ?.endOf(dateType as any)
                                                  .format(
                                                      'YYYY-MM-DD HH:mm:ss',
                                                  ) || '',
                                    ),
                                )
                            } else {
                                setValueData([])
                            }
                        }}
                        value={
                            (valueData
                                ? valueData.map((currentData) =>
                                      moment(currentData),
                                  )
                                : ['', '']) as any
                        }
                        picker="date"
                    />
                )
            default:
                return defaultNode
        }
    }
    /**
     *  获取确定按钮的禁用状态
     * @param paramData
     * @param paramOperator
     * @param paramValue
     * @returns
     */
    const checkBtnStatus = (paramData, paramOperator, paramValue) => {
        if (changeFormatToType(paramData?.data_type) === FieldTypes.BOOL) {
            if (paramOperator) {
                return false
            }
            return true
        }
        if (limitBoolean.includes(paramOperator)) {
            return false
        }

        if (paramOperator && paramValue && paramValue?.length > 0) {
            return false
        }
        return true
    }
    return (
        <Modal
            width={480}
            title={__('筛选')}
            open={open}
            maskClosable={false}
            onCancel={() => {
                onClose()
            }}
            onOk={() => {
                onOk({
                    ...data,
                    operator,
                    value: valueData,
                })
            }}
            okButtonProps={{
                disabled: checkBtnStatus(data, operator, valueData),
            }}
        >
            <div className={styles.filterModalContainer}>
                <div className={styles.configItem}>
                    <div>{__('过滤维度')}：</div>
                    <div className={styles.itemValueWrapper}>
                        <div className={styles.dataTypeIcon}>
                            {getFieldTypeIcon(data.data_type)}
                        </div>
                        <div className={styles.name} title={data.business_name}>
                            {data.business_name}
                        </div>
                    </div>
                </div>
                <div className={styles.configItem}>
                    <div>{__('过滤条件')}：</div>
                    <div className={styles.conditionWrapper}>
                        <Select
                            placeholder={__('过滤条件')}
                            options={fieldInfos[
                                changeFormatToType(data?.data_type)
                            ]?.limitListOptions?.filter(
                                (current) => current.value !== 'before',
                            )}
                            onChange={(val) => {
                                setOperator(val)

                                if (dateType && val === 'current') {
                                    setValueData([dateType])
                                } else {
                                    setValueData([])
                                }
                            }}
                            value={operator}
                            className={styles.select}
                        />
                        {getConfigOptionTemplate()}
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default ConfigFilter
