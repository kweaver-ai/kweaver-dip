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
    MinusOutlined,
    PlusOutlined,
} from '@ant-design/icons'
import styles from './styles.module.less'
import { DragOutlined } from '@/icons'
import __ from '../locale'
import { formatError, getCategoryTreesNodeItem, userInfo } from '@/core'

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
    owners?: userInfo[]
    editId?: string
    notDeleted?: boolean
    onStartEdit?(): void
    onCancelEdit?(): void
    onSureEdit?(name: string, owner?: string): void
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
            owners = [],
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
        const [ownerValue, setOwnerValue] = useState<string | undefined>(
            data.ownner_uid || undefined,
        )

        const editable = useMemo(() => editId === data.id, [editId])

        useEffect(() => {
            if (editable) {
                checkNameRepeat()
            }
        }, [nameValue])

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
            // if (!commReg.test(value)) {
            //     setNameError(
            //         __(
            //             '仅支持中英文、数字、下划线、中划线，且不能以下划线和中划线开头',
            //         ),
            //     )
            //     return Promise.resolve(false)
            // }
            if (value === data.name) {
                setNameError(undefined)
                return Promise.resolve(true)
            }
            try {
                const res = await getCategoryTreesNodeItem(data.categoryId, {
                    node_id: data.id === 'newItemId' ? '' : data.id,
                    parent_id: data.parentId || data.categoryId,
                    name: value,
                })
                if (res?.repeat) {
                    setNameError(__('名称已存在，请重新输入'))
                    return Promise.resolve(false)
                }
                setNameError(undefined)
                return Promise.resolve(true)
            } catch (err) {
                formatError(err)
                return Promise.resolve(false)
            }
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
                    setOwnerValue(data.ownner_uid || undefined)
                    break
                case 'sure':
                    {
                        const res = await checkNameRepeat(trim(nameValue))
                        if (res) {
                            onSureEdit?.(trim(nameValue), ownerValue)
                        }
                    }
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
                        label: (
                            <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                                {__('取消')}
                            </span>
                        ),
                    },
                    {
                        key: 'sure',
                        label: __('确定'),
                    },
                ]
            }
            if (depth < 4) {
                return [
                    {
                        key: 'addChild',
                        label: __('新建子级'),
                    },
                    {
                        key: 'edit',
                        label: __('编辑'),
                    },
                    {
                        key: 'delete',
                        label: __('删除'),
                        popTitle: __('该节点包含子节点，确定删除吗？'),
                        disabled: notDeleted,
                    },
                ]
            }
            return [
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
                            {collapsed ? <PlusOutlined /> : <MinusOutlined />}
                        </div>
                    )}
                    <div className={styles['content-nameWrap']}>
                        {editable ? (
                            <div className={styles['content-nameWrap-edit']}>
                                <Input
                                    ref={inputRef}
                                    placeholder={__('请输入节点名称')}
                                    allowClear
                                    maxLength={32}
                                    value={nameValue}
                                    status={nameError ? 'error' : undefined}
                                    onChange={(e) => {
                                        setNameValue(e.target.value)
                                    }}
                                    onBlur={() => {
                                        checkNameRepeat(trim(nameValue))
                                    }}
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
                            <div
                                className={styles['content-nameWrap-name']}
                                title={data.name}
                                dangerouslySetInnerHTML={{
                                    __html: highLight(data.name),
                                }}
                            />
                        )}
                    </div>
                    {/* {!clone && (
                        <div className={styles['content-ownerWrap']}>
                            {editable ? (
                                <div
                                    className={styles['content-ownerWrap-edit']}
                                >
                                    <Select
                                        placeholder={__('请选择数据Owner')}
                                        allowClear
                                        value={ownerValue}
                                        onChange={(value) => {
                                            setOwnerValue(value)
                                        }}
                                        showSearch
                                        filterOption={(inputValue, option) => {
                                            const res = owners
                                                .filter(
                                                    (info) =>
                                                        info.name?.includes(
                                                            trim(inputValue),
                                                        ) ||
                                                        info.name?.match(
                                                            new RegExp(
                                                                trim(
                                                                    inputValue,
                                                                ).replace(
                                                                    /[.*+?^${}()|[\]\\]/g,
                                                                    '\\$&',
                                                                ),
                                                                'ig',
                                                            ),
                                                        ),
                                                )
                                                .filter(
                                                    (info) =>
                                                        info.id ===
                                                        option?.value,
                                                )
                                            return res.length > 0
                                        }}
                                        options={owners.map((info) => ({
                                            value: info.id,
                                            label: info.name,
                                        }))}
                                        notFoundContent={
                                            <div
                                                style={{
                                                    color: 'rgba(0, 0, 0, 0.45)',
                                                }}
                                            >
                                                {__('抱歉，没有找到相关内容')}
                                            </div>
                                        }
                                    />
                                </div>
                            ) : (
                                <span
                                    className={styles['content-ownerWrap-name']}
                                    title={data.owner}
                                >
                                    {data.owner || '--'}
                                </span>
                            )}
                        </div>
                    )} */}
                    {!clone && (
                        <div className={styles['content-operateWrap']}>
                            {getOptionMenus().map((item: any) => {
                                return (
                                    <Tooltip
                                        title={
                                            item.disabled
                                                ? __(
                                                      '启用中，需保留一条类目结构',
                                                  )
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
