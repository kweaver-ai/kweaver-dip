import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Form, Select, Spin } from 'antd'
import {
    IFormula,
    IFormulaFields,
    formatError,
    messageError,
    getInfoItems,
    getDataCatalogMount,
    getDatasheetViewDetails,
} from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import { changeTypeToLargeArea, checkCatalogFormulaConfig } from '../helper'
import { IFormulaConfigEl, catalogLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'
import { FieldTypes } from '../const'
import { useViewGraphContext } from '../ViewGraphProvider'
import DataViewChooseDrawer from '@/components/WorkOrder/DataViewChooseDrawer'
import { ResourceType } from '@/components/ResourcesDir/const'
import { useCurrentUser } from '@/hooks/useCurrentUser'

/**
 * 库表算子配置
 */
const CatalogFormula = forwardRef((props: IFormulaConfigEl, ref: any) => {
    const {
        visible,
        graph,
        node,
        formulaData,
        fieldsData,
        viewSize = 0,
        dragExpand,
        onChangeExpand,
        onClose,
    } = props
    const {
        setContinueFn,
        setDeletable,
        setCiteFormViewId,
        viewMode,
        viewHeight,
    } = useViewGraphContext()
    const [userInfo] = useCurrentUser()
    const [form] = Form.useForm()
    const vRef: any = useRef(null)
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    const [fieldsFetching, setFieldsFetching] = useState<boolean>(false)
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 库表选项
    const [viewOptions, setViewOptions] = useState<any[]>([])
    // 字段集合 undefined-前置提示
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>()
    // 库表存在情况
    const [viewExist, setViewExist] = useState<boolean>(true)
    // 已选中的的库表
    const [selectView, setSelectView] = useState<any>()
    // 是否变更
    const [valuesChange, setValuesChange] = useState<boolean>(false)

    const inViewMode = useMemo(() => viewMode === 'view', [viewMode])

    useImperativeHandle(ref, () => ({
        checkSaveChanged,
        onSave: handleSave,
    }))

    // 检查算子保存变更
    const checkSaveChanged = (): Promise<boolean> => {
        if (!node) return Promise.resolve(false)
        const realFormula = node.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        if (!realFormula) return Promise.resolve(false)
        setFormulaItem(realFormula)
        if (tRef?.current?.valuesChange || valuesChange) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useEffect(() => {
        if (visible && formulaData && node) {
            setValuesChange(false)
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
                setContinueFn?.(undefined)
                return
            }
            const res = tRef.current?.getData()
            if (res.hasError) {
                tRef.current?.getData()
                setContinueFn?.(undefined)
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
                setContinueFn?.(undefined)
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
                                    form_id: selectView?.form_view_id,
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
        setViewOptions([])
        setFieldItems(undefined)
        setSelectView(undefined)
        setViewExist(true)
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()

        const { outData, isExist, totalData } = await checkCatalogFormulaConfig(
            graph!,
            node!,
            formulaData!,
            fieldsData,
            userInfo,
            inViewMode,
            true,
        )
        setViewExist(isExist)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (config) {
            const { form_id, config_fields, other } = config
            const { catalogOptions } = other
            setTimeout(() => {
                form.setFields([
                    {
                        name: 'form_id',
                        value: isExist ? form_id : undefined,
                        errors: isExist ? [] : [__('库表异常，请重新选择')],
                    },
                ])
            }, 400)
            setFieldItems(isExist ? totalData : undefined)
            if (isExist) {
                setSelectView(catalogOptions)
                setViewOptions(changeCatalogOptions([catalogOptions]))
            }
        }
        setLoading(false)
    }

    const changeCatalogOptions = (infos: any[]) => {
        return infos.map((info) => {
            return {
                label: catalogLabel(info),
                value: info.id,
                data: info,
            }
        })
    }

    // 切换库表
    const handleChangeView = async (addItems: any[], delItems: any[]) => {
        setViewVisible(false)
        setDeletable?.(true)
        setValuesChange(true)
        if (
            !addItems.length &&
            delItems.length &&
            delItems[0].id === selectView?.id
        ) {
            setSelectView(undefined)
            setViewOptions([])
            form.setFields([
                {
                    name: 'form_id',
                    value: undefined,
                    errors: [__('请选择库表')],
                },
            ])
            setFieldItems([])
            return
        }
        if (!addItems.length) {
            return
        }
        setViewOptions(changeCatalogOptions(addItems))
        const { id, business_name } = addItems[0]
        form.setFields([
            {
                name: 'form_id',
                value: id,
                errors: [],
            },
        ])
        setSelectView({ id, business_name })
        setViewExist(true)
        getColumnsWithView(id)
        setCiteFormViewId?.(id)
    }

    // 加载库表信息项
    const getColumnsWithView = async (id?: string) => {
        if (!id) {
            setFieldItems(undefined)
            return
        }
        try {
            setFieldsFetching(true)

            setSelectView((prev) => ({
                ...prev,
                form_view_id: id,
            }))
            const logicViewInfo = await getDatasheetViewDetails(id)

            const filterData =
                logicViewInfo?.fields
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
                        info_item_business_name: item.business_name,
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
            // if (
            //     [
            //         'DataCatalog.Public.DataSourceNotFound',
            //         'DataCatalog.Public.ResourceNotExisted',
            //         'DataCatalog.Public.AssetOfflineError',
            //         'DataView.FormView.FormViewIdNotExist',
            //     ].includes(err?.data?.code)
            // ) {
            //     form.setFields(
            //         {
            //             name: 'form_id',
            //             value: undefined,
            //             errors: ['目录异常，请重新选择'],
            //         },
            //     ])
            //     setSelectView(undefined)
            // } else {
            //     formatError(err)
            // }
            formatError(err)
            setFieldItems([])
        } finally {
            setFieldsFetching(false)
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
                                    className={styles.cf_selectInput}
                                    ref={vRef}
                                    placeholder={__('请选择库表')}
                                    options={viewOptions}
                                    open={false}
                                    optionLabelProp="label"
                                    disabled={inViewMode}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (inViewMode) {
                                            return
                                        }
                                        setDeletable?.(false)
                                        setViewVisible(true)
                                        vRef?.current?.blur()
                                    }}
                                    suffixIcon={<a>{__('选择')}</a>}
                                />
                            </Form.Item>
                        </Form>
                    </div>
                    <FieldsDragTable
                        ref={tRef}
                        items={fieldItems}
                        fieldsData={fieldsData}
                        formulaItem={formulaItem}
                        columns={[
                            'alias',
                            'enName',
                            'info_item_business_name',
                            'dict_id',
                        ]}
                        viewSize={viewSize}
                        viewHeight={viewHeight}
                        fetching={fieldsFetching}
                        scrollHeight={214}
                        inViewMode={inViewMode}
                        emptyDesc={
                            viewExist
                                ? __('暂无数据，请先选择库表')
                                : __('库表异常，请重新选择')
                        }
                    />
                </div>
            )}
            <DataViewChooseDrawer
                open={viewVisible}
                title={__('选择库表')}
                mode="single"
                selectType="catlg"
                selDataItems={selectView ? [selectView] : []}
                onClose={() => {
                    setViewVisible(false)
                    setDeletable?.(true)
                }}
                onSure={handleChangeView}
            />
        </div>
    )
})

export default CatalogFormula
