import { FC, useEffect, useState } from 'react'
import styles from './styles.module.less'
import GraphContent from '../GraphContent'
import {
    DataTableType,
    Direction,
    formatError,
    getDataConsanguinity,
} from '@/core'
import { changeDataToGraphData } from './helper'

interface ImpactAnalysisProps {
    id: string
}
const ImpactAnalysis: FC<ImpactAnalysisProps> = ({ id }) => {
    // 图谱数据
    const [graphData, setGraphData] = useState<Array<any>>([])

    // 主表id
    const [mainNodeId, setMainNodeId] = useState<string>('')

    // 所有数据
    const [allData, setAllData] = useState<Array<any>>([])

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
                direction: Direction.CHILDREN,
                step: 2,
            })
            // const resData = mockData
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
            const resData = await getDataConsanguinity({
                id: currentUUid,
                type: DataTableType.TABLE,
                direction: Direction.PARENTS,
                step: 2,
            })
            if (resData.entries.length > 0) {
                return changeDataToGraphData(
                    resData.entries.filter((item) => item.vid !== currentId),
                    // setSelectedFields,
                    // setSelectedTable,
                )
            }
            return []
        }
        return []
    }

    return (
        <div className={styles.main}>
            <GraphContent
                graphData={graphData}
                IngressId={mainNodeId}
                onLoadData={handleLoadData}
                expandDirection="child"
            />
        </div>
    )
}

export default ImpactAnalysis
