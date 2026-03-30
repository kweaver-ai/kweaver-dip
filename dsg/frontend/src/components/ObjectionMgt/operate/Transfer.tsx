import { useState, useEffect } from 'react'
import { Drawer, Form, Select } from 'antd'
import DetailsLabel from '@/ui/DetailsLabel'
import { formatError, getUserByDepartId, transferObjection } from '@/core'
import DepartmentAndOrgSelect from '../../DepartmentAndOrgSelect'
import {
    DetailType,
    DrawerFooter,
    getConfirmModal,
    EditGroupTitle,
    refreshDetails,
} from '../helper'
import __ from '../locale'

interface ITransfer {
    open: boolean
    item: any
    onTransferSuccess: () => void
    onTransferClose: () => void
}

const Transfer = ({
    open,
    item,
    onTransferSuccess,
    onTransferClose,
}: ITransfer) => {
    const [userList, setUserList] = useState<any[]>([])
    const [details, setDetails] = useState<any>(null)
    const [lastDepartmentId, setLastDepartmentId] = useState<string | null>(
        null,
    )
    const [form] = Form.useForm()

    useEffect(() => {
        setDetails(item)
    }, [item])

    const handleClickSubmit = async () => {
        try {
            await form.validateFields()
            getConfirmModal({
                title: __('确定转办给${name}吗？', {
                    name: userList?.find(
                        (i) => i.value === form.getFieldValue('user_id'),
                    )?.label,
                }),
                content: __('提交后将无法修改，请确认。'),
                onOk: () => form.submit(),
            })
        } catch (error) {
            // console.log(error)
        }
    }

    const onFinish = async (values) => {
        try {
            await transferObjection(item?.id, values)
            onTransferSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    const handleDepartmentChange = async (value) => {
        if (!value) return
        // 如果当前选择的部门与之前选择的部门不同，则重新获取处理人列表
        if (lastDepartmentId !== value) {
            try {
                const results = await getUserByDepartId({
                    depart_id: value,
                })
                form.setFieldValue('user_id', null)
                setUserList(
                    results?.map((result: any) => {
                        return {
                            ...result,
                            label: result.name,
                            value: result.id,
                        }
                    }),
                )
                // 更新最后选择的部门ID
                setLastDepartmentId(value)
            } catch (error) {
                formatError({ error })
            }
        }
    }

    return (
        <Drawer
            title={__('异议转办')}
            placement="right"
            open={open}
            width={640}
            onClose={onTransferClose}
            maskClosable={false}
            destroyOnClose
            footer={
                <DrawerFooter
                    onClose={onTransferClose}
                    onSubmit={handleClickSubmit}
                />
            }
        >
            <>
                <EditGroupTitle title={__('异议内容')} />
                <DetailsLabel
                    wordBreak
                    detailsList={refreshDetails({
                        type: DetailType.BasicSimple,
                        actualDetails: details,
                    })}
                    labelWidth="130px"
                />
            </>
            <>
                <EditGroupTitle title={__('转办')} />
                <Form
                    name="transfer"
                    form={form}
                    layout="vertical"
                    wrapperCol={{ span: 24 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label={__('处理部门')}
                        name="department_id"
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <DepartmentAndOrgSelect
                            allowClear
                            onChange={(value) => handleDepartmentChange(value)}
                        />
                    </Form.Item>

                    <Form.Item
                        label={__('处理人')}
                        name="user_id"
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请输入')}
                            options={userList}
                            allowClear
                        />
                    </Form.Item>
                </Form>
            </>
        </Drawer>
    )
}

export default Transfer
