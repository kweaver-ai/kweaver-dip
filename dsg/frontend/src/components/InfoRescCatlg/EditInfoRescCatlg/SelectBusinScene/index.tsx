import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
    Form,
    Modal,
    Space,
    Button,
    Tooltip,
    Col,
    Row,
    Radio,
    Input,
    Tag,
} from 'antd'
import type { InputRef } from 'antd'
import { noop } from 'lodash'

import { useWatch } from 'antd/lib/form/Form'
import __ from './locale'
import styles from './styles.module.less'
import Tags from '@/components/DemandManagement/Province/Tags'
import { SceneTypeEnum, sceneTypeList } from './helper'

interface ISelectBusinScene {
    open: boolean
    onClose: (isSearch?: boolean, isFlag?: string) => void
    onOK?: (val: any) => void
    title?: string
    id?: string
    originValue?: any
}

const SelectBusinScene: React.FC<ISelectBusinScene> = ({
    open,
    onClose = noop,
    onOK = noop,
    title = __('来源业务场景'),
    id,
    originValue = {},
}) => {
    const [form] = Form.useForm()

    const [btnLoading, setBtnLoading] = useState<boolean>(false)

    const tags = useWatch('value', form)

    const okBtnDisabled = useMemo(() => {
        // return !form.getFieldValue('value')?.length
        return !tags?.length
    }, [tags])

    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                ...originValue,
                type: originValue?.type || SceneTypeEnum.ZWSF,
            })
        }
    }, [open])

    const getModalFooter = () => {
        return (
            <Space size={16}>
                <Button onClick={() => onClose()}>{__('取消')}</Button>
                <Tooltip title={okBtnDisabled ? __('请添加业务场景') : ''}>
                    <Button
                        type="primary"
                        disabled={okBtnDisabled}
                        onClick={() => form.submit()}
                    >
                        {__('确定')}
                    </Button>
                </Tooltip>
            </Space>
        )
    }

    const onFinish = (values: any) => {
        onOK(values)
    }

    return (
        <Modal
            title={title}
            width={800}
            open={open}
            onCancel={() => onClose(true)}
            bodyStyle={{ height: 490 }}
            destroyOnClose
            maskClosable={false}
            className={styles.selectModalWrapper}
            footer={<div className={styles.footer}>{getModalFooter()}</div>}
        >
            <div className={styles.selectBusinSceneWrapper}>
                <Form
                    form={form}
                    name="validate_other"
                    onFinish={(values) => {
                        onFinish(values)
                    }}
                >
                    <Row>
                        <Col span={24}>
                            <Form.Item
                                label={__('选择场景类型')}
                                name="type"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: __('场景类型不能为空'),
                                    },
                                ]}
                                initialValue={SceneTypeEnum.ZWSF}
                            >
                                <Radio.Group>
                                    {sceneTypeList?.map((item) => (
                                        <Radio value={item.key}>
                                            {item.label}
                                        </Radio>
                                    ))}
                                </Radio.Group>
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                label={__('添加业务场景')}
                                name="value"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: __('添加业务场景不能为空'),
                                    },
                                ]}
                                className={styles.sceneTagsFormItem}
                            >
                                <Tags
                                    btnName={__('填写')}
                                    inputProps={{
                                        maxLength: 128,
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </div>
        </Modal>
    )
}
export default SelectBusinScene
