import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { DisplayInfoComponentType } from '../AutoFormView/helper'

import { FormFiled } from '@/core/apis/businessGrooming/index.d'
import __ from './locale'
import AutoFormView from '../AutoFormView'
import styles from './styles.module.less'
import { formsEnumConfig } from '@/core'
import {
    OpenAttribute,
    OpenAttributeOption,
    SecurityClassificationOption,
    SensibilityOption,
    SharedAttribute,
    SharedAttributeOption,
} from './helper'
import { ValueRangeType, exChangeRangeDataToObj } from '../FormTableMode/const'
import ValueRangeLabel from './ValueRangeLabel'
import { ViewConfig } from '../AutoFormView/baseViewComponents'
import { FormTableKind } from '../Forms/const'

interface ViewFieldDetailType {
    data: any
    node: any
    tableKind: FormTableKind
    onClose: () => void
}

const ViewFieldDetail = ({
    onClose,
    data,
    node,
    tableKind,
}: ViewFieldDetailType) => {
    const [form] = Form.useForm()
    // const [formData, setFormData] = useState<any>(null)
    const [formConfig, setFormConfig] = useState<any>(null)

    useEffect(() => {
        initGetFormInfo()
        initFormConfig()
    }, [data, tableKind])

    /**
     * 初始化加载数据
     */
    const initGetFormInfo = async () => {
        // setFormData(info)
        // form.setFieldsValue({
        //     name: info.name,
        //     description: info.description,
        //     guideline: info.guideline || '',
        //     data_range: info.data_range,
        //     update_cycle: info.update_cycle,
        //     resource_tag: info.resource_tag || [],
        //     source_system: info.source_system || [],
        //     source_business_scene: info.source_business_scene || [],
        //     related_business_scene: info.related_business_scene || [],
        // })
    }

    const getDataTypeConfig = (
        dataOptions,
    ): {
        [key: string]: ViewConfig
    } => {
        switch (data.data_type) {
            case 'number':
                return {
                    data_type: {
                        type: DisplayInfoComponentType.SelectText,
                        label: __('数据类型'),
                        options: dataOptions.map((dataOption) => ({
                            label: dataOption.value,
                            value: dataOption.value_en,
                        })),
                    },
                    data_length: {
                        type: DisplayInfoComponentType.Text,
                        label: __('数据长度'),
                    },
                    data_accuracy: {
                        type: DisplayInfoComponentType.Text,
                        label: __('数据精度'),
                    },
                }
            case 'char':
                return {
                    data_type: {
                        type: DisplayInfoComponentType.SelectText,
                        label: __('数据类型'),
                        options: dataOptions.map((dataOption) => ({
                            label: dataOption.value,
                            value: dataOption.value_en,
                        })),
                    },
                    data_length: {
                        type: DisplayInfoComponentType.Text,
                        label: __('数据长度'),
                    },
                }
            default:
                return {
                    data_type: {
                        type: DisplayInfoComponentType.SelectText,
                        label: __('数据类型'),
                        options: dataOptions.map((dataOption) => ({
                            label: dataOption.value,
                            value: dataOption.value_en,
                        })),
                    },
                }
        }
    }

    const getFieldConfig = async () => {
        const enumConfig = await formsEnumConfig()
        const data_type = enumConfig?.data_type

        const group5Children: any = {
            shared_attribute: {
                type: DisplayInfoComponentType.SelectText,
                label: __('共享属性'),
                options: SharedAttributeOption,
            },
            shared_condition: {
                type: DisplayInfoComponentType.AreaText,
                label: __('共享条件'),
            },
            open_attribute: {
                type: DisplayInfoComponentType.SelectText,
                label: __('开放属性'),
                options: OpenAttributeOption,
            },
            open_condition: {
                type: DisplayInfoComponentType.AreaText,
                label: __('开放条件'),
            },
        }
        if (data.shared_attribute === SharedAttribute.UnconditionalShare) {
            delete group5Children.shared_condition
        } else if (data?.shared_attribute === SharedAttribute.NotShare) {
            group5Children.shared_condition.label = __('不予共享依据')
        }
        if (data.open_attribute === OpenAttribute.NotOpen) {
            delete group5Children.open_condition
        }

        const standardConfig =
            node?.data?.formInfo?.table_kind === FormTableKind.DATA_STANDARD ||
            node?.data?.formInfo?.table_kind === FormTableKind.DATA_FUSION
                ? {
                      is_standardization_required: {
                          type: DisplayInfoComponentType.BooleanText,
                          label: __('是否标准'),
                      },
                      standard_id: {
                          type: DisplayInfoComponentType.Custom,
                          label: __('数据标准'),
                          CustomComponent: data.standard_id ? (
                              <ValueRangeLabel
                                  type={ValueRangeType.DataElement}
                                  value={data.standard_id}
                                  isStandard
                              />
                          ) : (
                              '--'
                          ),
                      },
                  }
                : {}

        if (tableKind === FormTableKind.DATA_ORIGIN) {
            return {
                group1: {
                    type: DisplayInfoComponentType.GroupType2,
                    label: __('基本信息'),
                    expand: true,
                    children: {
                        name: {
                            type: DisplayInfoComponentType.Text,
                            label: __('字段业务名称'),
                        },
                        name_en: {
                            type: DisplayInfoComponentType.Text,
                            label: __('字段技术名称'),
                        },

                        is_primary_key: {
                            type: DisplayInfoComponentType.BooleanText,
                            label: __('主键'),
                        },
                        is_required: {
                            type: DisplayInfoComponentType.BooleanText,
                            label: __('必填'),
                        },
                    },
                },
                group2: {
                    type: DisplayInfoComponentType.GroupType2,
                    label: __('技术属性'),
                    expand: true,
                    children: {
                        ...getDataTypeConfig(data_type),
                        code_table: {
                            type: DisplayInfoComponentType.Text,
                            label: __('码表'),
                        },
                    },
                },
                group3: {
                    type: DisplayInfoComponentType.GroupType2,
                    label: __('更多属性'),
                    expand: true,
                    children: {
                        value_range: {
                            type: DisplayInfoComponentType.AreaText,
                            label: __('取值范围'),
                        },
                        encoding_rule: {
                            type: DisplayInfoComponentType.Text,
                            label: __('编码规则'),
                        },
                        field_relationship: {
                            type: DisplayInfoComponentType.Text,
                            label: __('字段关系'),
                        },
                        is_current_business_generation: {
                            type: DisplayInfoComponentType.BooleanText,
                            label: __('本业务产生'),
                        },
                        description: {
                            type: DisplayInfoComponentType.Text,
                            label: __('描述'),
                        },
                    },
                },
            }
        }
        return {
            group1: {
                type: DisplayInfoComponentType.GroupType2,
                label: __('基本信息'),
                expand: true,
                children: {
                    name: {
                        type: DisplayInfoComponentType.Text,
                        label: __('字段业务名称'),
                    },
                    name_en: {
                        type: DisplayInfoComponentType.Text,
                        label: __('字段技术名称'),
                    },
                    description: {
                        type: DisplayInfoComponentType.Text,
                        label: __('描述'),
                    },
                    is_primary_key: {
                        type: DisplayInfoComponentType.BooleanText,
                        label: __('主键'),
                    },
                    is_required: {
                        type: DisplayInfoComponentType.BooleanText,
                        label: __('必填'),
                    },
                    is_current_business_generation: {
                        type: DisplayInfoComponentType.BooleanText,
                        label: __('本业务产生'),
                    },
                },
            },
            group2: {
                type: DisplayInfoComponentType.GroupType2,
                label: __('技术属性'),
                expand: true,
                children: {
                    ...(standardConfig as any),
                    ...getDataTypeConfig(data_type),
                    code_table: {
                        type: DisplayInfoComponentType.Text,
                        label: __('码表'),
                    },
                    value_range: {
                        type: DisplayInfoComponentType.AreaText,
                        label: __('取值范围'),
                    },
                    encoding_rule: {
                        type: DisplayInfoComponentType.Text,
                        label: __('编码规则'),
                    },
                    field_relationship: {
                        type: DisplayInfoComponentType.Text,
                        label: __('字段关系'),
                    },
                },
            },
            group3: {
                type: DisplayInfoComponentType.GroupType2,
                label: __('安全信息'),
                expand: true,
                children: {
                    sensitive_attribute: {
                        type: DisplayInfoComponentType.SelectText,
                        label: __('敏感属性'),
                        options: SensibilityOption,
                    },
                    confidential_attribute: {
                        type: DisplayInfoComponentType.SelectText,
                        label: __('涉密属性'),
                        options: SecurityClassificationOption,
                    },
                    ...group5Children,
                },
            },
        }
    }

    /**
     * 初始化配置
     */
    const initFormConfig = async () => {
        const enumConfig = await formsEnumConfig()
        const data_type = enumConfig?.data_type
        const formulate_basis = enumConfig?.formulate_basis
        const config = await getFieldConfig()
        // if (data.value_range_type === ValueRangeType.CodeRule) {
        //     const valueRangeObj = exChangeRangeDataToObj(data.value_range)
        //     if (valueRangeObj.id && config?.group2?.children) {
        //         config.group2.children.value_range = {
        //             type: DisplayInfoComponentType.Custom,
        //             label: __('编码规则'),
        //             CustomComponent: (
        //                 <ValueRangeLabel
        //                     type={data.value_range_type}
        //                     value={data.value_range}
        //                 />
        //             ),
        //         }
        //     }
        // } else if (data.value_range_type === ValueRangeType.CodeTable) {
        //     if (config?.group2?.children) {
        //         config.group2.children.value_range = {
        //             type: DisplayInfoComponentType.Custom,
        //             label: __('码表'),
        //             CustomComponent: (
        //                 <ValueRangeLabel
        //                     type={data.value_range_type}
        //                     value={data.value_range}
        //                 />
        //             ),
        //         }
        //     }
        // } else if (config?.group2?.children?.value_range) {
        //     delete config.group2.children.value_range
        // }
        if (tableKind === FormTableKind.DATA_ORIGIN) {
            if (config?.group2?.children?.code_table && data.code_table) {
                config.group2.children.code_table = {
                    type: DisplayInfoComponentType.Custom,
                    label: __('码表'),
                    CustomComponent: (
                        <ValueRangeLabel
                            type={ValueRangeType.CodeTable}
                            value={`${data.code_table}>><<`}
                        />
                    ),
                }
            }
            if (config?.group3?.children?.encoding_rule && data.encoding_rule) {
                config.group3.children.encoding_rule = {
                    type: DisplayInfoComponentType.Custom,
                    label: __('编码规则'),
                    CustomComponent: (
                        <ValueRangeLabel
                            type={ValueRangeType.CodeRule}
                            value={`${data.encoding_rule}>><<`}
                        />
                    ),
                }
            }
        } else if (config?.group2?.children) {
            if (data.code_table) {
                config.group2.children.code_table = {
                    type: DisplayInfoComponentType.Custom,
                    label: __('码表'),
                    CustomComponent: (
                        <ValueRangeLabel
                            type={ValueRangeType.CodeTable}
                            value={`${data.code_table}>><<`}
                        />
                    ),
                }
            }
            if (data.encoding_rule) {
                config.group2.children.encoding_rule = {
                    type: DisplayInfoComponentType.Custom,
                    label: __('编码规则'),
                    CustomComponent: (
                        <ValueRangeLabel
                            type={ValueRangeType.CodeRule}
                            value={`${data.encoding_rule}>><<`}
                        />
                    ),
                }
            }
        }

        setFormConfig(config)
    }

    const getValueRangeTypeDisplay = (valueType, value) => {
        if (valueType === ValueRangeType.CodeRule) {
            const valueRangeObj = exChangeRangeDataToObj(data.value_range)
            if (valueRangeObj.id) {
                return __('编码规则/从已有规则中选择')
            }
            return __('编码规则/自定义')
        }
        if (data.value_range_type === ValueRangeType.CodeTable) {
            return __('码表')
        }
        return __('无限制')
    }
    return (
        <Drawer
            width={560}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('字段信息')}</div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            onClose={() => {
                onClose()
            }}
            mask={false}
            open
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={null}
            destroyOnClose
            push={false}
        >
            {formConfig && (
                <AutoFormView
                    data={{
                        ...data,
                        value_range_type: getValueRangeTypeDisplay(
                            data.value_range_type,
                            data.value_range,
                        ),
                    }}
                    config={formConfig}
                />
            )}
        </Drawer>
    )
}

export default ViewFieldDetail
