import { FC, useEffect, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Space } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import { Loader, SearchInput } from '@/ui'
import { RefreshBtn } from '../ToolbarComponents'
import { formatError, getDatasheetView, OnlineStatus } from '@/core'
import DataViewItem from './DataViewItem'

const limit = 20

interface DataViewListProps {
    selectedNode: any
    selectedDataViews: Array<any>
    onChange: (info: any, isSelected: boolean) => void
    mid: string
}
const DataViewList: FC<DataViewListProps> = ({
    selectedNode,
    selectedDataViews,
    onChange,
    mid,
}) => {
    const [keyword, setKeyword] = useState<string>('')

    const [dataSources, setDataSources] = useState<Array<any>>([])

    const [totalCount, setTotalCount] = useState<number>(0)

    const scrollRef = useRef(null)

    const scrollListId = 'scrollableDiv'

    useEffect(() => {
        getDatasourceData([])
    }, [selectedNode, keyword])

    const handleReload = () => {
        getDatasourceData([])
    }

    const getDatasourceSearchParams = (id?: string) => {
        // 后端datasource_id和datasource_type二选一，有id则不使用type
        const datasource_type =
            !selectedNode?.id || selectedNode?.id !== selectedNode.type || id
                ? undefined
                : selectedNode.type
        const datasource_id =
            datasource_type || !selectedNode?.id
                ? undefined
                : selectedNode.dataSourceId || id || selectedNode?.id
        const excel_file_name =
            selectedNode?.dataType === 'file' ? selectedNode?.title : undefined

        return {
            datasource_type,
            datasource_id,
            excel_file_name,
        }
    }

    const getDatasourceData = async (lastData: Array<any>) => {
        try {
            const res = await getDatasheetView({
                offset: Math.ceil(lastData.length / 20) + 1,
                limit,
                direction: 'desc',
                sort: 'updated_at',
                keyword,
                business_model_id: mid,
                publish_status: 'publish',
                ...getDatasourceSearchParams(),
            })

            setTotalCount(res.total_count)

            if (lastData.length === 0) {
                setDataSources(res.entries)
            } else {
                setDataSources([...dataSources, ...res.entries])
            }
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.dataViewWrapper}>
            <div className={styles.searchBar}>
                <Space size={4}>
                    <SearchInput
                        onKeyChange={(value) => setKeyword(value)}
                        style={{
                            width: 256,
                        }}
                        placeholder={__('搜索库表名称')}
                    />
                    <RefreshBtn onClick={handleReload} />
                </Space>
            </div>
            <div
                ref={scrollRef}
                id={scrollListId}
                className={styles.scrollWrapper}
            >
                <InfiniteScroll
                    hasMore={dataSources.length < totalCount}
                    loader={
                        <div
                            className={styles.listLoading}
                            // hidden={!listDataLoading}
                        >
                            <Loader />
                        </div>
                    }
                    next={() => {
                        getDatasourceData(dataSources)
                    }}
                    dataLength={dataSources.length}
                    scrollableTarget={scrollListId}
                >
                    {dataSources?.map((item) => {
                        const checkedStatus = !!selectedDataViews.find(
                            (it) => it.id === item.id,
                        )
                        return (
                            <DataViewItem
                                showCheck
                                onSelect={(info, isSelected) => {
                                    if (!item.data_origin_form_id) {
                                        onChange(info, isSelected)
                                    }
                                }}
                                checked={
                                    !!selectedDataViews.find(
                                        (it) => it.id === item.id,
                                    )
                                }
                                nodeInfo={item}
                                checkDisabled={!!item.data_origin_form_id}
                            />
                        )
                    })}
                </InfiniteScroll>
            </div>
        </div>
    )
}

export default DataViewList
