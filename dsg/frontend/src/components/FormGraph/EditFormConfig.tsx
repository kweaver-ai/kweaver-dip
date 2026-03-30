import * as React from 'react'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
    Button,
    Drawer,
    Space,
    Form,
    Input,
    Select,
    Checkbox,
    Tooltip,
} from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { noop, slice, trim } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import { checkNameCorrect, checkNormalInput } from './helper'
import { validateName } from '@/utils/validate'
import {
    DataRangeOptions,
    FormTableKind,
    FormTableKindOptions,
    dataKindOptions,
    dataKindOptionsOfTC,
} from '../Forms/const'
import {
    formsEdit,
    getFormInfo,
    formatError,
    reqInfoSystemList,
    updReqStdTableName,
    getFileListByIds,
    transformQuery,
} from '@/core'

import { checkNameRepeat } from '../Forms/helper'

import Icons from '../BusinessArchitecture/Icons'
import BusinessTagsSelect from '../Forms/BusinessTagsSelect'
import { Architecture } from '../BusinessArchitecture/const'
import SelFileByType from '../CAFileManage/SelFileByType'
import { getFileExtension } from '@/utils'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

const defaultQueryParams = {
    direction: 'desc',
    keyword: '',
    limit: 2000,
    offset: 1,
}
interface DisplaySystemInfoTagsType {
    value?: Array<any>
    onChange?: (value) => void
    disabled?: boolean
    placeholder?: string
}
const DisplaySystemInfoTags = ({
    value = [],
    onChange = noop,
    disabled = false,
    placeholder = '',
}: DisplaySystemInfoTagsType) => {
    return (
        <div
            className={classnames(
                styles.selectSystemInfoInput,
                disabled && styles.selectSystemInfoInputDisabled,
            )}
        >
            {value.length ? (
                <Space align="start" wrap>
                    {value.map((item, index) => {
                        return (
                            <div key={index} className={styles.tagsStyle}>
                                <div
                                    className={styles.tagName}
                                    title={item.name}
                                >
                                    {item.name}
                                </div>
                                <div className={styles.tagClose}>
                                    {!disabled && (
                                        <CloseOutlined
                                            onClick={() => {
                                                onChange(
                                                    value.filter(
                                                        (vd, vindex) =>
                                                            vindex !== index,
                                                    ),
                                                )
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </Space>
            ) : (
                <Space>
                    <span className={styles.placeholderSystem}>
                        {placeholder}
                    </span>
                </Space>
            )}
        </div>
    )
}
interface EditFormConfigType {
    formId: string
    mid: string
    onClose: () => void
    onUpdate: (formCofig) => void
    model: string
    taskId: string
}

const EditFormConfig = ({
    onClose,
    formId,
    mid,
    onUpdate,
    model,
    taskId,
}: EditFormConfigType) => {
    const [form] = Form.useForm()
    const businessTagsSelectRef: any = useRef()

    const [loading, setLoading] = useState<boolean>(false)
    const [formData, setFormData] = useState<any>(null)

    // 基础信息分类
    const [dataKindOptionsList, setDataKindOptionsList] =
        useState<any[]>(dataKindOptions)

    const [queryParams, setQueryParams] = useState<any>(defaultQueryParams)

    const [systemOptions, setSystemOptions] = useState<Array<any>>([])

    const [systemLoading, setSystemLoading] = useState<boolean>(true)
    const [tagSum, setTagSum] = useState<number>(0)
    const [tableKindOptionsList, setTableKindOptionsList] =
        useState<any[]>(FormTableKindOptions)
    const { isDraft, selectedVersion, getDragData } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        // 优先使用拖拽数据中的 is_draft，如果没有则使用全局的 isDraft
        const dragData = getDragData ? getDragData(formId) : {}
        const currentIsDraft =
            dragData?.is_draft !== undefined ? dragData.is_draft : isDraft
        return transformQuery({ isDraft: currentIsDraft, selectedVersion })
    }, [isDraft, selectedVersion, getDragData, formId])

    useEffect(() => {
        initGetFormInfo()
        getInfoSystems()
    }, [])

    // 获取信息系统
    const getInfoSystems = async () => {
        try {
            setSystemLoading(true)
            const { entries, total_count } = await reqInfoSystemList(
                queryParams,
            )
            setSystemOptions(
                entries.map((systemInfo) => ({
                    label: (
                        <div
                            className={styles.systemItem}
                            title={systemInfo.name}
                        >
                            <Icons type={Architecture.BSYSTEM} />
                            <span className={styles.name}>
                                {systemInfo.name}
                            </span>
                        </div>
                    ),
                    value: systemInfo.id,
                    name: systemInfo.name,
                })),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setSystemLoading(false)
        }
    }

    /**
     * 初始化加载数据
     */
    const initGetFormInfo = async () => {
        const info = await getFormInfo(mid, formId, versionParams)
        setFormData(info)
        if (info.data_kind) {
            infoTypeOnChange(info.data_kind)
        }
        setTagSum(info.label_ids?.length || 0)
        let fileList: Array<any> = []
        if (info.stand_file_ids?.length) {
            const res = await getFileListByIds(info.stand_file_ids as string[])
            fileList = res?.data?.map((fileItem: any) => {
                return {
                    ...fileItem,
                    fileName: fileItem.name?.substring(
                        0,
                        fileItem.name.lastIndexOf('.'),
                    ),
                    fileType: getFileExtension(fileItem.name),
                    label: fileItem.name,
                    value: fileItem.name,
                    key: fileItem.id,
                }
            })
        }

        form.setFieldsValue({
            name: info.name,
            description: info.description,
            data_range: info.data_range,
            table_kind: info.table_kind,
            data_kind: info.data_kind,
            label_ids: info.label_ids,
            stand_file_ids: fileList,
        })
    }

    /**
     * 完成
     */
    const onFinish = async (values) => {
        // 发请求
        try {
            setLoading(true)
            const { stand_file_ids } = values
            await formsEdit(mid, formData?.id, {
                ...values,
                stand_file_ids: stand_file_ids?.map(
                    (item) => item.id || item.key || item,
                ),
                task_id: taskId,
            })
            // 修改名称，则修改新建标准表名称
            if (values?.name !== formData?.name) {
                await updReqStdTableName(formId, values.name)
            }
            onClose()
            onUpdate({
                ...values,
            })
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }

    // 基础信息分类 多选
    const infoTypeOnChange = (check) => {
        // 32 为其他 选择其他时，其他复选框不能选
        const project = localStorage.getItem('project')
        setDataKindOptionsList(
            (project === 'tc' ? dataKindOptionsOfTC : dataKindOptions).map(
                (item) => {
                    return {
                        ...item,
                        disabled: check.includes('other')
                            ? item.value !== 'other'
                            : false,
                    }
                },
            ),
        )
        if (check.includes('other')) {
            form.setFieldValue('data_kind', ['other'])
        }
    }

    return (
        <Drawer
            width={560}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('业务表信息')}</div>
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
            footer={
                model === 'view' ? null : (
                    <div className={styles.footerWrapper}>
                        <Space size={12}>
                            <Button
                                className={styles.cancelBtn}
                                onClick={onClose}
                            >
                                {__('取消')}
                            </Button>
                            <Button
                                className={styles.okBtn}
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                onClick={() => {
                                    form.validateFields()
                                        .then(() => form.submit())
                                        .catch(() => {
                                            // 在catch中进行错误定位
                                            setTimeout(() => {
                                                const errorList =
                                                    document.querySelectorAll(
                                                        '.any-fabric-ant-form-item-has-error',
                                                    )
                                                errorList[0]?.scrollIntoView({
                                                    block: 'center',
                                                    behavior: 'smooth',
                                                })
                                            }, 100)
                                        })
                                }}
                            >
                                {__('确定')}
                            </Button>
                        </Space>
                    </div>
                )
            }
            destroyOnClose
        >
            <Form
                layout="vertical"
                form={form}
                autoComplete="off"
                onFinish={onFinish}
                onFinishFailed={({ errorFields }) => {
                    setTimeout(() => {
                        form.scrollToField(errorFields[0].name[0])
                    }, 0)
                }}
            >
                <div>
                    <Form.Item
                        label={__('业务表名称')}
                        name="name"
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        rules={
                            model === 'view'
                                ? []
                                : [
                                      {
                                          required: true,
                                          message: __('输入不能为空'),
                                          transform: (value: string) =>
                                              trim(value),
                                          // validator: validateName(),
                                      },
                                      //   {
                                      //       validateTrigger: ['onBlur'],
                                      //       validator: (e, value) =>
                                      //           checkNameCorrect(e, value),
                                      //   },
                                      {
                                          validateTrigger: ['onBlur'],
                                          validator: (e, value) =>
                                              checkNameRepeat(
                                                  mid,
                                                  value,
                                                  formId,
                                              ),
                                      },
                                  ]
                        }
                    >
                        <Input
                            style={{
                                borderRadius: '4px 0 0 4px',
                            }}
                            placeholder={__('请输入业务表名称')}
                            maxLength={128}
                            autoComplete="off"
                            disabled={model === 'view'}
                            onBlur={() => {
                                businessTagsSelectRef?.current?.getRecommendList()
                            }}
                        />
                    </Form.Item>
                    {/* <Form.Item
                        label={__('类型')}
                        name="table_kind"
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        required
                        rules={[
                            {
                                required: true,
                                message: __('请选择类型'),
                            },
                        ]}
                    >
                        <Select
                            options={tableKindOptionsList}
                            placeholder={__('请选择类型')}
                            disabled
                        />
                    </Form.Item> */}

                    <Form.Item
                        noStyle
                        shouldUpdate={(prev, current) =>
                            prev.table_kind !== current.table_kind
                        }
                    >
                        {({ getFieldValue }) => {
                            const table_kind = getFieldValue('table_kind')
                            return (
                                [
                                    FormTableKind.STANDARD,
                                    FormTableKind.DATA_STANDARD,
                                ].includes(table_kind) && (
                                    <Form.Item
                                        label={__('关联标准文件')}
                                        name="stand_file_ids"
                                    >
                                        <SelFileByType />
                                    </Form.Item>
                                )
                            )
                        }}
                    </Form.Item>

                    <Form.Item
                        label={__('数据区域范围')}
                        name="data_range"
                        validateTrigger={['onChange', 'onBlur']}
                        rules={
                            model === 'view'
                                ? []
                                : [
                                      {
                                          required: true,
                                          message: __('请选择数据区域范围'),
                                      },
                                  ]
                        }
                    >
                        <Select
                            placeholder={__('请选择数据区域范围')}
                            options={DataRangeOptions}
                            disabled={model === 'view'}
                        />
                    </Form.Item>

                    <Form.Item label={__('基础信息分类')} name="data_kind">
                        <Checkbox.Group
                            disabled={model === 'view'}
                            options={dataKindOptionsList}
                            onChange={infoTypeOnChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label={__('描述')}
                        name="description"
                        validateFirst
                        validateTrigger={['onChange', 'onBlur']}
                        // rules={[
                        //     {
                        //         validateTrigger: ['onBlur'],
                        //         validator: (e, value) =>
                        //             checkNormalInput(e, value),
                        //     },
                        // ]}
                    >
                        <Input.TextArea
                            placeholder={__('请输入描述')}
                            style={{
                                height: `80px`,
                                resize: 'none',
                            }}
                            autoComplete="off"
                            maxLength={255}
                            disabled={model === 'view'}
                        />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                            const name = getFieldValue('name')
                            const desc = getFieldValue('description')
                            return (
                                <Form.Item
                                    label={__('业务标签（${sum}/5）', {
                                        sum: tagSum || '0',
                                    })}
                                    name="label_ids"
                                >
                                    <BusinessTagsSelect
                                        ref={businessTagsSelectRef}
                                        onChange={(list) => {
                                            setTagSum(list?.length)
                                        }}
                                        recommendParams={[
                                            {
                                                name,
                                                range_type: '1',
                                                desc,
                                            },
                                        ]}
                                    />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                </div>
            </Form>
        </Drawer>
    )
}

export default EditFormConfig
