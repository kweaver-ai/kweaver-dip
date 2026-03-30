import { AutoComplete } from 'antd'
import { FC, useState, useEffect } from 'react'
import classnames from 'classnames'
import { noop, trim } from 'lodash'
import FieldInput from './FieldInput'
import CustomerInput from './CustomerInput'
import styles from './styles.module.less'
import { checkFuncNameReg, onlyFuncNameOptions } from './const'

// 操作输入框
interface OperationalInputType {
    value: [string, string, string]
    fieldOptions: Array<any>
    onChange?: (value: string) => void
    onPopDelete?: () => void
    focusStatus?: boolean
    onPopLeftMove?: () => void
    onPopRightMove?: () => void
    onFieldSearch?: (value: string) => void
    onPopupScroll?: (e: any, searchKey: string) => void
    optionLabelProp?: string
    onFocus?: () => void
    optionFilterProp?: string
    ref?: any
}
export const OperationalInput: FC<OperationalInputType> = ({
    value,
    focusStatus = false,
    onChange = noop,
    onPopDelete = noop,
    onPopLeftMove = noop,
    onPopRightMove = noop,
    fieldOptions,
    onFieldSearch = noop,
    onPopupScroll = noop,
    optionLabelProp,
    onFocus = noop,
    optionFilterProp,
    ref,
}) => {
    const [operationData, setOperationData] = useState<[string, string]>([
        value[0],
        value[1],
    ])
    const [paramKey, setParamKey] = useState<string>(value[2])
    const [funcStatus, setFuncStatus] = useState<boolean>(false)
    const [fieldStatus, setFieldStatus] = useState<boolean>(false)

    useEffect(() => {
        if (
            paramKey !== value[2] ||
            [value[0], value[1]].join('') !== operationData.join('')
        ) {
            setOperationData([value[2] ? `${value[0]} ` : value[0], value[1]])
            setParamKey(value[2])
        }
    }, [value])

    useEffect(() => {
        if (focusStatus) {
            if (!funcStatus) {
                setFieldStatus(focusStatus)
            }
        } else {
            setFieldStatus(false)
            setFuncStatus(false)
        }
    }, [focusStatus])

    return (
        <div
            className={styles.funcContainer}
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
            }}
        >
            <CustomerInput
                ref={ref}
                defaultValue={operationData[0]}
                onChange={(currentValue, option: any) => {
                    onChange(
                        currentValue
                            ? `${trim(currentValue)}(${
                                  option.params ? `${option.params} ` : ''
                              }${
                                  operationData[1]
                                      ? `{{${operationData[1]}}}`
                                      : ''
                              })`
                            : '',
                    )
                    setParamKey(option.params)
                }}
                value={operationData[0]}
                options={onlyFuncNameOptions}
                className={
                    /^(COUNT(([\s]{1})*)|SUM|AVG|MAX|MIN){1}$/.test(
                        operationData[0],
                    )
                        ? styles.funcName
                        : ''
                }
                onPopDelete={onPopDelete}
                focusStatus={funcStatus}
                onPopLeftMove={onPopLeftMove}
                onPopRightMove={() => {
                    setFuncStatus(false)
                    setFieldStatus(true)
                }}
                onFocus={onFocus}
                checkInputStatus={(newValue) => {
                    if (
                        /^(COUNT(([\s]{1})*)|SUM|AVG|MAX|MIN){1}$/.test(
                            newValue,
                        )
                    ) {
                        return true
                    }
                    return false
                }}
                maxLength={30}
                isNeedFilter={false}
            />
            <div className={styles.funcParam}>
                ({paramKey ? <span>{paramKey}</span> : ''}
                <FieldInput
                    value={operationData[1]}
                    onChange={(fieldValue) => {
                        onChange(
                            `${trim(operationData[0])}(${
                                paramKey ? `${paramKey} ` : ''
                            }${fieldValue ? `{{${fieldValue}}}` : ''})`,
                        )
                    }}
                    options={fieldOptions}
                    onSearch={onFieldSearch}
                    onPopupScroll={onPopupScroll}
                    optionLabelProp={optionLabelProp}
                    onFocus={onFocus}
                    focusStatus={fieldStatus}
                    onPopLeftMove={() => {
                        setFuncStatus(true)
                        setFieldStatus(false)
                    }}
                    onPopRightMove={onPopRightMove}
                    optionFilterProp={optionFilterProp}
                    allowType={
                        ['SUM', 'AVG', 'MAX', 'MIN'].includes(operationData[0])
                            ? 'number'
                            : ''
                    }
                />
                )
            </div>
        </div>
    )
}
