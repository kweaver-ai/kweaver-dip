import { useEffect, useState } from 'react'
import { Select } from 'antd'
import { SelectProps } from 'antd/es/select'
import { trim } from 'lodash'
import __ from './locale'
import styles from './styles.module.less'

interface IValidateRule {
    ruleReg: any
    msg: string
}
interface ITagsSelectProps extends SelectProps {
    onValChange?: (val: any) => void
    validateRule?: IValidateRule
    maxLength?: number
}
const TagsSelect = (props: ITagsSelectProps) => {
    const { value, validateRule, maxLength, onValChange, ...resProps } = props
    const [selectStatus, setSelectStatus] = useState<'' | 'warning' | 'error'>(
        '',
    )
    const [errMsg, setErrMsg] = useState<string>('')
    const [fieldValue, setFieldValue] = useState<string[]>(value || [])
    const [searchValue, setSearchValue] = useState<string>('')
    const [isChange, setIsChange] = useState<boolean>(false)

    useEffect(() => {
        if (value?.length) {
            setFieldValue(value)
        }
    }, [value])

    useEffect(() => {
        if (isChange) {
            onValChange?.(fieldValue)
        }
    }, [fieldValue, isChange])

    const handleDeselect = (val) => {
        setIsChange(true)
        const newValue = fieldValue.filter((item) => item !== val)
        setFieldValue(newValue)
    }

    return (
        <div className={styles.tagsSelectWrapper}>
            <Select
                className={styles.fieldSelect}
                mode="tags"
                value={fieldValue}
                placeholder={__('请输入技术名称，输入完后回车保存')}
                open={false}
                status={selectStatus}
                searchValue={searchValue}
                onSearch={setSearchValue}
                onDeselect={handleDeselect}
                onInputKeyDown={(e) => {
                    const val = e.currentTarget.value
                    const trimValue = trim(val)
                    setIsChange(true)

                    if (e.key === 'Enter' && trimValue) {
                        if (
                            validateRule?.ruleReg &&
                            !validateRule?.ruleReg?.test(trimValue)
                        ) {
                            setErrMsg(validateRule?.msg)
                            setSelectStatus('error')
                        } else if (maxLength && trimValue.length > maxLength) {
                            setSelectStatus('error')
                            setErrMsg(
                                __('长度不能超过 ${max} 个字符', {
                                    max: maxLength,
                                }),
                            )
                        } else if (fieldValue.includes(trimValue)) {
                            setSelectStatus('error')
                            setErrMsg(__('已存在，请重新输入'))
                        } else {
                            setSearchValue('')
                            const list = new Set([...fieldValue, trimValue])
                            setFieldValue(Array.from(list))
                            setErrMsg('')
                            setSelectStatus('')
                        }
                    }
                    if (!trimValue) {
                        setErrMsg('')
                        setSelectStatus('')
                    }
                }}
                {...resProps}
            />
            <div className={styles.errorText}>{errMsg}</div>
        </div>
    )
}

export default TagsSelect
