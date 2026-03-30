import React, {
    useEffect,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { PlusOutlined } from '@ant-design/icons'
import type { InputRef } from 'antd'
import { Space, Input, Tag, Tooltip, Button, Form } from 'antd'
import { keyboardInputValidator } from '@/utils/validate'
import styles from './styles.module.less'

interface ITags {
    id: string
    name: string
}

interface ITagsList {
    ref?: any
    defaultData?: ITags[]
    showAddBtn?: boolean
    max?: number
    allowEdit?: boolean
    closable?: boolean
    setTagList?: (tags: ITags[]) => void
}
const TagsList: React.FC<ITagsList> = forwardRef((props: any, ref) => {
    const {
        defaultData,
        showAddBtn = true,
        max,
        setTagList,
        allowEdit = true,
        closable = true,
    } = props
    const [tags, setTags] = useState(defaultData || [])
    const [inputVisible, setInputVisible] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [editInputIndex, setEditInputIndex] = useState(-1)
    const [editInputValue, setEditInputValue] = useState('')
    const inputRef = useRef<InputRef>(null)
    const editInputRef = useRef<InputRef>(null)
    const [form] = Form.useForm()

    useImperativeHandle(ref, () => ({
        tags,
    }))

    useEffect(() => {
        if (inputVisible) {
            inputRef.current?.focus()
        }
    }, [inputVisible])

    useEffect(() => {
        setTags(defaultData)
    }, [defaultData])

    useEffect(() => {
        editInputRef.current?.focus()
    }, [inputValue])

    const handleClose = (removedTag: string) => {
        const newTags = tags.filter((tag) => tag.name !== removedTag)
        setTagList(newTags)
        setTags(newTags)
    }

    const showInput = () => {
        setInputVisible(true)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleInputConfirm = () => {
        form.validateFields().then(() => {
            if (
                inputValue &&
                tags.map((item) => item.name).indexOf(inputValue) === -1
            ) {
                const newTags = [
                    ...tags,
                    ...[{ name: inputValue, id: `${new Date().getTime()}` }],
                ]
                setTags(newTags)
                setTagList(newTags)
            }
            setInputVisible(false)
            setInputValue('')
            form.setFieldValue('addInput', '')
        })
    }

    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditInputValue(e.target.value)
    }

    const handleEditInputConfirm = () => {
        form.validateFields().then(() => {
            const newTags = [...tags]
            newTags[editInputIndex].name =
                editInputValue || newTags[editInputIndex].name
            setTags(newTags)
            setEditInputIndex(-1)
            setInputValue('')
            form.setFieldValue('editInput', '')
        })
    }

    const tagInputStyle: React.CSSProperties = {
        width: 120,
        verticalAlign: 'top',
        marginRight: '10px',
    }

    return (
        <Form form={form} autoComplete="off">
            <Space size={[0, 8]} wrap className={styles.tagBox}>
                <Space size={[0, 8]} wrap>
                    {tags.map((tag, index) => {
                        if (editInputIndex === index) {
                            return (
                                <Form.Item
                                    rules={[
                                        {
                                            validator: keyboardInputValidator(),
                                        },
                                    ]}
                                    validateFirst
                                    name="editInput"
                                >
                                    <Input
                                        ref={editInputRef}
                                        key={tag.id}
                                        size="small"
                                        style={tagInputStyle}
                                        value={editInputValue}
                                        maxLength={10}
                                        onChange={handleEditInputChange}
                                        onBlur={handleEditInputConfirm}
                                        onPressEnter={handleEditInputConfirm}
                                    />
                                </Form.Item>
                            )
                        }
                        const isLongTag = tag?.name?.length > 8
                        const tagElem = (
                            // <Form.Item validateFirst name="tag">
                            <Tag
                                key={tag.id}
                                style={{ userSelect: 'none' }}
                                closable={closable}
                                onClose={() => handleClose(tag.name)}
                            >
                                <span
                                    onDoubleClick={(e) => {
                                        if (allowEdit) {
                                            setEditInputIndex(index)
                                            setEditInputValue(tag.name)
                                            form.setFieldValue(
                                                'editInput',
                                                tag.name,
                                            )
                                            e.preventDefault()
                                        }
                                    }}
                                >
                                    {isLongTag
                                        ? `${tag.name.slice(0, 8)}...`
                                        : tag.name}
                                </span>
                            </Tag>
                            // </Form.Item>
                        )
                        return isLongTag ? (
                            <Tooltip title={tag.name} key={tag.name}>
                                {tagElem}
                            </Tooltip>
                        ) : (
                            tagElem
                        )
                    })}

                    {inputVisible ? (
                        <Form.Item
                            rules={[
                                {
                                    validator: keyboardInputValidator(),
                                },
                            ]}
                            validateFirst
                            name="addInput"
                        >
                            <Input
                                ref={inputRef}
                                type="text"
                                size="small"
                                style={tagInputStyle}
                                value={inputValue}
                                maxLength={10}
                                onChange={handleInputChange}
                                onBlur={handleInputConfirm}
                                onPressEnter={handleInputConfirm}
                            />
                        </Form.Item>
                    ) : showAddBtn ? (
                        <Button
                            disabled={max ? tags.length === max : false}
                            onClick={showInput}
                        >
                            <PlusOutlined /> 填写
                        </Button>
                    ) : null}
                </Space>
            </Space>
        </Form>
    )
})

export default TagsList
