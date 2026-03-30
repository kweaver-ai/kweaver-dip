import React, { useRef, useState, useEffect } from 'react'
import styles from './styles.module.less'
import __ from './locale'
import RuleDetails from './RuleDetails'
import {
    IDirItem,
    IDirQueryType,
    getDirDataByTypeOrId,
    CatalogType,
    formatError,
    CatalogOption,
    getFileDirByTypeOrId,
    StdFileCatlgType,
} from '@/core'
import { MoreOperate } from '@/components/Directory/const'
import DragBox from '@/components/DragBox'
import { StdDirStyle } from '@/utils'
import StandardDirTree from '../StandardDirTree'
import {
    StdTreeDataOpt,
    fileCatlgTreeToStdTreeData,
    findDirByKey,
} from '../StandardDirTree/const'

// 目录项操作（目前支持操作:重命名/移动至/导出/删除）
const optMenuItems = [
    MoreOperate.ADD,
    MoreOperate.RENAME,
    MoreOperate.MOVETO,
    MoreOperate.DELETE,
]

function CodeRulesComponent() {
    const [treeData, setTreeData] = useState<Array<IDirItem>>()
    const [loading, setLoading] = useState<boolean>(true)
    // 首次进入页面默认宽度
    const [needDefaultWidth, setNeedDefaultWidth] = useState(true)

    const [defaultSize, setDefaultSize] = useState<Array<number>>([15, 85])

    const [selectedDir, setSelectedDir] = useState<IDirItem | undefined>(
        treeData && treeData[0]
            ? {
                  id: treeData[0].id,
                  catalog_name: treeData[0].catalog_name,
                  parent_id: treeData[0].parent_id,
                  stdFileCatlgType: StdFileCatlgType.CATALOG,
              }
            : {
                  id: '',
                  catalog_name: '',
                  parent_id: '',
                  stdFileCatlgType: StdFileCatlgType.CATALOG,
              },
    )
    const ref: any = useRef({})

    useEffect(() => {
        async function getData() {
            await getTreeList()
        }
        getData()
    }, [])

    const curDirType = CatalogType.CODINGRULES

    /**
     * @param query query存在就根据query内容查询，query不存在默认根据类型查询
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
                let treeDataTemp: any = []
                // if (optType === StdTreeDataOpt.Init) {
                setLoading(true)
                res = await getFileDirByTypeOrId(query?.type, '')
                treeDataTemp = fileCatlgTreeToStdTreeData([res.data])
                // }
                data = treeDataTemp || []
            } else {
                setLoading(true)
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
        <div className={styles.codeRulesComponentWrapper}>
            <div className={styles.contentWrapper}>
                <DragBox
                    defaultSize={defaultSize}
                    minSize={[StdDirStyle.MINWIDTH, 500]}
                    maxSize={[StdDirStyle.MAXWIDTH, Infinity]}
                    onDragEnd={(size) => {
                        setNeedDefaultWidth(false)
                        setDefaultSize(size)
                    }}
                >
                    <StandardDirTree
                        ref={ref}
                        loading={loading}
                        treeData={treeData}
                        getTreeList={getTreeList}
                        selectedDir={selectedDir}
                        setSelectedDir={setSelectedDir}
                        optMenuItems={optMenuItems}
                        dirType={CatalogType.CODINGRULES}
                    />
                    <div className={styles.ruleDetails}>
                        <RuleDetails
                            selectedDir={selectedDir}
                            getTreeList={getTreeList}
                            setSelectedDir={setSelectedDir}
                            selCatlgClass={ref.current?.selCatlgClass}
                        />
                    </div>
                </DragBox>
            </div>
        </div>
    )
}

export default CodeRulesComponent
