import { Button, Checkbox, Col, Form, Input, Modal, Row, Tooltip } from 'antd'
import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import {
    agreementInfo,
    agreementRequireFields,
    defaultPhoneNumber,
} from './const'
import styles from './styles.module.less'
import __ from './locale'

const layout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
}

interface ICreateApplicationAgreement {
    applicationInfo: any
    getApplicationInfo: (vals) => void
    getCheckedStatus: (val: boolean) => void
    checkedStatus: boolean
    setIsContentChanged: (val: boolean) => void
}

const CreateApplicationAgreement: React.FC<ICreateApplicationAgreement> = ({
    applicationInfo,
    getApplicationInfo,
    getCheckedStatus,
    checkedStatus,
    setIsContentChanged,
}) => {
    const [form] = Form.useForm()
    const [open, setOpen] = useState(false)
    const [checked, setChecked] = useState(false)
    const [tipOpen, setTipOpen] = useState(false)

    const handleClick = () => {
        setOpen(true)
    }

    useEffect(() => {
        setChecked(checkedStatus)
    }, [checkedStatus])

    useEffect(() => {
        if (open) {
            setTipOpen(false)
            form.setFieldsValue({ ...applicationInfo })
        } else {
            form.resetFields()
        }
    }, [open, applicationInfo])

    const onFinish = (values) => {
        getApplicationInfo(values)
        setOpen(false)
        setChecked(true)
        getCheckedStatus(true)
    }

    const handlechecked = (e) => {
        let isFilledOver = true
        agreementRequireFields.forEach((field) => {
            if (!applicationInfo[field]) {
                isFilledOver = false
            }
        })
        // 未填写任何数据时,点击勾选,弹窗提示,且不能勾选
        if (!isFilledOver) {
            setTipOpen(e.target.checked)
            setChecked(false)
            getCheckedStatus(false)
            return
        }

        // 填写完数据时 可任意勾选 且 不会展示弹窗提示
        // 勾选变化时 向外传递数据变化状态
        if (e.target.checked !== checkedStatus) {
            setIsContentChanged(true)
        }

        setChecked(e.target.checked)
        getCheckedStatus(e.target.checked)
        setTipOpen(false)
    }

    // 内容变化通知组件发生变化 （取消时提示是否保存）
    const onValuesChange = (values) => {
        setIsContentChanged(true)
    }

    return (
        <div className={styles.applicationAgreement}>
            <div className={styles.agreementTitle}>
                <span className={styles.requiredFlag}>*</span>
                {__('申请协议')}
            </div>
            <div className={styles.agreementDesc}>
                {__('请仔细阅读')}
                <Tooltip title={__('请先填写承诺书内容')} open={tipOpen}>
                    <a onClick={handleClick}>{__('《承诺书》')}</a>
                </Tooltip>
                {__('中内容，并填写相关信息')}
            </div>
            <div className={styles.agreementDesc}>
                {__('阅读并填写完成后，勾选下方选项确认')}
            </div>
            <div className={styles.confirmInfo}>
                <Checkbox checked={checked} onChange={handlechecked} />
                <span className={styles.confirmInfoText}>
                    {__(
                        '已知晓并完成《承诺书》中所要求内容，并承诺履行相关义务和承担相关责任',
                    )}
                </span>
            </div>
            <Modal
                open={open}
                onCancel={() => setOpen(false)}
                getContainer={false}
                width={1000}
                maskClosable={false}
                footer={null}
                bodyStyle={{
                    maxHeight: 'calc(100vh - 48px)',
                    minHeight: 400,
                    overflowY: 'auto',
                }}
                centered
            >
                <div className={styles.commitmentLetter}>
                    <div className={styles.title}>
                        {__('数据资源保管承诺书')}
                    </div>
                    <div
                        className={classnames(
                            styles.commitmentDesc,
                            styles.commitmentDescFirst,
                        )}
                    >
                        {__(
                            '为确保共享过程中各类数据资源的安全性，我部门作出承诺如下：',
                        )}
                    </div>
                    <div className={styles.commitmentDesc}>
                        {__(
                            '1、在本次数据资源共享过程中所获取的数据，只限于本部门本次提出的应用场景使用，未经数据提供方许可，不得擅自变更使用人员，应用场景等使用范围。',
                        )}
                    </div>
                    <div className={styles.commitmentDesc}>
                        {__(
                            '2、经数据提供方许可，本部门再想其他部门提供有关数据或服务时，向其说明应承担的数据安全保管义务，要求其至少按照不低于本部门安全保管手段严格履行其安全保管义务。',
                        )}
                    </div>
                    <div className={styles.commitmentDesc}>
                        {__('3、其它事项受数据管理方协调管理。')}
                    </div>
                    <div className={styles.commitmentDesc}>
                        {__(
                            '4、授权以下人员对本部门数据进行管理，参与部门间相关协调事宜。',
                        )}
                    </div>
                    <div
                        className={classnames(
                            styles.commitmentDesc,
                            styles.commitmentDescLast,
                        )}
                    >
                        {__('请填写以下信息：')}
                    </div>
                    <Form
                        form={form}
                        {...layout}
                        colon={false}
                        onFinish={onFinish}
                        autoComplete="off"
                        onValuesChange={onValuesChange}
                    >
                        {agreementInfo.map((agreementItem) => (
                            <div key={agreementItem.key}>
                                <div className={styles.agreementTitleWrapper}>
                                    <div className={styles.titleLine} />
                                    <div className={styles.contentTitle}>
                                        {agreementItem.title}
                                    </div>
                                </div>
                                <Row gutter={12}>
                                    {agreementItem.content.map((item) => (
                                        <Col span={12} key={item.name}>
                                            <Form.Item
                                                label={item.label}
                                                name={item.name}
                                                validateTrigger={[
                                                    'onChange',
                                                    'onBlur',
                                                ]}
                                                validateFirst
                                                rules={[
                                                    {
                                                        required: item.required,
                                                        message:
                                                            __('输入不能为空'),
                                                    },
                                                    {
                                                        pattern: item.regExp,
                                                        message: item.message,
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={`${__(
                                                        '请输入',
                                                    )}${item.label}`}
                                                    maxLength={128}
                                                />
                                            </Form.Item>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        ))}
                    </Form>
                    <div className={styles.warningInfo}>
                        *&nbsp;
                        {__(
                            '本单位承诺严格履行安全保管义务，如果违反将承担相应的法律后果及法律责任',
                        )}
                    </div>
                    <div className={styles.operateWrapper}>
                        <Button type="primary" onClick={() => form.submit()}>
                            {__('确认承诺')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
export default CreateApplicationAgreement
