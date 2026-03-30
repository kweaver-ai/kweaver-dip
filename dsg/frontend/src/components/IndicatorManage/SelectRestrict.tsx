import { FC, ReactNode, useEffect, useState } from 'react'
import { Button, Input, Select } from 'antd'
import { noop } from 'lodash'
import { SearchOutlined } from '@ant-design/icons'
import __ from './locale'
import styles from './styles.module.less'

interface ISelectRestrict {
    options: Array<any>
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
}
const SelectRestrict: FC<ISelectRestrict> = ({
    options,
    value,
    onChange = noop,
    placeholder,
}) => {
    const [dataOptions, setDataOption] = useState<Array<any>>([])
    const [searchKey, setSearchKey] = useState<string>('')
    const [newOptionData, setNewOptionData] = useState<string>('')
    const [open, setOpen] = useState(false)

    useEffect(() => {
        filterOptions(searchKey)
    }, [options, value])

    useEffect(() => {
        filterOptions(searchKey)
    }, [searchKey])

    useEffect(() => {
        if (!dataOptions.length && searchKey) {
            setNewOptionData(searchKey)
        } else {
            setNewOptionData('')
        }
    }, [dataOptions])

    useEffect(() => {
        setSearchKey('')
    }, [open])

    const filterOptions = (searchValue) => {
        const findData = options.find((item) => item.value === value)
        const regex = new RegExp(searchKey ?? '', 'i')

        if (findData) {
            if (value) {
                setDataOption(options.filter((item) => regex.test(item)))
            } else {
                setDataOption(options)
            }
        } else if (value) {
            setDataOption(
                [{ label: value, value }, ...options].filter((item) =>
                    regex.test(item),
                ),
            )
        } else {
            setDataOption(options)
        }
    }

    const selectDropdown = (originNode: ReactNode) => {
        return (
            <div className={styles.selectRestrictContainer}>
                <div className={styles.searchInputContainer}>
                    <div className={styles.inputContainer}>
                        <Input
                            value={searchKey}
                            onChange={(e) => {
                                setSearchKey(e.target.value)
                            }}
                            prefix={<SearchOutlined />}
                            placeholder={__('搜索/自定义限定内容')}
                            bordered={false}
                            allowClear
                        />
                        {searchKey ? (
                            <Button
                                type="link"
                                onClick={() => {
                                    onChange(searchKey)
                                    setOpen(false)
                                }}
                            >
                                {__('添加')}
                            </Button>
                        ) : (
                            ''
                        )}
                    </div>
                </div>
                <div>{originNode}</div>
            </div>
        )
    }
    return (
        <Select
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            options={dataOptions}
            dropdownRender={selectDropdown}
            notFoundContent={
                <div style={{ color: 'rgba(0,0,0,0.45)' }}>
                    {__('未找到匹配的结果，可点击【添加】按钮自定义添加')}
                </div>
            }
            open={open}
            onDropdownVisibleChange={(visible) => setOpen(visible)}
            style={{ width: '100%' }}
        />
    )
}

export default SelectRestrict
