import React, { useEffect, useRef, useState } from 'react'
import type { InputProps, InputRef } from 'antd'
import { Button, Input, Tag, theme } from 'antd'
import { AddOutlined, FontIcon } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'

interface ITags {
    value?: string[]
    onChange?: (value: string[]) => void
    isShowAdd?: boolean
    width?: number
    btnName?: string
    inputProps?: InputProps
}
const Tags: React.FC<ITags> = ({
    value,
    onChange,
    isShowAdd = true,
    width,
    btnName = __('添加'),
    inputProps = {},
}) => {
    const [tags, setTags] = useState<string[]>([])
    const [inputVisible, setInputVisible] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<InputRef>(null)

    useEffect(() => {
        if (value) {
            setTags(value)
        }
    }, [value])

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus()
        }
    }, [inputVisible])

    const handleClose = (removedTag: string) => {
        const newTags = tags.filter((tag) => tag !== removedTag)
        onChange?.(newTags)
    }

    const showInput = () => {
        setInputVisible(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleInputConfirm = () => {
        if (inputValue && tags.indexOf(inputValue) === -1) {
            onChange?.([...tags, inputValue])
        }
        setInputVisible(false)
        setInputValue('')
    }

    const forMap = (tag: string) => (
        <div key={tag} className={styles['tag-container']}>
            <div className={styles.tag}>{tag}</div>
            <FontIcon
                name="icon-yichu"
                className={styles['remove-icon']}
                onClick={(e) => {
                    handleClose(tag)
                }}
            />
        </div>
    )

    const tagChild = tags.map(forMap)

    return (
        <div
            style={{ marginBottom: 16, width }}
            className={styles['tags-wrapper']}
        >
            {tagChild}
            {isShowAdd &&
                (inputVisible ? (
                    <Input
                        ref={inputRef}
                        type="text"
                        size="small"
                        style={{ width: 80, height: 32 }}
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputConfirm}
                        onPressEnter={handleInputConfirm}
                        {...inputProps}
                    />
                ) : (
                    <Button onClick={showInput} icon={<AddOutlined />}>
                        {btnName}
                    </Button>
                ))}
        </div>
    )
}

export default Tags
