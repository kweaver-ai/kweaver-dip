import { Radio, Select } from 'antd'
import { FC, useEffect, useRef, useState } from 'react'
import {
    DataSourceRadioType,
    DataSourceRadioTypeList,
    TreeType,
    TreeTypeList,
    UNGROUPED,
} from './const'
import styles from './styles.module.less'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import { Architecture } from '../BusinessArchitecture/const'
import __ from './locale'
import BusinessDomainTree from '../BusiArchitecture/BusinessDomainTree'
import SystemTree from './SystemTree'
import DataSourceTree from './DataSourceTree'

interface MultiTypeSelectTreeProps {
    enabledTreeTypes: string[]
    onSelectedNode: (menu: {
        nodeId: string
        treeType: string
        nodeType: string
        dataSourceType?: string
        dataType?: string
        name?: string
        catalog_name?: string
    }) => void
    showUnCategorized?: boolean
    isShowCurDept?: boolean
    treePropsConfig?: {
        [key: string]: any
    }
}
// 多维度选择树
const MultiTypeSelectTree: FC<MultiTypeSelectTreeProps> = ({
    enabledTreeTypes,
    onSelectedNode,
    showUnCategorized = true,
    isShowCurDept = false,
    treePropsConfig = {
        [TreeType.Department]: {
            needUncategorized: true,
        },
    },
}) => {
    const [treeOptions, setTreeOptions] = useState<
        {
            value: TreeType
            label: string
        }[]
    >([])

    const [selectedNode, setSelectedNode] = useState<any>()

    // 组织架构树
    const architectureDirTreeRef: any = useRef(null)

    // 业务架构树
    const businessDomainTreeRef: any = useRef(null)
    const [selectedTree, setSelectedTree] = useState<TreeType>()

    // 数据源树类型
    const [dataSourceRadio, setDataSourceRadio] = useState<DataSourceRadioType>(
        DataSourceRadioType.BySource,
    )

    useEffect(() => {
        setTreeOptions(
            enabledTreeTypes.map((treeType) => ({
                value: treeType as TreeType,
                label:
                    TreeTypeList.find((item) => item.value === treeType)
                        ?.label || '',
            })),
        )
        setSelectedTree(enabledTreeTypes[0] as TreeType)
    }, [])

    useEffect(() => {
        if (selectedNode && selectedTree) {
            onSelectedNode({
                nodeId:
                    selectedNode?.dataType === 'file'
                        ? selectedNode.dataSourceId
                        : selectedNode.id,
                nodeType: selectedNode.type,
                treeType: selectedTree,
                dataSourceType: selectedNode?.dataSourceType,
                dataType: selectedNode?.dataType,
                name: selectedNode.name,
                catalog_name: selectedNode.catalog_name,
            })
        }
    }, [selectedNode])

    useEffect(() => {
        setSelectedNode({
            id: '',
            name: __('全部'),
            type: selectedTree,
        })
    }, [selectedTree])

    const TreeComponent = {
        [TreeType.Department]: (
            <ArchitectureDirTree
                ref={architectureDirTreeRef}
                getSelectedNode={(node) => {
                    if (node) {
                        setSelectedNode(node)
                    } else {
                        setSelectedNode({ id: '' })
                    }
                }}
                hiddenType={[
                    Architecture.BMATTERS,
                    Architecture.BSYSTEM,
                    Architecture.COREBUSINESS,
                ]}
                filterType={[
                    Architecture.ORGANIZATION,
                    Architecture.DEPARTMENT,
                ].join(',')}
                placeholder={__('搜索组织架构')}
                isShowCurDept={isShowCurDept}
                needUncategorized={
                    treePropsConfig?.[TreeType.Department]?.needUncategorized
                }
            />
        ),
        [TreeType.BArchitecture]: (
            <BusinessDomainTree
                ref={businessDomainTreeRef}
                getSelectedKeys={(sd: any) => {
                    setSelectedNode({
                        ...sd,
                        id: sd.id,
                    })
                }}
                placeholder={__('搜索业务领域分组、业务领域、业务流程')}
                placeholderWith={125}
                isIncludeProcess
                extendNodesData={
                    showUnCategorized
                        ? [{ id: UNGROUPED, title: __('未分类') }]
                        : []
                }
            />
        ),
        [TreeType.InformationSystem]: (
            <SystemTree
                setSelectedNode={setSelectedNode}
                selectedNode={selectedNode}
                {...(treePropsConfig?.[TreeType.InformationSystem] || {})}
            />
        ),
        [TreeType.DataSource]: (
            <DataSourceTree
                dataSourceTreeType={dataSourceRadio}
                setSelectedNode={setSelectedNode}
                selectedNode={selectedNode}
                {...(treePropsConfig?.[TreeType.DataSource] || {})}
            />
        ),
    }

    return (
        <div className={styles['tree-container']}>
            <div
                hidden={enabledTreeTypes.length === 1}
                className={styles['tree-select']}
            >
                <Select
                    options={treeOptions}
                    value={selectedTree}
                    onChange={(value) => setSelectedTree(value)}
                    className={styles['view-select']}
                    bordered={false}
                />

                {selectedTree === TreeType.DataSource && (
                    <Radio.Group
                        value={dataSourceRadio}
                        onChange={(e) => setDataSourceRadio(e.target.value)}
                        size="small"
                    >
                        {DataSourceRadioTypeList.map((item) => (
                            <Radio.Button key={item.value} value={item.value}>
                                {item.label}
                            </Radio.Button>
                        ))}
                    </Radio.Group>
                )}
            </div>
            <div className={styles['tree-content']}>
                {selectedTree && TreeComponent[selectedTree]}
            </div>
        </div>
    )
}

export default MultiTypeSelectTree
