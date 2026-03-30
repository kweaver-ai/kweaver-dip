import {
    FC,
    useState,
    useEffect,
    useRef,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { useSize } from 'ahooks'
import { Tooltip } from 'antd'
import SelectDataForm from './SelectDataForm'
import styles from '../styles.module.less'
import __ from '../locale'
import DraggableList from '@/ui/DraggableList'
import { XScroll, HeaderItem } from '../helper'
import { TabViewType } from '../const'
import EditorModal from './EditorModal'
import DataFormTable from './DataFormTable'
import { RecycleBinOutlined } from '@/icons'
import { TaskExecutableStatus } from '@/core'

interface ProcessLogicType {
    ref?: any
    taskid: string
    modelFormInfo: any
    details?: {
        target: any
        table_list: Array<any>
        insert_sql: string
    }
    lastStatus: any
    onDataChange: () => void
    taskStatus: TaskExecutableStatus
}
const ProcessLogic: FC<ProcessLogicType> = forwardRef((props: any, ref) => {
    const {
        taskid,
        modelFormInfo,
        details,
        lastStatus,
        onDataChange,
        taskStatus,
    } = props
    const [expand, setExpand] = useState<boolean>(true)
    const [dataForms, setDataForms] = useState<Array<any>>([])
    const [sqlScript, setSqlScript] = useState<string>('')
    const listRef = useRef<HTMLDivElement>(null)
    const listSize = useSize(listRef)
    const [resultData, setResultData] = useState<any>(null)
    const [tableList, setTableList] = useState<Array<any>>([])
    // 编辑器ref
    const editorRef: any = useRef()
    const [tabItems, setTabItems] = useState<any>([
        {
            key: 'code',
            info: {},
            selected: true,
            type: TabViewType.CODE,
            name: __('编辑器'),
            errorStatus: false,
        },
    ])

    useEffect(() => {
        if (details) {
            if (modelFormInfo) {
                setDataForms([modelFormInfo, ...details.table_list])
            } else {
                setDataForms(details.table_list)
            }
            setTableList(details?.table_list || [])
            if (modelFormInfo?.table_name && !details.insert_sql) {
                setSqlScript(
                    `INSERT INTO  ${modelFormInfo.catalog_name}.${modelFormInfo.schema}.${modelFormInfo.table_name}`,
                )
            } else {
                setSqlScript(details.insert_sql)
            }
        }
    }, [modelFormInfo, details])

    useEffect(() => {
        if (lastStatus) {
            setTabItems(lastStatus?.tabItems || tabItems)
            setResultData(lastStatus.resultData)
        }
    }, [lastStatus])
    useImperativeHandle(ref, () => ({
        getData: () => {
            const data = {
                insert_sql: sqlScript,
                table_list: tableList.map((currentForm) => currentForm),
            }
            return data
        },
        getCurrentPageData: () => {
            return {
                tabItems,
                resultData:
                    tabItems.find((currentItem) => currentItem.selected).key ===
                    'code'
                        ? editorRef.current.getResultData()
                        : resultData,
            }
        },
    }))
    return (
        <div className={styles.processLogicContent}>
            <SelectDataForm
                expand={expand}
                onChangeExpand={(value) => {
                    setExpand(value)
                }}
                taskStatus={taskStatus}
                defaultData={tableList}
                onChangeDataForm={(data) => {
                    setTableList(data)
                    if (modelFormInfo) {
                        setDataForms([modelFormInfo, ...data])
                    } else {
                        setDataForms(data)
                    }
                    onDataChange()
                }}
                onClickOpen={(currentForm) => {
                    const findedForm = tabItems.find(
                        (currentData) =>
                            currentData.name === currentForm.table_name,
                    )
                    if (findedForm) {
                        setTabItems(
                            tabItems.map((currentData) =>
                                currentData.name === currentForm.table_name
                                    ? {
                                          ...currentData,
                                          selected: true,
                                      }
                                    : {
                                          ...currentData,
                                          selected: false,
                                      },
                            ),
                        )
                    } else {
                        setTabItems([
                            ...tabItems.map((currentData) => {
                                if (
                                    currentData.selected &&
                                    currentData.key === 'code'
                                ) {
                                    const currentResultData =
                                        editorRef.current.getResultData() ||
                                        null
                                    setResultData(currentResultData)
                                }
                                return {
                                    ...currentData,
                                    selected: false,
                                }
                            }),
                            {
                                ...currentForm,
                                selected: true,
                                key: currentForm.table_name,
                                type: TabViewType.FORM,
                                name: currentForm.table_name,
                            },
                        ])
                    }
                }}
                onUseTable={(tableInfo) => {
                    setSqlScript(`${sqlScript} ${tableInfo}`)
                }}
                isShowUseTable={
                    !!tabItems.find(
                        (currentTab) =>
                            currentTab.key === 'code' &&
                            currentTab.selected === true,
                    )
                }
            />
            <div
                ref={listRef}
                style={{
                    height: '100%',
                    width: `calc(100% - ${expand ? 220 : 40}px)`,
                    background: '#fff',
                }}
            >
                <div className={styles.ToolBarTitWrap}>
                    <XScroll
                        contentWi={(listSize?.width || 1280) - 100}
                        contentHi={32}
                    >
                        <DraggableList
                            style={{
                                paddingLeft: 8,
                                overflow: 'hidden',
                            }}
                            items={tabItems.map((item, i) => {
                                let showLine = true
                                if (item.selected) {
                                    showLine = false
                                } else if (i === tabItems.length - 1) {
                                    showLine = false
                                } else {
                                    showLine = !tabItems[i + 1].selected
                                }
                                return {
                                    label: (
                                        <HeaderItem
                                            item={item}
                                            selected={item.selected}
                                            showLine={showLine}
                                            onClick={() => {
                                                setTabItems(
                                                    tabItems.map((info) => {
                                                        if (
                                                            info.selected &&
                                                            info.key === 'code'
                                                        ) {
                                                            const currentResultData =
                                                                editorRef.current.getResultData() ||
                                                                null
                                                            setResultData(
                                                                currentResultData,
                                                            )
                                                        }
                                                        if (
                                                            info.key ===
                                                            item.key
                                                        ) {
                                                            return {
                                                                ...info,
                                                                selected: true,
                                                            }
                                                        }
                                                        return {
                                                            ...info,
                                                            selected: false,
                                                        }
                                                    }),
                                                )
                                            }}
                                            errorStatus={
                                                item?.errorStatus || false
                                            }
                                            onClose={() => {
                                                const res = tabItems.filter(
                                                    (info) =>
                                                        info.name !== item.name,
                                                )
                                                if (item.selected) {
                                                    setTabItems(
                                                        res.map((info, idx) => {
                                                            if (idx === 0) {
                                                                return {
                                                                    ...info,
                                                                    selected:
                                                                        true,
                                                                }
                                                            }
                                                            return {
                                                                ...info,
                                                                selected: false,
                                                            }
                                                        }),
                                                    )
                                                } else {
                                                    setTabItems(res)
                                                }
                                            }}
                                        />
                                    ),
                                    key: item.key,
                                }
                            })}
                            onDragEnd={(arr) => {
                                setTabItems([
                                    ...arr.map((info) =>
                                        tabItems.find(
                                            (a) => a.key === info.key,
                                        ),
                                    ),
                                ])
                            }}
                            fixedKey={['code']}
                        />
                    </XScroll>
                    <div className={styles.bottomBtnWrap}>
                        <Tooltip placement="left" title={__('清空全部预览')}>
                            <div
                                className={
                                    tabItems.length > 1
                                        ? styles.expandIcon
                                        : styles.expandDisabled
                                }
                                onClick={() => {
                                    setTabItems(
                                        tabItems
                                            .filter(
                                                (currentItem) =>
                                                    currentItem.type ===
                                                    TabViewType.CODE,
                                            )
                                            .map((currentItem) => ({
                                                ...currentItem,
                                                selected: true,
                                            })),
                                    )
                                }}
                            >
                                <RecycleBinOutlined />
                            </div>
                        </Tooltip>
                    </div>
                </div>

                <div className={styles.editorContent}>
                    {tabItems.find((info) => info.selected)?.type ===
                    TabViewType.CODE ? (
                        <EditorModal
                            dataForms={dataForms}
                            ref={editorRef}
                            onChangeSql={(value) => {
                                setSqlScript(value)
                                onDataChange()
                            }}
                            taskStatus={taskStatus}
                            insertSql={sqlScript}
                            originResultData={resultData}
                            setTabsErrorStatus={(errorStatus) => {
                                setTabItems(
                                    tabItems.map((currentItem) =>
                                        currentItem.type === TabViewType.CODE
                                            ? {
                                                  ...currentItem,
                                                  errorStatus,
                                              }
                                            : currentItem,
                                    ),
                                )
                            }}
                        />
                    ) : (
                        <DataFormTable
                            dataFormInfo={tabItems.find(
                                (info) => info.selected,
                            )}
                        />
                    )}
                </div>
            </div>
        </div>
    )
})

export default ProcessLogic
