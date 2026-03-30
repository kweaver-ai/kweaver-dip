import { Button, Form, Popover, Select, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import __ from './locale'
import { FieldInfosByEN, UnLimitType } from '@/components/RowAndColFilter/const'
import { getTypeText } from '@/utils'
import CopoundInput from '@/components/RowAndColFilter/RowFilter/CopoundInput'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface FieldFilterProps {
    targetField: any
    openProbe?: boolean
    exampleData?: any
    onOk?: (values: any) => void
    initialValues?: any
}

const FieldFilter = ({
    targetField,
    openProbe,
    exampleData,
    onOk,
    initialValues,
}: FieldFilterProps) => {
    const [form] = Form.useForm()
    const [open, setOpen] = useState(false)

    const onFinish = (values: any) => {
        onOk?.(values)
        setOpen(false)
    }

    const initFormValues = () => {
        const { operator, value } = initialValues || {}
        form.setFieldsValue({ operator, value })
    }
    useEffect(() => {
        initFormValues()
    }, [initialValues])

    return getTypeText(targetField.data_type) !== 'time' ? (
        <Popover
            trigger={['click']}
            open={open}
            onOpenChange={(status) => {
                setOpen(status)
                if (!status) {
                    initFormValues()
                }
            }}
            placement="bottom"
            overlayClassName={styles['popover-content-wrapper']}
            content={
                <div className={styles['field-filter-wrapper']}>
                    <Form form={form} onFinish={onFinish}>
                        <Form.Item
                            label=""
                            name="operator"
                            className={styles['filter-form-item']}
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择筛选条件'),
                                },
                            ]}
                        >
                            <Select
                                placeholder={__('筛选条件')}
                                options={
                                    FieldInfosByEN[
                                        getTypeText(targetField.data_type)
                                    ].limitListOptions
                                }
                                style={{ width: 280 }}
                                onChange={() => form.resetFields(['value'])}
                                getPopupContainer={(node) => node.parentElement}
                            />
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(pre, cur) =>
                                pre.operator !== cur.operator
                            }
                        >
                            {({ getFieldValue }) => {
                                const operator = getFieldValue('operator')
                                const required = !UnLimitType.includes(operator)
                                return (
                                    <Form.Item
                                        name="value"
                                        rules={[
                                            {
                                                required: operator
                                                    ? required
                                                    : false,
                                                message: __('输入不能为空'),
                                            },
                                        ]}
                                    >
                                        <CopoundInput
                                            width={280}
                                            fieldInfo={targetField}
                                            condition={operator}
                                            exampleData={exampleData}
                                            openProbe={openProbe}
                                        />
                                    </Form.Item>
                                )
                            }}
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                return (
                                    <div className={styles['filter-footer']}>
                                        {getFieldValue('operator') ||
                                        getFieldValue('value') ? (
                                            <Button
                                                type="link"
                                                className={
                                                    styles['clear-filter-btn']
                                                }
                                                onClick={() => {
                                                    form.resetFields()
                                                    onOk?.({})
                                                    setOpen(false)
                                                }}
                                            >
                                                {__('清空筛选')}
                                            </Button>
                                        ) : (
                                            <div />
                                        )}
                                        <Space
                                            size={8}
                                            className={styles['footer-btn']}
                                        >
                                            <Button
                                                onClick={() => {
                                                    initFormValues()
                                                    setOpen(false)
                                                }}
                                            >
                                                {__('取消')}
                                            </Button>
                                            <Button
                                                type="primary"
                                                onClick={() => form.submit()}
                                            >
                                                {__('确定')}
                                            </Button>
                                        </Space>
                                    </div>
                                )
                            }}
                        </Form.Item>
                    </Form>
                </div>
            }
        >
            <FontIcon
                name="icon-shaixuan"
                type={IconType.FONTICON}
                onClick={() => setOpen(true)}
                style={{
                    color: initialValues?.operator ? '#126EE3' : 'unset',
                }}
                className={classNames(
                    styles['field-filter-icon'],
                    initialValues?.operator &&
                        styles['field-filter-active-icon'],
                )}
            />
        </Popover>
    ) : (
        <Tooltip title={__('暂不支持过滤配置')}>
            <FontIcon
                name="icon-shaixuan"
                type={IconType.FONTICON}
                className={classNames(
                    styles['field-filter-icon'],
                    styles['disable-field-filter-icon'],
                )}
            />
        </Tooltip>
    )
}

export default FieldFilter
