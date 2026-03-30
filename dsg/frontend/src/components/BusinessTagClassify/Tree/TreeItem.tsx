import React, {
    CSSProperties,
    forwardRef,
    HTMLAttributes,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'
import { Input, InputRef, Popconfirm, Select, Tooltip } from 'antd'
import { trim } from 'lodash'
import {
    InfoCircleFilled,
    CloseOutlined,
    CheckOutlined,
    RightOutlined,
    DownOutlined,
} from '@ant-design/icons'
import styles from './styles.module.less'
import { FontIcon, DragOutlined } from '@/icons'
import __ from '../locale'
import { commReg } from '@/utils'

export interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
    childCount?: number
    clone?: boolean
    collapsed?: boolean
    depth: number
    disableInteraction?: boolean
    ghost?: boolean
    handleProps?: any
    indentationWidth: number
    keyword?: string
    data: any
    editId?: string
    notDeleted?: boolean
    onStartEdit?(): void
    onCancelEdit?(): void
    onSureEdit?(name: string): void
    onAddChild?(): void
    onRemove?(): void
    onCollapse?(): void
    wrapperRef?(node: HTMLDivElement): void
}

export const TreeItem = forwardRef<HTMLDivElement, Props>(
    (
        {
            childCount,
            clone,
            depth,
            disableInteraction,
            ghost,
            handleProps,
            indentationWidth,
            collapsed,
            onCollapse,
            onRemove,
            onStartEdit,
            onCancelEdit,
            onSureEdit,
            onAddChild,
            style,
            keyword,
            data,
            editId,
            notDeleted,
            wrapperRef,
            ...props
        },
        ref,
    ) => {
        const inputRef = useRef<InputRef>(null)
        const [nameValue, setNameValue] = useState<string>()
        const [nameError, setNameError] = useState<string>()

        const editable = useMemo(() => editId === data.id, [editId])

        // useEffect(() => {
        //     if (editable) {
        //         checkNameRepeat()
        //     }
        // }, [nameValue])

        useEffect(() => {
            if (editId === 'newItemId') {
                setNameError(undefined)
                setTimeout(() => {
                    inputRef?.current?.focus({
                        cursor: 'end',
                    })
                }, 0)
            }
        }, [editId])

        const checkNameRepeat = async (
            value: string = nameValue || '',
        ): Promise<boolean> => {
            if (!value) {
                setNameError(__('输入不能为空'))
                return Promise.resolve(false)
            }
            if (!commReg.test(value)) {
                setNameError(
                    __(
                        '仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头',
                    ),
                )
                return Promise.resolve(false)
            }
            if (value === data.name) {
                setNameError(undefined)
                return Promise.resolve(true)
            }
            setNameError(undefined)
            return Promise.resolve(true)
            // try {
            //     const res = await getCategoryTreesNodeItem(data.categoryId, {
            //         node_id: data.id === 'newItemId' ? '' : data.id,
            //         parent_id: data.parentId || data.categoryId,
            //         name: value,
            //     })
            //     if (res?.repeat) {
            //         setNameError(__('名称已存在，请重新输入'))
            //         return Promise.resolve(false)
            //     }
            //     setNameError(undefined)
            //     return Promise.resolve(true)
            // } catch (err) {
            //     formatError(err)
            //     return Promise.resolve(false)
            // }
        }

        const handleOption = async (key: string) => {
            switch (key) {
                case 'cancel':
                    if (editId === 'newItemId') {
                        onRemove?.()
                    }
                    onCancelEdit?.()
                    setNameValue(undefined)
                    setNameError(undefined)
                    break
                case 'sure':
                    {
                        const res = await checkNameRepeat(trim(nameValue))
                        if (res) {
                            onSureEdit?.(trim(nameValue))
                        }
                        onSureEdit?.(trim(nameValue))
                    }
                    onSureEdit?.(trim(nameValue))
                    break
                case 'addChild':
                    onAddChild?.()
                    break
                case 'delete':
                    onRemove?.()
                    break
                case 'edit':
                    setNameValue(data.name)
                    onStartEdit?.()
                    setTimeout(() => {
                        inputRef?.current?.focus({
                            cursor: 'end',
                        })
                    }, 0)
                    break
                default:
                    break
            }
        }

        const getOptionMenus = () => {
            if (editable) {
                return [
                    {
                        key: 'cancel',
                        label: <CloseOutlined />,
                    },
                    {
                        key: 'sure',
                        label: <CheckOutlined />,
                    },
                ]
            }
            return [
                {
                    key: 'addChild',
                    label: __('添加'),
                    disabled: depth > 8,
                },
                {
                    key: 'edit',
                    label: __('编辑'),
                },
                {
                    key: 'delete',
                    label: __('删除'),
                    popTitle: __('该节点包含子节点，确定删除吗？'),
                },
            ]
        }

        const highLight = (str: string) => {
            if (!keyword || keyword === '') return str
            const regex = new RegExp(keyword, 'gi')
            return str?.replace(
                regex,
                (match) => `<span style="color: #ff6304">${match}</span>`,
            )
        }

        return (
            <div
                className={classNames(
                    styles.treeItem,
                    clone && styles.clone,
                    ghost && styles.ghost,
                    disableInteraction && styles.disableInteraction,
                    editable && styles.editable,
                    editId && !editable && styles['not-edit'],
                )}
                ref={wrapperRef}
                style={style}
                {...props}
            >
                {!clone ? (
                    !editId ? (
                        <div {...handleProps} ref={ref} className={styles.drag}>
                            <DragOutlined />
                        </div>
                    ) : (
                        <div className={styles['treeItem-dragPlace']} />
                    )
                ) : null}
                <div
                    className={styles.content}
                    style={{
                        marginLeft: clone ? 0 : `${indentationWidth * depth}px`,
                    }}
                >
                    {!clone && (
                        <div
                            className={classNames(
                                styles['content-collapse'],
                                collapsed && styles.collapsed,
                            )}
                            style={{
                                visibility: onCollapse ? 'visible' : 'hidden',
                            }}
                            onClick={onCollapse}
                        >
                            {collapsed ? <RightOutlined /> : <DownOutlined />}
                        </div>
                    )}
                    <div className={styles['content-nameWrap']}>
                        {editable ? (
                            <div className={styles['content-nameWrap-edit']}>
                                <Input
                                    ref={inputRef}
                                    placeholder={__('请输入标签名称')}
                                    allowClear
                                    maxLength={30}
                                    value={nameValue}
                                    status={nameError ? 'error' : undefined}
                                    onChange={(e) => {
                                        setNameValue(e.target.value)
                                    }}
                                    // onBlur={() => {
                                    //     checkNameRepeat(trim(nameValue))
                                    // }}
                                />
                                {nameError && (
                                    <span
                                        className={
                                            styles[
                                                'content-nameWrap-edit-error'
                                            ]
                                        }
                                        title={nameError}
                                    >
                                        {nameError}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className={styles['content-nameWrap-box']}>
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    style={{
                                        marginTop: '2px',
                                        fontSize: '16px',
                                    }}
                                />
                                <div
                                    className={styles['content-nameWrap-name']}
                                    title={data.name}
                                    dangerouslySetInnerHTML={{
                                        __html: highLight(data.name),
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    {!clone && (
                        <div className={styles['content-operateWrap']}>
                            {getOptionMenus().map((item: any) => {
                                return (
                                    <Tooltip
                                        title={
                                            item.disabled
                                                ? __('标签层级已达上限（10）')
                                                : ''
                                        }
                                    >
                                        {onCollapse && item.popTitle ? (
                                            <Popconfirm
                                                disabled={item.disabled}
                                                title={item.popTitle}
                                                okText={__('确定')}
                                                cancelText={__('取消')}
                                                onConfirm={() => {
                                                    handleOption(item.key)
                                                }}
                                                key={item.label}
                                                icon={
                                                    <InfoCircleFilled
                                                        style={{
                                                            color: '#faad14',
                                                            fontSize: '16px',
                                                        }}
                                                    />
                                                }
                                                placement="topRight"
                                                getPopupContainer={(n) =>
                                                    n.parentElement || n
                                                }
                                            >
                                                <a
                                                    className={classNames(
                                                        styles[
                                                            'content-operateWrap-item'
                                                        ],
                                                        item.disabled &&
                                                            styles.item_disabled,
                                                    )}
                                                >
                                                    {item.label}
                                                </a>
                                            </Popconfirm>
                                        ) : (
                                            <a
                                                className={classNames(
                                                    styles[
                                                        'content-operateWrap-item'
                                                    ],
                                                    item.disabled &&
                                                        styles.item_disabled,
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (item.disabled) {
                                                        return
                                                    }
                                                    handleOption(item.key)
                                                }}
                                            >
                                                {item.label}
                                            </a>
                                        )}
                                    </Tooltip>
                                )
                            })}
                        </div>
                    )}
                    {clone && childCount && childCount > 1 ? (
                        <span className={styles['content-count']}>
                            {childCount}
                        </span>
                    ) : null}
                </div>
            </div>
        )
    },
)
