import { FC, useEffect, useState } from 'react'
import styles from './styles.module.less'
import GraphContent from '../GraphContent'
import { changeDataToGraphData } from './helper'
import {
    DataTableType,
    Direction,
    formatError,
    getDataConsanguinity,
} from '@/core'
import { NodeType } from '@/core/consanguinity'
import TableDetail from './TableDetail'

/**
 * 血缘图谱
 */
interface ConsanguinityGraphProps {
    id: string
}

/**
 * 血缘图谱
 * @param props
 * @returns
 */
const ConsanguinityGraph: FC<ConsanguinityGraphProps> = ({ id }) => {
    // 图谱数据
    const [graphData, setGraphData] = useState<Array<any>>([])

    // 主表id
    const [mainNodeId, setMainNodeId] = useState<string>('')

    // 所有数据
    const [allData, setAllData] = useState<Array<any>>([])

    // 选中的字段
    //  const [selectedField, setSelectedFields] = useState<any>(null)

    // 选中的表
    // const [selectedTable, setSelectedTable] = useState<any>(null)

    useEffect(() => {
        getGraphData()
    }, [id])

    /**
     * 获取图谱数据
     */
    const getGraphData = async () => {
        try {
            const resData = await getDataConsanguinity({
                id,
                type: DataTableType.TABLE,
                direction: Direction.PARENTS,
                step: 5,
            })
            setMainNodeId(
                resData.entries.find((item) => item.uuid === id)?.vid || '',
            )
            setAllData(resData.entries)
            const res = changeDataToGraphData(
                resData.entries,
                // setSelectedFields,
                // setSelectedTable,
            )
            setGraphData(res)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 加载数据
     * @param currentId 当前节点id
     * @returns
     */
    const handleLoadData = async (currentId: string) => {
        const currentUUid = allData.find((item) => item.vid === currentId).uuid
        if (currentUUid) {
            try {
                const resData = await getDataConsanguinity({
                    id: currentUUid,
                    type: DataTableType.TABLE,
                    direction: Direction.PARENTS,
                    step: 2,
                })
                if (resData.entries.length > 0) {
                    return changeDataToGraphData(
                        resData.entries.filter(
                            (item) => item.vid !== currentId,
                        ),
                        // setSelectedFields,
                        // setSelectedTable,
                    )
                }
                return []
            } catch (err) {
                formatError(err)
            }
        }
        return []
    }

    return (
        <div className={styles.main}>
            <GraphContent
                graphData={graphData}
                IngressId={mainNodeId}
                onLoadData={handleLoadData}
            />

            {/* {selectedTable &&
                selectedTable.node_type === NodeType.FORM_VIEW && (
                    <TableDetail
                        open={!!selectedTable}
                        onClose={() => setSelectedTable(null)}
                        tableId={selectedTable.uuid}
                        type={selectedTable.node_type}
                    />
                )} */}
        </div>
    )
}

export default ConsanguinityGraph
