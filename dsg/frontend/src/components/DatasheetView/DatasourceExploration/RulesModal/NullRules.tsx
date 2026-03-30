import React, { useEffect, useMemo, useState } from 'react'
import { Checkbox, Row, Col, Button, Input } from 'antd'
import { uniq, uniqBy } from 'lodash'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { AddOutlined, DeleteOutLined } from '@/icons'
import { SearchInput } from '@/ui'
import { useDataViewContext } from '../../DataViewProvider'
import { changeTypeToLargeArea } from '../helper'
import { dataTypeMap, numberType } from '../const'

interface INullRules {
    value?: any
    onChange?: (o) => void
    showError?: boolean
    isStorage?: boolean
    isEdit?: boolean
}

const NullRules: React.FC<INullRules> = ({
    value,
    onChange,
    showError,
    isStorage,
    isEdit,
}) => {
    const [options, setOptions] = useState<any>([])
    const [defaultRules, setDefaultRules] = useState<any>([])
    const [checked, setChecked] = useState<any>()
    const { isTemplateConfig, explorationData } = useDataViewContext()
    const [isInit, setIsInit] = useState<boolean>(true)

    useEffect(() => {
        if (!isInit) return
        let list: any[] = []
        const fieldType = changeTypeToLargeArea(
            explorationData?.activeField?.data_type,
        )
        if (fieldType === dataTypeMap.char) {
            list = ['NULL', ' ']
        }
        if (numberType.includes(fieldType)) {
            list = ['NULL', '0']
        } else if (
            fieldType === dataTypeMap.date ||
            fieldType === dataTypeMap.time ||
            fieldType === dataTypeMap.datetime ||
            fieldType === dataTypeMap.bool
        ) {
            list = ['NULL']
        }
        if (isTemplateConfig) {
            list = ['NULL', '0']
        }
        setOptions(
            list?.map((item, index) => ({
                name: item,
                id: index,
            })),
        )
        if (!isStorage && !isEdit) {
            onChange?.({ null: list })
        }
        setDefaultRules(list)
    }, [explorationData.activeField, isStorage, isEdit, isInit])

    useEffect(() => {
        if (defaultRules?.length && !isEdit && !isStorage) {
            setChecked((pre) => {
                const list = uniq([...defaultRules, ...(pre || [])])?.map(
                    (item, index) => index,
                )
                return list
            })
        }
    }, [defaultRules, isStorage, isEdit])

    useEffect(() => {
        if (value?.null && isInit) {
            const list = uniq([...defaultRules, ...(value?.null || [])])?.map(
                (item, index) => ({
                    name: item,
                    id: index,
                }),
            )
            setChecked((pre) => {
                const ops = uniqBy(list, 'name')
                const indexs: number[] = []
                ops.forEach((o, ind) => {
                    if (value?.null?.includes(o?.name)) {
                        indexs.push(ind)
                    }
                })
                return [...indexs, ...(pre || [])]
            })
            setOptions((pre) => uniqBy([...pre, ...list], 'name'))
        }
    }, [value, isInit])

    const onCheckChange = (checkedValues: any[]) => {
        setChecked(checkedValues)
        setIsInit(false)
        onChange?.({
            null: options
                ?.filter((item) => checkedValues.includes(item.id))
                ?.map((item) => item.name),
        })
    }

    const addRules = () => {
        const id = (options?.[options.length - 1]?.id || 0) + 1
        const list = [...options, { name: '', id }]
        setOptions(list)
        const checkeds = [...checked, id]
        setChecked(checkeds)
        setIsInit(false)
        onChange?.({
            null: list
                ?.filter((item) => checkeds.includes(item.id))
                ?.map((item) => item.name),
        })
    }

    return (
        <div className={styles.nullRulesWrapper}>
            <Checkbox.Group
                style={{ width: '100%' }}
                value={checked}
                onChange={onCheckChange}
            >
                <Row>
                    {options.map((item, index) => {
                        return (
                            <Col
                                key={item.id}
                                span={12}
                                className={styles.ruleCol}
                            >
                                <Checkbox
                                    value={item.id}
                                    disabled={
                                        !isTemplateConfig &&
                                        item.name === 'NULL'
                                    }
                                >
                                    {defaultRules.includes(item.name) ? (
                                        item.name === ' ' ? (
                                            __('空字符串')
                                        ) : (
                                            item.name
                                        )
                                    ) : (
                                        <div className={styles.inpRule}>
                                            <SearchInput
                                                placeholder={__(
                                                    '请输入您认为是空值的字符',
                                                )}
                                                className={classnames(
                                                    styles.input,
                                                    !item.name &&
                                                        showError &&
                                                        styles.errInput,
                                                )}
                                                showIcon={false}
                                                maxLength={128}
                                                value={item.name}
                                                onBlur={(e) => {
                                                    const val =
                                                        e.target?.value?.trim()
                                                    const newOptions = [
                                                        ...options,
                                                    ]
                                                    newOptions[index].name = val
                                                    setOptions(newOptions)
                                                    onChange?.({
                                                        null: newOptions
                                                            ?.filter((it) =>
                                                                checked.includes(
                                                                    it.id,
                                                                ),
                                                            )
                                                            ?.map(
                                                                (it) => it.name,
                                                            ),
                                                    })
                                                }}
                                                allowClear={false}
                                            />
                                            <DeleteOutLined
                                                className={styles.delIcon}
                                                onClick={() => {
                                                    setIsInit(false)
                                                    const list = options.filter(
                                                        (it, ind) =>
                                                            ind !== index,
                                                    )
                                                    setOptions(list)
                                                    if (
                                                        checked?.includes(
                                                            item?.id,
                                                        )
                                                    ) {
                                                        onChange?.({
                                                            null: list
                                                                ?.filter((it) =>
                                                                    checked.includes(
                                                                        it.id,
                                                                    ),
                                                                )
                                                                ?.map(
                                                                    (it) =>
                                                                        it.name,
                                                                ),
                                                        })
                                                    }
                                                }}
                                            />
                                        </div>
                                    )}
                                </Checkbox>
                            </Col>
                        )
                    })}
                </Row>
            </Checkbox.Group>
            <div>
                <Button
                    onClick={() => addRules()}
                    type="link"
                    icon={<AddOutlined />}
                    className={styles['row-filter-add']}
                >
                    {__('新增配置')}
                </Button>
            </div>
        </div>
    )
}

export default NullRules
