import { useEffect, useRef, useState } from 'react'
import { Form, Select, Spin } from 'antd'
import { get } from 'lodash'
import { IFormulaFields, formatError, getDatasheetViewDetails } from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import { changeTypeToLargeArea, checkDeAtomFormulaConfig } from '../helper'
import { fieldLabel, IFormulaConfigEl } from './helper'
import ConfigHeader from './ConfigHeader'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { FieldTypes, FormulaError, FormulaType } from '../const'
import ChooseAtomModal from '../AtomModal'
import Icons from '../Icons'
import AnalysisDimension from './AnalysisDimension'
import Editor, { getFormatSql } from '../Editor'
import { useIndicatorContext } from '../IndicatorProvider'
import { Loader } from '@/ui'

/**
 * 原子指标
 */
const DeAtomFormula = ({
    visible,
    node,
    formulaData,
    fieldsData,
    viewSize = 0,
    dragExpand,
    onChangeExpand,
    onClose,
    onOperate,
}: IFormulaConfigEl) => {
    const [form] = Form.useForm()
    const vRef: any = useRef(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [viewVisible, setViewVisible] = useState<boolean>(false)
    const { getDataById } = useIndicatorContext()
    // 当前的算子信息
    const [formulaItem, setFormulaItem] = useState<any>()
    // 指标选项
    const [viewOptions, setViewOptions] = useState<any[]>([])
    // 字段集合 undefined-前置提示
    // const [fieldItems, setFieldItems] = useState<IFormulaFields[]>()
    // 维度选中项
    const [dimValue, setDimValue] = useState<any>([])
    // 已选中的的指标
    const [selectView, setSelectView] = useState<any>()
    // 字段集合 undefined-前置提示
    const [viewFields, setViewFields] = useState<IFormulaFields[]>()
    const atomId = Form.useWatch('atom_id', form)
    const [policyFieldsInfo, setPolicyFieldsInfo] = useState<any>()
    const [viewLoading, setViewLoading] = useState<boolean>(false)

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
            const isPolicyFields = dimValue.some((v) =>
                policyFieldsInfo?.fields?.map((o) => o.id)?.includes(v.id),
            )
            if (isPolicyFields) return
            const { atom_id } = values
            if (!atom_id) {
                form.setFields([
                    {
                        name: 'atom_id',
                        value: undefined,
                        errors: [__('请选择原子指标')],
                    },
                ])
                return
            }
            const { formula } = node!.data

            // 若存在配置并更换了原子指标  => 重置所有节点数据
            const isNodeChange = !!(
                formulaItem?.config && atom_id !== formulaItem?.config?.atom_id
            )
            onOperate?.(FormulaType.ATOM, isNodeChange)
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
                                atom_id,
                                form_id: get(selectView, 'refer_view_id', ''),
                                scene_id: get(
                                    selectView,
                                    'scene_analysis_id',
                                    '',
                                ),
                                config_fields: viewFields,
                                other: {
                                    catalogOptions: selectView,
                                },
                            },
                            output_fields: viewFields,
                        }
                    }
                    return info
                }),
            })
            onClose()
        } catch (err) {
            // if (err?.errorFields?.length > 0) {
            // }
        }
    }

    const clearData = () => {
        form.resetFields()
        setViewOptions([])
        setSelectView(undefined)
    }

    // 检查更新数据
    const checkData = async () => {
        setLoading(true)
        clearData()
        const { errorMsg, totalData, policyFieldInfos } =
            await checkDeAtomFormulaConfig(
                node!,
                formulaData!,
                fieldsData,
                getDataById,
            )
        setPolicyFieldsInfo(policyFieldInfos)
        const realFormula = node!.data.formula.find(
            (info) => info.id === formulaData!.id,
        )
        setFormulaItem(realFormula)
        const { config } = realFormula
        if (config) {
            const { atom_id, other } = config
            setSelectView(
                errorMsg && errorMsg !== FormulaError.IsPolicy
                    ? undefined
                    : other.catalogOptions,
            )
            setViewOptions(
                errorMsg && errorMsg !== FormulaError.IsPolicy
                    ? []
                    : changeCatalogOptions([other.catalogOptions]),
            )
            setDimValue(
                get(other, 'catalogOptions.analysis_dimensions', [])
                    .map((item) => ({
                        id: item.field_id,
                        name: item.business_name,
                        name_en: item.technical_name,
                        data_type: item.original_data_type,
                    }))
                    ?.map((item) => {
                        return {
                            ...item,
                            isPolicy: policyFieldInfos?.fields
                                ?.map((o) => o.id)
                                ?.includes(item.id),
                        }
                    }),
            )
            setViewFields(totalData)
            form.setFields([
                {
                    name: 'atom_id',
                    value:
                        errorMsg && errorMsg !== FormulaError.IsPolicy
                            ? undefined
                            : atom_id,
                    errors:
                        errorMsg && errorMsg !== FormulaError.IsPolicy
                            ? []
                            : [__('原子指标异常，请重新选择')],
                },
            ])
        }
        setLoading(false)
    }

    const changeCatalogOptions = (infos: any[]) => {
        return infos.map((info) => {
            return {
                label: (
                    <>
                        <Icons colored type={FormulaType.ATOM} />
                        <span> {info.name}</span>
                    </>
                ),
                value: info.id,
                name: info.name,
                data: info,
            }
        })
    }

    // 切换原子指标
    const handleChange = async (value) => {
        setViewOptions(changeCatalogOptions([value]))
        form.setFields([
            {
                name: 'atom_id',
                value: value.id,
                errors: [],
            },
        ])
        setViewVisible(false)
        setSelectView(value)
        setDimValue(
            get(value, 'analysis_dimensions', []).map((item) => ({
                id: item.field_id,
                name: item.business_name,
                name_en: item.technical_name,
                data_type: item.original_data_type,
            })),
        )
        getColumnsWithView(value.refer_view_id)
    }

    // 加载库表字段
    const getColumnsWithView = async (cid?: string) => {
        if (!cid) {
            return
        }
        try {
            setViewLoading(true)
            const getFunc = getDataById || getDatasheetViewDetails
            const res = await getFunc(cid)
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
            const fields = filterData.map((item) => ({
                alias: item.business_name,
                id: item.id,
                name: item.business_name,
                sourceId: node!.id,
                originName: item.business_name,
                checked: true,
            }))
            setViewFields(fields)
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
                        name: 'atom_id',
                        value: undefined,
                        errors: [__('引用库表不存在，请重新选择原子指标')],
                    },
                ])
                setSelectView(undefined)
            } else {
                formatError(err)
            }
        } finally {
            setViewLoading(false)
        }
    }

    return (
        <div className={styles.deAtomFormulaWrap}>
            <ConfigHeader
                node={node}
                formulaItem={formulaItem}
                loading={loading || viewLoading}
                dragExpand={dragExpand}
                onChangeExpand={onChangeExpand}
                onClose={() => onClose(false)}
                onSure={() => handleSave()}
            />
            {loading ? (
                <Spin className={styles.ldWrap} />
            ) : (
                <div className={styles.da_contentWrap}>
                    <div className={styles.da_selectWrap}>
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
                                label={__('选择原子指标')}
                                required
                                name="atom_id"
                                validateTrigger={['onChange', 'onBlur']}
                            >
                                <Select
                                    ref={vRef}
                                    placeholder={__('请选择原子指标')}
                                    options={viewOptions}
                                    open={false}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setViewVisible(true)
                                        vRef?.current?.blur()
                                    }}
                                    suffixIcon={<a>{__('选择')}</a>}
                                />
                            </Form.Item>
                        </Form>
                    </div>

                    {atomId ? (
                        <Form
                            layout="horizontal"
                            autoComplete="off"
                            style={{
                                width: 1172,
                            }}
                            labelAlign="left"
                        >
                            <Form.Item label={__('日期时间标识')}>
                                {selectView &&
                                    fieldLabel(
                                        get(
                                            selectView,
                                            'date_mark.original_data_type',
                                        ),
                                        get(
                                            selectView,
                                            'date_mark.business_name',
                                        ),
                                    )}
                            </Form.Item>
                            <Form.Item label={__('分析维度')}>
                                <AnalysisDimension
                                    showAdd={false}
                                    showRemove={false}
                                    value={dimValue}
                                    disabledOptions={policyFieldsInfo?.fields}
                                />
                            </Form.Item>
                            <Form.Item label={__('表达式')}>
                                <Editor
                                    lineNumbers={false}
                                    grayBackground
                                    highlightActiveLine={false}
                                    value={getFormatSql(
                                        get(selectView, 'expression', ''),
                                    )}
                                    editable={false}
                                />
                            </Form.Item>
                            <Form.Item label={__('SQL')}>
                                <Editor
                                    grayBackground
                                    highlightActiveLine={false}
                                    style={{ maxHeight: 320, overflow: 'auto' }}
                                    value={getFormatSql(
                                        get(selectView, 'exec_sql', ''),
                                    )}
                                    editable={false}
                                />
                            </Form.Item>
                        </Form>
                    ) : (
                        <div
                            style={{
                                textAlign: 'center',
                                width: '100%',
                                flex: 1,
                            }}
                        >
                            {viewLoading ? (
                                <div
                                    style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Loader />
                                </div>
                            ) : (
                                <Empty
                                    desc={__('暂无数据，请先选择原子指标')}
                                    iconSrc={dataEmpty}
                                />
                            )}
                        </div>
                    )}
                    <ChooseAtomModal
                        open={viewVisible}
                        checkedId={selectView?.id}
                        onClose={() => {
                            setViewVisible(false)
                        }}
                        onSure={handleChange}
                    />
                </div>
            )}
        </div>
    )
}

export default DeAtomFormula
