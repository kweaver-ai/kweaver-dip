import React, { ReactNode, useState, useMemo, useRef, useEffect } from 'react'
import { Dropdown, Button, Tooltip, Tag, Badge } from 'antd'
import type { DropdownProps } from 'antd'
import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons'
import cs from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import SearchFields from './SearchFields'
import Icons from '@/components/BussinessConfigure/Icons'
import { Expand } from '@/ui'
import { getFieldTypeIcon } from '../helper'
import { disabledField, disabledFieldTips } from '../const'

export interface FieldType {
    id: string
    name_en: string
    name: string
    [key: string]: any
}

interface Props {
    value: FieldType[]
    onChange?: (value: FieldType[]) => void
    disabledOptions?: FieldType[]
    options?: FieldType[]
    showRemove?: boolean
    showAdd?: boolean
}

const arrowStyle = { fontSize: 12, marginLeft: 6 }

const AnalysisDimension: React.FC<Props> = ({
    value,
    onChange,
    disabledOptions = [],
    options = [],
    showRemove = true,
    showAdd = true,
}) => {
    const [open, setOpen] = useState<boolean>(false)

    // 默认存在名称即字段未被删除
    const usefulValue = useMemo(() => {
        return value?.filter((o) => !!o?.name && !!o?.data_type)
    }, [value])
    const usefulOptions = useMemo(() => {
        return options?.filter((o) => !!o?.name && !!o?.data_type)
    }, [options])

    const handleAddFields = (fields) => {
        const isExist = usefulValue.some((item) => item.id === fields.id)
        if (isExist) return
        onChange?.([fields, ...usefulValue])
    }
    const handleRemoveFields = (fields) => {
        onChange?.(usefulValue.filter((item) => item?.id !== fields?.id))
    }

    const getPopupContainer = (() =>
        document.getElementById(
            'analysisDimension',
        )) as DropdownProps['getPopupContainer']
    const items = [
        {
            label: (
                <div style={{ height: 400, width: 320 }}>
                    <SearchFields
                        options={usefulOptions}
                        onClick={handleAddFields}
                        placeholder={__('搜索业务名称、技术名称')}
                        emptyDesc={__('暂无可添加维度')}
                        hideOptions={usefulValue}
                    />
                </div>
            ),
            key: '1',
        }, // 菜单项务必填写 key
    ]

    return (
        <div className={styles.analysisDimension} id="analysisDimension">
            <div className={styles.content}>
                <Expand
                    rows={6}
                    content={
                        <>
                            {showAdd && (
                                <Dropdown
                                    trigger={['click']}
                                    menu={{ items }}
                                    getPopupContainer={getPopupContainer}
                                    onOpenChange={(o) => setOpen(o)}
                                >
                                    <Button
                                        className={cs(
                                            styles.add,
                                            open && styles.open,
                                        )}
                                    >
                                        <span
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                            }}
                                        >
                                            {__('添加')}
                                            {open ? (
                                                <UpOutlined
                                                    style={arrowStyle}
                                                />
                                            ) : (
                                                <DownOutlined
                                                    style={arrowStyle}
                                                />
                                            )}
                                        </span>
                                    </Button>
                                </Dropdown>
                            )}
                            {usefulValue?.map((item: FieldType) => (
                                <Badge
                                    key={item?.id}
                                    count={
                                        disabledField(item) ? (
                                            <Tooltip
                                                overlayInnerStyle={{
                                                    color: 'rgb(0 0 0 / 85%)',
                                                    fontSize: 14,
                                                }}
                                                color="#fff"
                                                title={disabledFieldTips(item)}
                                                placement="right"
                                            >
                                                <InfoCircleOutlined
                                                    style={{
                                                        color: '#FF4D4F',
                                                        backgroundColor: '#fff',
                                                        zIndex: 9,
                                                        right: '6px',
                                                    }}
                                                />
                                            </Tooltip>
                                        ) : (
                                            0
                                        )
                                    }
                                >
                                    <Tooltip
                                        overlayInnerStyle={{
                                            color: 'rgb(0 0 0 / 85%)',
                                            fontSize: 14,
                                        }}
                                        color="#fff"
                                        title={
                                            <div>
                                                <div>
                                                    {`${__('业务名称')}：${
                                                        item?.name ||
                                                        item?.business_name ||
                                                        '--'
                                                    }`}
                                                </div>
                                                <div>
                                                    {`${__('技术名称')}：${
                                                        item?.name_en ||
                                                        item?.technical_name ||
                                                        '--'
                                                    }`}
                                                </div>
                                            </div>
                                        }
                                    >
                                        <Tag
                                            icon={getFieldTypeIcon(
                                                item?.original_data_type ||
                                                    item?.data_type,
                                            )}
                                            className={cs(
                                                styles.tag,
                                                disabledField(item) &&
                                                    styles.error,
                                            )}
                                            closable={
                                                showRemove &&
                                                !disabledOptions?.some(
                                                    (o) => o.id === item?.id,
                                                )
                                            }
                                            onClose={() =>
                                                handleRemoveFields(item)
                                            }
                                        >
                                            <span className={styles.text}>
                                                {item?.name?.length > 10
                                                    ? `${item?.name.slice(
                                                          0,
                                                          10,
                                                      )}...`
                                                    : item?.name}
                                            </span>
                                        </Tag>
                                    </Tooltip>
                                </Badge>
                            ))}
                        </>
                    }
                    expandTips={
                        <span
                            className={styles.expBtn}
                            style={{ marginTop: '4px' }}
                        >
                            {__('展开')}
                            <DownOutlined className={styles.expIcon} />
                        </span>
                    }
                    collapseTips={
                        <span
                            className={styles.expBtn}
                            style={{ marginTop: '-4px' }}
                        >
                            {__('收起')}
                            <UpOutlined className={styles.expIcon} />
                        </span>
                    }
                />
            </div>
        </div>
    )
}

export default AnalysisDimension
