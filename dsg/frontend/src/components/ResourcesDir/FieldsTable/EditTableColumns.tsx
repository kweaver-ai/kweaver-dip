import { Form, Input, Select, Space } from 'antd'
import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import { ColumnsType } from 'antd/lib/table'
import { FormInstance } from 'antd/es/form'
import { trim } from 'lodash'
import { SortableHandle } from 'react-sortable-hoc'
import { MenuOutlined } from '@ant-design/icons'
import FormItemContainer from '../../FormTableMode/FormItemContainer'
import {
    ErrorInfo,
    entendNameEnReg,
    keyboardInputValidator,
    keyboardReg,
} from '@/utils'
import { checkRepeatName } from '../../FormGraph/helper'
import {
    DataTypeTemplate,
    RadioBox,
    HoldingComponent,
} from '../../FormTableMode/helper'
import __ from './locale'
import styles from './styles.module.less'
import SelectCodeOrStandard from '@/components/SelectCodeOrStandard'
import SelectTableCodeOrStandard from './SelectTableCodeOrStandard'
import {
    ShareTypeEnum,
    shareTypeList,
    OpenTypeEnum,
    openTypeList,
    sensitiveOptions,
    typeOptoins,
    classifiedOptoins,
} from '../const'
import SelectValueRange from '@/components/FormTableMode/SelectValueRange'
import {
    ValueRangeType,
    StandardDataDetail,
} from '@/components/FormTableMode/const'

const DragHandle = SortableHandle(() => (
    <MenuOutlined style={{ cursor: 'grab', color: '#999' }} />
))

interface IGetEditTableColumns {
    // 获取所有字段
    getAllFieldsData: () => Array<any>
    // 表单实例
    form: FormInstance<any>
    parentNode: any
}

/**
 * 获取可编辑表表头
 * @param param0
 * @returns
 */
