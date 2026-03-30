import { FC, CSSProperties, useState, useEffect, useRef } from 'react'
import { Space, Spin, Tabs, Tooltip } from 'antd'
import Item from 'antd/lib/list/Item'
import InfiniteScroll from 'react-infinite-scroll-component'
import classnames from 'classnames'
import { noop } from 'lodash'
import { CloseOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import {
    AtomsExpressionTabsKey,
    DataTableTabs,
    EditContentElementType,
    ExpressionStatus,
    FormatTypeTXT,
    OperatingKey,
    OperationalSymbol,
    TabsKey,
    changeFormatToType,
} from './const'
import {
    AtomsExpressionTabs,
    OperatingFuncOptions,
    getFieldTypeIcon,
} from './helper'
import ExpressEditContent from './ExpressEditContent'
import __ from './locale'
import {
    formatError,
    getIndictorList,
    reqBusinObjField,
    getDimensionModelDetail,
    FormatDataTypeTXT,
} from '@/core'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    DivisionSignOutlined,
    LeftBracketOutlined,
    MinusSignOutlined,
    PlusSignOutlined,
    RightBracketOutlined,
    TimesSignOutlined,
} from '@/icons'
import { useCatalogColumn } from '../DimensionModel/helper'
import { dataTypeMapping } from '../DataConsanguinity/const'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 100,
    keyword: '',
}
interface OperationBtnGroupType {
    onClick: (value: OperationalSymbol) => void
}
const OperationBtnGroup: FC<OperationBtnGroupType> = ({ onClick }) => {
    return (
        <div>
            <Space size={16} className={styles.groupBtns}>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.ADD)
                    }}
                    className={styles.btn}
                    key="+"
                >
                    <PlusSignOutlined />
                </div>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.SUB)
                    }}
                    className={styles.btn}
                    key="-"
                >
                    <MinusSignOutlined />
                </div>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.MUL)
                    }}
                    className={styles.btn}
                    key="*"
                >
                    <TimesSignOutlined />
                </div>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.DIV)
                    }}
                    className={styles.btn}
                    key="/"
                >
                    <DivisionSignOutlined />
                </div>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.LBRACKET)
                    }}
                    className={styles.btn}
                    key="("
                >
                    <LeftBracketOutlined />
                </div>
                <div
                    onClick={() => {
                        onClick(OperationalSymbol.RBRACKET)
                    }}
                    className={styles.btn}
                    key=")"
                >
                    <RightBracketOutlined />
                </div>
            </Space>
        </div>
    )
}

interface ExpressionConfigType {
    modelId?: string
    onChange?: (value: Array<string>) => void
    value?: Array<string>
    type: TabsKey
    style?: CSSProperties
    errorStatus: ExpressionStatus
    onClearStatus?: () => void
    allIndictor?: Array<any>
}

