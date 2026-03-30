import React, { useEffect, useState } from 'react'
import { noop } from 'lodash'
import classnames from 'classnames'
import { DatabaseOutlined } from '@/icons'
import styles from './styles.module.less'
import { formatError, getDataSourceList, IDataSourceInfo } from '@/core'
import { editDataSourceOptions } from '../DataSource/helper'
import __ from './locale'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { databaseTypesEleData } from '@/core/dataSource'

interface IDataSourceParams {
    keyword?: string
    limit?: number
    offset?: number
    info_system_id: string
}

const initSearchCondition: IDataSourceParams = {
    limit: 2000,
    offset: 1,
    keyword: '',
    info_system_id: '',
}

interface ITreeNode {
    id: string
    name: string
    children?: IDataSourceInfo[]
    isExpand?: boolean
}
interface IDataSource {
    getSelectedSourceId: (id: string) => void
    pMbid: string
    getSelectedSourceType: (type) => void
    noDataCallBack?: () => void
}
const DataSource: React.FC<IDataSource> = ({
    getSelectedSourceId,
    pMbid,
    getSelectedSourceType,
    noDataCallBack = noop,
}) => {
    const [data, setData] = useState<IDataSourceInfo[]>([])

    const [selectedSourceId, setSelectedSourceId] = useState('')

    const [searchCondition, setSearchCondition] =
        useState<IDataSourceParams>(initSearchCondition)

    useEffect(() => {
        getDatasoucesList(searchCondition)
    }, [searchCondition])

    useEffect(() => {
        getSelectedSourceId(selectedSourceId)
    }, [selectedSourceId])

    // 获取数据源列表
    const getDatasoucesList = async (params: any) => {
        try {
            // setLoading(true)
            const res = await getDataSourceList(params)
            // const res: any = {}
            if (!params?.keyword && !res.entries?.length) {
                // 数据源库无数据
                noDataCallBack()
            }
            const newResData =
                res?.entries.filter((item) => item.type !== 'excel') || []
            setSelectedSourceId(newResData[0]?.id)
            getSelectedSourceType(newResData[0]?.type)
            setData(newResData)
        } catch (error) {
            formatError(error)
        } finally {
            // setLoading(false)
        }
    }

    return (
        <div className={styles.dataSource}>
            <SearchInput
                placeholder={__('搜索数据源名称、数据库名称')}
                className={styles.searchInput}
                value={searchCondition.keyword}
                onKeyChange={(kw: string) => {
                    setSearchCondition({
                        ...searchCondition,
                        keyword: kw,
                    })
                }}
            />
            <div className={styles.dbListWrapper}>
                {data?.length ? (
                    data.map((dataSource: any) => {
                        // 来源
                        const dbOrigin =
                            editDataSourceOptions.find(
                                (oItem) =>
                                    oItem.value === dataSource.source_type,
                            )?.label || '--'
                        const dbName = dataSource.database_name || '--'
                        const { Outlined } =
                            databaseTypesEleData?.dataBaseIcons?.[
                                dataSource.type
                            ] || {}
                        const ICons = Outlined ? (
                            <Outlined
                                style={{
                                    fontSize: 30,
                                }}
                            />
                        ) : null
                        return (
                            <div
                                key={dataSource.id}
                                className={classnames({
                                    [styles.dbInfoWrapper]: true,
                                    [styles.selectedItem]:
                                        selectedSourceId === dataSource.id,
                                })}
                                onClick={() => {
                                    setSelectedSourceId(dataSource.id)
                                    getSelectedSourceType(dataSource.type)
                                }}
                            >
                                <div className={styles.dbInfoLeft}>
                                    <div className={styles.dbInfoIcon}>
                                        {ICons}
                                    </div>
                                    <div className={styles.dbNameWrapper}>
                                        <div
                                            className={styles.dbName}
                                            title={dataSource.name}
                                        >
                                            {dataSource.name}
                                        </div>
                                        <div
                                            className={styles.dbNameEn}
                                            title={__('数据库：') + dbName}
                                        >
                                            <DatabaseOutlined
                                                className={styles.countIcon}
                                            />

                                            <span
                                                className={
                                                    styles.dbNameEnContent
                                                }
                                            >
                                                {dbName}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.dbOrigin}>
                                    <div>
                                        {__('类型')}：{dbOrigin}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <Empty style={{ marginTop: 64 }} />
                )}
            </div>
        </div>
    )
}

export default DataSource
