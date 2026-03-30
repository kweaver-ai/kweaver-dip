import { FC, useState } from 'react'
import { Button, Form } from 'antd'
import { FormInstance } from 'antd/es/form'
import { AddOutlined, FontIcon } from '@/icons'
import __ from '../../locale'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import SelectDataFormDrawer from './SelectDataFormDrawer'
import { getTableTypeTag } from '../../helper'
import ItemFormSelect from './ItemFormSelect'

interface IFormsSelectConfig {
    modelId: string
    formInstance: FormInstance
}
const FormsSelectConfig: FC<IFormsSelectConfig> = ({
    modelId,
    formInstance,
}) => {
    // 添加来源表弹窗
    const [showAddFormModal, setShowAddFormModal] = useState(false)
    const [selectedForms, setSelectedForms] = useState<any[]>([])

    return (
        <div className={styles.formsSelectConfigWrapper}>
            <Form.List name="source_table">
                {(forms, { add, remove }) => {
                    return (
                        <>
                            {forms.map((form, index) => {
                                const {
                                    source_table_name,
                                    rel_type,
                                    table_id,
                                    source_field,
                                } = formInstance.getFieldValue([
                                    'source_table',
                                    index,
                                ])
                                return (
                                    <div
                                        key={index}
                                        className={styles.tableItemWrapper}
                                    >
                                        <Form.Item
                                            name={[index, 'source_table_name']}
                                        >
                                            <div
                                                className={
                                                    styles.tableTitleContent
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.titleNameWrapper
                                                    }
                                                >
                                                    <FontIcon
                                                        type={
                                                            IconType.COLOREDICON
                                                        }
                                                        name="icon-shujubiaoicon"
                                                        style={{
                                                            fontSize: 20,
                                                            flexShrink: 0,
                                                        }}
                                                    />
                                                    <span
                                                        className={
                                                            styles.nameWrapper
                                                        }
                                                    >
                                                        {source_table_name}
                                                    </span>
                                                    {getTableTypeTag(rel_type)}
                                                </div>
                                                <Button
                                                    type="link"
                                                    className={
                                                        styles.removeTableBtn
                                                    }
                                                    onClick={() => {
                                                        remove(index)
                                                        setSelectedForms(
                                                            selectedForms.filter(
                                                                (item) =>
                                                                    item.id !==
                                                                    table_id,
                                                            ),
                                                        )
                                                    }}
                                                >
                                                    {__('移除')}
                                                </Button>
                                            </div>
                                        </Form.Item>

                                        <div
                                            className={
                                                styles.sourceFieldWrapper
                                            }
                                        >
                                            <ItemFormSelect
                                                formInstance={formInstance}
                                                outIndex={index}
                                                formId={table_id}
                                                modelId={modelId}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )
                }}
            </Form.List>

            <div className={styles.addButtonWrapper}>
                <Button
                    onClick={() => {
                        setShowAddFormModal(true)
                    }}
                    icon={<AddOutlined />}
                    style={{ width: '100%', height: 48 }}
                >
                    {__('添加来源表')}
                </Button>
            </div>

            {showAddFormModal && (
                <SelectDataFormDrawer
                    open={showAddFormModal}
                    onClose={() => {
                        setShowAddFormModal(false)
                    }}
                    title={__('添加来源表')}
                    addedFormIds={selectedForms.map((item) => item.id)}
                    onConfirm={(currentSelectedForms) => {
                        setShowAddFormModal(false)
                        const sourceTable =
                            formInstance.getFieldValue('source_table') || []
                        setSelectedForms([
                            ...selectedForms,
                            ...currentSelectedForms,
                        ])
                        if (currentSelectedForms.length > 0) {
                            formInstance.setFieldValue('source_table', [
                                ...sourceTable,
                                ...currentSelectedForms.map((item) => ({
                                    source_table_name: item.name,
                                    table_id: item.id,
                                    rel_type: item.table_kind,
                                    source_field: [
                                        {
                                            field_id: null,
                                            source_field_name: '',
                                            source_rule: '',
                                        },
                                    ],
                                })),
                            ])
                        }
                    }}
                    mid={modelId}
                />
            )}
        </div>
    )
}

export default FormsSelectConfig
