import { Button, Checkbox, message, Modal, Space, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import { trim } from 'lodash'
import { CheckboxChangeEvent } from 'antd/es/checkbox'
import { SearchInput } from '@/ui'
import __ from './locale'
import styles from './styles.module.less'
import { ClearOutlined, UniqueFlagColored } from '@/icons'
import { formsQueryStandardItem, LoginEntityAttribute } from '@/core'
import Empty from '@/ui/Empty'
import emptyData from '@/assets/dataEmpty.svg'
import { getFieldTypeEelment } from '../DatasheetView/helper'

interface IAddAttributeFromForm {
    open: boolean
    onClose: () => void
    getBusinessFormFields: () => any[]
    onSuccess?: (attrs: LoginEntityAttribute[]) => void
    attributeIds: string[]
    fieldIds: string[]
    existAttrNames: string[]
}
const AddAttributeFromForm: React.FC<IAddAttributeFromForm> = ({
    open,
    onClose,
    getBusinessFormFields,
    onSuccess,
    attributeIds,
    fieldIds,
    existAttrNames = [],
}) => {
    const [searchKey, setSearchKey] = useState('')
    const [fields, setFields] = useState<any[]>([])
    const [showFields, setShowFields] = useState<any[]>([])
    const [indeterminate, setIndeterminate] = useState(false)
    const [checkAll, setCheckAll] = useState(false)
    const [checkedList, setCheckedList] = useState<any[]>([])

    const initFieldsData = () => {
        const data = getBusinessFormFields().map((f) => ({
            ...f,
            label: (
                <div className={styles['field-content']}>
                    {/* <Icons type={f.data_type} /> */}
                    <span
                        style={{
                            marginRight: 4,
                        }}
                    >
                        {getFieldTypeEelment(
                            {
                                ...f,
                                type: f.data_type,
                            },
                            16,
                        )}
                    </span>
                    <div
                        className={styles['field-name']}
                        title={
                            attributeIds.includes(f.id)
                                ? __('字段已关联属性')
                                : existAttrNames.includes(f.name)
                                ? __('与已存在属性重名，无法选择')
                                : f.name
                        }
                    >
                        {f.name}
                    </div>
                    {f.is_primary_key && (
                        <UniqueFlagColored className={styles['unique-flag']} />
                    )}
                </div>
            ),
            value: f.id,
            disabled:
                attributeIds.includes(f.id) || existAttrNames.includes(f.name),
        }))
        setFields(data)
        setShowFields(data)
    }

    const searchFields = () => {
        setShowFields(
            fields.filter((f) =>
                f.name
                    .toLocaleLowerCase()
                    .includes(searchKey.toLocaleLowerCase()),
            ),
        )
    }

    useEffect(() => {
        if (open) {
            initFieldsData()
        } else {
            setCheckedList([])
            setCheckAll(false)
            setIndeterminate(false)
        }
    }, [open])
    useEffect(() => {
        searchFields()
    }, [searchKey])

    useEffect(() => {
        if (showFields.every((f) => checkedList.includes(f.id))) {
            setIndeterminate(false)
            setCheckAll(true)
        } else if (showFields.some((f) => checkedList.includes(f.id))) {
            setIndeterminate(true)
            setCheckAll(false)
        } else {
            setIndeterminate(false)
            setCheckAll(false)
        }
    }, [showFields, checkedList])

    const onCheckAllChange = (e: CheckboxChangeEvent) => {
        const data = e.target.checked
            ? searchKey
                ? Array.from(
                      new Set([
                          ...showFields.map((f) => f.value),
                          ...checkedList,
                      ]),
                  )
                : showFields.map((f) => f.value)
            : // 从全部选中项中 包含搜索结果的选中项过滤掉
              checkedList.filter((id) => !showFields.find((f) => f.id === id))

        setCheckedList(data.filter((id) => !attributeIds.includes(id)))
    }

    const onChange = (list: any[]) => {
        let data = list
        if (searchKey) {
            data = Array.from(
                new Set([
                    ...list,
                    ...checkedList.filter(
                        (id) => !showFields.find((f) => f.id === id),
                    ),
                ]),
            )
        }
        setCheckedList(data.filter((id) => !attributeIds.includes(id)))
    }

    const handleClear = () => {
        setCheckedList([])
    }

    const getFieldStandardInfo = async (id: string) => {
        const res = await formsQueryStandardItem({
            id,
        })
        return res
    }

    const handleClick = async () => {
        const attrs: LoginEntityAttribute[] = await Promise.all(
            checkedList.map(async (item) => {
                const f = fields.find((field) => field.id === item)
                const params = {
                    id: f.id,
                    name: f.name,
                    field_id: fieldIds.includes(item) ? '' : f.id,
                    field_name: fieldIds.includes(item) ? '' : f.name,
                    unique: !!f.is_primary_key,
                }
                if (f.standard_id) {
                    const res = await formsQueryStandardItem({
                        id: f.standard_id,
                    })
                    return {
                        ...params,
                        standard_id: f.standard_id,
                        field_standard_info: res,
                    }
                }
                return params
            }),
        )
        onSuccess?.(attrs)
        onClose()
        message.success(__('添加成功'))
    }

    return (
        <Modal
            title={__('从业务表中添加属性')}
            width={480}
            open={open}
            onCancel={onClose}
            bodyStyle={{ height: 444, padding: '24px 10px' }}
            footer={
                <div className={styles['attribute-from-form']}>
                    <div className={styles.selectedCount}>
                        {__('已选：')}
                        {checkedList.length}
                        <Tooltip title={__('清空')}>
                            <ClearOutlined
                                className={styles.clearIcon}
                                onClick={handleClear}
                            />
                        </Tooltip>
                    </div>
                    <Space>
                        <Button onClick={onClose} className={styles.btn}>
                            {__('取消')}
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleClick}
                            disabled={checkedList.length === 0}
                            className={styles.btn}
                        >
                            {__('确定')}
                        </Button>
                    </Space>
                </div>
            }
        >
            <div className={styles['add-attribute-wrapper']}>
                <SearchInput
                    placeholder={__('搜索字段中文名称')}
                    onKeyChange={(kw: string) => {
                        setSearchKey(kw)
                    }}
                    onPressEnter={(e: any) =>
                        setSearchKey(
                            typeof e === 'string' ? e : trim(e.target.value),
                        )
                    }
                    style={{ marginLeft: 10, width: 440 }}
                />

                {showFields.length === 0 ? (
                    <div className={styles['empty-wrapper']}>
                        {searchKey ? (
                            <Empty />
                        ) : (
                            <Empty iconSrc={emptyData} desc={__('暂无数据')} />
                        )}
                    </div>
                ) : (
                    <>
                        <div className={styles['check-all']}>
                            <Checkbox
                                indeterminate={indeterminate}
                                onChange={onCheckAllChange}
                                checked={checkAll}
                                disabled={showFields.every((f) =>
                                    attributeIds.includes(f.id),
                                )}
                            >
                                {__('全选')}
                            </Checkbox>
                        </div>
                        <Checkbox.Group
                            options={showFields}
                            value={checkedList}
                            onChange={onChange}
                        />
                    </>
                )}
            </div>
        </Modal>
    )
}

export default AddAttributeFromForm
