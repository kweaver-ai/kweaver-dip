import {
    Dispatch,
    Key,
    SetStateAction,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { Button, Tooltip, Form, message, Radio } from 'antd'
import { useAsyncEffect, useSetState } from 'ahooks'
import {
    LayoutOutlined,
    HistoryOutlined,
    CaretRightOutlined,
} from '@ant-design/icons'
import { InfotipOutlined } from '@/icons'
import { Architecture } from '@/components/BusinessArchitecture/const'
import styles from './styles.module.less'
import DragBox from '../DragBox'
import {
    formatError,
    getSingleCatalogDetail,
    getDatasheetViewDetails,
    getHistoryImportDetail,
    policyValidate,
} from '@/core'
import __ from './locale'
import QueryTable from './QueryTable'
import SavedModal from './SavedModal'
import BreadcrumbNav from './BreadcrumbNav'
import { useRouter, useQueryParams, HOMEPATH } from './RouterStack'
import QueryConfig, { Filter } from './QueryConfig'
import CatalogDirTree, { QueryType, DataNode } from './CatalogDirTree'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const SingleDirectoryQuery = () => {
    const ref = useRef<{
        setCurrentNode: (node: DataNode | undefined) => void
        setTreeExpandedKeys: Dispatch<SetStateAction<Key[]>>
    }>()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [hideConfig, setHideConfig] = useState(false)
    const [querySource, setQuerySource] = useState(QueryType.DEPART)
    const [details, setDetails] = useState<any>(null)
    const [fields, setFields] = useState<any[]>([])
    // 回显选中字段
    const [selectedFields, setSelectedFields] = useState<string[]>([])
    // 操作选中字段
    const [operationFields, setOperationFields] = useState<any[]>([])
    const [orderedFields, setOrderedFields] = useState<any[]>([])
    const tableRef = useRef<{ getData: (params: any) => void }>(null)
    const typeRef = useRef(QueryType.DEPART)
    const savedRef = useRef<{
        setTrue: (params: any) => void
        setFalse: () => void
    }>(null)
    const { push, currentPath } = useRouter()
    const queryParams = useQueryParams()
    const importId = queryParams.get('q')
    const editId = queryParams.get('id')
    const historyId = queryParams.get('condition')
    const configRef = useRef<{
        activeKey: Filter
        onConfigChange: () => any
        onConfigReset: () => void
        selectedFields: any[]
    }>(null)
    const [templateInfo, setTemplateInfo] = useSetState({
        name: '',
        description: '',
    })
    const [configRes, setConfigRes] = useSetState({
        fields: [] as any[],
        filters: {},
        allFields: [] as string[],
    })
    const [selectedNode, setSelectedNode] = useState<DataNode>()
    const tableFieldsRef = useRef([])
    const [form] = Form.useForm()
    const [userId] = useCurrentUser('ID')
    // 判断库表是否有查看权限
    const [hasPerm, setHasPerm] = useState(true)
    // 判断是否是回显状态
    const isEdit = useRef(false)
    // 只在回显状态下首次获取详情
    const isFirst = useRef(true)

    const getSelectedNode = (sn?: DataNode) => {
        // 手动选择节点
        isEdit.current = false
        if (sn) {
            setSelectedNode({ ...sn })
        } else {
            setSelectedNode(undefined)
        }
    }

    // 过滤掉没有权限的字段
    const getHasPermFields = (originFields) => {
        const hasPermissionFields = originFields.filter((f) => f.is_readable)
        setFields(hasPermissionFields)
        tableFieldsRef.current = hasPermissionFields

        return hasPermissionFields
    }

    const getDataCatalogInfo = async (id: string) => {
        try {
            const res = await getDatasheetViewDetails(id)

            if (res.fields && res.fields.length) {
                return getHasPermFields(res.fields)
            }

            return []
        } catch (error) {
            formatError(error)
            return []
        }
    }

    const validateViewPerm = async (id: string) => {
        try {
            const res = await policyValidate([
                {
                    action: 'read',
                    object_id: id,
                    object_type: 'data_view',
                    subject_id: userId,
                    subject_type: 'user',
                } as any,
            ])

            return res[0].effect === 'allow'
        } catch (error) {
            formatError(error)
            return false
        }
    }

    const getQueryConfig = async (
        id: string,
        department_path_id: string,
        search_type: 'submit' | 'auto' = 'submit',
    ) => {
        if (configRef.current) {
            const configValue = await configRef.current.onConfigChange()

            if (!configValue) return null

            return {
                data_catalog_id: id,
                fields: configValue.fields
                    .filter((val) => val.isChecked)
                    .map((item) => item.id),
                fields_details: JSON.stringify(configValue.fields),
                configs: configValue.filters,
                type: typeRef.current,
                department_path_id,
                search_type,
                // configs参数未JSON.stringify之前的对象
                dataValues: configValue.dataValues,
            }
        }

        return null
    }

    const validateQueryParams = async (
        searchType?: Parameters<typeof getQueryConfig>[2],
    ) => {
        if (!selectedNode || selectedNode.type !== Architecture.DATACATALOG)
            return null
        const { id, department_path_id } = selectedNode
        const params = await getQueryConfig(id, department_path_id, searchType)

        if (!params) return null

        return params
    }

    const getQueryResult = async (
        searchType?: Parameters<typeof getQueryConfig>[2],
    ) => {
        const params = await validateQueryParams(searchType)

        if (!params) return

        if (tableRef.current) {
            const { dataValues, ...restParams } = params
            setConfigRes({
                fields: restParams.fields ?? [],
                filters: dataValues ?? {},
                allFields: fields,
            })
            tableRef.current.getData(restParams)
        }
    }

    const onReset = () => {
        if (configRef.current) {
            configRef.current.onConfigReset()
        }
    }

    const onSave = async () => {
        const params = await validateQueryParams()
        if (!params) return
        const { rule_expression = {} } = JSON.parse(params.configs || '{}')
        const isEmptyFilter = (rule_expression.where || []).every(
            (item) => item.member.length === 0,
        )

        if (!params?.fields.length && isEmptyFilter) {
            message.warn(__('请配置查询条件后保存'))
            return
        }
        if (savedRef.current) {
            const { dataValues, ...restParams } = params
            savedRef.current.setTrue(restParams)
        }
    }

    const clearAll = () => {
        // 回到单目录查询，清空选中节点
        setSelectedNode(undefined)
        setFields([])
        setDetails(null)
        setSelectedFields([])
        setQuerySource(QueryType.DEPART)
        setTemplateInfo({ name: '', description: '' })
        setConfigRes({ fields: [], filters: {}, allFields: [] })
        if (ref.current) {
            ref.current.setTreeExpandedKeys([])
            ref.current.setCurrentNode(undefined)
        }
    }

    const fetchDetail = async (
        id: string,
        detailType: 'edit' | 'import' | 'history',
    ) => {
        try {
            isEdit.current = true
            const res =
                detailType === 'history'
                    ? await getHistoryImportDetail(id)
                    : await getSingleCatalogDetail(id)
            const {
                configs,
                fields: initFields,
                fields_details,
                data_catalog_name,
                resource_id,
                data_catalog_id,
                name,
                type,
                description,
                department_path_id,
            } = res

            setQuerySource(type)
            // 获取详情返回的所有带有字段顺序字段，区分初始化的时候获取的默认顺序字段
            setOrderedFields(JSON.parse(fields_details || '[]'))
            typeRef.current = type
            const parseConfig = JSON.parse(configs || '{}')
            const { rule_expression } = parseConfig ?? {}
            setSelectedFields(initFields)
            setDetails(rule_expression)

            if (detailType === 'edit') {
                setTemplateInfo({ name, description })
            }

            const currentNode = {
                type: Architecture.DATACATALOG,
                name: data_catalog_name,
                id: data_catalog_id,
                resource_id,
                department_path_id,
                path: '',
            }
            if (ref.current) {
                ref.current.setTreeExpandedKeys((prevKeys: Key[]) => {
                    const newKeys = [...prevKeys]
                    newKeys.push(currentNode.id)
                    return newKeys
                })
                ref.current.setCurrentNode(currentNode)
                setSelectedNode(currentNode)
            }
        } catch (err) {
            formatError(err)
        }
    }

    useEffect(() => {
        // 切换数据目录，清空配置项
        // 回显状态下设置选中节点，不清空节点
        if (selectedNode && !isEdit.current) {
            setSelectedFields([])
            setDetails(null)
            onReset()
        }
    }, [selectedNode])

    useAsyncEffect(async () => {
        if (editId && isFirst.current) {
            await fetchDetail(editId, 'edit')
        } else if (importId && isFirst.current) {
            await fetchDetail(importId, 'import')
        } else if (historyId && isFirst.current) {
            await fetchDetail(historyId, 'history')
        } else {
            clearAll()
        }
    }, [editId, importId, historyId])

    useAsyncEffect(async () => {
        if (selectedNode) {
            const f = await getDataCatalogInfo(selectedNode.resource_id!)

            const hasPermission = await validateViewPerm(
                selectedNode.resource_id!,
            )
            setHasPerm(hasPermission)

            const isDetail =
                isFirst.current &&
                (editId || importId || historyId) &&
                tableRef.current &&
                selectedFields.length
            if (isDetail) {
                isFirst.current = false
                setConfigRes({
                    fields: selectedFields as any[],
                    filters: details,
                    allFields: f,
                })
                const { id, department_path_id } = selectedNode
                tableRef.current.getData({
                    data_catalog_id: id,
                    fields: selectedFields,
                    // fields_details: orderedFields,
                    configs: details
                        ? JSON.stringify({
                              rule_expression: details,
                          })
                        : '',
                    type: typeRef.current,
                    department_path_id,
                    search_type: 'auto',
                })
            }
        }
    }, [selectedFields, details, selectedNode, editId, importId, historyId])

    const fieldConfig = useMemo(
        () => ({
            initData: selectedFields,
            form,
            config: { fields: orderedFields },
        }),
        [selectedFields, form, orderedFields],
    )
    const dataConfig = { initData: details }

    const tableConfig = useMemo(
        () => ({
            fields: configRes.fields,
            filters: configRes.filters,
        }),
        [configRes.fields, configRes.filters],
    )

    const showEmpty =
        selectedNode === undefined ||
        selectedNode.type !== Architecture.DATACATALOG ||
        (selectedNode && !hasPerm)

    const isCannotQuery = operationFields.length === 0

    const initParams = useMemo(() => ({ type: querySource }), [querySource])

    return (
        <div className={styles.singleDrectoryQuery}>
            <div className={styles.pageTitle}>
                <BreadcrumbNav />
            </div>
            <DragBox
                defaultSize={defaultSize}
                splitClass={styles.mainContent}
                gutterSize={0}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                rightNodeStyle={{ padding: '0 0 0 20px' }}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <div className={styles.queryTypeWrapper}>
                        <Radio.Group
                            onChange={(e) => {
                                const { value } = e?.target || {}
                                setQuerySource(value)
                                setSelectedNode(undefined)
                                typeRef.current = value
                                if (ref.current) {
                                    ref.current.setCurrentNode(undefined)
                                }
                            }}
                            className={styles.fitWidth}
                            value={querySource}
                        >
                            <Radio.Button value={QueryType.DEPART}>
                                {__('本部门')}
                            </Radio.Button>
                            <Radio.Button value={QueryType.AUTH}>
                                {__('已授权')}
                            </Radio.Button>
                        </Radio.Group>
                    </div>
                    <div className={styles.leftTreeWrapper}>
                        <CatalogDirTree
                            ref={ref}
                            getSelectedNode={getSelectedNode}
                            isShowAll={false}
                            initParams={initParams}
                        />
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.contentLeft}>
                        <div className={styles.top}>
                            <div className={styles.title}>
                                {__('查询结果')}
                                <span className={styles.titleInfo}>
                                    <InfotipOutlined />
                                    <span>
                                        {__(
                                            '全量数据：受权限管控，只展示有权限部分的数据',
                                        )}
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className={styles.bottom}>
                            <QueryTable
                                ref={tableRef}
                                hasPerm={hasPerm}
                                config={tableConfig}
                                fields={configRes.allFields}
                            />
                        </div>
                    </div>
                    <div className={styles.contentRight}>
                        {!hideConfig && (
                            <div className={styles.configContent}>
                                <div className={styles.contentRightTop}>
                                    <span className={styles.topTitle}>
                                        {__('查询条件')}
                                    </span>
                                    {currentPath === HOMEPATH && (
                                        <span className={styles.topAction}>
                                            <Tooltip title={__('模板管理')}>
                                                <LayoutOutlined
                                                    onClick={() => {
                                                        push('templateManage')
                                                    }}
                                                />
                                            </Tooltip>
                                            <Tooltip title={__('历史记录')}>
                                                <HistoryOutlined
                                                    onClick={() => {
                                                        push('historyRecord')
                                                    }}
                                                />
                                            </Tooltip>
                                        </span>
                                    )}
                                </div>
                                <div className={styles.contentRightBottom}>
                                    <QueryConfig
                                        ref={configRef}
                                        fields={fields}
                                        resourceId={selectedNode?.resource_id}
                                        fieldConfig={fieldConfig}
                                        dataConfig={dataConfig}
                                        showEmpty={showEmpty}
                                        onFieldChange={(values) => {
                                            setOperationFields(values)
                                        }}
                                    />
                                </div>
                                {!showEmpty && (
                                    <div className={styles.bottomAction}>
                                        <Button
                                            className={styles.btn}
                                            onClick={onReset}
                                        >
                                            {__('重置')}
                                        </Button>
                                        <Button
                                            className={styles.btn}
                                            onClick={onSave}
                                        >
                                            {__('保存模板')}
                                        </Button>
                                        <Tooltip
                                            title={
                                                isCannotQuery
                                                    ? __('请先配置字段过滤')
                                                    : null
                                            }
                                            placement="top"
                                        >
                                            <Button
                                                type="primary"
                                                className={styles.btn}
                                                disabled={isCannotQuery}
                                                onClick={() => getQueryResult()}
                                            >
                                                {__('查询')}
                                            </Button>
                                        </Tooltip>
                                    </div>
                                )}
                            </div>
                        )}
                        <div
                            className={styles.expandOpen}
                            style={{ left: hideConfig ? '-12px' : '-6px' }}
                            onClick={() => {
                                setHideConfig((prevState) => !prevState)
                            }}
                        >
                            <CaretRightOutlined />
                        </div>
                    </div>
                </div>
            </DragBox>
            <SavedModal
                ref={savedRef}
                editId={editId}
                defaultValue={templateInfo}
            />
        </div>
    )
}

export default SingleDirectoryQuery
