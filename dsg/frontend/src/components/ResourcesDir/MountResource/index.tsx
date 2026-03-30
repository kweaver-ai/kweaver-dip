import {
    useState,
    useEffect,
    useMemo,
    forwardRef,
    useImperativeHandle,
    useRef,
} from 'react'
import { Table, Select } from 'antd'
import { isNumber, trim, isEqual, uniqBy } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { LabelTitle } from '../BaseInfo'
import {
    ResourceType,
    typeOptoins,
    FormatDataType,
    ShareTypeEnum,
    OpenTypeEnum,
} from '../const'
import SchedulePlan from './SchedulePlan'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import {
    detailFrontendServiceOverview,
    formatError,
    getDatasheetViewDetails,
    getFileResourceList,
    getDataGradeLabel,
    DataGradeLabelType,
} from '@/core'
import { useQuery } from '@/utils'
import { Empty, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import FileTable from './FileTable'
import { FormatDataTypeToText } from '@/components/DatasheetView/DataQuality/helper'
import {
    getLabelSensitiveFlag,
    flattenChildrenEnhanced,
    validateScheduling,
} from '../helper'
import { useResourcesCatlogContext } from '../ResourcesCatlogProvider'
import {
    DsType,
    formatSelectedNodeToTableParams,
} from '@/components/DatasheetView/const'
import LogicalViewList from '../ChooseMountResources/LogicalViewList'
import MultiTypeSelectTree from '@/components/MultiTypeSelectTree'
import { DataSourceOrigin } from '@/components/DataSource/helper'
import { TreeType } from '@/components/MultiTypeSelectTree/const'

interface IMountResource {
    defaultForm?: any
    baseInfoForm?: any
    initCheckedItems?: any[]
    editInitCheckedItems?: any[]
    onChange: (value: any) => void
    onSelectMapInfo?: (value: any[]) => void
    getselectedFormName?: (value: string) => void
}

const MountResource = forwardRef((props: IMountResource, ref) => {
    const {
        defaultForm,
        baseInfoForm,
        onChange,
        onSelectMapInfo,
        initCheckedItems,
        editInitCheckedItems,
        getselectedFormName,
    } = props
    const query = useQuery()
    const isEmptyCatalogEdit = query.get('isEmptyCatalogEdit') || ''
    const type = query.get('type') || ''
    const apiResourceRef = useRef<any>(null)
    const {
        emptyCatalogFields,
        mountResourceData,
        setMountResourceData,
        setMapFieldsData,
        setLabelList,
        labelList,
        setEmptyCatalogFields,
        isFileRescType,
        setIsFileRescType,
        columnData,
        dataViewFields,
        setDataViewFields,
    } = useResourcesCatlogContext()
    const [{ using, governmentSwitch }] = useGeneralConfig()
    const [tableData, setTableData] = useState<any[]>([])
    const [fieldsTableData, setFieldsTableData] = useState<any[]>([])
    const [filesDataSource, setFilesDataSource] = useState<any[]>([])
    const [isDataViewResource, setIsDataViewResource] = useState<boolean>()
    const [selectedNode, setSelectedNode] = useState<any>()
    const [dataType, setDataType] = useState<DsType>()
    const [checkedItem, setCheckedItem] = useState<any>([])
    const [validateSchedulingMsg, setValidateSchedulingMsg] =
        useState<string>('')

    useEffect(() => {
        getLableList()
    }, [])

    useEffect(() => {
        const isFile =
            mountResourceData?.length &&
            mountResourceData?.every(
                (o) => o.resource_type === ResourceType.File,
            )
        setIsFileRescType(isFile)
        setIsDataViewResource(
            !!mountResourceData?.find(
                (o) => o.resource_type === ResourceType.DataView,
            )?.resource_type,
        )
    }, [mountResourceData])

    const isEmptyCatalog = useMemo(() => {
        return isEmptyCatalogEdit === 'true'
    }, [isEmptyCatalogEdit])

    const showMountFields = useMemo(() => {
        return isDataViewResource && isEmptyCatalog && tableData?.length
    }, [isDataViewResource, isEmptyCatalog, tableData])

    const sourceOptions = useMemo(() => {
        const list = columnData?.map((field) => {
            const disabledOp =
                fieldsTableData
                    .map((o) => o.technical_name)
                    .includes(field.technical_name) ||
                fieldsTableData
                    .map((o) => o.business_name)
                    .includes(field.business_name) ||
                fieldsTableData
                    ?.filter((o) => o.source_id || o.source_field_id)
                    .map((o) => o.source_id || o.source_field_id)
                    .includes(field.id)
            const opValue = field?.id?.length < 36 ? field?.id : field.source_id
            const info = {
                ...field,
                label: `${field.business_name}（${field.technical_name}）`,
                value: opValue,
                disabled: disabledOp,
            }
            return info
        })
        return list
    }, [columnData, fieldsTableData])

    useEffect(() => {
        if (emptyCatalogFields?.length && isEmptyCatalog) {
            setMapFieldsData(emptyCatalogFields)
        }
    }, [emptyCatalogFields, isEmptyCatalog])

    // 切换上一步，下一步时，将已选择的值赋值给fieldsTableData
    useEffect(() => {
        if (
            dataViewFields?.length &&
            !isEqual(dataViewFields, fieldsTableData)
        ) {
            setFieldsTableData(dataViewFields)
        }
    }, [dataViewFields])

    const [fileKeyword, setFileKeyword] = useState<string>('')
    const fileTableRef = useRef<any>()

    const governmentStatus = useMemo(() => {
        return governmentSwitch.on
    }, [governmentSwitch])

    const condition = useMemo(() => {
        return formatSelectedNodeToTableParams(selectedNode)
    }, [selectedNode])

    useEffect(() => {
        if (initCheckedItems) {
            setCheckedItem(initCheckedItems)
        }
    }, [initCheckedItems])

    useImperativeHandle(ref, () => ({
        getFormAndValidate,
    }))

    const getFormAndValidate = (value?: any) => {
        const { flag, msg } = validateScheduling(value || defaultForm)
        setValidateSchedulingMsg(msg)
        return flag
    }

    const fieldsColumns: any = [
        {
            title: __('字段中文名称'),
            dataIndex: 'business_name',
            key: 'business_name',
            ellipsis: true,
        },
        {
            title: __('字段英文名称'),
            dataIndex: 'technical_name',
            key: 'technical_name',
            ellipsis: true,
        },
        {
            title: __('映射信息项'),
            dataIndex: 'source_id',
            key: 'source_id',
            ellipsis: true,
            width: 200,
            render: (text, record) => {
                const disabled = fieldsTableData
                    ?.filter((o) => !o.changeSource && o.source_id)
                    ?.map((o) => o.source_id)
                    ?.includes(text)
                return (
                    <Select
                        style={{ width: '100%' }}
                        value={text}
                        disabled={disabled}
                        options={sourceOptions}
                        allowClear
                        placeholder={__('请选择')}
                        onChange={(value) => handleSelectMapInfo(value, record)}
                    />
                )
            },
        },
        {
            title: __('关联数据标准'),
            dataIndex: 'standard',
            key: 'standard',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('关联码表'),
            dataIndex: 'code_table',
            key: 'code_table',
            ellipsis: true,
            render: (text) => text || '--',
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            width: 200,
            render: (text, record) => {
                const data_length = record?.data_length
                    ? `${__('长度')}：${record?.data_length}`
                    : ''
                const ranges = record?.data_range
                    ? `${__('值域')}：${record?.data_range}`
                    : ''
                const info =
                    data_length || ranges
                        ? `（${data_length}${
                              data_length && ranges ? '；' : ''
                          }${ranges}）`
                        : ''
                const val = FormatDataTypeToText(
                    isNumber(text)
                        ? typeOptoins.find((item) => item.value === text)
                              ?.strValue
                        : text,
                )
                const title = `${val}${info}`
                return <span title={title}>{title || '--'}</span>
            },
        },
    ]

    useEffect(() => {
        setTableData(mountResourceData)
        if (isFileRescType) {
            getFileList()
        }
    }, [mountResourceData, isFileRescType])

    const getFileList = async () => {
        const fileIds = mountResourceData
            ?.filter((item) => item.resource_type === ResourceType.File)
            .map((item) => item.resource_id)
        if (!fileIds?.length) return
        const allEntries: any[] = []
        try {
            const promises = fileIds.map((o) => getFileResourceList(o, {}))
            const results = await Promise.all(promises)

            results.forEach((res) => {
                allEntries.push(...res.entries)
            })
            setFilesDataSource(allEntries)
        } catch (e) {
            formatError(e)
        }
    }

    const handleChooseView = (data: any[]) => {
        if (data.length === 0) {
            setTableData([])
            setFieldsTableData([])
            setMountResourceData([])
            setDataViewFields([])
            if (!isEmptyCatalog && type === 'create') {
                setEmptyCatalogFields([])
            }
            return
        }
        const list = data.filter(
            (item) =>
                !tableData.some((t) => t.resource_id === item.resource_id),
        )
        setMountResourceData(data)
        let resouce
        if (list?.find((item) => item.resource_type === 1)) {
            resouce = list?.find((item) => item.resource_type === 1)
        }
        if (!resouce) return
        searchMountFields(resouce)
    }

    const getLableList = async () => {
        try {
            const res = await getDataGradeLabel({})
            setLabelList(
                flattenChildrenEnhanced(res?.entries)
                    ?.filter((o) => o.node_type === DataGradeLabelType.Node)
                    ?.reverse(),
            )
        } catch (e) {
            formatError(e)
        }
    }

    const searchMountFields = async (resouce: any) => {
        try {
            let list: any = []
            if (resouce.resource_type === ResourceType.DataView) {
                const res = await getDatasheetViewDetails(resouce.resource_id)
                list = res.fields
            } else if (resouce.resource_type === ResourceType.Api) {
                const res = await detailFrontendServiceOverview(
                    resouce.resource_id,
                )
                const request_body =
                    res?.service_param?.data_table_request_params
                list = request_body
            }

            const fields = list?.map((item, index, arry) => {
                const mapfield = columnData?.find(
                    (o) =>
                        o.technical_name === item.technical_name ||
                        o.business_name === item.business_name,
                )
                const data_type = item.data_type || mapfield?.data_type
                const sensitiveFlag: any = getLabelSensitiveFlag(
                    labelList,
                    item,
                )
                const info = {
                    ...item,
                    source_id: isEmptyCatalog
                        ? mapfield?.id || undefined
                        : item.id,
                    data_type:
                        data_type &&
                        (FormatDataType(data_type) ||
                            FormatDataType(data_type) === 0)
                            ? FormatDataType(data_type)
                            : undefined,
                    ...sensitiveFlag,
                    data_length:
                        type === 'create'
                            ? mapfield?.reset_data_length ||
                              mapfield?.data_length ||
                              item?.data_length
                            : item?.data_length,
                    // 添加默认值
                    shared_type:
                        sensitiveFlag?.shared_type || ShareTypeEnum.UNCONDITION, // 无条件共享
                    open_type: OpenTypeEnum.OPEN, // 无条件开放
                    sensitive_flag: sensitiveFlag?.sensitive_flag || 0, // 不敏感
                    classified_flag: sensitiveFlag?.classified_flag || 0, // 非涉密
                }
                if (info.shared_type === ShareTypeEnum.NOSHARE) {
                    info.open_type = OpenTypeEnum.NOOPEN
                }
                return info
            })
            if (!isEmptyCatalog && type === 'create') {
                setEmptyCatalogFields(list)
            }
            setDataViewFields(fields)
            setFieldsTableData(fields)
        } catch (e) {
            formatError(e)
        }
    }

    const handleSelectMapInfo = (value: string, record: any) => {
        const list = fieldsTableData.map((item) => {
            const info = {
                ...item,
                source_id: record.id === item.id ? value : item?.source_id,
                source_field_id:
                    record.id === item.id ? item?.id : item?.source_field_id,
                changeSource: record.id === item.id ? true : item.changeSource,
            }
            return info
        })
        setFieldsTableData(list)
        setDataViewFields(list)
    }

    return (
        <div className={styles.mountResourcesWrapper}>
            <div className={styles['choose-lv']}>
                <div className={styles['choose-lv-left']}>
                    <MultiTypeSelectTree
                        enabledTreeTypes={[
                            TreeType.Department,
                            TreeType.InformationSystem,
                            TreeType.DataSource,
                        ]}
                        onSelectedNode={(sn) => {
                            setSelectedNode(sn)
                        }}
                        treePropsConfig={{
                            [TreeType.DataSource]: {
                                showExcelFile: false,
                                filterDataSourceTypes: [
                                    DataSourceOrigin.DATASANDBOX,
                                    DataSourceOrigin.INFOSYS,
                                ],
                            },
                        }}
                    />
                </div>
                <div className={styles['choose-lv-right']}>
                    <LogicalViewList
                        dataType={dataType}
                        condition={condition}
                        checkItems={checkedItem}
                        setCheckItems={(val: any[]) => {
                            handleChooseView(val)
                            setCheckedItem(val)
                            getselectedFormName?.(
                                val?.find((item) => item.resource_type === 1)
                                    ?.name,
                            )
                        }}
                        initCheckedItems={editInitCheckedItems}
                    />
                    {showMountFields ? (
                        <>
                            <LabelTitle label={__('挂接资源的字段信息')} />
                            <Table
                                columns={fieldsColumns}
                                dataSource={fieldsTableData}
                                rowKey="resource_id"
                                bordered={false}
                                pagination={false}
                                style={{ marginBottom: 20 }}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            iconSrc={dataEmpty}
                                            desc={__('暂无数据')}
                                        />
                                    ),
                                }}
                            />
                        </>
                    ) : null}
                    {isFileRescType ? (
                        <>
                            <LabelTitle
                                label={__('附件清单')}
                                rightNode={
                                    !!fileTableRef?.current?.allTotalCount && (
                                        <SearchInput
                                            placeholder={__('搜索文件名称')}
                                            style={{ width: 246 }}
                                            value={fileKeyword}
                                            onKeyChange={(val: string) => {
                                                fileTableRef?.current?.handleKeywordChange?.(
                                                    trim(val),
                                                )
                                            }}
                                        />
                                    )
                                }
                            />
                            {filesDataSource?.length ? (
                                <FileTable dataSource={filesDataSource} />
                            ) : null}
                        </>
                    ) : null}
                    {governmentStatus &&
                        !isFileRescType &&
                        mountResourceData?.length > 0 && (
                            <>
                                <SchedulePlan
                                    value={defaultForm}
                                    onFormChange={(val) => {
                                        onChange(val)
                                        getFormAndValidate(val)
                                    }}
                                />
                                <div
                                    style={{ color: 'red', marginTop: '-20px' }}
                                >
                                    {validateSchedulingMsg}
                                </div>
                            </>
                        )}
                </div>
            </div>
        </div>
    )
})
export default MountResource
