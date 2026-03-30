import { FC, useEffect, useRef, useState, CSSProperties } from 'react'
import classnames from 'classnames'
import { noop, set } from 'lodash'
import { Button, Input, Select, Tooltip } from 'antd'
import { CloseCircleFilled, ConsoleSqlOutlined } from '@ant-design/icons'
import {
    CodeRuleOptions,
    CodeRuleType,
    StandardDataDetail,
    ValueRangeType,
    exChangeRangeDataToObj,
    exChangeRangeDataToString,
    CodeStatus,
} from './const'
import {
    CatalogType,
    formatError,
    getCodeRuleDetails,
    getDictDetailById,
    getDataEleDetailById,
    IStdRecParams,
    IRuleRecParams,
} from '@/core'
import SelDataByTypeModal from '../SelDataByTypeModal'
import DataEleDetails from '../DataEleManage/Details'
import CodeTableDetails from '../CodeTableManage/Details'
import __ from './locale'
import styles from './styles.module.less'
import { StateType } from '@/utils'
import CodeRuleDetails from '../CodeRulesComponent/CodeRuleDetails'
import ViewRuleRegular from './ViewRuleRegular'
import CodeStatusLabel from './CodeStatusLabel'

// 获取item的状态-已删除/已停用
export const getItemStatus = (item: any) => {
    const { state, deleted } = item
    if (deleted) {
        return <div className={styles.quoteDeletedStatus}>{__('已删除')} </div>
    }
    if (state === StateType.DISABLE) {
        return <div className={styles.quoteDisableStatus}>{__('已停用')} </div>
    }
    return undefined
}

/**
 * 选择“编码规则/码表”
 */
interface ISelectValueRange {
    type: ValueRangeType
    value?: string
    // 取值：id/code，用此key区分详情查询（暂仅支持数据元）
    dataKey?: string

    onChange?: (value: string) => void
    // 标准规则详情Map
    standardRuleDetail: StandardDataDetail

    placeholder?: string
    style?: CSSProperties
    disabled?: boolean
    getContainer?: any
    isViewDetail?: boolean
    onSelectDetails?: (id: string, type: ValueRangeType) => void
    stdRecParams?: IStdRecParams
    ruleRecParams?: IRuleRecParams
}

