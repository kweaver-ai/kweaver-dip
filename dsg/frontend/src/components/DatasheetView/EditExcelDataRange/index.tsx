import { Form, Image, Input, Modal, Radio, Select, Space, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import __ from '../locale'
import excelExample from '@/assets/excelExample.svg'
import CellRangeSelect from './CellRangeSelect'
import { compareCells, encodeComplete, ExcelFieldConfigTypes } from '../const'
import styles from './styles.module.less'
import { excelCellRangeRegex, wordNumberRegex } from '@/utils'
import { formatError, getExcelSheetList } from '@/core'

interface EditExcelDataRangeProps {
    editInfo?: any
    open: boolean
    onCancel: () => void
    onConfirm: (data: any) => void
}

const EditExcelDataRange: React.FC<EditExcelDataRangeProps> = ({
    editInfo,
    open,
    onCancel,
    onConfirm,
}) => {
    // 表单
    const [form] = Form.useForm()
    // 选项
    const [optionExcelList, setOptionExcelList] = useState<any[]>([])

    const [errorRange, setErrorRange] = useState<boolean>(false)

    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
        if (editInfo) {
            form.setFieldsValue(editInfo)
        }
    }, [editInfo])

    useEffect(() => {
        const catalogName = searchParams.get('catalog')
        const excelName = searchParams.get('filename')
        getOptionExcelList(excelName, catalogName)
    }, [searchParams])

    /**
     * 验证单元格范围
     * @param rule
     * @param value
     * @returns
     */
    const validateCellRange = (rule, value) => {
        if (!value?.[0]) {
            setErrorRange(true)
            return Promise.reject(new Error(__('请输入开始单元格')))
        }
        if (!excelCellRangeRegex.test(value?.[0])) {
            setErrorRange(true)
            return Promise.reject(
                new Error(__('仅支持输入大写字母加数字(例:A1)')),
            )
        }
        if (!value?.[1]) {
            setErrorRange(true)
            return Promise.reject(new Error(__('请输入结束单元格')))
        }
        if (!excelCellRangeRegex.test(value?.[1])) {
            setErrorRange(true)
            return Promise.reject(
                new Error(__('仅支持输入大写字母加数字(例:A1)')),
            )
        }
        if (
            compareCells(value?.[0], value?.[1], {
                compareRow: false,
                compareColumn: true,
            }) > 0 ||
            compareCells(value?.[0], value?.[1], {
                compareRow: true,
                compareColumn: false,
            }) > 0
        ) {
            setErrorRange(true)
            return Promise.reject(
                new Error(__('开始单元格不能在结束单元格后面')),
            )
        }
        setErrorRange(false)
        return Promise.resolve()
    }

    /**
     * 获取Excel列表
     * @param name
     * @param catalog
     */
    const getOptionExcelList = async (name, catalog) => {
        try {
            const { data } = await getExcelSheetList({
                file_name: encodeComplete(name),
                catalog,
            })
            setOptionExcelList(
                data.map((item) => ({
                    label: item,
                    value: item,
                })),
            )
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            title={__('配置数据范围')}
            onOk={() => {
                form.submit()
            }}
            className={styles.dataRangeContainer}
            maskClosable={false}
            okButtonProps={{
                className: styles.btnMinWidth,
            }}
            cancelButtonProps={{
                className: styles.btnMinWidth,
            }}
        >
            <Form
                form={form}
                onFinish={(values) => {
                    const catalogName = searchParams.get('catalog')
                    const excelName = searchParams.get('filename')
                    onConfirm({
                        ...values,
                        catalog: catalogName,
                        file_name: excelName,
                    })
                }}
                layout="vertical"
            >
                <Form.Item
                    name="sheet"
                    label={__('Sheet页')}
                    rules={[{ required: true, message: __('请选择Sheet页') }]}
                >
                    <Select
                        options={optionExcelList}
                        placeholder={__('请选择Sheet页')}
                        mode="multiple"
                        notFoundContent={__('暂无数据')}
                    />
                </Form.Item>
                <Form.Item
                    name="cell_range"
                    label={
                        <Space size={8}>
                            <span>{__('单元格范围')}</span>
                            <Tooltip
                                title={
                                    <div>
                                        <div>
                                            {__(
                                                '选取Sheet页后填写数据开始、结束的单元，',
                                            )}
                                        </div>
                                        <div>
                                            {__(
                                                '确定库表数据范围。例“开始-结束单元为：A2-C3”',
                                            )}
                                        </div>
                                        <div>
                                            <Image
                                                src={excelExample}
                                                preview={false}
                                            />
                                        </div>
                                    </div>
                                }
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                    padding: 12,
                                    fontSize: 12,
                                }}
                                color="#fff"
                                overlayStyle={{
                                    maxWidth: 320,
                                }}
                                placement="right"
                            >
                                <InfoCircleOutlined
                                    style={{ color: 'rgba(0,0,0,0.65)' }}
                                />
                            </Tooltip>
                        </Space>
                    }
                    validateTrigger="onChange"
                    rules={[
                        {
                            validator: validateCellRange,
                            validateTrigger: 'onChange',
                        },
                    ]}
                >
                    <CellRangeSelect error={errorRange} />
                </Form.Item>
                <Form.Item
                    name="has_headers"
                    label={__('库表字段配置')}
                    required
                    initialValue={ExcelFieldConfigTypes.FirstRow}
                >
                    <Radio.Group className={styles.radioGroupContainer}>
                        <Radio
                            value={ExcelFieldConfigTypes.FirstRow}
                            className={styles.radioItemWrapper}
                        >
                            <Space size={8}>
                                <span>{__('选取首行字段')}</span>
                                <Tooltip
                                    title={__(
                                        '选取已选择的第一个Sheet页的首行作为库表字段',
                                    )}
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                        padding: 12,
                                        fontSize: 12,
                                    }}
                                    color="#fff"
                                    overlayStyle={{
                                        maxWidth: 320,
                                    }}
                                    placement="right"
                                >
                                    <InfoCircleOutlined
                                        style={{ color: 'rgba(0,0,0,0.65)' }}
                                    />
                                </Tooltip>
                            </Space>
                        </Radio>
                        <Radio
                            value={ExcelFieldConfigTypes.Custom}
                            className={styles.radioItemWrapper}
                        >
                            <Space size={8}>
                                <span>{__('自定义')}</span>
                                <Tooltip
                                    title={
                                        <div>
                                            <div>
                                                {__(
                                                    '库表字段业务名称默认命名为“第1列、第2列、第3列…”；字段技术名称默认命名为“column_1，column_2，column_3….”',
                                                )}
                                            </div>
                                            <div>
                                                {__(
                                                    '字段业务/技术名称支持在画布表格中修改。',
                                                )}
                                            </div>
                                        </div>
                                    }
                                    overlayInnerStyle={{
                                        color: 'rgba(0,0,0,0.85)',
                                        padding: 12,
                                        fontSize: 12,
                                    }}
                                    color="#fff"
                                    overlayStyle={{
                                        maxWidth: 320,
                                    }}
                                    placement="right"
                                >
                                    <InfoCircleOutlined
                                        style={{ color: 'rgba(0,0,0,0.65)' }}
                                    />
                                </Tooltip>
                            </Space>
                        </Radio>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    name="sheet_as_new_column"
                    label={
                        <Space size={8}>
                            <span>{__('Sheet页名称作为字段')}</span>
                            <Tooltip
                                title={__(
                                    '将Sheet页名称作为字段后会在画布表格中新增一个字段，其业务名称默认命名为“Sheet名称”；字段技术名默认命名为“sheet_name”。',
                                )}
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                    padding: 12,
                                    fontSize: 12,
                                }}
                                color="#fff"
                                overlayStyle={{
                                    maxWidth: 320,
                                }}
                                placement="right"
                            >
                                <InfoCircleOutlined
                                    style={{ color: 'rgba(0,0,0,0.65)' }}
                                />
                            </Tooltip>
                        </Space>
                    }
                    initialValue={1}
                    style={{ marginBottom: 0 }}
                >
                    <Radio.Group className={styles.radioGroupContainer}>
                        <Radio value={1} className={styles.radioItemWrapper}>
                            {__('是')}
                        </Radio>
                        <Radio value={0} className={styles.radioItemWrapper}>
                            {__('否')}
                        </Radio>
                    </Radio.Group>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default EditExcelDataRange
