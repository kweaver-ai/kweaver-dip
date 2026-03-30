import { FC, useState, useEffect } from 'react'
import { Modal, Form, Row, Col, Select, Input, Spin } from 'antd'
import { Node } from '@antv/x6'
import { noop, trim } from 'lodash'
import { useDebounce } from 'ahooks'
import {
    DataSourceFromType,
    formatError,
    getDataBaseDetails,
    getDataFormFields,
    getDataSourceList,
    getFormsFromDatasource,
    getObjectDetails,
    getObjects,
} from '@/core'
import { Architecture } from '../../BusinessArchitecture/const'
import Icons from '../../BusinessArchitecture/Icons'
import DataSourcIcons from '../../DataSource/Icons'
import __ from '../locale'
import styles from '../styles.module.less'
import { DataSourceFromOptions, FormType } from '../const'
import { enBeginNameRegNew } from '@/utils'
import {
    changeFieldDataBaseType,
    checkoutDataFormNameRepeat,
    formatFieldData,
} from '../helper'
import dataSourceForm from './DataSourceForm'
import { DataBaseType } from '@/components/DataSource/const'
import { databaseTypesEleData } from '@/core/dataSource'

interface IConfigModal {
    node: Node
    connectNode: Node
    onClose: () => void
    editStatus?: boolean
    onConfirm?: (
        fieldData: Array<any>,
        targetDataBaseType: DataBaseType,
    ) => void
}
const ConfigModal: FC<IConfigModal> = ({
    node,
    connectNode,
    onClose,
    editStatus,
    onConfirm = noop,
}) => {
    const [form] = Form.useForm()
    const [selectedSystem, setSelectedSystem] = useState<string>('')
    const [dataOriginOptions, setDataOriginOptions] = useState<Array<any>>([])
    const [infoSystemOptions, setInfoSystemOptions] = useState<Array<any>>([])
    const [systemTotalCount, setSysetemTotalCount] = useState<number>(0)
    const [selectedDataSourceType, setSelectedDataSourceType] =
        useState<string>('')

    const [selectedFormOptions, setSelectedFormOptions] = useState<Array<any>>(
        [],
    )
    const [sysetmKeyword, setSystemKeyword] = useState<string>('')

    const debounceValue = useDebounce(sysetmKeyword, { wait: 500 })

    const [datasourceKeyword, setDatasouceKeyword] = useState<string>('')

    const [dataFormKeyword, setDataFormKeyword] = useState<string>('')

    const [systemLoading, setSystemLoading] = useState<boolean>(true)

    const [dataSourceLoading, setDataSourceLoading] = useState<boolean>(true)

    const [formLoading, setFormLoading] = useState<boolean>(true)
    const [selectedSourceType, setSelectedSourceType] = useState<
        DataSourceFromType | string
    >()

    // useEffect(() => {
    //     getSystemsOptions([], selectedSourceType)
    // }, [debounceValue])

    useEffect(() => {
        if (node?.data?.formInfo) {
            const { name, datasource_id, datasource_type } = node.data.formInfo
            setSelectedDataSourceType(datasource_type)
            form.setFieldValue('name', name)
            if (datasource_id) {
                getOriginDetail(datasource_id)
                getDataFormOptions(datasource_id)
            } else if (node?.data?.type === FormType.SOURCESFORM) {
                form.setFieldValue('source_type', DataSourceFromType.Records)
                setSelectedSourceType(DataSourceFromType.Records)
            } else {
                form.setFieldValue('source_type', DataSourceFromType.Analytical)
                setSelectedSourceType(DataSourceFromType.Analytical)
            }
        } else if (node?.data?.type === FormType.SOURCESFORM) {
            form.setFieldValue('source_type', DataSourceFromType.Records)
            setSelectedSourceType(DataSourceFromType.Records)
        } else {
            form.setFieldValue('source_type', DataSourceFromType.Analytical)
            setSelectedSourceType(DataSourceFromType.Analytical)
        }
    }, [node])

    useEffect(() => {
        if (selectedSourceType) {
            getDataOriginOptions(selectedSourceType)
        }
    }, [selectedSourceType])

    const getOriginDetail = async (datasourceId: string) => {
        try {
            const dataSourceInfo = await getDataBaseDetails(datasourceId)
            form.setFieldValue('datasource_id', datasourceId)
            form.setFieldValue('source_type', dataSourceInfo.source_type)
            setSelectedSourceType(dataSourceInfo.source_type)
            // if (dataSourceInfo?.info_system_id) {
            //     setSelectedSystem(dataSourceInfo.info_system_id)
            //     const infoSystemDetail = await getObjectDetails(
            //         dataSourceInfo.info_system_id,
            //     )
            //     getSystemsOptions(
            //         [],
            //         dataSourceInfo.info_system_id,
            //         infoSystemDetail.name,
            //     )
            // }
        } catch (ex) {
            if (ex?.data?.code === 'ConfigurationCenter.DataSourceNotExist') {
                form.setFieldValue('datasource_id', null)
                form.setFieldValue('source_type', DataSourceFromType.Records)
                getSystemsOptions([], '')
            }
            formatError(ex)
        }
    }

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
    const getDataOriginOptions = async (dataSourceType) => {
        try {
            setDataSourceLoading(true)
            const { entries } = await getDataSourceList({
                source_type: dataSourceType,
                limit: 999,
            })
            setDataOriginOptions(
                entries
                    .filter((item) => item.type !== 'excel')
                    .map((dataSourceInfo) => {
                        const { Outlined } =
                            databaseTypesEleData?.dataBaseIcons?.[
                                dataSourceInfo.type
                            ] || {}
                        const ICons = Outlined ? (
                            <Outlined style={{ fontSize: 22 }} />
                        ) : null
                        return {
                            label: (
                                <div className={styles.selectMetaOptions}>
                                    {ICons}
                                    <span
                                        style={{
                                            marginLeft: '10px',
                                        }}
                                        className={styles.name}
                                        title={dataSourceInfo.name}
                                    >
                                        {dataSourceInfo.name}
                                    </span>
                                </div>
                            ),
                            value: dataSourceInfo.id,
                            dataType: dataSourceInfo.type,
                            details: dataSourceInfo,
                        }
                    }),
            )
        } catch (ex) {
            formatError(ex)
        } finally {
            setDataSourceLoading(false)
        }
    }

    /**
     * 获取下拉框的选项的显示
     * @param name
     * @returns
     */
    const getInfoSystemLabel = (name: string) => {
        return (
            <div className={styles.selectMetaOptions}>
                <Icons type={Architecture.BSYSTEM} />
                <span
                    style={{
                        marginLeft: '10px',
                    }}
                    className={styles.name}
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
    const getSystemsOptions = async (
        initData,
        systemId: string,
        systemName?: string,
    ) => {
        try {
            setSystemLoading(true)
            const { entries, total_count } = await getObjects({
                is_all: true,
                offset: initData.length
                    ? Math.floor(initData.length / 20) + 1
                    : 1,
                id: '',
                limit: 20,
                type: Architecture.BSYSTEM,
                keyword: debounceValue,
            })
            setSysetemTotalCount(total_count)
            setSystemLoading(false)
            if (initData.length) {
                if (
                    systemId &&
                    entries.find(
                        (codeTableInfo) => codeTableInfo.id === systemId,
                    )
                ) {
                    setInfoSystemOptions([
                        ...initData.filter(
                            (infoSystemData) =>
                                infoSystemData.value !== systemId,
                        ),
                        ...entries.map((infoSystemData) => ({
                            label: getInfoSystemLabel(infoSystemData.name),
                            value: infoSystemData.id,
                        })),
                    ])
                } else {
                    setInfoSystemOptions([
                        ...initData,
                        ...entries.map((infoSystemData) => ({
                            label: getInfoSystemLabel(infoSystemData.name),
                            value: infoSystemData.id,
                        })),
                    ])
                }
            } else if (
                entries.find((infoSystemData) => infoSystemData.id === systemId)
            ) {
                setInfoSystemOptions(
                    entries.map((infoSystemData) => ({
                        label: getInfoSystemLabel(infoSystemData.name),
                        value: infoSystemData.id,
                    })),
                )
            } else {
                setInfoSystemOptions(
                    systemName
                        ? [
                              {
                                  label: getInfoSystemLabel(systemName),
                                  value: systemId,
                              },
                              ...entries.map((infoSystemData) => ({
                                  label: getInfoSystemLabel(
                                      infoSystemData.name,
                                  ),
                                  value: infoSystemData.id,
                              })),
                          ]
                        : entries.map((infoSystemData) => ({
                              label: getInfoSystemLabel(infoSystemData.name),
                              value: infoSystemData.id,
                          })),
                )
            }
        } catch (ex) {
            formatError(ex)
        }
    }
    /**
     * 表单变化
     * @param values
     */
    const handleValuesChange = (values) => {
        if (Object.keys(values).includes('source_type')) {
            setSelectedSourceType(values.source_type)
            form.setFieldValue('datasource_id', null)
            setSelectedDataSourceType('')
            if (node.data.type === FormType.SOURCESFORM) {
                form.setFieldValue('name', null)
            }
        }
        if (Object.keys(values).includes('datasource_id')) {
            if (node.data.type === FormType.SOURCESFORM) {
                form.setFieldValue('name', null)
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
            getSystemsOptions(infoSystemOptions, selectedSystem)
        }
    }

    /**
     * 滚动加载信息系统
     * @param e
     */
    const getDataSourceByScroll = (e) => {
        const { target } = e
        if (
            target.scrollTop + target.offsetHeight === target.scrollHeight &&
            systemTotalCount > infoSystemOptions.length
        ) {
            getSystemsOptions(infoSystemOptions, selectedSystem)
        }
    }

    /**
     * 选择数据源表
     * @param values
     */
    const handleFinsh = async (values) => {
        try {
            if (node.data.type === FormType.SOURCESFORM) {
                const fields = await getDataFormFields(
                    values.name,
                    values.datasource_id,
                )
                const formatFields = fields.map((field, index) => ({
                    ...formatFieldData(field),
                    indexId: index,
                }))
                node.replaceData({
                    ...node.data,
                    formInfo: {
                        name: trim(values.name),
                        datasource_id: values.datasource_id,
                        datasource_type: selectedDataSourceType,
                    },
                    items: formatFields,
                    singleSelectedId: '',
                    offset: 0,
                    keyWord: '',
                })
                onConfirm(formatFields, selectedDataSourceType)
            } else if (connectNode?.data?.items.length) {
                const { formInfo, items } = connectNode.data
                const targetFields = await changeFieldDataBaseType(
                    items,
                    formInfo.datasource_type,
                    selectedDataSourceType,
                )
                node.replaceData({
                    ...node.data,
                    formInfo: {
                        name: trim(values.name),
                        datasource_id: values.datasource_id,
                        datasource_type: selectedDataSourceType,
                    },
                    items: targetFields.map((field, index) => ({
                        ...field,
                        indexId: index,
                        description:
                            field?.description?.length > 255
                                ? field.description.substring(0, 255)
                                : field.description,
                    })),
                    formErrorStatus: false,
                })
                onConfirm(targetFields, selectedDataSourceType)
            } else {
                node.replaceData({
                    ...node.data,
                    formInfo: {
                        name: trim(values.name),
                        datasource_id: values.datasource_id,
                        datasource_type: selectedDataSourceType,
                    },
                    formErrorStatus: false,
                })
            }
            onClose()
        } catch (ex) {
            formatError(ex)
        }
    }
    return (
        <Modal
            title={
                node?.data?.type === FormType.SOURCESFORM
                    ? __('配置来源数据表')
                    : __('配置目标数据表')
            }
            width={640}
            onCancel={onClose}
            open
            onOk={() => {
                form.submit()
            }}
            maskClosable={false}
        >
            <Form
                form={form}
                onFinish={handleFinsh}
                layout="vertical"
                onValuesChange={handleValuesChange}
                autoComplete="off"
            >
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="source_type"
                            required={node?.data?.type !== FormType.TARGETFORM}
                            label={__('数据源来源')}
                            rules={
                                node?.data?.type === FormType.TARGETFORM
                                    ? []
                                    : [
                                          {
                                              required: true,
                                              message: __('请选择数据源来源'),
                                          },
                                      ]
                            }
                        >
                            {node?.data?.type === FormType.TARGETFORM ? (
                                <Select
                                    open={false}
                                    disabled
                                    options={DataSourceFromOptions}
                                    placeholder={__('请选择数据源来源')}
                                    showArrow={false}
                                />
                            ) : (
                                <Select
                                    options={DataSourceFromOptions}
                                    placeholder={__('请选择数据源来源')}
                                />
                            )}
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        {/* <Form.Item
                            name="info_system_id"
                            required
                            label={__('信息系统')}
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择信息系统'),
                                },
                            ]}
                        >
                            <Select
                                options={infoSystemOptions}
                                placeholder={__('请选择信息系统')}
                                onPopupScroll={getInfoSystemsByScroll}
                                disabled={!editStatus}
                                searchValue={sysetmKeyword}
                                onSearch={(value) => {
                                    if (value.length <= 128) {
                                        setSystemKeyword(value)
                                    }
                                }}
                                allowClear
                                filterOption={false}
                                showSearch
                                notFoundContent={
                                    systemLoading ? (
                                        <Spin />
                                    ) : debounceValue?.length ? (
                                        __('未找到匹配的结果')
                                    ) : (
                                        __('暂无数据')
                                    )
                                }
                            />
                        </Form.Item> */}
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
                                allowClear
                                showSearch
                                onSearch={(value) => {
                                    if (value.length <= 128) {
                                        setDatasouceKeyword(value)
                                    }
                                }}
                                searchValue={datasourceKeyword}
                                filterOption={(value, option) => {
                                    return option.details.name
                                        .toLocaleLowerCase()
                                        .includes(value.toLocaleLowerCase())
                                }}
                                onChange={(value, option) => {
                                    setSelectedDataSourceType(option.dataType)
                                    if (
                                        node?.data?.type ===
                                        FormType.SOURCESFORM
                                    ) {
                                        getDataFormOptions(value)
                                    }
                                }}
                                notFoundContent={
                                    dataSourceLoading ? (
                                        <Spin />
                                    ) : datasourceKeyword ? (
                                        __('未找到匹配的结果')
                                    ) : (
                                        __('暂无数据')
                                    )
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Form.Item
                        shouldUpdate={(prevValues, curValues) =>
                            curValues.datasource_id !== prevValues.datasource_id
                        }
                        noStyle
                        style={{
                            width: '100%',
                            padding: '0 8px',
                        }}
                    >
                        {({ getFieldValue }) => {
                            const dataSourceId = getFieldValue('datasource_id')
                            return node.data.type === FormType.SOURCESFORM ? (
                                <Form.Item
                                    name="name"
                                    label={__('来源数据表')}
                                    required
                                    rules={[
                                        {
                                            required: true,
                                            message: __('请选择来源数据表'),
                                        },
                                    ]}
                                    style={{
                                        width: '100%',
                                        padding: '0 8px',
                                    }}
                                >
                                    <Select
                                        placeholder={__('请选择来源数据表')}
                                        disabled={!dataSourceId || !editStatus}
                                        options={selectedFormOptions}
                                        allowClear
                                        showSearch
                                        notFoundContent={
                                            formLoading ? (
                                                <Spin />
                                            ) : selectedFormOptions?.length ? (
                                                __('未找到匹配的结果')
                                            ) : (
                                                __('暂无数据')
                                            )
                                        }
                                        onSearch={(value) => {
                                            if (value.length <= 128) {
                                                setDataFormKeyword(value)
                                            }
                                        }}
                                        searchValue={dataFormKeyword}
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="name"
                                    label={__('目标数据表')}
                                    validateFirst
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0 8px',
                                    }}
                                    validateTrigger={['onChange', 'onBlur']}
                                    rules={[
                                        {
                                            validateTrigger: [
                                                'onChange',
                                                'onBlur',
                                            ],
                                            required: true,
                                            transform: (value) => trim(value),
                                            message: __('输入不能为空'),
                                        },
                                        {
                                            validateTrigger: [
                                                'onChange',
                                                'onBlur',
                                            ],
                                            pattern: enBeginNameRegNew,
                                            message: __(
                                                '仅支持英文、数字、下划线，且必须以字母开头',
                                            ),
                                            transform: (value) => trim(value),
                                        },
                                        {
                                            validateTrigger: ['onBlur'],
                                            validator: (ruler, value) => {
                                                const params = {
                                                    name: value,
                                                    datasource_id: dataSourceId,
                                                }
                                                return checkoutDataFormNameRepeat(
                                                    params,
                                                )
                                            },
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={__('请输入目标数据表名称')}
                                        disabled={!dataSourceId || !editStatus}
                                        maxLength={128}
                                    />
                                </Form.Item>
                            )
                        }}
                    </Form.Item>
                </Row>
            </Form>
        </Modal>
    )
}

export default ConfigModal