const ExpressionConfig: FC<ExpressionConfigType> = ({
    value,
    onChange = noop,
    type,
    style = {},
    modelId = '',
    errorStatus,
    onClearStatus = noop,
    allIndictor,
}) => {
    const [activeTab, setActiveTab] = useState<
        AtomsExpressionTabsKey | TabsKey
    >(AtomsExpressionTabsKey.FUNC)
    const [tabsItems, setTabsItems] = useState<Array<any>>(AtomsExpressionTabs)
    const [fieldLoading, setFieldLoading] = useState<boolean>(true)

    const [factTableId, setFactTableId] = useState<string>('')

    const [factTableFields, setFactTableFields] = useState<Array<any>>([])

    const [factFieldsCount, setFactFieldsCount] = useState<number>(0)

    const [atomicSearchKey, setAtomicSearchKey] = useState<string>('')

    const [derivedSearchKey, setDerivedSearchKey] = useState<string>('')

    const [compositeSearchKey, setCompositeSearchKey] = useState<string>('')
    const [indictorLoading, setIndictorLoading] = useState<boolean>(true)

    const [keyword, setKeyword] = useState<string>('')

    const [showIndictorData, setShowIndictorData] = useState<Array<any>>([])
    const editContent = useRef<HTMLDivElement | null>(null)
    const { loading, getColumnsById } = useCatalogColumn()

    // editor Ref
    const editorRef: any = useRef()

    useEffect(() => {
        if (allIndictor && type === TabsKey.RECOMBINATION) {
            setIndictorLoading(false)
            if (
                [TabsKey.ATOMS, TabsKey.DERIVE, TabsKey.RECOMBINATION].includes(
                    activeTab as TabsKey,
                )
            ) {
                const currentIndictorData = allIndictor.filter(
                    (currentData) => currentData.indicator_type === activeTab,
                )
                setShowIndictorData(currentIndictorData)
            } else {
                const currentIndictorData = allIndictor.filter(
                    (currentData) =>
                        currentData.indicator_type === TabsKey.ATOMS,
                )
                setShowIndictorData(currentIndictorData)
            }
        }
    }, [allIndictor, type])

    // useEffect(() => {
    //     editContent?.current?.ATTRIBUTE_NODE
    // }, [])

    useEffect(() => {
        if (type === TabsKey.ATOMS) {
            setTabsItems(AtomsExpressionTabs)
        } else {
            setTabsItems(
                DataTableTabs.filter(
                    (currentTab) => currentTab.key !== TabsKey.ALL,
                ),
            )
            setActiveTab(TabsKey.ATOMS)
        }
    }, [type])

    useEffect(() => {
        if (modelId) {
            getModelDetail(modelId)
        }
    }, [modelId])

    useEffect(() => {
        if (factTableId) {
            getFactFieldsList(factTableId, [])
        }
    }, [keyword])

    useEffect(() => {
        if (factTableId) {
            getFactFieldsList(factTableId, [])
        }
    }, [keyword])

    useEffect(() => {
        if (activeTab === TabsKey.ATOMS) {
            getIndictorDataList(atomicSearchKey)
        } else if (activeTab === TabsKey.DERIVE) {
            getIndictorDataList(derivedSearchKey)
        } else if (activeTab === TabsKey.RECOMBINATION) {
            getIndictorDataList(compositeSearchKey)
        }
    }, [activeTab, atomicSearchKey, derivedSearchKey, compositeSearchKey])

    const getModelDetail = async (id: string) => {
        try {
            const modelDetail = await getDimensionModelDetail(id, {
                show_type: 2,
            })
            if (modelDetail?.dim_model_config?.fact_table_id) {
                setFactTableId(modelDetail?.dim_model_config?.fact_table_id)
                await getFactFieldsList(
                    modelDetail?.dim_model_config?.fact_table_id,
                    [],
                )
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setFieldLoading(false)
        }
    }

    const getFactFieldsList = async (tableId, initData) => {
        try {
            setFieldLoading(true)
            const res = await getColumnsById(tableId)
            setFactTableFields(res.data)
            setFactFieldsCount(res.data.length)
        } catch (ex) {
            setFactTableFields([])
            setFactFieldsCount(0)
            formatError(ex)
        } finally {
            setFieldLoading(false)
        }
    }

    const selectField = (currentData) => {
        if (dataTypeMapping.number.includes(currentData.data_type)) {
            editorRef.current?.onAddData(
                EditContentElementType.OperationalInput,
                `SUM({{${currentData.id}}})`,
            )
        } else {
            editorRef.current?.onAddData(
                EditContentElementType.OperationalInput,
                `COUNT({{${currentData.id}}})`,
            )
        }
    }

    const selectIndictor = (currentData) => {
        if (dataTypeMapping.number.includes(currentData.data_type)) {
            editorRef.current?.onAddData(
                EditContentElementType.BasicInput,
                `{{${currentData.id}}}`,
            )
        } else {
            editorRef.current?.onAddData(
                EditContentElementType.BasicInput,
                `{{${currentData.id}}}`,
            )
        }
    }

    const getIndictorDataList = (searchKeyword) => {
        const currentIndictorData =
            allIndictor?.filter(
                (currentData) =>
                    currentData.indicator_type === activeTab &&
                    currentData.name
                        .toLocaleLowerCase()
                        .includes(searchKeyword.toLocaleLowerCase()),
            ) || []
        setShowIndictorData(currentIndictorData)
    }
    /**
     *  获取左侧列表
     * @returns
     */
    const getListComponents = () => {
        switch (activeTab) {
            case AtomsExpressionTabsKey.FUNC:
                return (
                    <>
                        {OperatingFuncOptions.map((item, index) => (
                            <div
                                onClick={() => {
                                    editorRef.current?.onAddData(
                                        EditContentElementType.OperationalInput,
                                        item.value ===
                                            OperatingKey.COUNTDISTINCT
                                            ? 'COUNT(DISTINCT )'
                                            : `${item.value}()`,
                                    )
                                }}
                                className={styles.operationItem}
                                key={index}
                            >
                                {item.label}
                            </div>
                        ))}
                    </>
                )
            case AtomsExpressionTabsKey.FIELD:
                return (
                    <div
                        key={AtomsExpressionTabsKey.FIELD}
                        className={styles.fieldsListContainer}
                    >
                        <div
                            className={styles.searchInput}
                            style={{
                                visibility:
                                    !keyword && !factTableFields?.length
                                        ? 'hidden'
                                        : 'visible',
                            }}
                        >
                            <SearchInput
                                onKeyChange={(searchKey) => {
                                    setKeyword(searchKey)
                                }}
                                placeholder={__('搜索字段名称')}
                            />
                        </div>
                        {fieldLoading ? (
                            <div className={styles.loading}>
                                <Spin />
                            </div>
                        ) : (
                            <div
                                className={styles.modelList}
                                id="scrollableDiv"
                            >
                                <InfiniteScroll
                                    hasMore={false}
                                    endMessage={
                                        factTableFields.length === 0 ? (
                                            keyword ? (
                                                <div className={styles.empty}>
                                                    <Empty />
                                                </div>
                                            ) : (
                                                <div className={styles.empty}>
                                                    <Empty
                                                        iconSrc={dataEmpty}
                                                        desc={__('暂无数据')}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            ''
                                        )
                                    }
                                    loader=""
                                    next={() => {
                                        getFactFieldsList(
                                            factTableId,
                                            factTableFields,
                                        )
                                    }}
                                    dataLength={factTableFields.length}
                                    scrollableTarget="scrollableDiv"
                                >
                                    {factTableFields.map((currentField) => (
                                        <div
                                            className={styles.modelItem}
                                            onClick={() => {
                                                selectField(currentField)
                                            }}
                                        >
                                            <Tooltip
                                                title={FormatDataTypeTXT(
                                                    currentField.data_type,
                                                )}
                                                overlayInnerStyle={{
                                                    color: 'rgba(0,0,0,0.85)',
                                                }}
                                                color="#fff"
                                                placement="left"
                                            >
                                                <div className={styles.icon}>
                                                    {getFieldTypeIcon(
                                                        currentField?.original_data_type ||
                                                            currentField.data_type,
                                                    )}
                                                </div>
                                            </Tooltip>
                                            <div
                                                className={styles.name}
                                                title={
                                                    currentField.business_name
                                                }
                                            >
                                                {currentField.business_name}
                                            </div>
                                        </div>
                                    ))}
                                </InfiniteScroll>
                            </div>
                        )}
                    </div>
                )
            case TabsKey.ATOMS:
                return indictorLoading ? (
                    <div className={styles.indictorItemLoading}>
                        <Spin />
                    </div>
                ) : (
                    <div
                        key={AtomsExpressionTabsKey.FIELD}
                        className={styles.fieldsListContainer}
                    >
                        <div
                            className={styles.searchInput}
                            hidden={
                                !!(!showIndictorData.length && !atomicSearchKey)
                            }
                        >
                            <SearchInput
                                onKeyChange={(searchKey) => {
                                    setAtomicSearchKey(searchKey)
                                }}
                                placeholder={__('搜索原子指标名称')}
                            />
                        </div>
                        <div className={styles.modelList}>
                            {showIndictorData.length ? (
                                showIndictorData.map((currentData) => (
                                    <div
                                        className={styles.modelItem}
                                        onClick={() => {
                                            selectIndictor(currentData)
                                        }}
                                    >
                                        <div
                                            className={styles.name}
                                            title={currentData.name}
                                        >
                                            {currentData.name}
                                        </div>
                                    </div>
                                ))
                            ) : atomicSearchKey ? (
                                <Empty />
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            )}
                        </div>
                    </div>
                )
            case TabsKey.DERIVE:
                return indictorLoading ? (
                    <div className={styles.indictorItemLoading}>
                        <Spin />
                    </div>
                ) : (
                    <div
                        key={AtomsExpressionTabsKey.FIELD}
                        className={styles.fieldsListContainer}
                    >
                        <div
                            className={styles.searchInput}
                            hidden={
                                !!(
                                    !showIndictorData.length &&
                                    !derivedSearchKey
                                )
                            }
                        >
                            <SearchInput
                                onKeyChange={(searchKey) => {
                                    setDerivedSearchKey(searchKey)
                                }}
                                placeholder={__('搜索衍生指标名称')}
                            />
                        </div>
                        <div className={styles.modelList}>
                            {showIndictorData.length ? (
                                showIndictorData.map((currentData) => (
                                    <div
                                        className={styles.modelItem}
                                        onClick={() => {
                                            selectIndictor(currentData)
                                        }}
                                    >
                                        <div
                                            className={styles.name}
                                            title={currentData.name}
                                        >
                                            {currentData.name}
                                        </div>
                                    </div>
                                ))
                            ) : derivedSearchKey ? (
                                <Empty />
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            )}
                        </div>
                    </div>
                )
            case TabsKey.RECOMBINATION:
                return indictorLoading ? (
                    <div className={styles.indictorItemLoading}>
                        <Spin />
                    </div>
                ) : (
                    <div
                        key={AtomsExpressionTabsKey.FIELD}
                        className={styles.fieldsListContainer}
                    >
                        <div
                            className={styles.searchInput}
                            hidden={
                                !!(
                                    !showIndictorData.length &&
                                    !compositeSearchKey
                                )
                            }
                        >
                            <SearchInput
                                onKeyChange={(searchKey) => {
                                    setCompositeSearchKey(searchKey)
                                }}
                                placeholder={__('搜索复合指标名称')}
                            />
                        </div>
                        <div className={styles.modelList}>
                            {showIndictorData.length ? (
                                showIndictorData.map((currentData) => (
                                    <div
                                        className={styles.modelItem}
                                        onClick={() => {
                                            selectIndictor(currentData)
                                        }}
                                    >
                                        <div
                                            className={styles.name}
                                            title={currentData.name}
                                        >
                                            {currentData.name}
                                        </div>
                                    </div>
                                ))
                            ) : compositeSearchKey ? (
                                <Empty />
                            ) : (
                                <Empty
                                    iconSrc={dataEmpty}
                                    desc={__('暂无数据')}
                                />
                            )}
                        </div>
                    </div>
                )
            default:
                return <div key="default" />
        }
    }

    const getErrorMessage = () => {
        if (errorStatus === ExpressionStatus.Empty) {
            return (
                <div className={styles.errorMessage}>
                    <div>
                        <ExclamationCircleFilled className={styles.icon} />
                        <span className={styles.text}>
                            {__('表达式不能为空!')}
                        </span>
                    </div>
                    <div
                        className={styles.close}
                        onClick={() => {
                            onClearStatus()
                        }}
                    >
                        <CloseOutlined />
                    </div>
                </div>
            )
        }
        if (errorStatus === ExpressionStatus.Error) {
            return (
                <div className={styles.errorMessage}>
                    <div>
                        <ExclamationCircleFilled className={styles.icon} />
                        <span className={styles.text}>
                            {__('表达式不合法，请检查!')}
                        </span>
                    </div>
                    <div
                        className={styles.close}
                        onClick={() => {
                            onClearStatus()
                        }}
                    >
                        <CloseOutlined />
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div style={style} className={styles.expressionConfig}>
            <div className={styles.selectedList}>
                <Tabs
                    items={tabsItems}
                    defaultActiveKey={
                        type === TabsKey.ATOMS
                            ? AtomsExpressionTabsKey.FUNC
                            : TabsKey.ATOMS
                    }
                    onChange={(activeKey) => {
                        setActiveTab(
                            activeKey as TabsKey | AtomsExpressionTabsKey,
                        )
                        setAtomicSearchKey('')
                        setDerivedSearchKey('')
                        setCompositeSearchKey('')
                    }}
                    centered
                    activeKey={activeTab}
                />
                <div>{getListComponents()}</div>
            </div>
            <div className={styles.expressionContent}>
                <OperationBtnGroup
                    onClick={(currentValue) => {
                        editorRef.current?.onAddData(
                            EditContentElementType.OperationSymbol,
                            currentValue,
                        )
                    }}
                />
                <div
                    className={styles.expressionEditArea}
                    onClick={(e) => {
                        editorRef.current?.onFcous()
                        e.preventDefault()
                        e.stopPropagation()
                    }}
                >
                    {getErrorMessage()}
                    <div className={styles.textMessage}>
                        {type === TabsKey.ATOMS
                            ? __(
                                  '您可点击左侧聚合函数、字段名称，将其引用至表达式中',
                              )
                            : __(
                                  '您可点击左侧原子指标、衍生指标及复合指标，将其引用至表达式中',
                              )}
                    </div>
                    <ExpressEditContent
                        value={value || ['']}
                        onChange={(contentValue) => {
                            onChange(contentValue)
                        }}
                        ref={editorRef}
                        tabType={type}
                        tableId={factTableId}
                        indictorList={allIndictor}
                    />
                </div>
            </div>
        </div>
    )
}
export default ExpressionConfig
