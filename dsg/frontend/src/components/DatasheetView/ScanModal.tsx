import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Modal, Space, Button, Badge } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { ClockColored } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { scanType } from './const'
import Icons from './Icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import DatasourceTree from './DatasourceTree'
import { useQuery } from '@/utils'
import { getDataSourceTypeData } from './helper'
import { DataColoredBaseIcon } from '@/core/dataSource'

interface IScanModal {
    open: boolean
    onClose: () => void
    onOk: (datasourceData?: any[]) => void
    type: scanType
    datasourceData: any[]
    selectedDsNode?: any
    isEmpty?: boolean
}

const ScanModal: React.FC<IScanModal> = ({
    open,
    onClose,
    onOk,
    datasourceData,
    type,
    selectedDsNode,
    isEmpty = false,
}) => {
    const [data, setData] = useState<any[]>([])
    const [title, setTitle] = useState<string>(__('选择要扫描的数据源'))
    const [desc, setDesc] = useState<string>('')
    const treeRef: any = useRef()
    const query = useQuery()
    const taskId = query.get('taskId') || ''
    const [dsType, setDsType] = useState<any[]>([])

    useEffect(() => {
        getDstype()
    }, [])

    useEffect(() => {
        // 历史数据源 按扫描时间排序，所有数据源按数据源类型排序
        const newDataSourceData = datasourceData.filter(
            (item) => item.type !== 'excel',
        )
        if (type !== scanType.init) {
            setData(
                type === scanType.history
                    ? newDataSourceData
                    : sortBydsType(newDataSourceData),
            )
        }
    }, [datasourceData, dsType])

    const sortBydsType = (datasources: any[]) => {
        let list: any[] = []
        dsType.forEach((item) => {
            list = [
                ...list,
                ...datasources.filter((it) => it.type === item.type),
            ]
        })
        return list
    }

    const getDstype = async () => {
        const list = await getDataSourceTypeData()
        setDsType(list)
    }

    useEffect(() => {
        if (selectedDsNode) {
            const typeText =
                selectedDsNode.id && selectedDsNode.type === selectedDsNode.id
                    ? `“${selectedDsNode.title}” ${__('类型下')}，`
                    : ''
            const titleText =
                type === scanType.history
                    ? `${__('仅重新扫描历史数据源')} (${data.length})`
                    : type === scanType.init
                    ? __('选择要扫描的数据源')
                    : `${__('扫描所有数据源')} (${data.length})`
            const descText =
                type === scanType.history
                    ? `${typeText}${__('已扫描过且存在库表的历史数据源有')} ${
                          data.length
                      } ${__('个')}：`
                    : type === scanType.init
                    ? ''
                    : `${typeText}${
                          typeText
                              ? __('所有数据源有')
                              : __('平台内所有类型的数据源有')
                      } ${data.length} ${__('个')}：`
            setTitle(titleText)
            setDesc(descText)
        }
    }, [selectedDsNode, data])

    const modalHandleOk = () => {
        onOk(data)
    }

    // 空状态
    const renderEmpty = () => {
        return (
            <div style={{ marginTop: '70px' }}>
                <Empty
                    desc={
                        type === scanType.history
                            ? __('无可重新扫描的历史数据源')
                            : __('暂无数据，需要先配置数据源才能进行扫描')
                    }
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    // 获取选中的节点
    const getCheckedNode = (item: any) => {
        // 根据uuid过滤数据源，分类类型id为type
        setData(item.filter((o) => o.id.length === 36))
    }

    return (
        <div>
            <Modal
                title={title}
                width={800}
                open={open}
                onOk={modalHandleOk}
                onCancel={onClose}
                className={styles.modalWrapper}
                maskClosable={false}
                footer={
                    <div className={styles.modalFooter}>
                        {!isEmpty ? (
                            <div className={styles.footerLeft}>
                                <ClockColored
                                    className={styles.footerLeftIcon}
                                />
                                <span>
                                    {taskId
                                        ? __(
                                              '表示当前任务已扫描过且存在库表的历史数据源，但仍可重新扫描获取最新变化',
                                          )
                                        : __(
                                              '表示已扫描过且存在库表的历史数据源，但仍可重新扫描获取最新变化',
                                          )}
                                </span>
                            </div>
                        ) : (
                            <div />
                        )}
                        <div className={styles.footerRight}>
                            <Space size={8}>
                                <Button onClick={() => onClose()}>
                                    {__('取消')}
                                </Button>
                                <Button
                                    disabled={data?.length === 0}
                                    type="primary"
                                    onClick={() => modalHandleOk()}
                                >
                                    {__('开始扫描')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                }
            >
                <div className={styles.ModalBox}>
                    {desc && <div className={styles.title}>{desc}</div>}
                    {isEmpty ? (
                        <div className={styles.modalContent}>
                            {renderEmpty()}
                        </div>
                    ) : (
                        <div
                            className={classnames(
                                styles.modalContent,
                                type === scanType.init && styles.init,
                            )}
                        >
                            {type === scanType.init && (
                                <div className={styles.modalInitContent}>
                                    <div className={styles.modalLeft}>
                                        <DatasourceTree
                                            getCheckedNode={getCheckedNode}
                                            hasTreeData={false}
                                            checkable
                                            checkKeys={data.map(
                                                (item) => item.id,
                                            )}
                                            filterTypes={['excel']}
                                            ref={treeRef}
                                            onlyShowDataSource={false}
                                            showScanStatus
                                        />
                                    </div>
                                </div>
                            )}
                            <div
                                className={classnames(
                                    type === scanType.init && styles.modalright,
                                )}
                            >
                                {type === scanType.init && (
                                    <div className={styles.initTitle}>
                                        <div>
                                            {`${__('已选择：')}${
                                                data?.length || 0
                                            }${__('个')}`}
                                        </div>
                                        <Button
                                            type="link"
                                            className={styles.initClear}
                                            onClick={() => {
                                                setData([])
                                            }}
                                            disabled={data.length === 0}
                                        >
                                            {__('全部移除')}
                                        </Button>
                                    </div>
                                )}
                                <div className={styles.rightItemBox}>
                                    {data?.length
                                        ? data?.map((item, index) => {
                                              return (
                                                  <div
                                                      className={styles.item}
                                                      key={index}
                                                  >
                                                      <Badge
                                                          offset={[0, 20]}
                                                          count={
                                                              item.last_scan ? (
                                                                  <ClockColored
                                                                      style={{
                                                                          fontSize:
                                                                              '10px',
                                                                      }}
                                                                  />
                                                              ) : (
                                                                  0
                                                              )
                                                          }
                                                      >
                                                          <DataColoredBaseIcon
                                                              type={item.type}
                                                              iconType="Colored"
                                                              className={
                                                                  styles.itemIcon
                                                              }
                                                          />
                                                      </Badge>
                                                      <span
                                                          title={item.name}
                                                          className={
                                                              styles.itemName
                                                          }
                                                      >
                                                          {item.name}
                                                      </span>
                                                      {type ===
                                                          scanType.init && (
                                                          <Button
                                                              type="text"
                                                              icon={
                                                                  <CloseOutlined />
                                                              }
                                                              className={
                                                                  styles.delBtn
                                                              }
                                                              onClick={() => {
                                                                  const datasources =
                                                                      data?.filter(
                                                                          (
                                                                              it,
                                                                          ) =>
                                                                              it.id !==
                                                                              item.id,
                                                                      )
                                                                  setData(
                                                                      datasources,
                                                                  )
                                                              }}
                                                          />
                                                      )}
                                                  </div>
                                              )
                                          })
                                        : null}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default ScanModal
