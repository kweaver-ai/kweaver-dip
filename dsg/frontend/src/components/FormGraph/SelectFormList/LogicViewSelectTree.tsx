import { useEffect, useState } from 'react'
import { databaseTypesEleData } from '@/core/dataSource'
import {
    formatError,
    getDatasheetView,
    getDataViewDatasouces,
    OnlineStatus,
} from '@/core'
import DirTree from '@/components/StandardDirTree/DirTree'
import SelectNode from './SelectNode'
import { DataSourceOrigin } from '@/components/DataSource/helper'

const LogicViewSelectTree = () => {
    const [treeData, setTreeData] = useState<Array<any>>([])

    useEffect(() => {
        getTreeData()
    }, [])

    /**
     * 获取数据源类型数据
     * @returns
     */
    const getDataSourceTypeData = async () => {
        try {
            await databaseTypesEleData.handleUpdateDataBaseTypes()

            return databaseTypesEleData.dataTypes?.map((item: any) => {
                const { Colored } =
                    databaseTypesEleData.dataBaseIcons[item.olkConnectorName]
                return {
                    title: item.showConnectorName,
                    type: item.olkConnectorName,
                    id: item.olkConnectorName,
                    icon: <Colored />,
                }
            })
        } catch (ex) {
            formatError(ex)
            return []
        }
    }

    /**
     * 获取树数据
     */
    const getTreeData = async () => {
        const res = await getDataViewDatasouces({
            limit: 1000,
            direction: 'desc',
            sort: 'updated_at',
            source_types: `${DataSourceOrigin.INFOSYS},${DataSourceOrigin.DATAWAREHOUSE}`,
        })
        const dsType = await getDataSourceTypeData()

        const initTreeData = dsType
            .map((item) => {
                const { Colored } =
                    databaseTypesEleData.dataBaseIcons[item.type]

                const children =
                    res?.entries
                        ?.map((it) => {
                            return {
                                ...it,
                                title: it.name,
                                key: it.id,
                                icon: <Colored />,
                                isLeaf: false,
                                dataType: 'datasource',
                            }
                        })
                        ?.filter((it) => it.type === item.type) || []

                return {
                    ...item,
                    key: item.id,
                    children,
                }
            })
            .map((item) => {
                return {
                    ...item,
                    isLeaf: item?.children?.length === 0,
                }
            })
            .filter((item) => item?.children?.length)

        setTreeData(initTreeData)
    }

    /**
     * 加载数据源
     * @param node
     * @returns
     */
    const onLoadDataSources = async (node: any) => {
        if (node?.dataType !== 'datasource') return

        try {
            const res = await getDatasheetView({
                datasource_id: node.key,
                offset: 1,
                limit: 2000,
                type: 'datasource',
                publish_status: 'publish',
            })
            const newTreeData = addNodeToTreeData(
                treeData,
                node.key,
                res?.entries || [],
            )
            setTreeData(newTreeData)
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 添加节点到树数据
     * @param allTreeNode // 树数据
     * @param id // 数据源id
     * @param data // 数据源数据
     * @returns
     */
    const addNodeToTreeData = (
        allTreeNode: Array<any>,
        id: string,
        data: Array<any>,
    ) => {
        return allTreeNode.map((node) => {
            if (node.key === id) {
                return {
                    ...node,
                    children: data.map((item) => {
                        return {
                            title: (
                                <SelectNode
                                    info={{
                                        ...item,
                                        name: item.business_name,
                                    }}
                                />
                            ),
                            type: item.id,
                            id: item.id,
                            isLeaf: true,
                        }
                    }),
                }
            }
            if (node?.children?.length) {
                return {
                    ...node,
                    children: addNodeToTreeData(node.children, id, data),
                }
            }
            return node
        })
    }

    return (
        <DirTree
            conf={{
                showSearch: false,
                showTopTitle: false,
            }}
            treeData={treeData}
            loadData={onLoadDataSources}
        />
    )
}

export default LogicViewSelectTree
