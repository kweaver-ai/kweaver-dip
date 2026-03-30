import React, {
    useEffect,
    useRef,
    useState,
    useContext,
    useImperativeHandle,
    forwardRef,
} from 'react'
import { Form, Spin } from 'antd'
import { uniqBy } from 'lodash'
import { IFormula, IFormulaFields, messageError } from '@/core'
import styles from './styles.module.less'
import __ from '../locale'
import { checkCiteViewFormulaConfig, useSceneGraphContext } from '../helper'
import { IFormulaConfigEl, catalogLabel } from './helper'
import ConfigHeader from './ConfigHeader'
import FieldsDragTable from './FieldsDragTable'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { useQuery } from '@/utils'
import { ModuleType } from '../const'
import {
    CHANGE_TAB_ACTIVE_KEY,
    CHANGE_TAB_ITEMS,
    CustomViewContext,
} from '../CustomViewRedux'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useViewGraphContext } from '../ViewGraphProvider'
import SampleComp from '../LeftViewCont/SampleComp'

/**
 * 引用库表算子配置-逻辑/自定义库表模块
 */
const CiteViewFormula = forwardRef((props: IFormulaConfigEl, ref) => {
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
    const { setDeletable } = useSceneGraphContext()
    const query = useQuery()
    const module = query.get('module') || ModuleType.SceneAnalysis
    const entityId = query.get('entityId') || ''
    const [form] = Form.useForm()
    const vRef: any = useRef(null)
    const tRef = useRef() as React.MutableRefObject<any>
    const [loading, setLoading] = useState<boolean>(false)
    const [fieldsFetching, setFieldsFetching] = useState<boolean>(false)
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
    const [userInfo] = useCurrentUser()

    const { data: contextData, dispatch } = useContext(CustomViewContext)
    const { tabItems, dataViewLists } = contextData.toJS()
    const { setContinueFn } = useViewGraphContext()

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
        if (tRef?.current?.valuesChange) {
            return Promise.resolve(true)
        }
        return Promise.resolve(false)
    }

    useEffect(() => {
        if (visible && formulaData && node) {
            checkData()
        }
    }, [visible, formulaData])

    // 保存节点配置
    const handleSave = async () => {
        try {
            const res = tRef.current?.getData()
            if (res.hasError) {
                tRef.current?.getData()
                setContinueFn(undefined)
                return
            }
            const selectedFields = res.resultFields.filter(
                (info) => info.checked,
            )
            if (selectedFields.length === 0) {
                setContinueFn(undefined)
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
                                    form_id: formulaData?.config?.form_id,
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

        const { outData, isExist, totalData } =
            await checkCiteViewFormulaConfig(
                graph!,
                node!,
                formulaData!,
                fieldsData,
                userInfo,
            )
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

    const handleViewPreview = () => {
        const newActiveKey = selectView.id
        let newPanes = [...tabItems]
        newPanes.push({
            label: selectView.business_name,
            children: <SampleComp data={selectView} />,
            key: newActiveKey,
            closable: true,
        })
        newPanes = uniqBy(newPanes, 'key')
        dispatch({
            type: CHANGE_TAB_ITEMS,
            data: newPanes,
        })
        dispatch({
            type: CHANGE_TAB_ACTIVE_KEY,
            data: newActiveKey,
        })
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
                    <div className={styles.view_title}>
                        {__('库表名称：')}
                        <a
                            onClick={() => handleViewPreview()}
                            title={selectView?.business_name}
                        >
                            {selectView?.business_name}
                        </a>
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
                            scrollHeight={176}
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
                    {/* <DataOutPreview
                        visible={recommendViewVisible}
                        title={__('推荐库表预览')}
                        items={recommendItems}
                        allowPrimary
                        formulaType={FormulaType.FORM}
                        onClose={() => setRecommendViewVisible(false)}
                    /> */}
                    {/* <ChooseBizTable
                        title={__('选择库表')}
                        visible={viewVisible}
                        onClose={() => setViewVisible(false)}
                        checked={selectView}
                        onSure={handleChangeView}
                    /> */}
                    {/* <ChooseLogicalView
                        open={viewVisible}
                        checkedId={selectView?.value}
                        onClose={() => {
                            setViewVisible(false)
                            setDeletable(true)
                        }}
                        onSure={handleChangeView}
                    /> */}
                </div>
            )}
        </div>
    )
})

export default CiteViewFormula
