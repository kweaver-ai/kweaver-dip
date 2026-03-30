import {
    FC,
    useState,
    useRef,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { useDebounce } from 'ahooks'
import classnames from 'classnames'
import { AutoComplete, AutoCompleteProps } from 'antd'

import { noop, trim } from 'lodash'
import styles from './styles.module.less'
import { operationOptions } from './const'

interface CustomerInputType extends AutoCompleteProps {
    ref?: any
    onPopDelete?: () => void
    focusStatus?: boolean
    onPopLeftMove?: () => void
    onPopRightMove?: () => void
    needChecked?: boolean
    checkInputStatus?: (value: string) => boolean
    checkIsLabel?: (value: string) => boolean
    isNeedFilter?: boolean
}
const CustomerInput: FC<CustomerInputType> = forwardRef(
    (dataProps: any, ref) => {
        const {
            defaultValue = '',
            onChange = noop,
            options,
            onPopDelete = noop,
            focusStatus,
            onPopLeftMove = noop,
            onPopRightMove = noop,
            needChecked = false,
            checkInputStatus = () => true,
            checkIsLabel = () => false,
            value,
            isNeedFilter = true,
            ...props
        } = dataProps
        const currentRef = useRef<any>()
        const inputRef = useRef<HTMLDivElement | null>(null)
        const [InputValue, setInputValue] = useState<string>(defaultValue)
        const [currentWidth, setCurrentWidth] = useState<number>(10)

        useEffect(() => {
            setCurrentWidth(inputRef?.current?.offsetWidth || 10)
        }, [InputValue])

        useEffect(() => {
            setInputValue(value)
        }, [value])

        useImperativeHandle(ref, () => ({
            onFocus: () => {
                currentRef.current?.focus()
            },
        }))

        useEffect(() => {
            if (focusStatus) {
                currentRef.current?.focus()
            }
        }, [focusStatus])

        return (
            <div
                className={styles.customerInput}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                <div ref={inputRef} className={styles.hiddenText}>
                    {InputValue}
                </div>
                <div
                    style={{ width: `${currentWidth + 4}px`, height: '24px' }}
                    className={classnames(
                        styles.currentBackgroundContainer,
                        checkIsLabel(InputValue) && needChecked
                            ? styles.currentBackground
                            : '',
                    )}
                >
                    <div
                        className={classnames(
                            checkInputStatus(InputValue)
                                ? ''
                                : styles.errorStatus,
                        )}
                    />
                </div>
                <AutoComplete
                    defaultValue={defaultValue}
                    onChange={(currentValue, option) => {
                        setInputValue(trim(currentValue))
                        onChange(trim(currentValue), option)
                    }}
                    style={{
                        width: `${currentWidth}px`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        background: 'transparent',
                        padding: '0 5px',
                    }}
                    options={options || operationOptions}
                    popupClassName={styles.dropList}
                    {...props}
                    value={InputValue}
                    filterOption={(currentValue, option) => {
                        return isNeedFilter
                            ? (option?.value as string)
                                  ?.toLocaleLowerCase()
                                  .includes(currentValue.toLocaleLowerCase())
                            : true
                    }}
                    onKeyDown={(e) => {
                        if (
                            e.key === 'Backspace' &&
                            (e.target as HTMLInputElement).selectionEnd === 0
                        ) {
                            onPopDelete()
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
                                InputValue.length
                        ) {
                            onPopRightMove()
                        }
                    }}
                    ref={currentRef}
                />
            </div>
        )
    },
)

export default CustomerInput