const SelectValueRange: FC<ISelectValueRange> = ({
    type,
    value,
    dataKey,
    disabled = false,
    onChange = noop,
    standardRuleDetail,
    placeholder = '',
    style,
    getContainer,
    isViewDetail = true,
    onSelectDetails = noop,
    stdRecParams,
    ruleRecParams,
}) => {
    // 内部类型
    const [innerType, setInnerType] = useState<ValueRangeType>()
    // 弹窗的ref
    const codeTableRef: any = useRef()
    // 打开弹窗状态
    const [selCodeTable, setSelCodeTable] = useState<boolean>(false)
    // 标准类型
    const [catalogType, setCatalogType] = useState<CatalogType>()
    // 详情id
    const [detailId, setDetailId] = useState<string>('')

    // 当前选择的数据结果
    const [selectedData, setSelectedData] = useState<any>()

    // 码表详情弹窗状态
    const [codeTableVisible, setCodeTableVisible] = useState<boolean>(false)
    // 编码规则详情弹窗状态
    const [codeRuleVisible, setCodeRuleVisible] = useState<boolean>(false)

    // 当前选择的数据详情
    const [selectedDataDetail, setSelectedDataDetail] = useState<any>()

    // 编码规则选择的状态
    const [codeRuleType, setCodeRuleType] = useState<CodeRuleType>(
        CodeRuleType.System,
    )

    const [oprItems, setOprItem] = useState<Array<any>>([])

    const [deleted, setDeleted] = useState<boolean>(false)

    // 标准类型
    const [catalogViewType, setCatalogViewType] = useState<
        CatalogType.CODETABLE | CatalogType.CODINGRULES | CatalogType.DATAELE
    >(CatalogType.CODINGRULES)

    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 预览详情的信息
    const [codeViewId, setCodeViewId] = useState<string>('')

    useEffect(() => {
        if (innerType && innerType !== type) {
            setCodeRuleType(CodeRuleType.System)
        }
        setInnerType(type)
    }, [type])

    useEffect(() => {
        if (value) {
            const objInfo = exChangeRangeDataToObj(value)
            if (objInfo.id) {
                getCodeRuleDetail(objInfo.id)
            } else {
                setCodeRuleType(CodeRuleType.Custom)
            }
            setSelectedData(objInfo)
        } else {
            setSelectedData(undefined)
            setSelectedDataDetail(undefined)
            if (value === '') {
                setCodeRuleType(CodeRuleType.Custom)
            } else {
                setCodeRuleType(CodeRuleType.System)
            }
        }
    }, [value])

    useEffect(() => {
        setOprItem(
            selectedData
                ? [
                      {
                          key: selectedData.id,
                          label: selectedData.name,
                      },
                  ]
                : [],
        )
    }, [selectedData])

    /**
     * 展示详情页面（如编码规则/码表详情）
     * @param dataType 查看数据类型
     * @param dataId 查看的数据id
     */
    const handleShowCodeTableDetail = (
        dataType: CatalogType,
        dataId?: string,
    ) => {
        if (dataId) {
            if (isViewDetail) {
                if (innerType === ValueRangeType.CodeRule) {
                    setCodeRuleVisible(true)
                } else if (innerType === ValueRangeType.CodeTable) {
                    setCodeTableVisible(true)
                } else if (innerType === ValueRangeType.DataElement) {
                    setDataEleDetailVisible(true)
                }
                setDetailId(dataId)
            } else {
                onSelectDetails(dataId, innerType)
            }
        }
    }

    /**
     * 获取当前编码规则的详情
     * @param id
     */
    const getCodeRuleDetail = async (id) => {
        try {
            if (type === ValueRangeType.CodeRule) {
                const res = await getCodeRuleDetails(id)
                setSelectedData({
                    id,
                    name: res?.data?.name,
                })
                setSelectedDataDetail(res.data)
            } else if (type === ValueRangeType.CodeTable) {
                const res = await getDictDetailById(id)
                setSelectedData({
                    id,
                    name: res?.data?.name || res?.data?.ch_name,
                })
                setSelectedDataDetail(res.data)
            } else if (type === ValueRangeType.DataElement) {
                const res = await getDataEleDetailById({
                    type: dataKey === 'id' ? 1 : 2,
                    value: id,
                })
                setSelectedData({ id, name: res?.data?.name_cn })
                setSelectedDataDetail(res.data)
            }
        } catch (ex) {
            if (ex.data.code === 'Standardization.ResourceError.DataNotExist') {
                setDeleted(true)
            } else {
                formatError(ex)
            }
        }
    }

    const getEditComponent = () => {
        switch (type) {
            case ValueRangeType.CodeRule:
                return (
                    <div
                        className={`${styles.selectRulerWrapper} error-customer-style`}
                        style={style}
                    >
                        <Select
                            options={CodeRuleOptions}
                            value={codeRuleType}
                            onChange={(selected) => {
                                setCodeRuleType(selected)
                                if (codeRuleType === CodeRuleType.Custom) {
                                    onChange(null)
                                } else {
                                    onChange('')
                                }
                            }}
                            disabled={disabled}
                            bordered={false}
                            className={styles.codeRuleTypeSelected}
                        />
                        {codeRuleType === CodeRuleType.System ? (
                            <>
                                <div className={styles.textNameWrapper}>
                                    {selectedData?.name ? (
                                        <Tooltip
                                            title={
                                                (deleted ||
                                                    selectedDataDetail?.deleted) &&
                                                __('已被删除，无法查看详情')
                                            }
                                        >
                                            <Button
                                                type="link"
                                                className={styles.nameText}
                                                disabled={
                                                    deleted ||
                                                    selectedDataDetail?.deleted
                                                }
                                                onClick={() => {
                                                    setCatalogViewType(
                                                        CatalogType.CODINGRULES,
                                                    )
                                                    setCodeViewId(
                                                        selectedData.id,
                                                    )
                                                }}
                                                title={
                                                    selectedDataDetail?.ch_name ||
                                                    selectedDataDetail?.name ||
                                                    selectedData?.name
                                                }
                                            >
                                                {selectedDataDetail?.ch_name ||
                                                    selectedDataDetail?.name ||
                                                    selectedData?.name}
                                            </Button>
                                        </Tooltip>
                                    ) : (
                                        <span
                                            className={styles.namePlaceholder}
                                        >
                                            {placeholder ||
                                                __('请选择编码规则（必选）')}
                                        </span>
                                    )}
                                    {selectedDataDetail ? (
                                        <div className={styles.status}>
                                            <CodeStatusLabel
                                                status={
                                                    deleted
                                                        ? CodeStatus.Deleted
                                                        : selectedDataDetail?.deleted
                                                        ? CodeStatus.Deleted
                                                        : selectedDataDetail?.state ===
                                                          StateType.DISABLE
                                                        ? CodeStatus.Disabled
                                                        : CodeStatus.Normal
                                                }
                                            />
                                        </div>
                                    ) : null}
                                </div>
                                <div className={styles.rightButtonBar}>
                                    {value && !disabled ? (
                                        <CloseCircleFilled
                                            onClick={() => {
                                                onChange(null)
                                            }}
                                            className={styles.clearBtn}
                                        />
                                    ) : null}
                                    <div
                                        onClick={(e) => {
                                            if (!disabled) {
                                                e.stopPropagation()
                                                setCatalogType(
                                                    CatalogType.CODINGRULES,
                                                )
                                                setSelCodeTable(true)
                                                if (
                                                    deleted ||
                                                    selectedDataDetail?.deleted ||
                                                    selectedDataDetail?.state ===
                                                        StateType.DISABLE
                                                ) {
                                                    onChange('')
                                                }
                                            }
                                        }}
                                        className={classnames(
                                            styles.selectBtn,
                                            disabled
                                                ? styles.selectBtnDisabled
                                                : '',
                                        )}
                                    >
                                        {__('选择')}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className={styles.textNameWrapper}>
                                <Input
                                    placeholder={__('请输入（必填）')}
                                    value={selectedData?.name || ''}
                                    onChange={(e) => {
                                        onChange(e.target.value)
                                    }}
                                    disabled={disabled}
                                    bordered={false}
                                    maxLength={255}
                                    allowClear
                                />
                            </div>
                        )}
                    </div>
                )
            case ValueRangeType.CodeTable:
                return (
                    <div
                        className={`${styles.selectRulerWrapper} error-customer-style`}
                        style={style}
                    >
                        <div className={styles.textNameWrapper}>
                            {selectedData?.name ? (
                                <Tooltip
                                    title={
                                        (deleted ||
                                            selectedDataDetail?.deleted) &&
                                        __('已被删除，无法查看详情')
                                    }
                                >
                                    <Button
                                        type="link"
                                        className={styles.nameText}
                                        disabled={
                                            deleted ||
                                            selectedDataDetail?.deleted
                                        }
                                        onClick={() => {
                                            setCatalogViewType(
                                                CatalogType.CODETABLE,
                                            )
                                            setCodeViewId(selectedData.id)
                                        }}
                                        title={
                                            selectedDataDetail?.ch_name ||
                                            selectedDataDetail?.name ||
                                            selectedData?.name
                                        }
                                    >
                                        {selectedDataDetail?.ch_name ||
                                            selectedDataDetail?.name ||
                                            selectedData?.name}
                                    </Button>
                                </Tooltip>
                            ) : (
                                <span className={styles.namePlaceholder}>
                                    {placeholder || __('请选择码表（必选）')}
                                </span>
                            )}
                            {selectedDataDetail ? (
                                <CodeStatusLabel
                                    status={
                                        deleted
                                            ? CodeStatus.Deleted
                                            : selectedDataDetail?.deleted
                                            ? CodeStatus.Deleted
                                            : selectedDataDetail?.state ===
                                              StateType.DISABLE
                                            ? CodeStatus.Disabled
                                            : CodeStatus.Normal
                                    }
                                />
                            ) : null}
                        </div>
                        <div className={styles.rightButtonBar}>
                            {value && !disabled ? (
                                <CloseCircleFilled
                                    onClick={() => {
                                        onChange('')
                                    }}
                                    className={styles.clearBtn}
                                />
                            ) : null}
                            <div
                                onClick={(e) => {
                                    if (!disabled) {
                                        e.stopPropagation()
                                        setCatalogType(CatalogType.CODETABLE)
                                        setSelCodeTable(true)
                                        if (
                                            deleted ||
                                            selectedDataDetail?.deleted ||
                                            selectedDataDetail?.state ===
                                                StateType.DISABLE
                                        ) {
                                            onChange('')
                                        }
                                    }
                                }}
                                className={classnames(
                                    styles.selectBtn,
                                    disabled ? styles.selectBtnDisabled : '',
                                )}
                            >
                                {__('选择')}
                            </div>
                        </div>
                    </div>
                )
            case ValueRangeType.DataElement:
                return (
                    <div
                        className={`${styles.selectRulerWrapper} error-customer-style`}
                        style={style}
                    >
                        <div className={styles.textNameWrapper}>
                            {selectedData?.name ? (
                                <Tooltip
                                    title={
                                        (deleted ||
                                            selectedDataDetail?.deleted) &&
                                        __('已被删除，无法查看详情')
                                    }
                                >
                                    <Button
                                        type="link"
                                        className={styles.nameText}
                                        disabled={
                                            deleted ||
                                            selectedDataDetail?.deleted
                                        }
                                        onClick={() => {
                                            setCatalogViewType(
                                                CatalogType.DATAELE,
                                            )
                                            setCodeViewId(selectedData.id)
                                        }}
                                        title={
                                            selectedDataDetail?.ch_name ||
                                            selectedDataDetail?.name ||
                                            selectedData?.name
                                        }
                                    >
                                        {selectedDataDetail?.ch_name ||
                                            selectedDataDetail?.name ||
                                            selectedData?.name}
                                    </Button>
                                </Tooltip>
                            ) : (
                                <span className={styles.namePlaceholder}>
                                    {placeholder || __('请选择数据元（必选）')}
                                </span>
                            )}
                            {selectedDataDetail ? (
                                <CodeStatusLabel
                                    status={
                                        deleted
                                            ? CodeStatus.Deleted
                                            : selectedDataDetail?.deleted
                                            ? CodeStatus.Deleted
                                            : selectedDataDetail?.state ===
                                              StateType.DISABLE
                                            ? CodeStatus.Disabled
                                            : CodeStatus.Normal
                                    }
                                />
                            ) : null}
                        </div>
                        <div className={styles.rightButtonBar}>
                            {value && !disabled ? (
                                <CloseCircleFilled
                                    onClick={() => {
                                        onChange('')
                                    }}
                                    className={styles.clearBtn}
                                />
                            ) : null}
                            <div
                                onClick={(e) => {
                                    if (!disabled) {
                                        e.stopPropagation()
                                        setCatalogType(CatalogType.DATAELE)
                                        setSelCodeTable(true)
                                        if (
                                            deleted ||
                                            selectedDataDetail?.deleted ||
                                            selectedDataDetail?.state ===
                                                StateType.DISABLE
                                        ) {
                                            onChange('')
                                        }
                                    }
                                }}
                                className={classnames(
                                    styles.selectBtn,
                                    disabled ? styles.selectBtnDisabled : '',
                                )}
                            >
                                {__('选择')}
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    /**
     *  更新编码规则/码表的Map
     * @param {newStandardInfo} 新增数据
     */
    const updateStandardRules = async (newStandardInfo) => {
        try {
            let standardInfo
            if (innerType === ValueRangeType.CodeRule) {
                standardInfo = await getCodeRuleDetails(newStandardInfo.key)
            } else if (innerType === ValueRangeType.CodeTable) {
                standardInfo = await getDictDetailById(newStandardInfo.key)
            } else if (innerType === ValueRangeType.DataElement) {
                standardInfo = await getDataEleDetailById({
                    type: 1,
                    value: newStandardInfo.key,
                })
            }

            if (standardInfo) {
                standardRuleDetail.updateStandardDetails([standardInfo.data])
                // setSelectedDataDetail(standardInfo)
            }
        } catch (ex) {
            formatError(ex)
        }
    }

    return (
        <div>
            {getEditComponent()}
            {/* 选择码表/编码规则 */}
            {catalogType && selCodeTable ? (
                <SelDataByTypeModal
                    visible={selCodeTable}
                    ref={codeTableRef}
                    onClose={() => {
                        setSelCodeTable(false)
                    }}
                    onOk={() => {
                        // form.validateFields(['std_files'])
                    }}
                    dataType={catalogType}
                    rowSelectionType="radio"
                    oprItems={oprItems}
                    setOprItems={(newValue) => {
                        if (newValue[0]) {
                            // 数据元默认使用数据元code，若传dataKey为id，则使用key值
                            onChange(
                                exChangeRangeDataToString({
                                    id:
                                        catalogType === CatalogType.DATAELE
                                            ? (newValue[0][
                                                  dataKey === 'id'
                                                      ? 'key'
                                                      : 'code'
                                              ] as string)
                                            : (newValue[0].key as string),
                                    name: newValue[0].label,
                                }),
                            )
                            updateStandardRules(newValue[0])
                        }
                    }}
                    handleShowDataDetail={handleShowCodeTableDetail}
                    isEnableCodeRule
                    isEnableDict
                    getContainer={getContainer || false}
                    stdRecParams={stdRecParams}
                    ruleRecParams={ruleRecParams}
                />
            ) : null}

            {/* 查看码表详情 */}
            {codeTableVisible && !!detailId && (
                <CodeTableDetails
                    visible={codeTableVisible && !!detailId}
                    dictId={detailId}
                    onClose={() => {
                        setCodeTableVisible(false)
                        setDetailId('')
                    }}
                    getContainer={getContainer || false}
                />
            )}

            {codeRuleVisible && !!detailId && (
                <CodeRuleDetails
                    visible={codeRuleVisible}
                    onClose={() => {
                        setCodeRuleVisible(false)
                        setDetailId('')
                    }}
                    id={detailId}
                />
            )}

            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible && !!detailId}
                    dataEleId={detailId}
                    onClose={() => {
                        setDataEleDetailVisible(false)
                        setDetailId('')
                    }}
                    getContainer={getContainer || false}
                />
            )}

            {codeViewId && catalogViewType !== CatalogType.DATAELE && (
                <ViewRuleRegular
                    onClose={() => {
                        setCodeViewId('')
                    }}
                    codeRuleId={codeViewId}
                    open={!!codeViewId}
                    regularType={catalogViewType}
                />
            )}
        </div>
    )
}

export default SelectValueRange
