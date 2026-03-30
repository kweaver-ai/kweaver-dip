import * as React from 'react'
import { useState, useEffect } from 'react'
import { Modal, Form, Input, Select, Row, Col, message } from 'antd'

import { Node } from '@antv/x6'
import finalPropsSelectorFactory from 'react-redux/es/connect/selectorFactory'
import { noop } from 'lodash'
import {
    checkFormExistByDataSource,
    formatError,
    getDataBaseDetails,
    getDataSourceList,
    getObjectDetails,
    getObjects,
} from '@/core'
import __ from './locale'
import Icons from '../BusinessArchitecture/Icons'
import DataSourcIcons from '../DataSource/Icons'
import { Architecture } from '../BusinessArchitecture/const'
import styles from './styles.module.less'
import { PasteSourceChecked } from './const'

interface ConfigDataOriginType {
    node: Node
    onClose: () => void
    reCreatePasteForm?: (node: Node) => void
    editStatus?: boolean
}
const ConfigDataOrigin = ({
    node,
    onClose,
    reCreatePasteForm = noop,
    editStatus = true,
}: ConfigDataOriginType) => {
    const [selectedSystem, setSelectedSystem] = useState<string>('')
    const [infoSystemOptions, setInfoSystemOptions] = useState<Array<any>>([])
    const [dataOriginOptions, setDataOriginOptions] = useState<Array<any>>([])
    const [systemTotalCount, setSysetemTotalCount] = useState<number>(0)
    const [selectedDataSourceType, setSelectedDataSourceType] =
        useState<string>('')
    const [form] = Form.useForm()

    useEffect(() => {
        if (node) {
            const { name, datasource_id, datasource_type } = node.data.formInfo
            setSelectedDataSourceType(datasource_type)
            form.setFieldValue('name', name)
            if (datasource_id) {
                getOriginDetail(datasource_id)
            } else {
                getSystemsOptions([], '')
            }
        }
    }, [node])

    useEffect(() => {
        getDataOriginOptions(selectedSystem)
    }, [selectedSystem])

    /**
     * 完成事件
     */
    const handleFinsh = async (values) => {
        const { name, datasource_id } = values
        if (!name) {
            node.replaceData({
                ...node.data,
                formInfo: {
                    ...node.data.formInfo,
                    datasource_id,
                    datasource_type: selectedDataSourceType,
                },
            })
            message.success(__('配置数据源成功'))
            onClose()
        } else {
            const { is_consistent } = await checkFormExistByDataSource({
                ...node.data.formInfo,
                datasource_id,
                datasource_type: selectedDataSourceType,
                fields: node?.data?.items || [],
            })
            switch (node.data.formInfo.checked) {
                case PasteSourceChecked.New:
                    node.replaceData({
                        ...node.data,
                        formInfo: {
                            ...node.data.formInfo,
                            datasource_id,
                            datasource_type: selectedDataSourceType,
                            checked: is_consistent
                                ? PasteSourceChecked.Created
                                : PasteSourceChecked.New,
                        },
                    })
                    break
                case PasteSourceChecked.FromDW:
                    reCreatePasteForm(node)
                    node.replaceData({
                        ...node.data,
                        formInfo: {
                            ...node.data.formInfo,
                            datasource_id,
                            datasource_type: selectedDataSourceType,
                            checked: is_consistent
                                ? PasteSourceChecked.FromDW
                                : PasteSourceChecked.New,
                        },
                    })
                    break
                case PasteSourceChecked.Created:
                    reCreatePasteForm(node)
                    node.replaceData({
                        ...node.data,
                        formInfo: {
                            ...node.data.formInfo,
                            datasource_id,
                            datasource_type: selectedDataSourceType,
                            checked: is_consistent
                                ? PasteSourceChecked.Created
                                : PasteSourceChecked.New,
                        },
                    })
                    break
                default:
                    break
            }
            onClose()
        }
    }

    const getOriginDetail = async (datasourceId: string) => {
        try {
            const dataSourceInfo = await getDataBaseDetails(datasourceId)
            form.setFieldValue('datasource_id', datasourceId)
            form.setFieldValue('info_system_id', dataSourceInfo.info_system_id)
            if (dataSourceInfo?.info_system_id) {
                setSelectedSystem(dataSourceInfo.info_system_id)
                const infoSystemDetail = await getObjectDetails(
                    dataSourceInfo.info_system_id,
                )
                getSystemsOptions(
                    [],
                    dataSourceInfo.info_system_id,
                    infoSystemDetail.name,
                )
            }
        } catch (ex) {
            if (ex?.data?.code === 'ConfigurationCenter.DataSourceNotExist') {
                form.setFieldValue('datasource_id', null)
                form.setFieldValue('info_system_id', null)
                getSystemsOptions([], '')
            }
            formatError(ex)
        }
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
        const { entries, total_count } = await getObjects({
            is_all: true,
            offset: initData.length ? Math.floor(initData.length / 20) + 1 : 1,
            id: '',
            limit: 20,
            type: Architecture.BSYSTEM,
        })
        setSysetemTotalCount(total_count)
        if (initData.length) {
            if (
                systemId &&
                entries.find((codeTableInfo) => codeTableInfo.id === systemId)
            ) {
                setInfoSystemOptions([
                    ...initData.filter(
                        (infoSystemData) => infoSystemData.value !== systemId,
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
                              label: getInfoSystemLabel(infoSystemData.name),
                              value: infoSystemData.id,
                          })),
                      ]
                    : entries.map((infoSystemData) => ({
                          label: getInfoSystemLabel(infoSystemData.name),
                          value: infoSystemData.id,
                      })),
            )
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
     * 获取数据源下拉
     * @param systemId
     */
    const getDataOriginOptions = async (systemId) => {
        const { entries } = await getDataSourceList({
            info_system_id: systemId,
            limit: 999,
        })
        setDataOriginOptions(
            entries.map((dataSourceInfo) => ({
                label: (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <DataSourcIcons
                            type={dataSourceInfo?.type}
                            fontSize={22}
                            iconType="outlined"
                        />
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
            })),
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
     * 表单变化
     * @param values
     */
    const handleValuesChange = (values) => {
        if (Object.keys(values).includes('info_system_id')) {
            setSelectedSystem(values.info_system_id)
            form.setFieldValue('datasource_id', null)
            setSelectedDataSourceType('')
        }
    }

    return (
        <Modal
            title={__('配置数据源')}
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
            >
                <Form.Item name="name" label={__('数据表名称')}>
                    <Input disabled />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="info_system_id"
                            required
                            label={__('信息系统')}
                            rules={[
                                {
                                    required: true,
                                    message: __('请选择的信息系统'),
                                },
                            ]}
                        >
                            <Select
                                options={infoSystemOptions}
                                placeholder={__('请选择信息系统')}
                                onPopupScroll={getInfoSystemsByScroll}
                                disabled={!editStatus}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
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
                                disabled={!selectedSystem || !editStatus}
                                onChange={(value, option) => {
                                    setSelectedDataSourceType(option.dataType)
                                }}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    )
}

export default ConfigDataOrigin
