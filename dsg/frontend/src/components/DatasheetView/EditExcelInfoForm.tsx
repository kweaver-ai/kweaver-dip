import { FC, useEffect, useState } from 'react'
import { Button, Form, Input, Space } from 'antd'
import { trim } from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import moment from 'moment'
import __ from './locale'
import {
    excelDetailConfig,
    excelFieldTemplate,
    excelFormConfig,
    IEditFormData,
    onLineStatusList,
    validateNameRepeat,
} from './const'
import { LabelTitle } from './DatasourceExploration/helper'
import { formatError, getExcelSheetsFields, LogicViewType } from '@/core'
import { lowercaseEnNumNameReg } from '@/utils'
import styles from './styles.module.less'
import DataOwnerCompositeComponent from '../DataOwnerCompositeComponent'
import { CombinedComponentType } from '../DataOwnerCompositeComponent/const'
import { useDataViewContext } from './DataViewProvider'
import { BasicCantainer } from '../ApiServices/helper'
import { FontIcon } from '@/icons'
import EditExcelDataRange from './EditExcelDataRange'
import ExcelDataRangeView from './EditExcelDataRange/ExcelDataRangeView'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { TimeRender } from '../DataAssetsCatlg/LogicViewDetail/helper'
import { getState, updateExcelFieldsStatus } from './helper'
import { IconType } from '@/icons/const'
import OwnerDisplay from '../OwnerDisplay'

