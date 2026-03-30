import { Button, ConfigProvider, Divider, Layout, message } from 'antd'
import { useState, useEffect, useRef } from 'react'
import DataEleManage from '@/components/DataEleManage'
import DragBox from '@/components/DragBox'
import {
    CatalogOption,
    CatalogType,
    getDirDataByTypeOrId,
    getFileDirByTypeOrId,
    IDirItem,
    IDirQueryType,
    formatError,
} from '@/core'
import { MoreOperate } from '@/components/Directory/const'
import StandardDirTree from '@/components/StandardDirTree'
import { StdDirStyle } from '@/utils'
import styles from './styles.module.less'
import {
    fileCatlgTreeToStdTreeData,
    findDirByKey,
    StdTreeDataOpt,
    updateTreeData,
} from '@/components/StandardDirTree/const'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function DataElement({ props }: any) {
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
            if (ref.current?.selCatlgClass === CatalogOption.DEPARTMENT) {
                return
            }
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

    return (
        <div className={styles.stdBaseWrapper}>
            <Layout className={styles.baseContentLayout}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[StdDirStyle.MINWIDTH, 500]}
                    maxSize={[StdDirStyle.MAXWIDTH, Infinity]}
                    onDragEnd={(size) => {
                        setDefaultSize(size)
                    }}
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
                    />

                    <div className={styles.baseContent}>
                        <DataEleManage
                            selectedDir={selectedDir}
                            setSelectedDir={setSelectedDir}
                            getTreeList={getTreeList}
                            selCatlgClass={ref.current?.selCatlgClass}
                        />
                    </div>
                </DragBox>
            </Layout>
        </div>
    )
}

export default DataElement
