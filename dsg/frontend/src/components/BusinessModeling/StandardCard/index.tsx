import { Layout } from 'antd'
import { memo, useContext, useMemo, useRef, useState } from 'react'
import { TaskInfoContext } from '@/context'

import DataEleManage from './DataEleManage'
import { MoreOperate } from '@/components/Directory/const'
import DragBox from '@/components/DragBox'
import StandardDirTree from '@/components/StandardDirTree'
import {
    fileCatlgTreeToStdTreeData,
    findDirByKey,
    StdTreeDataOpt,
} from '@/components/StandardDirTree/const'
import {
    CatalogOption,
    CatalogType,
    formatError,
    getDirDataByTypeOrId,
    getFileDirByTypeOrId,
    IDirItem,
    IDirQueryType,
    TaskExecutableStatus,
    TaskStatus,
} from '@/core'
import { StdDirStyle } from '@/utils'
import styles from './styles.module.less'

function StandardCard({
    modelId,
    mainbusId,
}: {
    modelId: string
    mainbusId: string
}) {
    const { taskInfo } = useContext(TaskInfoContext)

    const [treeData, setTreeData] = useState<Array<IDirItem>>()

    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])

    const [selectedDir, setSelectedDir] = useState<IDirItem>(
        treeData && treeData[0]
            ? {
                  id: treeData[0].id,
                  catalog_name: treeData[0].catalog_name,
                  parent_id: treeData[0].parent_id,
              }
            : {
                  id: '',
                  catalog_name: '',
                  parent_id: '',
              },
    )

    // 目录项操作（目前支持操作:添加/重命名/移动至/导出/删除）
    const optMenuItems = [
        MoreOperate.ADD,
        MoreOperate.RENAME,
        MoreOperate.MOVETO,
        MoreOperate.EXPORT,
        MoreOperate.DELETE,
    ]

    const [loading, setLoading] = useState(false)

    const ref: any = useRef({})

    const curDirType = CatalogType.DATAELE

    /**
     * @param query query存在就根据query内容查询，query不存在默认根据类型查询
     * @param newSelectedDir 传了此参数则会在自定义目录中更新左侧选择该目录节点并展开
     */
    const getTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => {
        try {
            let res
            let data
            if (
                query?.type &&
                query?.catlgOption === CatalogOption.STDFILECATLG
            ) {
                // 标准文件目录及其文件是一次性获取
                let treeDataTemp: any = treeData
                // if (optType === StdTreeDataOpt.Init) {
                setLoading(true)
                res = await getFileDirByTypeOrId(query?.type, '')
                treeDataTemp = fileCatlgTreeToStdTreeData([res.data])
                // setSelectedDir(treeDataTemp?.[0])
                // }
                data = treeDataTemp || []
            } else {
                setLoading(true)
                // 一次性获取所有节点
                res = await getDirDataByTypeOrId(curDirType, undefined)
                data = res?.data ? res?.data : []
            }
            let newNode
            if (newSelectedDir) {
                newNode = findDirByKey(newSelectedDir?.id, data)
                ref.current?.addNewExpandedKeys(newNode?.parent_id)
            }
            setSelectedDir(newNode || data?.[0])
            setTreeData(data)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const canOpt = useMemo(() => {
        return !(
            taskInfo.status === TaskStatus.COMPLETED ||
            taskInfo.executable_status !== TaskExecutableStatus.EXECUTABLE
        )
    }, [taskInfo.status, taskInfo.executable_status])

    return (
        <div className={styles.standardCardWrapper}>
            <Layout className={styles.baseContentLayout}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[StdDirStyle.MINWIDTH, 500]}
                    maxSize={[StdDirStyle.MAXWIDTH, Infinity]}
                    showExpandBtn={false}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
                    rightNodeStyle={{ width: '0 !important', flex: 1 }}
                >
                    <StandardDirTree
                        ref={ref}
                        loading={loading}
                        dirType={curDirType}
                        treeData={treeData}
                        getTreeList={getTreeList}
                        selectedDir={selectedDir}
                        setSelectedDir={setSelectedDir}
                        optMenuItems={optMenuItems}
                        canOpt={canOpt}
                    />

                    <div className={styles.baseContent}>
                        <DataEleManage
                            selectedDir={selectedDir}
                            setSelectedDir={setSelectedDir}
                            getTreeList={getTreeList}
                            selCatlgClass={ref.current?.selCatlgClass}
                            canOpt={canOpt}
                        />
                    </div>
                </DragBox>
            </Layout>
        </div>
    )
}

export default memo(StandardCard)
