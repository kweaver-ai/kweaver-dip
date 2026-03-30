import React, { useEffect, useRef, useState } from 'react'
import { Input, InputRef } from 'antd'
import { trim } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { IFormulaFields } from '@/core'
import { FieldsData } from '../FieldsData'
import { DragOutlined, EditOutlined } from '@/icons'
import Icons from '@/components/BussinessConfigure/Icons'
import { FieldErrorType } from '../const'

interface IFieldItem {
    // 字段数据
    item: IFormulaFields
    // 字段元数据
    fieldsData: FieldsData
    // 是否可以拖拽 默认true-可以
    canDrag?: boolean
    // 编辑中
    beEditing: boolean
    wi?: string
    inViewMode?: boolean
    onStartEdit: () => void
    onStartChange: () => void
    onChangeFieldName: (value) => void
}

const FieldItem: React.FC<IFieldItem> = ({
    item,
    fieldsData,
    canDrag = true,
    beEditing,
    wi = '60%',
    inViewMode = false,
    onChangeFieldName,
    onStartChange,
    onStartEdit,
}) => {
    // 编辑字段信息
    const [editValue, setEditValue] = useState<string>()
    const itemKey = `${item.id}_${item.sourceId}`
    const inputRef = useRef<InputRef>(null)

    useEffect(() => {
        if (beEditing) {
            setEditValue(item.alias)
            inputRef.current?.focus({
                cursor: 'end',
            })
            return
        }
        setEditValue(undefined)
    }, [beEditing])

    useEffect(() => {
        if (item?.editError && item.editError.length > 0) {
            setEditValue(item.alias)
        }
    }, [item])

    // 确定修改字段名称
    const handleSureFieldName = () => {
        let name = trim(editValue)
        if (!name) {
            name = item.alias
        }
        onChangeFieldName(name)
    }

    return (
        <div
            key={itemKey}
            className={styles.fieldItemWrap}
            style={{
                alignItems: 'center',
                height: item?.editError ? 50 : 32,
            }}
        >
            <div className={styles.iconWrap}>
                <DragOutlined className={styles.dragIcon} hidden={!canDrag} />
                <Icons
                    type={
                        item?.data_type ||
                        fieldsData.data.find((c) => item?.id === c.id)
                            ?.data_type
                    }
                />
            </div>
            {beEditing ? (
                /* 字段编辑中 */
                <div className={styles.editInfoWrap}>
                    <div className={styles.editInfo}>
                        <Input
                            ref={inputRef}
                            style={{
                                width: wi,
                                minWidth: 200,
                                height: 28,
                                margin: '0 8px',
                            }}
                            allowClear
                            maxLength={255}
                            status={item?.editError ? 'error' : undefined}
                            value={editValue}
                            onChange={(e) => {
                                if (e.target.value) {
                                    onStartChange()
                                }
                                setEditValue(e.target.value)
                            }}
                            onPressEnter={() => handleSureFieldName()}
                            onBlur={() => handleSureFieldName()}
                        />
                    </div>
                    <span
                        hidden={!item?.editError}
                        className={styles.editInfoErr}
                    >
                        {[FieldErrorType.OverLength].includes(
                            item!.editError as FieldErrorType,
                        )
                            ? __('仅支持输入255个字符')
                            : __('该字段名称已存在，请重新输入')}
                    </span>
                </div>
            ) : (
                /* 字段正常显示 */
                <div className={styles.normalInfo}>
                    <div className={styles.nameWrap}>
                        <div className={styles.fieldName} title={item.alias}>
                            {item.alias}
                        </div>
                        {/* {fieldsData.data.find((c) => item?.id === c.id)
                            .primary_key && (
                            <span className={styles.uniqueIcon}>
                                {__('主键')}
                            </span>
                        )} */}
                    </div>
                    {!inViewMode && (
                        <EditOutlined
                            className={styles.fieldBtn}
                            onClick={(e) => onStartEdit()}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default FieldItem
