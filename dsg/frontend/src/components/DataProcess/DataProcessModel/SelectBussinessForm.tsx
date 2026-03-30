import { FC, useState, useEffect } from 'react'
import { Node } from '@antv/x6'
import { Form, Modal, Select, Spin, message } from 'antd'
import { noop } from 'lodash'
import __ from '../locale'
import { getTaskDetail } from '@/core/apis/taskCenter'
import {
    SortDirection,
    SortType,
    formatError,
    formsQuery,
    getCoreBusinesses,
    getFormQueryItem,
    getFormsFieldsList,
} from '@/core'

interface ISelectBussinessForm {
    node: Node
    onClose: () => void
    taskId: string
    editStatus?: boolean
    onConfirm?: (fields: Array<any>) => void
}
const SelectBussinessForm: FC<ISelectBussinessForm> = ({
    node,
    onClose,
    taskId,
    editStatus = true,
    onConfirm = noop,
}) => {
    const [form] = Form.useForm()

    const [selectedFormOptions, setSelectedFormOptions] = useState<Array<any>>(
        [],
    )

    const [formKeyword, setFormKeyword] = useState<string>('')

    const [formLoading, setFormLoading] = useState<boolean>(true)

    useEffect(() => {
        getSelectedFormOptions()
        form.setFieldsValue(node.data.formInfo)
    }, [taskId])

    /**
     * 获取任务绑定的业务表
     */
    const getSelectedFormOptions = async () => {
        setFormLoading(true)
        const res = await getTaskDetail(taskId)
        setSelectedFormOptions(
            res?.data?.map((currentForm) => ({
                value: currentForm.id,
                label: currentForm.name,
                formInfo: currentForm,
            })) || [],
        )
        setFormLoading(false)
    }

    /**
     * 完成事件
     * @param values
     */
    const handleFinsh = async (values) => {
        if (values.id) {
            try {
                const [formInfo, { entries }] = await Promise.all([
                    getFormQueryItem(values.id),
                    getFormsFieldsList(values.id, { limit: 999 }),
                ])
                const fields = entries.filter(
                    (currentData) => currentData.data_type !== 'binary',
                )
                if (fields.length) {
                    node.replaceData({
                        ...node.data,
                        formInfo,
                        items: entries
                            .filter(
                                (currentData) =>
                                    currentData.data_type !== 'binary',
                            )
                            .map((currentData, index) => ({
                                ...currentData,
                                indexId: index,
                            })),
                        offset: 0,
                    })

                    onConfirm(entries)
                    onClose()
                } else if (entries.length) {
                    message.error(
                        __('二进制字段不支持加工，请重新选择或增加新字段！'),
                    )
                } else {
                    message.error(__('业务表字段不能为空，请添加业务表字段！'))
                }
            } catch (ex) {
                formatError(ex)
            }
        }
    }
    return (
        <Modal
            title={__('选择业务表')}
            width={640}
            onCancel={onClose}
            open
            onOk={() => {
                form.submit()
            }}
            maskClosable={false}
        >
            <Form
                form={form}
                onFinish={handleFinsh}
                layout="vertical"
                autoComplete="off"
            >
                <Form.Item
                    name="id"
                    label={__('业务表名称')}
                    required
                    rules={[
                        {
                            required: true,
                            message: __('请选择业务表名称'),
                        },
                    ]}
                    style={{
                        width: '100%',
                        padding: '0 8px',
                    }}
                >
                    <Select
                        placeholder={__('请选择业务表名称')}
                        options={selectedFormOptions}
                        disabled={!editStatus}
                        notFoundContent={
                            formLoading ? (
                                <Spin />
                            ) : selectedFormOptions?.length ? (
                                __('未找到匹配的结果')
                            ) : (
                                __('暂无数据')
                            )
                        }
                        showSearch
                        allowClear
                        onSearch={(value) => {
                            if (value.length <= 128) {
                                setFormKeyword(value)
                            }
                        }}
                        optionFilterProp="label"
                        searchValue={formKeyword}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default SelectBussinessForm
