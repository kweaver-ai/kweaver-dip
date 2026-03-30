import { ConfigProvider, Layout, message } from 'antd'
import { useState, useRef } from 'react'
import {
    CatalogType,
    formatError,
    getDirDataByTypeOrId,
    IDirItem,
    IDirQueryType,
} from '@/core'
import { MoreOperate } from '@/components/Directory/const'
import { OperateType, StdDirStyle } from '@/utils'
import DictManage from '@/components/CodeTableManage'
import DragBox from '@/components/DragBox'
import StandardDirTree from '@/components/StandardDirTree'
import File from '@/components/File'
import styles from './styles.module.less'
import {
    findDirByKey,
    oprTreeData,
    StdTreeDataOpt,
} from '@/components/StandardDirTree/const'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function StandardFile({ props }: any) {
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

    // 目录项操作（目前支持操作:重命名/移动至/删除）
    const optMenuItems = [
        MoreOperate.ADD,
        MoreOperate.RENAME,
        MoreOperate.MOVETO,
        MoreOperate.DELETE,
    ]

    const [loading, setLoading] = useState(false)

    const ref: any = useRef({})

    const curDirType = CatalogType.FILE

    const getTreeList = async (
        query?: IDirQueryType,
        optType?: StdTreeDataOpt,
        newSelectedDir?: any,
    ) => {
        try {
            const res = await getDirDataByTypeOrId(curDirType, undefined)
            const data = res.data ? res.data : []
            const parentId = data.length > 0 ? data[0].id.toString() : ''
            let newNode
            if (newSelectedDir) {
                newNode = findDirByKey(newSelectedDir?.id, data)
                ref.current?.addNewExpandedKeys(newNode?.parent_id)
            }
            // setSelectedDir(newNode || data?.[0])
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
                        setSelectedDir={(node) => {
                            setSelectedDir(node)
                        }}
                        optMenuItems={optMenuItems}
                    />

                    <div className={styles.baseContent}>
                        <File
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

export default StandardFile
