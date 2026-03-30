import { ConfigProvider, Divider, Layout, message } from 'antd'
import { useState, useRef, useEffect } from 'react'
import {
    CatalogOption,
    CatalogType,
    formatError,
    getDirDataByTypeOrId,
    getFileDirByTypeOrId,
    IDirItem,
    IDirQueryType,
} from '@/core'
import { MoreOperate } from '@/components/Directory/const'
import { StdDirStyle } from '@/utils'
import DictManage from '@/components/CodeTableManage'
import StandardDirTree from '@/components/StandardDirTree'
import DragBox from '@/components/DragBox'
import styles from './styles.module.less'
import {
    fileCatlgTreeToStdTreeData,
    findDirByKey,
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

function CodeTable({ props }: any) {
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

    // 目录项操作（目前支持操作:重命名/移动至/导出/删除）
    const optMenuItems = [
        MoreOperate.ADD,
        MoreOperate.RENAME,
        MoreOperate.MOVETO,
        MoreOperate.EXPORT,
        MoreOperate.DELETE,
    ]

    // const [dirSiderWidth, setDirSiderWidth] = useState(DirStyle.DEFAULTWIDTH)

    const [loading, setLoading] = useState(true)

    // 当前选中目录类型
    const catlgClassOptions = [
        { label: '自定义目录', value: CatalogOption.AUTOCATLG },
        {
            label: '标准文件目录',
            value: CatalogOption.STDFILECATLG,
        },
    ]
    const ref: any = useRef()

    const curDirType = CatalogType.CODETABLE

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
            if (query?.catlgOption === CatalogOption.DEPARTMENT) {
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
                // } else if (optType === StdTreeDataOpt.Load) {
                // res = await getFileDirByTypeOrId(
                //     query?.type,
                //     query.id || '',
                // )
                // const { catalogs, files } = res?.data || {}
                // const newChildren =
                //     fileCatlgTreeToStdTreeData({
                //         catalogs: {
                //             ...catalogs,
                //             children: catalogs?.children?.map((o) => ({
                //                 ...o,
                //                 isLeaf: !o.have_children,
                //                 stdFileCatlgType: StdFileCatlgType.CATALOG,
                //             })),
                //         },
                //         files,
                //     })?.children || []
                // // 更新树
                // treeDataTemp = updateTreeData(
                //     treeData || [],
                //     query?.id!,
                //     newChildren,
                // )
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
                    minSize={[StdDirStyle.MINWIDTH, 270]}
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
                        <DictManage
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

export default CodeTable