const EditExcelInfoForm = () => {
    const [form] = Form.useForm()

    const {
        fieldsTableData,
        setFieldsTableData,
        datasheetInfo,
        setDatasheetInfo,
        optionType,
        excelForm,
    } = useDataViewContext()

    const [detailInfoContent, setDetailInfoContent] =
        useState<any>(excelDetailConfig)
    // 数据范围编辑弹窗是否打开
    const [dataRangeOpen, setDataRangeOpen] = useState<boolean>(false)

    // 数据范围数据
    const [dataRangeData, setDataRangeData] = useState<any>(null)

    const [subjectId, setSubjectId] = useState<string | undefined>()

    const [departmentId, setDepartmentId] = useState<string | undefined>(
        undefined,
    )
    const [{ using }] = useGeneralConfig()

    useEffect(() => {
        if (datasheetInfo?.id) {
            getDetailInfoContent()
        }
    }, [datasheetInfo, fieldsTableData])

    useEffect(() => {
        // 初始化数据
        setDataRangeData({
            sheet: datasheetInfo?.sheet ? datasheetInfo?.sheet.split(',') : [],
            cell_range: [datasheetInfo?.start_cell, datasheetInfo?.end_cell],
            has_headers: datasheetInfo?.has_headers === true ? 1 : 0,
            sheet_as_new_column:
                datasheetInfo?.sheet_as_new_column === true ? 1 : 0,
        })
        form.setFieldsValue({
            business_name: datasheetInfo?.business_name,
            technical_name: datasheetInfo?.technical_name,
            description: datasheetInfo?.description,
            subject_id: datasheetInfo?.subject_id,
            department_id: datasheetInfo?.department_id,
            owners: datasheetInfo?.owners?.map((o) => o.owner_id),
        })
        setSubjectId(datasheetInfo?.subject_id)
        setDepartmentId(datasheetInfo?.department_id)
    }, [])

    useEffect(() => {
        excelForm.current = form
    }, [])

    // 编辑表单配置
    const configFormItem = {
        business_name: (
            <Form.Item
                label={__('库表业务名称')}
                name="business_name"
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    {
                        required: true,
                        message: __('库表业务名称不能为空'),
                    },
                    {
                        validateTrigger: ['onBlur'],
                        validator: (e, value) =>
                            validateNameRepeat({
                                name: value,
                                flag: 'business_name',
                                type: LogicViewType.DataSource,
                                id: datasheetInfo?.id,
                                datasource_id: datasheetInfo?.datasource_id,
                            }),
                    },
                ]}
            >
                <Input placeholder={__('请输入库表业务名称')} maxLength={255} />
            </Form.Item>
        ),
        technical_name: (
            <Form.Item
                label={__('库表技术名称')}
                name="technical_name"
                validateFirst
                validateTrigger={['onChange', 'onBlur']}
                rules={[
                    {
                        required: true,
                        message: __('库表技术名称不能为空'),
                    },
                    {
                        validateTrigger: ['onChange', 'onBlur'],
                        pattern: lowercaseEnNumNameReg,
                        message: __(
                            '仅支持小写字母、数字及下划线，且不能以数字开头',
                        ),
                        transform: (value) => trim(value),
                    },
                    {
                        validateTrigger: ['onBlur'],
                        validator: (e, value) =>
                            validateNameRepeat({
                                name: value,
                                flag: 'technical_name',
                                type: LogicViewType.DataSource,
                                id: datasheetInfo?.id,
                                datasource_id: datasheetInfo?.datasource_id,
                            }),
                    },
                ]}
            >
                <Input
                    placeholder={__('请输入库表技术名称')}
                    maxLength={100}
                    title={__('元数据库表不能调整技术名称')}
                    disabled={datasheetInfo?.id}
                />
            </Form.Item>
        ),
        description: (
            <Form.Item label={__('描述')} name="description">
                <Input.TextArea
                    placeholder={__('请输入库表描述')}
                    maxLength={300}
                    showCount
                    autoSize={{ minRows: 5, maxRows: 5 }}
                    className={styles.textArea}
                />
            </Form.Item>
        ),
        subject_department_owner: (
            <div className={styles.formComponet}>
                <DataOwnerCompositeComponent
                    componentsConfig={[
                        {
                            name: 'subject_id',
                            label: __('所属业务对象'),
                            type: CombinedComponentType.THEME_DOMAIN_TREE,
                            defaultDisplay: subjectId,
                            disableDisplay: true,
                        },
                        {
                            name: 'department_id',
                            label: __('所属部门'),
                            type: CombinedComponentType.DEPARTMENT,
                            defaultDisplay: departmentId,
                            required: true,
                        },
                        {
                            name: 'owners',
                            label: __('数据Owner'),
                            type: CombinedComponentType.DATAOWNER,
                            mode: 'multiple',
                            perm: 'manageDataResourceAuthorization',
                        },
                    ]}
                    defaultDomainId={subjectId}
                    defaultOwnerId={datasheetInfo?.owner_id}
                    gutter={20}
                    numberPerLine={1}
                    form={form}
                />
            </div>
        ),
        data_range: (
            <Form.Item label={__('数据范围')} name="data_range">
                <Input placeholder={__('请输入数据范围')} maxLength={255} />
            </Form.Item>
        ),
    }

    /**
     * 获取详情信息内容
     */
    const getDetailInfoContent = () => {
        // 从 fieldsTableData 中获取字段数据来判断是否有业务时间戳
        const hasTimestamp = fieldsTableData?.some((o) => o.business_timestamp)
        const list = excelDetailConfig.map((item) => {
            const detailsField =
                using === 1
                    ? item.list.filter((o) => o.key !== 'online_status')
                    : hasTimestamp
                    ? item.list
                    : item.list.filter((o) => o.key !== 'data_updated_at')
            return {
                ...item,
                list: detailsField.map((it) => {
                    let value: any
                    if (it.key === 'created_at' || it.key === 'updated_at') {
                        value = moment(datasheetInfo?.[it.key]).format(
                            'YYYY-MM-DD HH:mm:ss',
                        )
                    } else if (it.key === 'owners') {
                        value = ''
                    } else {
                        value = datasheetInfo?.[it.key] || ''
                    }
                    const obj = {
                        ...it,
                        value,
                        render: () =>
                            it.key === 'status' ? (
                                getState(
                                    datasheetInfo?.last_publish_time
                                        ? 'publish'
                                        : 'unpublished',
                                )
                            ) : it.key === 'online_status' ? (
                                getState(
                                    datasheetInfo?.online_status,
                                    onLineStatusList,
                                )
                            ) : it.key === 'data_updated_at' ? (
                                <TimeRender formViewId={datasheetInfo?.id} />
                            ) : undefined,
                    }
                    return obj
                }),
            }
        })
        setDetailInfoContent(
            list.map((item) => {
                return {
                    ...item,
                    list: item.list.map((it) => {
                        if (it.key === 'sheet') {
                            return {
                                ...it,
                                value: (
                                    <div className={styles.sheetWrapper}>
                                        {datasheetInfo?.sheet
                                            ?.split(',')
                                            .map((sheetName, index) => {
                                                return (
                                                    <div
                                                        key={index}
                                                        className={styles.item}
                                                        title={sheetName}
                                                    >
                                                        <FontIcon name="icon-sheetye" />
                                                        <span
                                                            className={
                                                                styles.text
                                                            }
                                                        >
                                                            {sheetName}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                ),
                            }
                        }
                        if (it.key === 'cell_range') {
                            return {
                                ...it,
                                value: `${datasheetInfo?.start_cell}-${datasheetInfo?.end_cell}`,
                            }
                        }
                        if (it.key === 'sheet_as_new_column') {
                            return {
                                ...it,
                                value: datasheetInfo?.sheet_as_new_column
                                    ? __('是')
                                    : __('否'),
                            }
                        }
                        if (it.key === 'has_headers') {
                            return {
                                ...it,
                                value: datasheetInfo?.has_headers
                                    ? __('选取首行字段')
                                    : __('自定义'),
                            }
                        }
                        if (it.key === 'excel_file_name') {
                            return {
                                ...it,
                                render: () => {
                                    return datasheetInfo?.[it.key] ? (
                                        <div
                                            className={styles.excelFileWrapper}
                                            title={datasheetInfo?.[it.key]}
                                        >
                                            <FontIcon
                                                name="icon-xls"
                                                type={IconType.COLOREDICON}
                                                className={styles.icon}
                                            />
                                            <span
                                                className={styles.excelFileText}
                                            >
                                                {datasheetInfo?.[it.key]}
                                            </span>
                                        </div>
                                    ) : (
                                        '--'
                                    )
                                },
                            }
                        }
                        if (it.key === 'owners') {
                            return {
                                ...it,
                                render: () => (
                                    <OwnerDisplay
                                        value={datasheetInfo?.owners}
                                    />
                                ),
                            }
                        }
                        return {
                            ...it,
                            value: it.value || datasheetInfo?.[it.key],
                        }
                    }),
                }
            }),
        )
    }
    /**
     *
     * @param values
     */
    const handleGetFieldList = async (values) => {
        try {
            const {
                sheet,
                sheet_as_new_column,
                cell_range,
                has_headers,
                ...rest
            } = values

            const res = await getExcelSheetsFields({
                ...rest,
                sheet: sheet.join(','),
                sheet_as_new_column: !!sheet_as_new_column,
                start_cell: cell_range[0],

                end_cell: cell_range[1],

                has_headers: !!has_headers,
            })
            const fields = res.data.map((item) => {
                const fileId = uuidv4()
                return {
                    ...excelFieldTemplate,
                    business_name: item.column,
                    technical_name: item.column.toLocaleLowerCase(),
                    data_type: item.type,
                    original_data_type: item.type,
                    id: fileId,
                }
            })
            setFieldsTableData(updateExcelFieldsStatus(fields))
            setDatasheetInfo({
                ...datasheetInfo,
                fields,
                sheet: sheet.join(','),
                sheet_as_new_column: !!sheet_as_new_column,
                start_cell: cell_range[0],
                end_cell: cell_range[1],
                has_headers: !!has_headers,
            })
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 表单值改变
     * @param values
     */
    const handleFormValuesChange = (values) => {
        setDatasheetInfo({
            ...datasheetInfo,
            ...values,
        })
    }

    return (
        <div>
            {optionType === 'edit' ? (
                <div>
                    <Form
                        form={form}
                        autoComplete="off"
                        layout="horizontal"
                        labelAlign="left"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        onValuesChange={handleFormValuesChange}
                    >
                        {excelFormConfig.map((blockItem) => {
                            return (
                                <div
                                    key={blockItem.key}
                                    className={styles.editDataRangeWrapper}
                                >
                                    <div style={{ marginTop: -20 }}>
                                        {blockItem.key === 'data_range_info' &&
                                        dataRangeData ? (
                                            <LabelTitle
                                                label={
                                                    <div
                                                        className={
                                                            styles.labelTitleWrapper
                                                        }
                                                    >
                                                        <span>
                                                            {blockItem.title}
                                                        </span>
                                                        {!datasheetInfo?.id && (
                                                            <Button
                                                                type="link"
                                                                icon={
                                                                    <FontIcon
                                                                        name="icon-edit"
                                                                        style={{
                                                                            marginRight: 8,
                                                                        }}
                                                                    />
                                                                }
                                                                onClick={() =>
                                                                    setDataRangeOpen(
                                                                        true,
                                                                    )
                                                                }
                                                            >
                                                                {__(
                                                                    '编辑数据范围',
                                                                )}
                                                            </Button>
                                                        )}
                                                    </div>
                                                }
                                            />
                                        ) : (
                                            <LabelTitle
                                                label={blockItem.title}
                                            />
                                        )}
                                    </div>
                                    {blockItem.key === 'data_range_info' ? (
                                        dataRangeData?.sheet?.length ? (
                                            <ExcelDataRangeView
                                                size={[8, 16]}
                                                data={dataRangeData}
                                            />
                                        ) : (
                                            <div
                                                className={
                                                    styles.dataRangeEmpty
                                                }
                                            >
                                                <span>{__('点击')}</span>
                                                <Button
                                                    type="link"
                                                    onClick={() =>
                                                        setDataRangeOpen(true)
                                                    }
                                                >
                                                    {__('【配置数据范围】')}
                                                </Button>
                                                <span>
                                                    {__('按钮确定库表字段')}
                                                </span>
                                            </div>
                                        )
                                    ) : (
                                        blockItem.fields.map((item) => {
                                            return configFormItem[item.key]
                                        })
                                    )}
                                </div>
                            )
                        })}
                    </Form>
                </div>
            ) : (
                <BasicCantainer
                    basicCantainerContent={detailInfoContent}
                    labelWidth="142px"
                />
            )}
            {/* TODO: 获取字段列表，mock使用 */}
            {/* <Button type="primary" onClick={handleGetFieldList}>
                获取字段列表
            </Button> */}
            {optionType === 'edit' && dataRangeOpen && (
                <EditExcelDataRange
                    open={dataRangeOpen}
                    onCancel={() => setDataRangeOpen(false)}
                    onConfirm={(values) => {
                        handleGetFieldList(values)
                        setDataRangeOpen(false)
                        setDataRangeData(values)
                    }}
                    editInfo={dataRangeData}
                />
            )}
        </div>
    )
}

export default EditExcelInfoForm
