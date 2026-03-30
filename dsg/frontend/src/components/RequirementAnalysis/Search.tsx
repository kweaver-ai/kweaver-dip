import React, { useEffect, useState } from 'react'
import { Button, Col, DatePicker, Form, Input, Row, Select, Space } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import { getObjects, IObject, formatError } from '@/core'
import { Architecture } from '../BusinessArchitecture/const'

interface IRequirementSearch {
    getSearchCondition: (val) => void
}
const Search: React.FC<IRequirementSearch> = ({ getSearchCondition }) => {
    const [form] = Form.useForm()
    const [depts, setDepts] = useState<IObject[]>()

    useEffect(() => {
        form.setFieldsValue({
            org_code: '',
        })
    }, [])

    // 获取申请部门
    const getDepts = async () => {
        try {
            const res = await getObjects({
                limit: 0,
                id: '',
                is_all: true,
                type: Architecture.DEPARTMENT,
            })
            setDepts(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getDepts()
    }, [])

    const handleReset = () => {
        form.resetFields()
        form.setFieldsValue({
            org_code: '',
        })
        getSearchCondition({
            time: undefined,
            apply_date_greater_than: undefined,
            apply_date_less_than: undefined,
            keyword: '',
            org_code: '',
            status: 0,
        })
    }
    const onFinish = (values) => {
        getSearchCondition({
            ...values,
            time: undefined,
            apply_date_greater_than: values.time
                ? Date.parse(
                      moment(values.time?.[0]).format('YYYY-MM-DD:00:00:00'),
                  )
                : undefined,
            apply_date_less_than: values.time
                ? Date.parse(
                      moment(values.time?.[1]).format('YYYY-MM-DD:23:59:59'),
                  )
                : undefined,
        })
    }

    return (
        <div className={styles.requirementSearch}>
            <Row>
                <Col span={18}>
                    <Form
                        form={form}
                        layout="vertical"
                        className={styles.form}
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <Row gutter={32}>
                            <Col span={6}>
                                <Form.Item
                                    name="keyword"
                                    label="需求名称/需求编号"
                                >
                                    <Input
                                        placeholder="请输入"
                                        maxLength={128}
                                        allowClear
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="org_code" label="申请部门">
                                    <Select
                                        placeholder="请选择"
                                        getPopupContainer={(node) =>
                                            node.parentNode
                                        }
                                    >
                                        <Select.Option value="">
                                            全部
                                        </Select.Option>
                                        {depts?.map((dept) => (
                                            <Select.Option
                                                key={dept.id}
                                                value={dept.id}
                                            >
                                                {dept.name}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name="time" label="创建时间">
                                    <DatePicker.RangePicker
                                        getPopupContainer={(node) =>
                                            node.parentNode as HTMLElement
                                        }
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Col>
                <Col span={4} offset={2}>
                    <div className={styles.operate}>
                        <Space size={12}>
                            <Space size={8}>
                                <Button onClick={() => handleReset()}>
                                    重置
                                </Button>
                                <Button
                                    type="primary"
                                    onClick={() => form.submit()}
                                >
                                    查询
                                </Button>
                            </Space>
                        </Space>
                    </div>
                </Col>
            </Row>
        </div>
    )
}
export default Search
