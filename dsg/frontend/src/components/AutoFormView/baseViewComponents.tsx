import * as React from 'react'
import {
    ReactNode,
    useState,
    useEffect,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { noop } from 'lodash'
import classnames from 'classnames'
import { Button, Form, Typography, Tag } from 'antd'
import { CaretDownFilled, DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { DisplayInfoComponentType } from './helper'

export interface ViewConfig {
    type: DisplayInfoComponentType
    expand?: boolean
    onExpand?: (status) => void
    children?: {
        [key: string]: ViewConfig
    }
    label: string
    options?: Array<{
        label: string
        value: any
    }>
    valueKey?: string
    CustomComponent?: ReactNode
}

interface GroupViewType {
    title?: string
    expand?: boolean
    children: ReactNode
    ref?: any
}

export const GroupView: React.FC<GroupViewType> = forwardRef(
    ({ title = '', expand = false, children }: any, ref) => {
        const [expandStatus, setExpandStatus] = useState<boolean>(true)
        useImperativeHandle(ref, () => ({
            onExpand: () => {
                setExpandStatus(true)
            },
        }))
        return (
            <div>
                <div className={styles.groupHeaderContainer}>
                    <div className={styles.groupTitle}>{title}</div>
                    <div className={styles.groupExpand}>
                        {expand ? (
                            expandStatus ? (
                                <DownOutlined
                                    onClick={() => {
                                        setExpandStatus(false)
                                    }}
                                />
                            ) : (
                                <UpOutlined
                                    onClick={() => {
                                        setExpandStatus(true)
                                    }}
                                />
                            )
                        ) : null}
                    </div>
                </div>
                <div className={styles.groupLine} />
                <div
                    style={
                        expandStatus
                            ? {}
                            : {
                                  height: 0,
                                  overflow: 'hidden',
                              }
                    }
                >
                    {children}
                </div>
            </div>
        )
    },
)

/**
 * 分组组件
 * @param param0
 * @returns
 */
export const GroupView2: React.FC<GroupViewType> = forwardRef(
    ({ title = '', expand = false, children }: any, ref) => {
        const [expandStatus, setExpandStatus] = useState<boolean>(true)
        useImperativeHandle(ref, () => ({
            onExpand: () => {
                setExpandStatus(true)
            },
        }))
        return (
            <div>
                <div className={styles.groupTitleWrapper}>
                    <div
                        className={classnames(
                            styles.groupExpand,
                            !expandStatus && styles.unExpanded,
                        )}
                    >
                        <CaretDownFilled
                            onClick={() => {
                                setExpandStatus(!expandStatus)
                            }}
                        />
                        {/* {expand ? (
                            expandStatus ? (
                                <DownOutlined
                                    onClick={() => {
                                        setExpandStatus(false)
                                    }}
                                />
                            ) : (
                                <UpOutlined
                                    onClick={() => {
                                        setExpandStatus(true)
                                    }}
                                />
                            )
                        ) : null} */}
                    </div>
                    <div className={styles.groupTitle}>{title}</div>
                </div>
                <div
                    style={
                        expandStatus
                            ? {
                                  padding: '16px 0',
                              }
                            : {
                                  height: 0,
                                  overflow: 'hidden',
                                  marginBottom: '16px',
                              }
                    }
                >
                    {children}
                </div>
            </div>
        )
    },
)

/**
 * 单行文本预览
 * @param param0
 * @returns
 */
export const TextView = ({ initValue }: { initValue: string }) => {
    return (
        <div className={styles.textView} title={initValue}>
            {initValue || '--'}
        </div>
    )
}

/**
 * 带展开收起的文本域
 * @param param0
 * @returns
 */
export const TextAreaView = ({
    initValue,
    rows = 3,
    placement = 'bottom',
    onExpand = noop,
}: {
    initValue: string | ReactNode
    rows?: number
    placement?: 'bottom' | 'end'
    onExpand?: (expand: boolean) => void
}) => {
    const [ellipsis, setEllipsis] = useState<boolean>(false)
    const [visible, setVisible] = useState<boolean>(false) // 是否全部展示
    const { Paragraph, Text } = Typography

    useEffect(() => {
        setVisible(false)
    }, [initValue])
    useEffect(() => {
        onExpand(visible)
    }, [visible])
    return (
        <div className={styles.textAreaView}>
            <Paragraph
                ellipsis={
                    visible
                        ? false
                        : {
                              rows,
                              expandable: true,
                              onEllipsis: (status) => {
                                  setEllipsis(status)
                              },
                              symbol: (
                                  <span style={{ visibility: 'hidden' }}>
                                      {__('展开')}
                                      <DownOutlined />
                                  </span>
                              ),
                          }
                }
            >
                {initValue}
                {visible && placement === 'end' && (
                    <span
                        onClick={() => {
                            setVisible(false)
                        }}
                        style={{
                            fontSize: '12px',
                        }}
                        className={styles.expandBtn}
                    >
                        {__('收起')}
                        <UpOutlined />
                    </span>
                )}
            </Paragraph>
            {!visible && placement === 'end' && (
                <span
                    onClick={() => {
                        setVisible(true)
                    }}
                    style={{
                        visibility: ellipsis ? 'visible' : 'hidden',
                        fontSize: '12px',
                    }}
                    className={classnames(styles.endExpand, styles.expandBtn)}
                >
                    {__('展开')}
                    <DownOutlined
                        style={{
                            marginLeft: '8px',
                        }}
                    />
                </span>
            )}
            {ellipsis && placement === 'bottom' ? (
                <div className={styles.btn}>
                    {visible ? (
                        <Button
                            type="link"
                            onClick={() => {
                                setVisible(false)
                            }}
                            style={{
                                fontSize: '12px',
                            }}
                        >
                            {__('收起')}
                            <UpOutlined />
                        </Button>
                    ) : (
                        <Button
                            type="link"
                            onClick={() => {
                                setVisible(true)
                            }}
                            style={{
                                visibility: ellipsis ? 'visible' : 'hidden',
                                fontSize: '12px',
                            }}
                        >
                            {__('展开')}
                            <DownOutlined />
                        </Button>
                    )}
                </div>
            ) : null}
        </div>
    )
}

/**
 * 单行文本预览
 * @param param0
 * @returns
 */
export const SelectTextView = ({
    initValue,
    options,
}: {
    initValue: string
    options: Array<{
        value: any
        label: string
    }>
}) => {
    const text = options.find((option) => option.value === initValue)?.label
    return (
        <div className={styles.textView} title={text}>
            {text || '--'}
        </div>
    )
}

/**
 * 带展开收起的标签组件
 * @param param0
 * @returns
 */
export const TagTextView = ({
    initValue,
    valueKey,
    minRow = 3,
    maxTextLength = 15,
}: {
    initValue: Array<any>
    valueKey: string
    minRow?: number
    maxTextLength?: number
}) => {
    const [ellipsis, setEllipsis] = useState<boolean>(false)
    const [visible, setVisible] = useState<boolean>(false) // 是否全部展示
    const { Paragraph, Text } = Typography
    useEffect(() => {
        setVisible(false)
    }, [initValue])

    return (
        <div className={styles.textAreaView}>
            <div
                style={{
                    maxHeight: '230px',
                    overflowY: 'auto',
                }}
            >
                <Paragraph
                    ellipsis={
                        visible
                            ? false
                            : {
                                  rows: minRow,
                                  expandable: true,
                                  onEllipsis: (status) => {
                                      setEllipsis(status)
                                  },
                                  symbol: (
                                      <span style={{ visibility: 'hidden' }}>
                                          Expand
                                      </span>
                                  ),
                              }
                    }
                >
                    {initValue && initValue.length
                        ? initValue.map((value, index) => (
                              <Tag
                                  style={{
                                      height: '24px',
                                      background: 'rgba(0,0,0,0.04)',
                                      borderRadius: '2px',
                                      border: 0,
                                      marginBottom: '5px',
                                  }}
                                  title={valueKey ? value[valueKey] : value}
                                  key={index}
                              >
                                  {valueKey
                                      ? value[valueKey].length > maxTextLength
                                          ? `${value[valueKey].slice(
                                                0,
                                                maxTextLength,
                                            )}...`
                                          : value[valueKey]
                                      : value.length > maxTextLength
                                      ? `${value.slice(0, maxTextLength)}...`
                                      : value}
                              </Tag>
                          ))
                        : '--'}
                </Paragraph>
            </div>
            {ellipsis && (
                <div className={styles.btn}>
                    {visible ? (
                        <Button
                            type="link"
                            onClick={() => {
                                setVisible(false)
                            }}
                            style={{
                                fontSize: '12px',
                            }}
                        >
                            {__('收起')}
                            <UpOutlined />
                        </Button>
                    ) : (
                        <Button
                            type="link"
                            onClick={() => setVisible(true)}
                            style={{
                                visibility: ellipsis ? 'visible' : 'hidden',
                                fontSize: '12px',
                            }}
                        >
                            {__('展开')}
                            <DownOutlined />
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * 单行文本预览
 * @param param0
 * @returns
 */
export const BooleanText = ({ initValue }: { initValue: number }) => {
    return (
        <div className={styles.textView}>{initValue ? __('是') : __('否')}</div>
    )
}
