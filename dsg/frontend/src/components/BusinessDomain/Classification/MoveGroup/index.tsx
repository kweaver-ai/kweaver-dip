import { Modal, Form, Select, message } from 'antd'
import { forwardRef, useEffect, useState } from 'react'
import { getGradeRuleGroupList, moveGradeRuleGroup, formatError } from '@/core'
import __ from '../../locale'
import { useClassificationContext } from '../ClassificationProvider'

interface IMoveGroup {
    open: boolean
    groupId: string
    onClose: () => void
    onOk: () => void
    selectedRules: any[]
}

const unGroup = {
    id: 'unGroup',
    name: '未分组',
}

const MoveGroup = (props: IMoveGroup, ref) => {
    const { open, onClose, onOk, groupId, selectedRules } = props
    const [form] = Form.useForm()
    const { selectedAttribute } = useClassificationContext()

    const [loading, setLoading] = useState<boolean>(false)
    const [groupOptions, setGroupOptions] = useState<Array<any>>([])

    useEffect(() => {
        form.setFieldValue('group_id', groupId === '' ? unGroup.id : groupId)
        getGroup()
    }, [])

    /**
     * 获取所有分组
     */
    const getGroup = async () => {
        try {
            const { entries } = await getGradeRuleGroupList({
                business_object_id: selectedAttribute.id,
            })
            const list = [...entries, unGroup]
            setGroupOptions(
                list.map((o) => ({
                    ...o,
                    value: o.id,
                    label: o.name,
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

    const onFinish = async (values: any) => {
        try {
            let { group_id } = values
            if (group_id === unGroup.id) {
                group_id = ''
            }
            setLoading(true)
            await moveGradeRuleGroup({
                group_id,
                rule_ids: selectedRules.map((o) => o.id),
            })
            onOk()
            message.success(__('调整成功'))
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }
    return (
        <Modal
            open={open}
            title={__('调整分组')}
            width={640}
            getContainer={false}
            maskClosable={false}
            destroyOnClose
            onCancel={() => onClose()}
            onOk={() => form.submit()}
            confirmLoading={loading}
        >
            <Form
                form={form}
                autoComplete="off"
                layout="vertical"
                onFinish={onFinish}
                scrollToFirstError
            >
                <div style={{ marginBottom: '16px' }}>
                    {__('调整对象：')}
                    {selectedRules.length === 1
                        ? selectedRules[0]?.name
                        : `已选择${selectedRules.length}个规则`}
                </div>
                <Form.Item
                    rules={[
                        {
                            required: true,
                            message: __('请选择所属规则组'),
                        },
                    ]}
                    label={__('调整至规则组')}
                    name="group_id"
                >
                    <Select
                        placeholder={__('请选择所属规则组')}
                        options={groupOptions}
                        showSearch
                        filterOption={(input, option) => {
                            if (!option?.name) return false
                            return option.name
                                .toLowerCase()
                                .includes(input.toLowerCase())
                        }}
                        optionFilterProp="name"
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default forwardRef(MoveGroup)
