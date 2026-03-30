import { Button, Radio, Select, Tooltip } from 'antd'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import classnames from 'classnames'
import DragBox from '../DragBox'
import styles from './styles.module.less'
import ArchitectureDirTree from '../BusinessArchitecture/ArchitectureDirTree'
import CoreBusiness from './CoreBusiness'
import { ViewMode, UNGROUPED } from './const'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import Empty from '@/ui/Empty'
import dataEmpty from '../../assets/dataEmpty.svg'
import { getPlatformNumber, useQuery } from '@/utils'
import { viewModeList } from './helper'
import __ from './locale'
import BusinessDomainTree from '../BusiArchitecture/BusinessDomainTree'
import { BizModelType, LoginPlatform } from '@/core'
import BusinessModelProvider from './BusinessModelProvider'
import SystemTree from '../MultiTypeSelectTree/SystemTree'

interface BusinessModelingProps {
    businessModelType: BizModelType
}
const BusinessModeling: FC<BusinessModelingProps> = ({ businessModelType }) => {
    const architectureData = useSelector(
        (state: any) => state?.architectureReducer,
    )
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BArchitecture)
    const [viewModeOpen, setViewModeOpen] = useState(false)
    const [selectedNode, setSelectedNode] = useState<any>()
    const bdRef: any = useRef()
    const aRef: any = useRef()
    const query = useQuery()
    const platformNumber = getPlatformNumber()

    useEffect(() => {
        const viewType = query.get('viewType')
        if (viewType) setViewMode(viewType as ViewMode)
    }, [])

    return (
        <div className={styles.modelingWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[280, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <div className={styles.viewModeWrapper}>
                        {/* <Radio.Group
                            options={viewModeList}
                            onChange={(e) => setViewMode(e.target.value)}
                            value={viewMode}
                            optionType="button"
                        /> */}
                        {viewModeOpen ? (
                            <CaretUpOutlined
                                style={{ fontSize: 14, color: '#333' }}
                                onClick={() => {
                                    setViewModeOpen(!viewModeOpen)
                                }}
                            />
                        ) : (
                            <CaretDownOutlined
                                style={{ fontSize: 14, color: '#333' }}
                                onClick={() => {
                                    setViewModeOpen(!viewModeOpen)
                                }}
                            />
                        )}
                        <Select
                            open={viewModeOpen}
                            value={viewMode}
                            bordered={false}
                            options={viewModeList}
                            dropdownMatchSelectWidth={100}
                            onChange={(option: ViewMode) => {
                                setViewMode(option)
                                setSelectedNode({ id: '' })
                            }}
                            onDropdownVisibleChange={(o) => {
                                setViewModeOpen(o)
                            }}
                            className={styles.viewSelect}
                            showArrow={false}
                            getPopupContainer={(n) => n}
                        />
                    </div>
                    {viewMode === ViewMode.BArchitecture ? (
                        <div
                            className={classnames(
                                styles.treeContainer,
                                styles.bATreeContainer,
                            )}
                        >
                            <BusinessDomainTree
                                ref={bdRef}
                                getSelectedKeys={(sd: any) =>
                                    setSelectedNode({
                                        ...sd,
                                        id: sd.id,
                                    })
                                }
                                placeholder={
                                    platformNumber === LoginPlatform.default
                                        ? __(
                                              '搜索业务领域分组、业务领域、业务流程',
                                          )
                                        : __(
                                              '搜索业务领域分组、业务领域、主干业务',
                                          )
                                }
                                placeholderWith={125}
                                isIncludeProcess
                                extendNodesData={[
                                    { id: UNGROUPED, title: __('未分组') },
                                ]}
                            />
                        </div>
                    ) : viewMode === ViewMode.InfoSystem ? (
                        <div
                            className={classnames(
                                styles.treeContainer,
                                styles.bATreeContainer,
                            )}
                        >
                            <SystemTree
                                setSelectedNode={(node) => {
                                    setSelectedNode(node)
                                }}
                                selectedNode={selectedNode}
                                unCategorizedKey={UNGROUPED}
                            />
                        </div>
                    ) : (
                        <div
                            className={classnames(
                                styles.treeContainer,
                                styles.bATreeContainer,
                            )}
                        >
                            <ArchitectureDirTree
                                ref={aRef}
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
                                extendNodesData={[
                                    { id: UNGROUPED, title: __('未分组') },
                                ]}
                            />
                        </div>
                    )}
                </div>
                <div className={styles.right}>
                    {!selectedNode && viewMode === ViewMode.Department && (
                        <div className={styles.empty}>
                            <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                        </div>
                    )}
                    <div
                        className={styles.coreBusiness}
                        hidden={
                            !selectedNode && viewMode === ViewMode.Department
                        }
                    >
                        <BusinessModelProvider
                            businessModelType={businessModelType}
                        >
                            <CoreBusiness
                                selectedNode={selectedNode}
                                setSelectedNode={setSelectedNode}
                                viewMode={viewMode}
                                architectureTreeRef={aRef}
                                businessDomainTreeRef={bdRef}
                            />
                        </BusinessModelProvider>
                    </div>
                </div>
            </DragBox>
        </div>
    )
}

export default BusinessModeling
