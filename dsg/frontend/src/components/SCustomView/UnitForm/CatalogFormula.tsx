import React, { useEffect, useRef, useState } from 'react'
import { Form, Select, Spin, Tabs, Table, Popover, Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { isNull } from 'lodash'
import {
    IFormula,
    IFormulaFields,
    formatError,
    messageError,
    getUserDatasheetViewDetails,
    getVirtualEngineExample,
} from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import {
    changeTypeToLargeArea,
    checkCatalogFormulaConfig,
    useSceneGraphContext,
} from '../helper'
import { IFormulaConfigEl, catalogLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import FieldsToolTips from '@/components/DatasheetView/DataQuality/FieldsToolTips'
import { ExplorOutlined } from '@/icons'
import Icons from '@/components/BussinessConfigure/Icons'
import { FieldTypes } from '../const'
import ChooseBizTable from '@/components/DimensionModel/components/ChooseBizTable'
import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * 库表算子配置
 */
const CatalogFormula = ({
    visible,
    node,
    formulaData,
    fieldsData,
    viewSize = 0,
    dragExpand,
    onChangeExpand,
    onClose,
}: IFormulaConfigEl) => {
    const { setDeletable, setCiteFormViewId } = useSceneGraphContext()
    const limit = 100
    const [form] = Form.useForm()
    const vRef: any = useRef(null)
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    const [catalogFetching, setCatalogFetching] = useState<boolean>(false)
    const [offset, setOffset] = useState(1)
    const [total, setTotal] = useState(0)
    const [searchKey, setSearchKey] = useState('')
    const [fieldsFetching, setFieldsFetching] = useState<boolean>(false)
    const [samplesFetching, setSamplesFetching] = useState<boolean>(false)
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 库表选项
    const [viewOptions, setViewOptions] = useState<any[]>([])
    // 字段集合 undefined-前置提示
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>()
    // 样例数据集合 undefined-前置提示
    const [sampleItems, setSampleItems] = useState<any[]>()
    // 样例数据列
    const [columns, setColumns] = useState<any[]>([])
    // 样例数据AI
    const [isAi, setIsAi] = useState<boolean>(false)
    // 当前分类
    const [activeKey, setActiveKey] = useState<string>('field')
    // 库表存在情况
    const [viewExist, setViewExist] = useState<boolean>(true)
    // 已选中的的库表
    const [selectView, setSelectView] = useState<any>()
    const [userInfo] = useCurrentUser()

    const items = [
        {
            label: __('字段列表'),
            key: 'field',
        },
        {
            label: __('样例数据'),
            key: 'sample',
        },
    ]

    useEffect(() => {
        if (visible && formulaData && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            await form.validateFields()
            const values = form.getFieldsValue()
            const { form_id } = values
            if (!form_id) {
                form.setFields([
                    {
                        name: 'form_id',
                        value: undefined,
                        errors: [__('请选择库表')],
                    },
                ])
                return
            }
            const res = tRef.current?.getData()
            if (res.hasError) {
                setActiveKey('field')
                tRef.current?.getData()
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
                setActiveKey('field')
                messageError(__('请至少选择一个字段作为下一个节点/算子的输入'))
            } else {
                const { formula } = node!.data
                // 更新节点内数据
                node!.replaceData({
                    ...node?.data,
                    formula: formula.map((info) => {
                        // 查找当前配置的算子
                        if (info.id === formulaItem?.id) {
                            const tempFl = info
                            delete tempFl.errorMsg
                            return {
                                ...tempFl,
                                config: {
                                    form_id,
                                    config_fields: res.resultFields,
                                    other: {
                                        catalogOptions: selectView,
                                    },
                                },
                                output_fields: selectedFields,
                            }
                        }
                        return info
                    }),
                })
                onClose()
            }
        } catch (err) {
            // if (err?.errorFields?.length > 0) {
            // }
        }
    }

    const clearData = () => {
        form.resetFields()
        setSearchKey('')
        setOffset(1)
        setTotal(0)
        setViewOptions([])
        setFieldItems(undefined)
        setSampleItems(undefined)
        setColumns([])
        setSelectView(undefined)
        setViewExist(true)
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()

        const { outData, isExist, totalData } = await checkCatalogFormulaConfig(
            node!,
            formulaData!,
            fieldsData,
        )
        setViewExist(isExist)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (config) {
            const { form_id, other, config_fields } = config
            setTimeout(() => {
                form.setFields([
                    {
                        name: 'form_id',
                        value: isExist ? form_id : undefined,
                        errors: isExist ? [] : [__('库表不存在，请重新选择')],
                    },
                ])
            }, 400)
            setFieldItems(isExist ? totalData : undefined)
            if (isExist) {
                setSelectView(other.catalogOptions)
                setViewOptions(changeCatalogOptions([other.catalogOptions]))
                getSamplesData(other.catalogOptions)
            }
        }
        setLoading(false)
    }

    const changeCatalogOptions = (infos: any[]) => {
        return infos.map((info) => {
            return {
                label: catalogLabel(info),
                value: info.id,
                name: info.business_name,
                showLabel: catalogLabel(info, false),
                data: info,
            }
        })
    }

    // 切换库表
    const handleChangeView = async (value) => {
        setViewOptions(changeCatalogOptions([value]))
        form.setFields([
            {
                name: 'form_id',
                value: value.id,
                errors: [],
            },
        ])
        setViewVisible(false)
        setDeletable(true)
        setSelectView(value)
        setViewExist(true)
        getColumnsWithView(value.id)
        setCiteFormViewId(value.id)
        getSamplesData(value)
    }

    // 加载库表信息项
    const getColumnsWithView = async (cid?: string) => {
        if (!cid) {
            setFieldItems(undefined)
            return
        }
        try {
            setFieldsFetching(true)
            const res = await getUserDatasheetViewDetails(cid)
            const filterData =
                res?.fields
                    ?.filter(
                        (item) =>
                            changeTypeToLargeArea(item.data_type) !==
                                FieldTypes.BINARY &&
                            item.data_type !== null &&
                            item.data_type !== '',
                    )
                    ?.map((item) => ({
                        ...item,
                        data_type: changeTypeToLargeArea(item.data_type),
                        name_en: item.technical_name,
                    })) || []
            fieldsData.addData(filterData)
            // 过滤二进制字段
            const fields =
                filterData.map((item) => ({
                    alias: item.business_name,
                    id: item.id,
                    name: item.business_name,
                    sourceId: node!.id,
                    originName: item.business_name,
                    checked: true,
                })) || []
            setFieldItems(fields)
        } catch (err) {
            if (
                [
                    'DataCatalog.Public.DataSourceNotFound',
                    'DataCatalog.Public.ResourceNotExisted',
                    'DataCatalog.Public.AssetOfflineError',
                    'DataView.FormView.FormViewIdNotExist',
                ].includes(err?.data?.code)
            ) {
                form.setFields([
                    {
                        name: 'form_id',
                        value: undefined,
                        errors: ['库表不存在，请重新选择'],
                    },
                ])
                setSelectView(undefined)
            } else {
                formatError(err)
            }
            setFieldItems([])
        } finally {
            setFieldsFetching(false)
        }
    }

    // 获取样例数据
    const getSamplesData = async (value: any = selectView) => {
        setIsAi(false)
        if (!value) {
            setSampleItems(undefined)
            return
        }
        try {
            setSamplesFetching(true)
            const [catalog, schema] = value.view_source_catalog_name.split('.')
            const res = await getVirtualEngineExample({
                catalog,
                schema,
                table: value.technical_name,
                user: userInfo?.Account || '',
                limit: 10,
                user_id: userInfo?.ID || '',
            })
            // const reportRes = await getMarketExploreReport({
            //     catalogId: cid,
            //     isFullReport: false,
            // })
            // setIsAi(res?.is_ai)
            if (res?.data !== null && res?.data.length > 0) {
                setColumns(
                    res?.columns
                        ?.filter((cItem) =>
                            fieldsData.data?.findLast(
                                (b) => b.name_en === cItem.name,
                            ),
                        )
                        .map((cItem) => {
                            const reportInfo = undefined
                            // reportRes?.data?.explore_details.find(
                            //     (it) => it.field_name_en === cItem.en_col_name,
                            // )
                            const fieldItem = fieldsData.data?.findLast(
                                (b) => b.name_en === cItem.name,
                            )
                            return {
                                title: (
                                    <div
                                        className={styles.cf_rowHeaderWrap}
                                        title={fieldItem?.business_name}
                                    >
                                        <Icons
                                            type={fieldItem.data_type}
                                            fontSize={20}
                                        />
                                        <div>
                                            <div
                                                className={
                                                    styles.cf_rowNameWrap
                                                }
                                            >
                                                {reportInfo && (
                                                    <Tooltip
                                                        color="white"
                                                        placement="bottom"
                                                        overlayClassName="reportInfoTitleTipsWrapper"
                                                        title={
                                                            <FieldsToolTips
                                                                ruleData={
                                                                    reportInfo
                                                                }
                                                            />
                                                        }
                                                    >
                                                        <ExplorOutlined
                                                            style={{
                                                                marginLeft:
                                                                    '5px',
                                                            }}
                                                        />
                                                    </Tooltip>
                                                )}
                                            </div>
                                            <div
                                                className={
                                                    styles.cf_rowNameWrap
                                                }
                                            >
                                                {fieldItem?.business_name}
                                            </div>
                                        </div>
                                    </div>
                                ),
                                dataIndex: cItem.name,
                                key: cItem.name,
                                ellipsis: true,
                                render: (text) => text,
                            }
                        }) || [],
                )
                setSampleItems(
                    res?.data.map((outItem, i) => {
                        const obj: any = {}
                        outItem.forEach((innerItem, j) => {
                            const { name } = res.columns[j]
                            obj.key = i
                            if (isNull(innerItem)) {
                                obj[name] = '--'
                            } else if (
                                typeof innerItem === 'string' &&
                                !innerItem
                            ) {
                                obj[name] = '--'
                            } else if (typeof innerItem === 'boolean') {
                                obj[name] = `${innerItem}`
                            } else {
                                obj[name] = innerItem
                            }
                        })
                        return obj
                    }) || [],
                )
            } else {
                setColumns([])
                setSampleItems([])
            }
        } catch (err) {
            formatError(err)
            setColumns([])
            setSampleItems([])
        } finally {
            setSamplesFetching(false)
        }
    }

    // tab 切换
    const handleTabChange = (key: string) => {
        setActiveKey(key)
        const cid = form.getFieldValue('form_id')
        if (key === 'sample') {
            const res = tRef.current?.getData()
            setFieldItems(res.resultFields)
            if ((!sampleItems || sampleItems.length === 0) && cid) {
                getSamplesData()
            }
        } else if (fieldItems?.length === 0 && cid) {
            getColumnsWithView(cid)
        }
    }

    return (
        <div className={styles.catalogFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.cf_contentWrap}>
                    <div className={styles.cf_selectWrap}>
                        <Form
                            layout="horizontal"
                            form={form}
                            autoComplete="off"
                            style={{
                                width: '40%',
                                minWidth: 400,
                            }}
                        >
                            <Form.Item
                                label={__('选择库表')}
                                required
                                name="form_id"
                                validateTrigger={['onChange', 'onBlur']}
                            >
                                <Select
                                    ref={vRef}
                                    placeholder={__('请选择库表')}
                                    options={viewOptions}
                                    open={false}
                                    optionLabelProp="showLabel"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setDeletable(false)
                                        setViewVisible(true)
                                        vRef?.current?.blur()
                                    }}
                                    suffixIcon={<a>{__('选择')}</a>}
                                />
                            </Form.Item>
                        </Form>
                        <Popover
                            content={__('可选择「可用资源」板块中的库表')}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                className={styles.cf_selectQuesWrap}
                            />
                        </Popover>
                    </div>
                    {fieldItems && fieldItems?.length > 0 ? (
                        <>
                            <div className={styles.cf_tabWrap}>
                                <Tabs
                                    style={{ marginTop: -16 }}
                                    onChange={handleTabChange}
                                    activeKey={activeKey}
                                    items={items}
                                />
                                <span
                                    className={styles.cf_aiInfo}
                                    hidden={activeKey === 'field' || !isAi}
                                >
                                    {__(
                                        '温馨提示：当前库表可能不存在数据，以下为 AI 生成',
                                    )}
                                </span>
                            </div>
                            <div className={styles.cf_dataWrap}>
                                <div
                                    style={{ marginTop: -56, height: '100%' }}
                                    hidden={activeKey !== 'field'}
                                >
                                    <FieldsDragTable
                                        ref={tRef}
                                        items={fieldItems}
                                        fieldsData={fieldsData}
                                        formulaItem={formulaItem}
                                        columns={['alias', 'enName']}
                                        viewSize={viewSize}
                                        fetching={fieldsFetching}
                                        emptyDesc={
                                            viewExist
                                                ? sampleItems
                                                    ? '暂无数据'
                                                    : '暂无数据，请先选择库表'
                                                : '该库表不再是您的可用资源'
                                        }
                                    />
                                </div>
                                <div
                                    hidden={activeKey === 'field'}
                                    style={{ height: '100%' }}
                                >
                                    {samplesFetching ? (
                                        <Spin className={styles.ldWrap} />
                                    ) : sampleItems &&
                                      sampleItems.length > 0 ? (
                                        <Table
                                            dataSource={sampleItems}
                                            columns={columns}
                                            rowClassName={styles.cf_rowWrap}
                                            bordered={false}
                                            pagination={false}
                                            rowKey={(record) =>
                                                record.idx || ''
                                            }
                                            scroll={{
                                                y:
                                                    (window.innerHeight - 52) *
                                                        (viewSize / 100) -
                                                    247,
                                                // x: 'max-content',
                                                x: columns.length * 200,
                                            }}
                                        />
                                    ) : (
                                        <Empty
                                            desc={
                                                viewExist
                                                    ? sampleItems
                                                        ? __('暂无数据')
                                                        : __(
                                                              '暂无数据，请先选择库表',
                                                          )
                                                    : __(
                                                          '该库表不再是您的可用资源',
                                                      )
                                            }
                                            iconSrc={dataEmpty}
                                        />
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                width: '100%',
                            }}
                        >
                            <Empty
                                desc={
                                    viewExist
                                        ? __('暂无数据，请先选择库表')
                                        : __('库表不存在，请重新选择')
                                }
                                iconSrc={dataEmpty}
                            />
                        </div>
                    )}
                </div>
            )}
            <ChooseBizTable
                title={__('选择库表')}
                visible={viewVisible}
                onClose={() => {
                    setViewVisible(false)
                    setDeletable(true)
                }}
                hasAiButton
                checked={selectView}
                onSure={handleChangeView}
                owner
            />
        </div>
    )
}

export default CatalogFormula
