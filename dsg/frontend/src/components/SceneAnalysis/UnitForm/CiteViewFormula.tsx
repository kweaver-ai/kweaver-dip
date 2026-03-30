import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Form, Select, Spin } from 'antd'
import {
    IFormula,
    IFormulaFields,
    formatError,
    messageError,
    getDatasheetViewDetails,
    postRecommendLogicView,
} from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import {
    changeTypeToLargeArea,
    checkCiteViewFormulaConfig,
    useSceneGraphContext,
} from '../helper'
import { IFormulaConfigEl, catalogLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { useQuery } from '@/utils'
import { FieldTypes, FormulaType, ModuleType } from '../const'
import DataOutPreview from './DataOutPreview'
import { DatasheetViewColored } from '@/icons'
import ChooseLogicalView from '../LogicalViewModal'

/**
 * 引用库表算子配置-逻辑/自定义库表模块
 */
const CiteViewFormula = ({
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
    const query = useQuery()
    const module = query.get('module') || ModuleType.SceneAnalysis
    const entityId = query.get('entityId') || ''
    const [form] = Form.useForm()
    const vRef: any = useRef(null)
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    const [fieldsFetching, setFieldsFetching] = useState<boolean>(false)
    const [recommendViewVisible, setRecommendViewVisible] =
        useState<boolean>(false)
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<IFormula>()
    // 库表选项
    const [viewOptions, setViewOptions] = useState<any[]>([])
    // 字段集合 undefined-前置提示
    const [fieldItems, setFieldItems] = useState<IFormulaFields[]>()
    // 已选中的的库表
    const [selectView, setSelectView] = useState<any>()
    // 库表存在情况
    const [viewExist, setViewExist] = useState<boolean>(true)
    // 推荐库表
    const [recommendView, setRecommendView] = useState<any>()
    const [recommendItems, setRecommendItems] = useState<IFormulaFields[]>([])

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
                tRef.current?.getData()
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
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
        setViewOptions([])
        setFieldItems(undefined)
        setSelectView(undefined)
        setViewExist(true)
        setRecommendView(undefined)
        setRecommendItems([])
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()

        const { outData, isExist, totalData } =
            await checkCiteViewFormulaConfig(node!, formulaData!, fieldsData)
        setViewExist(isExist)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config, errorMsg } = realFormula
        if (config) {
            const { form_id, other, config_fields } = config
            setSelectView(isExist ? other.catalogOptions : undefined)
            setViewOptions(
                isExist ? changeCatalogOptions([other.catalogOptions]) : [],
            )
            setTimeout(() => {
                form.setFields([
                    {
                        name: 'form_id',
                        value: isExist ? form_id : undefined,
                        errors: isExist ? [] : ['库表不存在，请重新选择'],
                    },
                ])
            }, 400)
            setFieldItems(isExist ? totalData : undefined)
        } else if (module === ModuleType.LogicEntityView) {
            getRecommend()
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
        setRecommendView(undefined)
        setViewVisible(false)
        setDeletable(true)
        setSelectView(value)
        setViewExist(true)
        getColumnsWithView(value.id)
        setCiteFormViewId(value.id)
    }

    // 加载库表字段
    const getColumnsWithView = async (cid?: string) => {
        if (!cid) {
            setFieldItems(undefined)
            return
        }
        try {
            setFieldsFetching(true)
            const res = await getDatasheetViewDetails(cid, {
                enable_data_protection: true,
            })
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
                        dict_id: item.code_table_id || undefined,
                        dict_name: item.code_table || undefined,
                        standard_code: item.standard_code || undefined,
                        standard_name: item.standard || undefined,
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

    const getRecommend = async () => {
        try {
            const { res } = await postRecommendLogicView({
                logical_entity_id: entityId,
            })
            if (res?.[0]?.id) {
                const details = await getDatasheetViewDetails(res?.[0]?.id, {
                    enable_data_protection: true,
                })
                let primaryField
                let fields =
                    details?.fields
                        ?.filter((item) => {
                            if (item.primary_key) {
                                primaryField = {
                                    ...item,
                                    data_type: changeTypeToLargeArea(
                                        item.data_type,
                                    ),
                                    name_en: item.technical_name,
                                    alias: item.business_name,
                                }
                                return false
                            }
                            return (
                                changeTypeToLargeArea(item.data_type) !==
                                    FieldTypes.BINARY &&
                                item.data_type !== null &&
                                item.data_type !== ''
                            )
                        })
                        ?.map((item) => ({
                            ...item,
                            data_type: changeTypeToLargeArea(item.data_type),
                            name_en: item.technical_name,
                            alias: item.business_name,
                        })) || []
                if (primaryField) {
                    fields = [primaryField, ...fields]
                }
                setRecommendView(res?.[0])
                setRecommendItems(fields)
            }
        } catch (err) {
            // formatError(err)
        }
    }

    const handleSelectRecommend = () => {
        handleChangeView(recommendView)
    }

    return (
        <div className={styles.citeViewFormulaWrap}>
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
                <div className={styles.cv_contentWrap}>
                    <div className={styles.cv_selectWrap}>
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
                        {recommendView && (
                            <div className={styles.cv_recommendWrap}>
                                <div style={{ flexShrink: 0 }}>
                                    {__('推荐库表：')}
                                </div>
                                <div
                                    className={styles.cv_recommendItem}
                                    onClick={() =>
                                        setRecommendViewVisible(true)
                                    }
                                >
                                    <DatasheetViewColored />
                                    <div
                                        className={styles.cl_name}
                                        title={recommendView.business_name}
                                    >
                                        {recommendView.business_name}
                                    </div>
                                </div>
                                <a
                                    style={{ flexShrink: 0 }}
                                    onClick={handleSelectRecommend}
                                >
                                    {__('确定引用')}
                                </a>
                            </div>
                        )}
                    </div>

                    {fieldItems && fieldItems?.length > 0 ? (
                        <FieldsDragTable
                            ref={tRef}
                            items={fieldItems}
                            fieldsData={fieldsData}
                            formulaItem={formulaItem}
                            columns={['alias', 'enName', 'dict_id']}
                            viewSize={viewSize}
                            fetching={fieldsFetching}
                            module={module as ModuleType}
                        />
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
                    <DataOutPreview
                        visible={recommendViewVisible}
                        title={__('推荐库表预览')}
                        items={recommendItems}
                        allowPrimary
                        formulaType={FormulaType.FORM}
                        onClose={() => setRecommendViewVisible(false)}
                    />
                    {/* <ChooseBizTable
                        title={__('选择库表')}
                        visible={viewVisible}
                        onClose={() => setViewVisible(false)}
                        checked={selectView}
                        onSure={handleChangeView}
                    /> */}
                    <ChooseLogicalView
                        open={viewVisible}
                        checkedId={selectView?.value}
                        onClose={() => {
                            setViewVisible(false)
                            setDeletable(true)
                        }}
                        onSure={handleChangeView}
                    />
                </div>
            )}
        </div>
    )
}

export default CiteViewFormula
