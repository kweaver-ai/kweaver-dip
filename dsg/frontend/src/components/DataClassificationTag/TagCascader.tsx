import { Cascader } from 'antd'
import React, { useEffect, useState } from 'react'
import { FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import {
    DataGradeLabelType,
    IGradeLabel,
    formatError,
    getDataGradeLabel,
} from '@/core'
import { findNodeById, generateFullPathData } from '../FormGraph/helper'

interface ITagCascader {
    value?: string | string[]
    onChange?: () => void
}
const TagCascader: React.FC<ITagCascader> = ({
    onChange = (val) => {},
    value,
}) => {
    const [tagOptions, setTagOptions] = useState<any>([])
    const [tagData, setTagData] = useState<IGradeLabel[]>([])
    const [val, setVal] = useState<string[]>()

    const generateTagItem = (dataArr: any[]) => {
        return dataArr.map((item) => {
            if (item.node_type === DataGradeLabelType.Node) {
                return {
                    ...item,
                    label: (
                        <>
                            <FontIcon
                                name="icon-biaoqianicon"
                                style={{ color: item.icon, marginRight: 4 }}
                            />
                            <span title={item.name}>{item.name}</span>
                        </>
                    ),
                    value: item.id,
                }
            }
            if (item.node_type === DataGradeLabelType.Group) {
                return {
                    ...item,
                    label: item.name,
                    value: item.id,
                    children:
                        item.children?.length > 0
                            ? generateTagItem(item.children)
                            : [
                                  {
                                      label: <div>暂无数据</div>,
                                      value: '',
                                      disabled: true,
                                  },
                              ],
                }
            }

            return item
        })
    }

    useEffect(() => {
        if (value && tagData.length > 0) {
            if (Array.isArray(value)) {
                setVal(value)
            } else if (typeof value === 'string') {
                const res = findNodeById(tagData, value)
                if (res) {
                    setVal(res.path)
                }
            }
        }
    }, [value, tagData])

    const getClassificationTag = async () => {
        try {
            const res = await getDataGradeLabel({ keyword: '' })
            generateFullPathData(res?.entries || [], [])
            setTagData(res?.entries || [])
            setTagOptions(generateTagItem(res?.entries || []))
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getClassificationTag()
    }, [])

    const displayRender = (label, selectedOptions) => {
        if (Array.isArray(selectedOptions) && selectedOptions.length > 0) {
            const displayTextArr = selectedOptions
                ?.map((item) => item?.name)
                .join('/')
            const tagInfo = selectedOptions[selectedOptions.length - 1]
            return (
                <span>
                    <FontIcon
                        name="icon-biaoqianicon"
                        style={{
                            color: tagInfo?.icon || tagInfo?.label_icon,
                            marginRight: 4,
                        }}
                    />
                    <span title={tagInfo?.name}>{displayTextArr}</span>
                </span>
            )
        }
        return <span />
    }
    return (
        <Cascader
            className={styles.tagCascaderWrapper}
            placeholder={__('请选择数据分级')}
            options={tagOptions}
            getPopupContainer={(cn) => cn.parentNode}
            displayRender={displayRender}
            onChange={(e) => {
                setVal(e as string[])
                onChange?.(e)
            }}
            value={val}
            style={{ width: '100%' }}
            allowClear
        />
    )
}

export default TagCascader
