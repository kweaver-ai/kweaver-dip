import classnames from 'classnames'
import { memo, useEffect, useRef, useState } from 'react'
import moment from 'moment'
import {
    formatError,
    getDataViewDatasouces,
    LogicViewType,
    LoginPlatform,
} from '@/core'
import { getPlatformNumber } from '@/utils'
import styles from './styles.module.less'
import DragBox from '@/components/DragBox'
import DatasourceTree, {
    ShowType,
} from '@/components/DatasheetView/DatasourceTree'
import { Loader, Empty } from '@/ui'
import { DataColoredBaseIcon } from '@/core/dataSource'
import Icons from '@/components/DatasheetView/Icons'
import {
    allNodeInfo,
    datasourceTitleData,
    DatasourceTreeNode,
    DsType,
    IconType,
    IDatasourceInfo,
    RescCatlgType,
} from '@/components/DatasheetView/const'

import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import ReportTable from './ReportTable'
import { DataSourceOrigin } from '@/components/DataSource/helper'

function QualityReport() {
    const platform = getPlatformNumber()

    const reportTableRef: any = useRef()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])

    const [isEmpty, setIsEmpty] = useState<boolean>(false)

    const [selectedNode, setSelectedNode] = useState<DatasourceTreeNode>({
        name: '全部',
        title: '全部',
        id: '',
    })

    const [dataType, setDataType] = useState<DsType>(DsType.all)
    const [datasourceInfo, setDatasourceInfo] = useState<IDatasourceInfo>(
        datasourceTitleData[dataType],
    )

    const [datasourceData, setDatasourceData] = useState<any[]>([])
    const [tableList, setTableList] = useState<any>()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        setDatasourceInfo(datasourceTitleData[dataType])
    }, [dataType])

    useEffect(() => {
        getDatasourceData()
    }, [])

    // 获取选中的节点
    const getSelectedNode = (sn?: DatasourceTreeNode, type?: RescCatlgType) => {
        const snType =
            sn?.id === ''
                ? DsType.all
                : sn?.id === sn?.type
                ? DsType.datasourceType
                : DsType.datasource
        setDataType(snType)

        setSelectedNode(sn || allNodeInfo)
    }

    const showEmpty = () => {
        return (
            <div
                className={styles.indexEmptyBox}
                style={{ paddingTop: '20vh', width: ' 100%' }}
            >
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            </div>
        )
    }

    const getDatasourceData = async () => {
        try {
            const res = await getDataViewDatasouces({
                limit: 1000,
                direction: 'desc',
                sort: 'updated_at',
                // source_type: DataSourceOrigin.DATAWAREHOUSE,
                // datasource_source_type: DataSourceOrigin.DATAWAREHOUSE,
            })
            const list = res?.entries || []
            setDatasourceData(list)
            if (list.length === 0) {
                setIsEmpty(true)
            }
        } catch (err) {
            formatError(err)
        } finally {
            setIsLoading(false)
        }
    }
    return (
        <div className={styles['quality-report']}>
            <div className={styles['quality-report-wrapper']}>
                {isLoading ? (
                    <div className={styles['empty-box']}>
                        <Loader />
                    </div>
                ) : isEmpty ? (
                    showEmpty()
                ) : (
                    <DragBox
                        defaultSize={defaultSize}
                        minSize={[220, 270]}
                        maxSize={[800, Infinity]}
                        onDragEnd={(size) => {
                            setDefaultSize(size)
                        }}
                    >
                        <div className={styles.left}>
                            <div className={styles.leftTreeBox}>
                                <DatasourceTree
                                    getSelectedNode={getSelectedNode}
                                    datasourceData={datasourceData}
                                    showType={ShowType.List}
                                />
                            </div>
                        </div>
                        <div className={classnames(styles.right)}>
                            <div className={styles.rightTop}>
                                <div
                                    className={classnames(
                                        styles.rightTopleft,
                                        tableList?.last_scan_time &&
                                            styles.scanWid,
                                    )}
                                >
                                    {selectedNode.type ? (
                                        <DataColoredBaseIcon
                                            type={selectedNode.type}
                                            iconType="Colored"
                                            className={styles.rightTopIcon}
                                        />
                                    ) : (
                                        <Icons
                                            type={IconType.DATASHEET}
                                            className={styles.rightTopIcon}
                                        />
                                    )}

                                    <div className={styles.rightTopDescBox}>
                                        <div className={styles.rightTopDesc}>
                                            <span title={selectedNode.title}>
                                                {selectedNode?.title}
                                            </span>
                                            {dataType !== DsType.datasource && (
                                                <span
                                                    className={styles.titleText}
                                                >
                                                    {datasourceInfo.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <ReportTable
                                datasourceData={datasourceData}
                                // dataType={dataType}
                                getTableEmptyFlag={(flag) => {
                                    setIsEmpty(
                                        flag && datasourceData?.length === 0,
                                    )
                                    setIsLoading(false)
                                }}
                                selectedDatasources={selectedNode}
                                getTableList={setTableList}
                                ref={reportTableRef}
                            />
                        </div>
                    </DragBox>
                )}
            </div>
        </div>
    )
}

export default memo(QualityReport)
