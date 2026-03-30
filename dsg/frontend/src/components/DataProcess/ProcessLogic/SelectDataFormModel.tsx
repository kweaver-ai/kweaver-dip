import { FC, useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Select, Spin } from 'antd'
import { noop, trim } from 'lodash'
import { useDebounce } from 'ahooks'
import {
    DataSourceFromType,
    formatError,
    getDataFormFields,
    getDataSourceList,
    getFormsFromDatasource,
    getObjects,
} from '@/core'
import { Architecture } from '../../BusinessArchitecture/const'
import Icons from '../../BusinessArchitecture/Icons'
import DataSourcIcons from '../../DataSource/Icons'
import __ from '../locale'
import styles from '../styles.module.less'
import { DataBaseType } from '@/components/DataSource/const'
import { catalogs } from '@/components/Requirement/const'
import { databaseTypesEleData } from '@/core/dataSource'

interface ISelectDataFormModel {
    onClose: () => void
    onConfirm?: (fieldData: Array<any>, errorFormInfo: Array<any>) => void
    allDataForms: Array<any>
}
const SelectDataFormModel: FC<ISelectDataFormModel> = ({
    onClose,
    onConfirm = noop,
    allDataForms,
}) => {
    const [form] = Form.useForm()
    const [selectedSystem, setSelectedSystem] = useState<string>('')
    const [selectedSystemName, setSelectedSystemName] = useState<string>('')
    const [dataOriginOptions, setDataOriginOptions] = useState<Array<any>>([])
    const [infoSystemOptions, setInfoSystemOptions] = useState<Array<any>>([])
    const [systemTotalCount, setSysetemTotalCount] = useState<number>(0)
    const [selectedDataSourceCatalog, setSelectedDataSourceCatalog] =
        useState<string>('')
    const [selectedDataSourceType, setSelectedDataSourceType] =
        useState<string>('')
    const [selectedDataSourceName, setSelectedDataSourceName] =
        useState<string>('')
    const [selectedFormOptions, setSelectedFormOptions] = useState<Array<any>>(
        [],
    )
    const [selectedDataSchema, setSelectedDataSchema] = useState<string>('')

    const [selectedData, setSelectedData] = useState<Array<any>>([])

    const [sysetmKeyword, setSystemKeyword] = useState<string>('')

    const debounceValue = useDebounce(sysetmKeyword, { wait: 500 })

    const [datasourceKeyword, setDatasouceKeyword] = useState<string>('')

    const [dataFormKeyword, setDataFormKeyword] = useState<string>('')

    const [systemLoading, setSystemLoading] = useState<boolean>(true)

    const [dataSourceLoading, setDataSourceLoading] = useState<boolean>(true)

    const [formLoading, setFormLoading] = useState<boolean>(true)

    const [confirmLoading, setConfirmLoading] = useState<boolean>(false)

    // useEffect(() => {
    //     getSystemsOptions([])
    // }, [debounceValue])

    // useEffect(() => {
    //     getSystemsOptions([])
    // }, [])

    useEffect(() => {
        getDataOriginOptions()
    }, [])

    /**
     * 获取数据表下拉
     */
    const getDataFormOptions = async (dataSourceId: string) => {
        try {
            setFormLoading(true)
            const names = await getFormsFromDatasource(dataSourceId)
            if (names?.length) {
                setSelectedFormOptions(
                    names.map((name) => ({
                        value: name,
                        label: (
                            <div className={styles.selectMetaOptions}>
                                <span className={styles.name} title={name}>
                                    {name}
                                </span>
                            </div>
                        ),
                        disabled:
                            !!allDataForms.find(
                                (currentForms) =>
                                    name === currentForms.table_name &&
                                    currentForms.datasource_id === dataSourceId,
                            ) ||
                            allDataForms.length + selectedData.length >= 50,
                    })),
                )
            }
            setFormLoading(false)
        } catch (ex) {
            formatError(ex)
        }
    }

    /**
     * 获取数据源下拉
     * @param systemId
     */
    const getDataOriginOptions = async () => {
        setDataSourceLoading(true)
        const { entries } = await getDataSourceList({
            source_type: DataSourceFromType.Analytical,
            limit: 999,
        })

        setDataSourceLoading(false)
        setDataOriginOptions(
            entries.map((dataSourceInfo) => {
                const { Outlined } =
                    databaseTypesEleData?.dataBaseIcons?.[
                        dataSourceInfo?.type
                    ] || {}
                const ICons = Outlined ? (
                    <Outlined style={{ fontSize: 22 }} />
                ) : null
                return {
                    label: (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {ICons}
                            <span
                                style={{
                                    marginLeft: '10px',
                                }}
                                className={styles.systemInfoName}
                                title={dataSourceInfo.name}
                            >
                                {dataSourceInfo.name}
                            </span>
                        </div>
                    ),
                    value: dataSourceInfo.id,
                    dataType: dataSourceInfo.type,
                    detail: dataSourceInfo,
                }
            }),
        )
    }

    /**
     * 获取下拉框的选项的显示
     * @param name
     * @returns
     */
    const getInfoSystemLabel = (name: string) => {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <Icons type={Architecture.BSYSTEM} />
                <span
                    style={{
                        marginLeft: '10px',
                    }}
                    className={styles.systemInfoName}
                    title={name}
                >
                    {name}
                </span>
            </div>
        )
    }
    /**
     *  获取下拉选项
     * @param initData
     * @param systemId
     * @param systemName
     */
    const getSystemsOptions = async (initData) => {
        setSystemLoading(true)
        const { entries, total_count } = await getObjects({
            is_all: true,
            offset: initData.length ? Math.floor(initData.length / 20) + 1 : 1,
            id: '',
            limit: 20,
            type: Architecture.BSYSTEM,
            keyword: debounceValue,
        })
        setSysetemTotalCount(total_count)
        setSystemLoading(false)
        setInfoSystemOptions([
            ...initData,
            ...entries.map((infoSystemData) => ({
                label: getInfoSystemLabel(infoSystemData.name),
                value: infoSystemData.id,
                detail: infoSystemData,
            })),
        ])
    }
    /**
     * 表单变化
     * @param values
     */
    const handleValuesChange = async (values, allValues) => {
        if (Object.keys(values).includes('info_system_id')) {
            setSelectedSystem(values.info_system_id)
            form.setFieldValue('datasource_id', undefined)
            form.setFieldValue('tableList', undefined)
            setSelectedDataSourceType('')
            setSelectedDataSourceName('')
            setSelectedData([])
        }
        if (Object.keys(values).includes('datasource_id')) {
            form.setFieldValue('tableList', undefined)
            setSelectedData([])
        }
        if (Object.keys(values).includes('tableList')) {
            if (values.tableList.length > selectedData.length) {
                setSelectedFormOptions(
                    selectedFormOptions.map((currentData) => ({
                        ...currentData,
                        disabled:
                            (!!allDataForms.find(
                                (currentForms) =>
                                    currentData.value ===
                                        currentForms.table_name &&
                                    currentForms.datasource_id ===
                                        allValues.datasource_id,
                            ) ||
                                allDataForms.length + values.tableList.length >=
                                    50) &&
                            !values.tableList.find(
                                (currentForms) =>
                                    currentData.value === currentForms,
                            ),
                    })),
                )
            } else {
                setSelectedData([
                    ...selectedData.filter(
                        (currentForm) =>
                            !values.tableList.includes(currentForm.table_name),
                    ),
                ])
            }
        }
    }

    /**
     * 滚动加载信息系统
     * @param e
     */
    const getInfoSystemsByScroll = (e) => {
        const { target } = e
        if (
            target.scrollTop + target.offsetHeight === target.scrollHeight &&
            systemTotalCount > infoSystemOptions.length
        ) {
            getSystemsOptions(infoSystemOptions)
        }
    }

    /**
     * 选择数据源表
     * @param values
     */
    const handleFinsh = async (values) => {
        try {
            setConfirmLoading(true)
            let tableErrorInfo: Array<any> = []
            const dataFormInfos = await Promise.all(
                values.tableList.map((tableName) =>
                    getDataFormFields(tableName, values.datasource_id).catch(
                        (error) => {
                            tableErrorInfo = [
                                ...tableErrorInfo,
                                {
                                    name: tableName,
                                    errorDescription:
                                        error?.data?.description ||
                                        __('无法连接服务器'),
                                },
                            ]
                            return Promise.resolve(null)
                        },
                    ),
                ),
            )
            onConfirm(
                values.tableList
                    .filter((name, index) => !!dataFormInfos[index])
                    .map((name, index) => ({
                        datasource_id: values.datasource_id,
                        datasource_name: selectedDataSourceName,
                        datasource_type: selectedDataSourceType,
                        table_name: name,
                        catalog_name: selectedDataSourceCatalog,
                        schema: selectedDataSchema,
                        fields: dataFormInfos[index].map(
                            (currentField) => currentField.name,
                        ),
                    })),
                tableErrorInfo,
            )
            onClose()
            setConfirmLoading(false)
        } catch (ex) {
            setConfirmLoading(false)
            formatError(ex)
        }
    }
    return (
        <Modal
            title={__('添加数据表')}
            width={640}
            onCancel={onClose}
            open
            onOk={() => {
                form.submit()
            }}
            maskClosable={false}
            confirmLoading={confirmLoading}
        >
            <Form
                form={form}
                onFinish={handleFinsh}
                layout="vertical"
                onValuesChange={handleValuesChange}
                autoComplete="off"
            >
                <Form.Item
                    name="datasource_id"
                    label={__('数据源')}
                    required
                    rules={[
                        {
                            required: true,
                            message: __('请选择数据源'),
                        },
                    ]}
                >
                    <Select
                        options={dataOriginOptions}
                        placeholder={__('请选择数据源')}
                        onChange={(value, option) => {
                            setSelectedDataSourceType(option.dataType)
                            setSelectedDataSourceName(option.detail.name)
                            setSelectedDataSourceCatalog(
                                option.detail.catalog_name,
                            )
                            setSelectedDataSchema(option.detail.schema)
                            getDataFormOptions(value)
                        }}
                        allowClear
                        showSearch
                        onSearch={(value) => {
                            if (value.length <= 128) {
                                setDatasouceKeyword(value)
                            }
                        }}
                        searchValue={datasourceKeyword}
                        filterOption={(value, option) => {
                            return option.detail.name
                                .toLocaleLowerCase()
                                .includes(value.toLocaleLowerCase())
                        }}
                        notFoundContent={
                            dataSourceLoading ? (
                                <Spin />
                            ) : dataOriginOptions?.length ? (
                                __('未找到匹配的结果')
                            ) : (
                                __('暂无数据')
                            )
                        }
                    />
                </Form.Item>
                <Form.Item
                    shouldUpdate={(prevValues, curValues) =>
                        curValues.datasource_id !== prevValues.datasource_id
                    }
                    noStyle
                    style={{
                        width: '100%',
                    }}
                >
                    {({ getFieldValue }) => {
                        const dataSourceId = getFieldValue('datasource_id')
                        return (
                            <Form.Item
                                name="tableList"
                                label={__('数据表')}
                                required
                                rules={[
                                    {
                                        required: true,
                                        message: __('请选择数据表'),
                                    },
                                ]}
                                style={{
                                    width: '100%',
                                }}
                                className={styles.selectedDataForm}
                            >
                                <Select
                                    mode="multiple"
                                    loading={formLoading}
                                    options={selectedFormOptions}
                                    notFoundContent={
                                        formLoading ? (
                                            <Spin />
                                        ) : selectedFormOptions?.length ? (
                                            __('未找到匹配的结果')
                                        ) : (
                                            __('暂无数据')
                                        )
                                    }
                                    placeholder={__('请选择数据表')}
                                    allowClear
                                    showSearch
                                    disabled={!dataSourceId}
                                    onSearch={(value) => {
                                        if (value.length <= 128) {
                                            setDataFormKeyword(value)
                                        }
                                    }}
                                    searchValue={dataFormKeyword}
                                />
                            </Form.Item>
                        )
                    }}
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default SelectDataFormModel
