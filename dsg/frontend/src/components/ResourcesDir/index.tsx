/* eslint-disable no-bitwise */
import { useEffect, useRef, useState, useMemo } from 'react'
import { Tabs } from 'antd'
import { formatError, getDataCatalogCount, PermissionScope } from '@/core'
import DragBox from '../DragBox'
import {
    Architecture,
    CatlgTreeNode,
    allNodeInfo,
    tabItems,
    EditResourcesType,
    onLineStatus,
    publishStatus,
    onlinedList,
} from './const'
import styles from './styles.module.less'
import __ from './locale'
import ResourcesEdited from './ResourcesEdited'
import AllResourcesDir from './AllResourcesDir'
import ResourcesCustomTree from './ResourcesCustomTree'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useQuery } from '@/utils'

const ResourcesDir = () => {
    const query = useQuery()
    const tabKey = query.get('tabKey') || ''
    const ref: any = useRef()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [activeKey, setActiveKey] = useState<EditResourcesType>(
        EditResourcesType.AllResources,
    )
    // 左侧目录tabKey
    const [activeTabKey, setActiveTabKey] = useState<string>()
    const [selectedNode, setSelectedNode] = useState<CatlgTreeNode>({
        name: __('全部'),
        id: '',
        path: '',
        type: Architecture.ALL,
    })
    const [tabItemsData, setTabItemsData] = useState<any[]>(tabItems)

    const { checkPermission } = useUserPermCtx()

    // 是否拥有全部管理资源目录的权限
    const hasDataOperRole = useMemo(() => {
        return (
            checkPermission(
                [
                    {
                        key: 'manageResourceCatalog',
                        scope: PermissionScope.All,
                    },
                    {
                        key: 'operateResourceCatalog',
                        scope: PermissionScope.All,
                    },
                    {
                        key: 'operateResourceCatalog',
                        scope: PermissionScope.Organization,
                    },
                ],
                'or',
            ) ?? false
        )
    }, [checkPermission])
    useEffect(() => {
        setTabItemsData(
            hasDataOperRole
                ? tabItems
                : tabItems.filter(
                      (o) => o.key !== EditResourcesType.AllResources,
                  ),
        )
        let curKey: any = hasDataOperRole
            ? EditResourcesType.AllResources
            : EditResourcesType.Edited

        if (tabKey && tabKey !== 'undefined') {
            curKey = hasDataOperRole ? tabKey : EditResourcesType.Edited
        }
        setActiveKey(curKey)
    }, [hasDataOperRole, tabKey])

    useEffect(() => {
        getEditResourcesSum()
    }, [])

    useEffect(() => {
        if (tabKey && tabKey !== 'undefined') {
            setActiveKey(tabKey as EditResourcesType)
        }
    }, [tabKey])

    // 获取选中的节点
    const getSelectedNode = (sn?: any) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        let node
        if (sn) {
            node = { ...sn }
        } else {
            node = allNodeInfo
        }
        setSelectedNode(sn || allNodeInfo)
    }

    const handleTabChange = (key) => {
        setActiveKey(key)
        setSelectedNode({
            name: __('全部'),
            id: '',
            path: '',
            type: Architecture.ALL,
        })
    }

    const getEditResourcesSum = async () => {
        try {
            // const res = await getDataCatalogStatstics({ user_department: true })
            const allRes = await getDataCatalogCount({
                user_department: true,
                // online_status: onlinedList.join(','),
            })
            const obj = {
                [EditResourcesType.AllResources]: allRes?.done_catalog_count,
                [EditResourcesType.Edited]: allRes?.depart_catalog_count,
            }
            setTabItemsData((pre) =>
                pre.map((item) => {
                    return {
                        ...item,
                        label: `${item.title} ${obj[item.key]}`,
                    }
                }),
            )
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div className={styles.catlgResourceWrapper}>
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={tabItemsData}
                className={styles.catlgTabs}
            />
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    {/* {activeKey === EditResourcesType.Unedited ? (
                        <ResourcesDirTree
                            getCurTabKey={setActiveTabKey}
                            getSelectedNode={getSelectedNode}
                            initNodeType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                            selectOptions={rescCatlgItems.filter((currentTab) =>
                                [
                                    RescCatlgType.DOAMIN,
                                    RescCatlgType.ORGSTRUC,
                                ].includes(currentTab.value),
                            )}
                            filterDomainType={[
                                BusinessDomainType.subject_domain_group,
                                BusinessDomainType.subject_domain,
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            limitDomainTypes={[
                                BusinessDomainType.business_object,
                                BusinessDomainType.business_activity,
                            ]}
                            domainPlaceholder={__(
                                '搜索主题域分组、主题域、所属业务对象/活动',
                            )}
                            defaultActiveKey={RescCatlgType.DOAMIN}
                            needUncategorized
                            unCategorizedKey="00000000-0000-0000-0000-000000000000"
                        />
                    ) : (
                        <ResourcesCustomTree
                            hiddenSwitch
                            onChange={getSelectedNode}
                            // needUncategorized
                        />
                    )} */}
                    <ResourcesCustomTree
                        onChange={getSelectedNode}
                        defaultCategotyId="00000000-0000-0000-0000-000000000001"
                        needUncategorized
                        isShowCurDept={activeKey === EditResourcesType.Edited}
                        isShowMainDept={activeKey === EditResourcesType.Edited}
                        wapperStyle={{ height: 'calc(100vh - 105px)' }}
                        applyScopeTreeKey="data_resource_left"
                    />
                    {/* <ResourcesCategoryTree onChange={getSelectedNode} /> */}
                </div>
                <div className={styles.right}>
                    {activeKey === EditResourcesType.AllResources ? (
                        <AllResourcesDir
                            // <ResourcesUnEdited
                            treeType={activeTabKey}
                            selectedTreeNode={selectedNode}
                            updateResourcesSum={getEditResourcesSum}
                        />
                    ) : null}
                    {activeKey === EditResourcesType.Edited ? (
                        <ResourcesEdited
                            treeType={activeTabKey}
                            selectedTreeNode={selectedNode}
                            updateResourcesSum={getEditResourcesSum}
                        />
                    ) : null}
                </div>
            </DragBox>
        </div>
    )
}

export default ResourcesDir
