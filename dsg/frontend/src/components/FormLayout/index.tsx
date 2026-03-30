import React, {
    useEffect,
    useImperativeHandle,
    useState,
    useRef,
    forwardRef,
} from 'react'
import {
    Button,
    Form,
    Input,
    Row,
    Col,
    Space,
    Select,
    Radio,
    InputNumber,
} from 'antd'
import { FormProps } from 'antd/lib/form/Form'
import classnames from 'classnames'
import styles from './styles.module.less'
import {
    IFormData,
    SearchType,
    IFormItem,
} from '@/components/SearchLayout/const'
import __ from './locale'
import { getItems } from '@/components/SearchLayout/formItems'

interface IFormLayoutData extends FormProps {
    ref?: any
    formData: IFormItem[]
    formInitialValues?: any
}

/**
 * @param label 显示文本
 * @param key  接口返回字段名
 * @param value sting | [] 显示值，为数组时，显示标签样式
 * @param span  栅格布局，默认12
 * @param styles  传入styles
 * @param render  传入自定义组件
 * @param options  枚举值状态，用于转换状态
 */

export const FormLayout: React.FC<IFormLayoutData> = forwardRef(
    (props: IFormLayoutData, ref) => {
        const { formData, formInitialValues, ...other } = props
        const [form] = Form.useForm()

        useImperativeHandle(ref, () => ({
            form,
        }))

        return (
            <div className={styles.formCantainer}>
                <Form
                    className={styles.searchForm}
                    form={form}
                    layout="vertical"
                    initialValues={formInitialValues}
                    autoComplete="off"
                    {...other}
                >
                    <Row>
                        {formData.map((item, index) => {
                            return (
                                <>
                                    {item.offset && <Col span={item.offset} />}
                                    <Col
                                        key={item.key}
                                        span={item.span || 12}
                                        className={styles.searchCol}
                                    >
                                        {!item.hidden && (
                                            <Form.Item
                                                label={item.label}
                                                name={item.key}
                                                className={styles.searchColItem}
                                                {...item.formItemProps}
                                            >
                                                {getItems(item)}
                                            </Form.Item>
                                        )}
                                    </Col>
                                </>
                            )
                        })}
                    </Row>
                </Form>
            </div>
        )
    },
)
export default FormLayout
