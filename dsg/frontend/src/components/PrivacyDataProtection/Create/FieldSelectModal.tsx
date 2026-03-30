import { Modal, Input, Checkbox, List } from 'antd'
import { useState, useMemo, useEffect } from 'react'
import __ from '../locale'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty, SearchInput } from '@/ui'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import styles from './styles.module.less'

interface FieldSelectModalProps {
    visible: boolean
    fieldList: any[]
    initialSelected?: any[]
    onCancel: () => void
    onSubmit: (selectedField: any[]) => void
}

const FieldSelectModal = ({
    visible,
    fieldList,
    initialSelected = [],
    onCancel,
    onSubmit,
}: FieldSelectModalProps) => {
    const [selectedField, setSelectedField] = useState<any[]>([])
    const [searchText, setSearchText] = useState('')
    const [indeterminate, setIndeterminate] = useState(false)

    // 过滤后的字段列表
    const filteredFields = useMemo(() => {
        return fieldList.filter((item) =>
            item.business_name.toLowerCase().includes(searchText.toLowerCase()),
        )
    }, [fieldList, searchText])

    // 添加重置逻辑
    useEffect(() => {
        if (visible && initialSelected?.length) {
            setSelectedField(initialSelected)
        }
    }, [visible, initialSelected])

    useEffect(() => {
        setIndeterminate(
            selectedField.length > 0 &&
                selectedField.length < filteredFields.length,
        )
    }, [selectedField, filteredFields])

    // 全选/全不选
    const handleCheckAll = (checked: boolean) => {
        if (checked) {
            setSelectedField(filteredFields)
        } else {
            setSelectedField([])
        }
    }

    // 单个选择
    const handleSingleCheck = (item: any, checked: boolean) => {
        setSelectedField((prev) =>
            checked
                ? [...prev, item]
                : prev.filter((key) => key?.id !== item.id),
        )
    }

    // 全选复选框状态
    const checkAll =
        filteredFields.length > 0 &&
        filteredFields.every((item) =>
            selectedField.map((it) => it.id).includes(item.id),
        )

    return (
        <Modal
            title={__('添加字段')}
            open={visible}
            width={600}
            bodyStyle={{
                padding: '24px 24px 0',
            }}
            onCancel={onCancel}
            onOk={() => onSubmit(selectedField)}
        >
            <div style={{ marginBottom: 16 }}>
                <SearchInput
                    placeholder={__('搜索字段')}
                    allowClear
                    onKeyChange={(kw) => setSearchText(kw)}
                />
            </div>

            <div className={styles.fieldSelectWrapper}>
                {filteredFields.length > 0 ? (
                    <>
                        <div style={{ padding: '8px 0' }}>
                            <Checkbox
                                checked={checkAll}
                                onChange={(e) =>
                                    handleCheckAll(e.target.checked)
                                }
                                indeterminate={indeterminate}
                            >
                                {__('全选')}
                            </Checkbox>
                        </div>

                        <List
                            className={styles.fieldBox}
                            dataSource={filteredFields}
                            renderItem={(item) => (
                                <List.Item key={item.id}>
                                    <Checkbox
                                        checked={selectedField
                                            .map((it) => it.id)
                                            .includes(item.id)}
                                        onChange={(e) =>
                                            handleSingleCheck(
                                                item,
                                                e.target.checked,
                                            )
                                        }
                                    >
                                        <div className={styles.tableTDContnet}>
                                            <span className={styles.nameIcon}>
                                                {getFieldTypeEelment(
                                                    {
                                                        ...item,
                                                        type: item.data_type,
                                                    },
                                                    20,
                                                )}
                                            </span>
                                            <div style={{ overflow: 'hidden' }}>
                                                <div
                                                    title={`${item.business_name}`}
                                                    className={
                                                        styles.businessTitle
                                                    }
                                                >
                                                    {item.business_name}
                                                </div>
                                                <div
                                                    className={
                                                        styles.subTableTDContnet
                                                    }
                                                    title={`${item.technical_name}`}
                                                >
                                                    {item.technical_name}
                                                </div>
                                            </div>
                                        </div>
                                    </Checkbox>
                                </List.Item>
                            )}
                        />
                    </>
                ) : (
                    <Empty
                        desc={searchText ? undefined : __('暂无数据')}
                        iconSrc={searchText ? undefined : dataEmpty}
                    />
                )}
            </div>
        </Modal>
    )
}

export default FieldSelectModal
