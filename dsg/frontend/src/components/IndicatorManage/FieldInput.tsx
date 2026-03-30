import { AutoComplete, Select } from 'antd'
import { FC, useState, useEffect, useRef } from 'react'
import { noop } from 'lodash'
import classnames from 'classnames'
import __ from './locale'
import styles from './styles.module.less'
import { dataTypeMapping } from '../DataConsanguinity/const'

// 字段输入框

interface FieldInputType {
    value?: string
    options: Array<any>
    onChange: (value: string) => void
    onSearch?: (searchKey: string) => void
    onPopupScroll?: (e: any, searchKey: string) => void
    optionLabelProp?: string
    onFocus?: () => void
    focusStatus?: boolean
    onPopLeftMove?: () => void
    onPopRightMove?: () => void
    allowType: string
    optionFilterProp?: string
}
export const FieldInput: FC<FieldInputType> = ({
    value,
    options,
    onChange,
    onSearch = noop,
    onPopupScroll = noop,
    optionLabelProp = '',
    onFocus = noop,
    focusStatus = false,
    onPopLeftMove = noop,
    onPopRightMove = noop,
    allowType = '',
    optionFilterProp = 'label',
}) => {
    const [keyword, setKeyword] = useState<string>('')
    const inputRef = useRef<HTMLDivElement | null>(null)
    const [displayName, setDisplayName] = useState<string>('')
    const [currentWidth, setCurrentWidth] = useState<number>(10)
    const currentRef = useRef<any>()
    const [allowOptions, setAllowOptions] = useState<Array<any>>([])
    const [selectedStatus, setSelectedStatus] = useState<boolean>(false)
    const [currentSelectedData, setCurrentSelectedData] = useState<string>('')

    useEffect(() => {
        if (value) {
            setDisplayName(
                options.find((item) => item.value === value)?.[
                    optionLabelProp || ''
                ] || '',
            )
            setCurrentSelectedData(
                options.find((item) => item.value === value)?.detail
                    ?.business_name || '',
            )
        }
        checkCurrentSelect(value)
    }, [value, options])

    useEffect(() => {
        setCurrentWidth(inputRef?.current?.offsetWidth || 10)
    }, [displayName, keyword])

    useEffect(() => {
        if (focusStatus) {
            currentRef.current?.focus()
        }
    }, [focusStatus])

    useEffect(() => {
        checkCurrentSelect(value)
        if (allowType === 'number') {
            setAllowOptions(
                options.filter((currentOption) =>
                    dataTypeMapping.number.includes(
                        currentOption?.detail?.data_type,
                    ),
                ),
            )
        } else {
            setAllowOptions(options)
        }
    }, [allowType, options])

    const checkCurrentSelect = (currentValue) => {
        const findData = options.find((item) => item.value === currentValue)
        if (
            allowType === 'number' &&
            !dataTypeMapping.number.includes(findData?.detail?.data_type)
        ) {
            setSelectedStatus(true)
        } else {
            setSelectedStatus(false)
        }
    }

    return (
        <div
            style={{ width: 'fit-content', margin: '0 4px' }}
            className={styles.fieldsSelectContainer}
        >
            <div ref={inputRef} className={styles.hiddenText}>
                {keyword || displayName}
            </div>
            <div
                style={{ width: `${currentWidth + 4}px`, height: '24px' }}
                className={classnames(styles.currentBackgroundContainer)}
            >
                <div
                    className={classnames(
                        selectedStatus ? styles.errorStatus : '',
                    )}
                />
            </div>
            <Select
                style={{
                    width: `${currentWidth}px`,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
                options={allowOptions}
                showSearch
                onSearch={(searchValue) => {
                    if (searchValue.length <= 128) {
                        setKeyword(searchValue)
                        onSearch(searchValue)
                    }
                }}
                onChange={(currrentValue, option) => {
                    setDisplayName(option[optionLabelProp || 'label'] || '')
                    onChange(currrentValue)
                }}
                value={
                    allowOptions.find(
                        (currentData) => currentData.value === value,
                    )
                        ? value
                        : currentSelectedData
                }
                searchValue={keyword}
                filterOption
                notFoundContent={
                    keyword ? __('抱歉，未找到匹配的结果') : __('暂无数据')
                }
                showArrow={false}
                popupClassName={styles.dropList}
                onPopupScroll={(e) => {
                    onPopupScroll(e, keyword)
                }}
                optionLabelProp={optionLabelProp || 'label'}
                optionFilterProp={optionFilterProp}
                onFocus={onFocus}
                getPopupContainer={(node) => node.parentNode || node}
                onKeyDown={(e) => {
                    if (
                        e.key === 'Backspace' &&
                        (e.target as HTMLInputElement).selectionEnd === 0
                    ) {
                        if (value) {
                            setDisplayName('')
                            setCurrentSelectedData('')
                            onChange('')
                        } else {
                            onPopLeftMove()
                        }
                    }
                    if (
                        e.key === 'ArrowLeft' &&
                        (e.target as HTMLInputElement).selectionEnd === 0
                    ) {
                        onPopLeftMove()
                    }
                    if (
                        e.key === 'ArrowRight' &&
                        (e.target as HTMLInputElement).selectionEnd ===
                            keyword.length
                    ) {
                        onPopRightMove()
                    }
                }}
                ref={currentRef}
            />
        </div>
    )
}

export default FieldInput
