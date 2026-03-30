import React, { useContext, useMemo, useState } from 'react'
import { Button, Dropdown, Menu } from 'antd'
import { IFlowchartItem, TaskExecutableStatus, TaskType } from '@/core'
import { EllipsisOutlined } from '@/icons'
import styles from './styles.module.less'
import { formatTime, OperateType } from '@/utils'
import FlowchartIconOutlined from '@/icons/FlowchartIconOutlined'
import { TaskInfoContext } from '@/context'
import __ from './locale'

interface IFlowchartCardItem {
    item: IFlowchartItem
    onEdit: () => void
    onPreview: () => void
    onDelete: () => void
    onEditDrawio: (item: IFlowchartItem) => void
}

/**
 * 流程图卡片
 * @param item 流程图item
 * @param onEdit 编辑
 * @param onPreview 查看
 * @param onDelete 删除
 * @returns
 */
const FlowchartCardItem: React.FC<IFlowchartCardItem> = ({
    item,
    onEdit,
    onPreview,
    onEditDrawio,
    onDelete,
}) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const taskDisabled = useMemo(() => {
        const { taskStatus, taskType, taskExecutableStatus } = taskInfo
        return (
            [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                taskType,
            ) ||
            (taskExecutableStatus &&
                taskExecutableStatus !== TaskExecutableStatus.EXECUTABLE)
        )
    }, [taskInfo])

    const [hidden, setHidden] = useState(true)
    const [bg, setBg] = useState('rgba(0, 0, 0, 0)')

    // 操作菜单
    const menu = (
        <Menu
            items={
                taskDisabled
                    ? [
                          {
                              key: OperateType.PREVIEW,
                              label: (
                                  <Button
                                      type="text"
                                      style={{
                                          height: 22,
                                          color: 'rgba(0, 0, 0, 0.85)',
                                          padding: 0,
                                      }}
                                  >
                                      {__('查看')}
                                  </Button>
                              ),
                              onClick: (e) => {
                                  e.domEvent.stopPropagation()
                                  onPreview()
                              },
                              style: {
                                  textAlign: 'center',
                              },
                          },
                      ]
                    : [
                          {
                              key: OperateType.EDIT,
                              label: (
                                  <Button
                                      type="text"
                                      style={{
                                          height: 22,
                                          color: 'rgba(0, 0, 0, 0.85)',
                                          padding: 0,
                                      }}
                                  >
                                      {__('编辑')}
                                  </Button>
                              ),
                              onClick: (e) => {
                                  e.domEvent.stopPropagation()
                                  onEdit()
                              },
                              style: {
                                  textAlign: 'center',
                              },
                          },
                          {
                              key: OperateType.PREVIEW,
                              label: (
                                  <Button
                                      type="text"
                                      style={{
                                          height: 22,
                                          color: 'rgba(0, 0, 0, 0.85)',
                                          padding: 0,
                                      }}
                                  >
                                      {__('查看')}
                                  </Button>
                              ),
                              onClick: (e) => {
                                  e.domEvent.stopPropagation()
                                  onPreview()
                              },
                              style: {
                                  textAlign: 'center',
                              },
                          },
                          {
                              key: OperateType.DELETE,
                              label: (
                                  <Button
                                      type="text"
                                      style={{
                                          height: 22,
                                          color: taskDisabled
                                              ? undefined
                                              : 'rgba(0, 0, 0, 0.85)',
                                          padding: 0,
                                      }}
                                  >
                                      {__('删除')}
                                  </Button>
                              ),
                              onClick: (e) => {
                                  e.domEvent.stopPropagation()
                                  onDelete()
                              },
                              style: {
                                  textAlign: 'center',
                              },
                          },
                      ]
            }
            onFocus={() => {
                setBg('rgba(0, 0, 0, 0.04)')
            }}
            onMouseOver={() => {
                setBg('rgba(0, 0, 0, 0.04)')
            }}
        />
    )

    return (
        <div
            className={styles.flowchartCardItem}
            aria-hidden
            onFocus={() => {}}
            onMouseOver={() => {
                setHidden(false)
            }}
            onMouseLeave={() => {
                setHidden(true)
            }}
        >
            <div
                style={{ background: bg }}
                hidden={hidden}
                onFocus={() => {}}
                onMouseOver={() => {
                    setBg('rgba(0, 0, 0, 0.04)')
                }}
                onMouseLeave={() => {
                    setHidden(true)
                    setBg('rgba(0, 0, 0, 0)')
                }}
                className={styles.itemMoreWrapper}
            >
                <Dropdown
                    overlay={menu}
                    placement="bottomLeft"
                    trigger={['hover']}
                    className={styles.itemMore}
                    overlayStyle={{ width: 60 }}
                >
                    <EllipsisOutlined style={{ fontSize: '20px' }} />
                </Dropdown>
            </div>
            <div className={styles.itemTitleWrapper}>
                <FlowchartIconOutlined
                    style={{
                        fontSize: '20px',
                        fill: 'rgb(18 110 227 / 6%)',
                    }}
                    className={styles.itemIcon}
                />
                <span
                    className={`${styles.itemName} ${
                        !taskDisabled && styles.itemNameClick
                    }`}
                    title={item.name}
                    onClick={() => {
                        if (!taskDisabled) {
                            onEditDrawio(item)
                        }
                    }}
                >
                    {item.name}
                </span>
            </div>
            <div className={styles.itemDescWrapper}>
                {item.description ? (
                    <span title={item.description}>{item.description}</span>
                ) : (
                    <span className={styles.descriptionNo}>
                        [{__('暂无描述')}]
                    </span>
                )}
            </div>
            <div className={styles.itemDetailWrapper}>
                <span
                    className={styles.itemCreate}
                    title={`${__('创建人')}${__('：')}${item.created_by}`}
                >
                    {item.created_by}
                </span>
                <span
                    title={`${__('更新时间')}${__('：')}${formatTime(
                        item.updated_at ? item.updated_at : item.created_at,
                    )}`}
                >
                    {formatTime(
                        item.updated_at ? item.updated_at : item.created_at,
                    )}
                </span>
            </div>
        </div>
    )
}

export default FlowchartCardItem