export const getEditTableColumns = ({
    getAllFieldsData,
    form,
    parentNode,
}: IGetEditTableColumns): ColumnsType<any> => {
    return [
        {
            dataIndex: 'drag',
            width: 50,
            key: 'drag',
            className: 'drag-visible',
            render: () => <DragHandle />,
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>
                        {__('信息项业务名称')}
                    </span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ),
            key: 'business_name',
            width: 240,
            // fixed: 'left',
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'business_name']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: keyboardReg,
                            message: ErrorInfo.EXCEPTEMOJI,
                            transform: (value) => trim(value),
                        },
                        {
                            validateTrigger: ['onBlur'],
                            validator: (e, value) =>
                                checkRepeatName(
                                    value,
                                    record,
                                    getAllFieldsData(),
                                ),
                        },
                    ]}
                    id={`fields-${index}-business_name`}
                    parentNode={parentNode}
                >
                    <Input
                        style={{
                            borderRadius: '4px',
                            width: '220px',
                        }}
                        autoComplete="off"
                        placeholder={__('请输入信息项业务名称')}
                        maxLength={128}
                    />
                </FormItemContainer>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>
                        {__('信息项技术名称')}
                    </span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ),
            key: 'technical_name',
            width: 240,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'technical_name']}
                    validateFirst
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            transform: (val) => trim(val),
                            message: __('输入不能为空'),
                        },
                        {
                            pattern: entendNameEnReg,
                            message: __(
                                '仅支持英文、数字、下划线及中划线，且不能以下划线和中划线开头',
                            ),
                            transform: (value) => trim(value),
                        },
                    ]}
                    id={`fields-${index}-technical_name`}
                    parentNode={parentNode}
                >
                    <Input
                        style={{
                            borderRadius: '4px',
                            width: '220px',
                        }}
                        autoComplete="off"
                        placeholder={__('请输入信息项技术名称')}
                        maxLength={128}
                    />
                </FormItemContainer>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span>{__('关联数据标准')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ),
            width: 300,
            key: 'standard_code',
            render: (_, record, index) => (
                <SelectTableCodeOrStandard fields={record} type="code" />
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span>{__('关联码表')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ),
            width: 300,
            key: 'code_table_id',
            render: (_, record, index) => (
                <SelectTableCodeOrStandard fields={record} type="code" />
                // <FormItemContainer
                //     name={['fields', index, 'code_table_id']}
                //     validateTrigger={['onChange', 'onBlur']}
                //     rules={[
                //         {
                //             required: true,
                //             message: __('请选择共享属性'),
                //         },
                //     ]}
                // >
                //     <SelectValueRange
                //         type={ValueRangeType.CodeTable}
                //         standardRuleDetail={standardRuleDetail}
                //         style={{ width: '330px' }}
                //         onChange={(currentValue) => {
                //             form.setFields([
                //                 {
                //                     name: ['fields', index, 'code_table_id'],
                //                     errors: [],
                //                     value: currentValue,
                //                 },
                //             ])
                //         }}
                //     />
                // </FormItemContainer>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('数据类型')}</span>
                    <div className={styles.tips}>{__('不支持批量配置')}</div>
                </div>
            ),
            width: 360,
            key: 'data_type',
            render: (_, record, index) => (
                <DataTypeTemplate
                    names={['fields', index]}
                    fields={record}
                    dataTypes={
                        typeOptoins.map((item) => ({
                            value_en: item.value,
                            value: item.label,
                        })) || []
                    }
                    form={form}
                    parentNode={parentNode}
                    isRequired
                />
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('共享属性')}</span>
                    <div>
                        <Form.Item name={['shared_type', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '130px' }}
                                options={shareTypeList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ),
            key: 'shared_type',
            width: 338,
            render: (_, record, index) => (
                <Space size={8}>
                    <FormItemContainer
                        name={['fields', index, 'shared_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择共享属性'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择')}
                            style={{ width: '130px' }}
                            options={shareTypeList}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                        />
                    </FormItemContainer>
                    <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                            prevValues?.fields[index]?.shared_type !==
                            curValues?.fields[index]?.shared_type
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const sharedType = getFieldValue([
                                'fields',
                                index,
                                'shared_type',
                            ])
                            return sharedType !== ShareTypeEnum.UNCONDITION ? (
                                <FormItemContainer
                                    name={['fields', index, 'shared_condition']}
                                    rules={[
                                        {
                                            required: true,
                                            message: `请输入${
                                                sharedType ===
                                                ShareTypeEnum.CONDITION
                                                    ? __('共享条件')
                                                    : __('不予共享依据')
                                            }`,
                                        },
                                        {
                                            validator: keyboardInputValidator(),
                                        },
                                    ]}
                                    validateFirst
                                    id={`fields-${index}-shared_condition`}
                                >
                                    <Input
                                        maxLength={128}
                                        style={{ width: '164px' }}
                                        placeholder={
                                            sharedType ===
                                            ShareTypeEnum.CONDITION
                                                ? __('共享条件(必填)')
                                                : __('不予共享依据（必填）')
                                        }
                                    />
                                </FormItemContainer>
                            ) : (
                                <HoldingComponent
                                    style={{ width: '164px' }}
                                    text={__('无需配置此选项')}
                                />
                            )
                        }}
                    </Form.Item>
                </Space>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('开放属性')}</span>
                    <div>
                        <Form.Item name={['open_type', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '134px' }}
                                options={openTypeList}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ),
            key: 'open_type',
            width: 338,
            render: (_, record, index) => (
                <Space size={8}>
                    <FormItemContainer
                        name={['fields', index, 'open_type']}
                        validateTrigger={['onChange', 'onBlur']}
                        rules={[
                            {
                                required: true,
                                message: __('请选择开放属性'),
                            },
                        ]}
                    >
                        <Select
                            placeholder={__('请选择')}
                            style={{ width: '134px' }}
                            options={openTypeList}
                            getPopupContainer={(element) =>
                                parentNode || element.parentNode
                            }
                        />
                    </FormItemContainer>
                    <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                            prevValues?.fields[index]?.open_type !==
                            curValues?.fields[index]?.open_type
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const openTypes = getFieldValue([
                                'fields',
                                index,
                                'open_type',
                            ])
                            return openTypes === OpenTypeEnum.HASCONDITION ? (
                                <FormItemContainer
                                    name={['fields', index, 'open_condition']}
                                >
                                    <Input
                                        maxLength={128}
                                        style={{ width: '160px' }}
                                        placeholder={__('开放条件(选填)')}
                                    />
                                </FormItemContainer>
                            ) : (
                                <HoldingComponent
                                    style={{ width: '160px' }}
                                    text={__('无需配置此选项')}
                                />
                            )
                        }}
                    </Form.Item>
                </Space>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('敏感属性')}</span>
                    <div>
                        <Form.Item name={['sensitive_flag', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                                options={sensitiveOptions}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ),
            key: 'sensitive_flag',
            width: 128,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'sensitive_flag']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('请选择敏感属性'),
                        },
                    ]}
                >
                    <Select
                        placeholder={__('请选择')}
                        style={{ width: '92px' }}
                        options={sensitiveOptions}
                        getPopupContainer={(element) =>
                            parentNode || element.parentNode
                        }
                    />
                </FormItemContainer>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span className={styles.fieldLabel}>{__('涉密属性')}</span>
                    <div>
                        <Form.Item name={['classified_flag', 'value']} noStyle>
                            <Select
                                placeholder={__('多项值')}
                                style={{ width: '92px' }}
                                options={classifiedOptoins}
                                getPopupContainer={(element) =>
                                    parentNode || element.parentNode
                                }
                            />
                        </Form.Item>
                    </div>
                </div>
            ),
            key: 'classified_flag',
            width: 128,
            render: (_, record, index) => (
                <FormItemContainer
                    name={['fields', index, 'classified_flag']}
                    validateTrigger={['onChange', 'onBlur']}
                    rules={[
                        {
                            required: true,
                            message: __('请选择敏感属性'),
                        },
                    ]}
                >
                    <Select
                        placeholder={__('多项值')}
                        style={{ width: '92px' }}
                        options={classifiedOptoins}
                        getPopupContainer={(element) =>
                            parentNode || element.parentNode
                        }
                    />
                </FormItemContainer>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否时间戳')}</span>
                    <div className={styles.tips}>{__('不支持批量')}</div>
                </div>
            ),
            key: 'timestamp_flag',
            width: 102,
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'timestamp_flag']}
                    valuePropName="checked"
                >
                    <RadioBox />
                </Form.Item>
            ),
        },
        {
            title: (
                <div className={styles.tableTitleContainer}>
                    <span>{__('是否主键')}</span>
                    <div className={styles.tips}>{__('不支持批量')}</div>
                </div>
            ),
            key: 'primary_flag',
            width: 102,
            render: (_, record, index) => (
                <Form.Item
                    name={['fields', index, 'primary_flag']}
                    valuePropName="checked"
                >
                    <RadioBox />
                </Form.Item>
            ),
        },
    ]
}
