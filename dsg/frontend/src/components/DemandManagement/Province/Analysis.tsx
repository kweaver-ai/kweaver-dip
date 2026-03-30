import { Button, DatePicker, Form, Input, Radio, Select, Space } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { RangePickerProps } from 'antd/lib/date-picker'
import moment from 'moment'
import { ReturnConfirmModal, Return } from '@/ui'
import styles from '../styles.module.less'
import currentStyles from './styles.module.less'
import CommonTitle from '../CommonTitle'
import __ from '../locale'
import BasicInfo from '../ProvinceDetails/BasicInfo'
import { DemandInfoFields } from '../ProvinceDetails/const'
import DataSource from '../ProvinceDetails/DataSource'
import {
    ISSZDDemandDetails,
    ISSZDDict,
    SSZDDictTypeEnum,
    analysisSSZDDemand,
    formatError,
    getCurUserDepartment,
    getSSZDDemandDetails,
    getSSZDDict,
} from '@/core'
import { ErrorInfo, numberReg } from '@/utils'
import { RejectTypeOptions, ResourceTypeOptions } from './const'
import Confirm from '@/components/Confirm'

const Analysis = () => {
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const demandId = searchParams.get('demandId') || ''
    const demandName = searchParams.get('demandName') || ''
    const [details, setDetails] = useState<ISSZDDemandDetails>()
    const [dict, setDict] = useState<ISSZDDict>()
    const [departments, setDepartments] = useState<
        { id: string; name: string }[]
    >([])
    const [confirmOpen, setConfirmOpen] = useState(false)

    const handleReturn = () => {
        ReturnConfirmModal({
            onCancel: () => {
                navigate('/demand-mgt?tab=todo')
            },
        })
    }

    // 获取当前部门
    const getCurDepartment = async () => {
        try {
            const deps = await getCurUserDepartment()
            const [firstDept] = deps ?? []

            if (firstDept?.id) {
                form.setFieldsValue({ org_code: firstDept.id })
            }

            setDepartments(deps ?? [])
        } catch (error) {
            formatError(error)
        }
    }

    const getDict = async () => {
        try {
            const res = await getSSZDDict([
                SSZDDictTypeEnum.Scene,
                SSZDDictTypeEnum.SceneType,
                SSZDDictTypeEnum.UpdateCycle,
                SSZDDictTypeEnum.OneThing,
            ])
            setDict(res)
            // 将详情中的相关枚举code 转换 value 供展示
            getDetails()
        } catch (error) {
            formatError(error)
        }
    }

    const getDetails = async () => {
        const res = await getSSZDDemandDetails({
            id: demandId,
            fields: ['basic_info', 'analysis_result'].join(','),
            view: 'operator',
        })
        setDetails(res)
    }

    useEffect(() => {
        getDict()
        getCurDepartment()
    }, [])

    const onFinish = () => {
        setConfirmOpen(true)
    }

    // 设置不可选日期 - 当天之前不可选
    const disabledDate: RangePickerProps['disabledDate'] = (current) => {
        return current < moment().subtract(1, 'days')
    }

    const handleSubmit = async () => {
        const values = form.getFieldsValue()
        values.provide_time = values.provide_time
            ? Date.parse(values.provide_time.format('YYYY-MM-DD 23:59:59')) /
              1000
            : undefined
        try {
            await analysisSSZDDemand(demandId, values)
            navigate('/demand-hall?isProvince=1')
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div
            className={classNames(
                styles['analysis-wrapper'],
                currentStyles['province-analysis-wrapper'],
            )}
        >
            <div className={styles.header}>
                <Return title={demandName} onReturn={() => handleReturn()} />
            </div>
            <div className={styles['analysis-body']}>
                <div className={styles['analysis-content']}>
                    <div className={styles['analysis-content-title']}>
                        {__('分析签收')}
                    </div>
                    <div className={styles['analysis-content-info']}>
                        <BasicInfo
                            details={details?.basic_info}
                            basicInfoFields={DemandInfoFields}
                            title={__('需求信息')}
                        />
                        <DataSource
                            showOperate={false}
                            basicInfo={details?.basic_info}
                        />
                        <CommonTitle title={__('签收结果')} />
                        <Form
                            form={form}
                            labelAlign="left"
                            autoComplete="off"
                            className={currentStyles['analysis-form']}
                            onFinish={onFinish}
                        >
                            <Form.Item
                                label={__('签收意见')}
                                name="audit_result"
                                initialValue="agree"
                            >
                                <Radio.Group>
                                    <Radio value="agree">{__('同意')}</Radio>
                                    <Radio value="reject">{__('拒绝')}</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item
                                noStyle
                                shouldUpdate={(pre, cur) =>
                                    pre.audit_result !== cur.audit_result
                                }
                            >
                                {({ getFieldValue }) => {
                                    return getFieldValue('audit_result') ===
                                        'agree' ? (
                                        <Form.Item
                                            label={__('提供时间')}
                                            name="provide_time"
                                        >
                                            <DatePicker
                                                className={
                                                    currentStyles[
                                                        'provide-time-input'
                                                    ]
                                                }
                                                placeholder={__('请选择')}
                                                disabledDate={disabledDate}
                                                format="YYYY-MM-DD"
                                            />
                                        </Form.Item>
                                    ) : (
                                        <Form.Item
                                            label={__('拒绝原因')}
                                            name="reject_type"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: __('请选择'),
                                                },
                                            ]}
                                        >
                                            <Select
                                                className={
                                                    currentStyles[
                                                        'reject-reason-select'
                                                    ]
                                                }
                                                placeholder={__('请选择')}
                                                options={RejectTypeOptions}
                                            />
                                        </Form.Item>
                                    )
                                }}
                            </Form.Item>
                            <Form.Item
                                label={__('资源类型')}
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                                name="duty_resource_type"
                            >
                                <Select
                                    placeholder={__('请选择')}
                                    className={currentStyles['res-time-select']}
                                    options={ResourceTypeOptions}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('联系电话')}
                                name="phone"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: ErrorInfo.NOTNULL,
                                    },
                                    {
                                        pattern: numberReg,
                                        message: __('仅支持输入数字'),
                                    },
                                ]}
                            >
                                <Input
                                    placeholder={__('请输入')}
                                    maxLength={11}
                                    className={currentStyles['phone-input']}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('所属部门')}
                                name="org_code"
                                validateTrigger={['onChange', 'onBlur']}
                                validateFirst
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择'),
                                    },
                                ]}
                            >
                                <Select
                                    placeholder={__('请选择')}
                                    className={currentStyles['org-select']}
                                    options={departments}
                                    fieldNames={{ label: 'name', value: 'id' }}
                                    disabled={departments.length === 1}
                                />
                            </Form.Item>
                            <Form.Item
                                label={__('签收说明')}
                                rules={[
                                    {
                                        required: true,
                                        message: __('输入不能为空'),
                                    },
                                ]}
                                name="comment"
                            >
                                <Input.TextArea
                                    maxLength={300}
                                    showCount
                                    placeholder={__('请输入')}
                                    style={{
                                        width: 818,
                                        height: 80,
                                        resize: 'none',
                                    }}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                    <div className={styles.footer}>
                        <Space size={14}>
                            <Button
                                onClick={() => navigate('/demand-mgt?tab=todo')}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => form.submit()}
                            >
                                {__('提交')}
                            </Button>
                        </Space>
                    </div>
                </div>
            </div>
            <Confirm
                open={confirmOpen}
                title={__('确定要提交分析签收结果吗？')}
                content={__('分析签收结果提交后不可修改，请确认。')}
                onOk={handleSubmit}
                onCancel={() => setConfirmOpen(false)}
                width={432}
            />
        </div>
    )
}

export default Analysis
