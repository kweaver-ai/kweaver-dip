import { useEffect, useRef, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { useSearchParams } from 'react-router-dom'
import SceneGraph from './SceneGraph'
import { ModeType, ModuleType } from './const'
import styles from './styles.module.less'
import FieldsTable from '../DatasheetView/FieldsTable'
import { ClassifyType, IconType } from '../DatasheetView/const'
import {
    GradeLabelStatusEnum,
    IGradeLabel,
    formatError,
    getDataGradeLabel,
    getDataGradeLabelStatus,
    LogicViewType,
} from '@/core'
import { getTagsData } from '../DataClassificationTag/const'
import { useQuery } from '@/utils'
import IconInstructions from '../DatasheetView/IconInstructions'
import DataViewDetail from '../DatasheetView/DataViewDetail'
import __ from './locale'
import { useDataViewContext } from '../DatasheetView/DataViewProvider'

const DataSheetViewContainer = () => {
    const {
        baseInfoData,
        setBaseInfoData,
        setOptionType,
        datasheetInfo,
        setDatasheetInfo,
        setLogicViewType,
    } = useDataViewContext()
    const [mode, setMode] = useState<ModeType>(ModeType.Model)
    const [data, setData] = useState<any[]>([])
    const ref = useRef<any>()
    const [isStart, setIsStart] = useState(false)
    const [dataSource, setDataSource] = useState<IGradeLabel[]>([])
    const [viewInfo, setViewInfo] = useState({ name: '', technical_name: '' })
    const [searchParams, setSearchParams] = useSearchParams()
    const query = useQuery()
    const module = query.get('module') || ''
    const operate = query.get('operate') || ''
    // 更多里选中字段信息
    const offset = Number(query.get('offset') || 0)
    const selectFieldId = query.get('selectFieldId') || ''
    const [openDataViewDetail, setOpenDataViewDetail] = useState<boolean>(false)

    useEffect(() => {
        if (operate) {
            setOptionType(operate)
        }
    }, [operate])
    // 获取分级标签是否开启
    const getTagStatus = async () => {
        try {
            const res = await getDataGradeLabelStatus()
            setIsStart(res === GradeLabelStatusEnum.Open)
            if (res === GradeLabelStatusEnum.Open) {
                getTags()
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 查询标签
    const getTags = async () => {
        try {
            const res = await getDataGradeLabel({ keyword: '' })
            const tagArr = []
            getTagsData(res.entries, tagArr)
            setDataSource(tagArr)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (mode === ModeType.More) {
            const tableData = ref.current?.getData()
            const sceneData = ref.current?.sceneData
            setViewInfo(sceneData)
            setData(
                tableData.map((td) => {
                    const res = data.find((item) => item.id === td.id)
                    if (res) {
                        return {
                            ...td,
                            // 分类分级信息同步
                            attribute_id: res.attribute_id,
                            attribute_name: res.attribute_name,
                            attribute_path: res.attribute_path,
                            label_id: res.label_id,
                            label_name: res.label_name,
                            label_icon: res.label_icon,
                            label_path: res.label_path,
                            classfity_type: ClassifyType.Manual,
                            // 编码信息同步
                            code_table: res.code_table,
                            code_table_id: res.code_table_id,
                            // 标准信息同步
                            standard: res.standard,
                            standard_code: res.standard_code,
                        }
                    }
                    return td
                }),
            )
        }
    }, [mode])

    useUpdateEffect(() => {
        if (mode === ModeType.Model && offset) {
            query.delete('offset')
            query.delete('selectFieldId')
            setSearchParams(query)
        }
    }, [mode])

    useEffect(() => {
        getTagStatus()
        setLogicViewType(module)
    }, [])
    return (
        <div className={styles.dataViewWrapper}>
            <SceneGraph
                mode={mode}
                setMode={setMode}
                ref={ref}
                moreData={data}
            />
            <div hidden={mode !== ModeType.More}>
                <div className={styles.moreInfoContainer}>
                    <div className={styles.tableContainer}>
                        <FieldsTable
                            fieldList={data}
                            setFieldList={setData}
                            datasheetInfo={datasheetInfo}
                            setDatasheetInfo={setDatasheetInfo}
                            isStart={isStart}
                            tagData={dataSource}
                            isCustomOrLogic
                            moreOffset={offset}
                            selectFieldId={selectFieldId}
                        />
                    </div>
                    {baseInfoData?.id && (
                        <div
                            className={styles.dataViewDetailsBtn}
                            onClick={() => setOpenDataViewDetail(true)}
                        >
                            <div className={styles.text}>
                                {__('展开库表信息')}
                            </div>
                            <span className={styles.icon}>{'<<'}</span>
                        </div>
                    )}
                    {openDataViewDetail && (
                        <DataViewDetail
                            onClose={() => setOpenDataViewDetail(false)}
                            logic={module as LogicViewType}
                            open={openDataViewDetail}
                            optionType="edit"
                            isDataView
                            style={{
                                height: '100%',
                                marginTop: 0,
                            }}
                        />
                    )}
                </div>
                {isStart && (
                    <div className={styles.instructions}>
                        <IconInstructions />
                    </div>
                )}
            </div>
        </div>
    )
}

export default DataSheetViewContainer
