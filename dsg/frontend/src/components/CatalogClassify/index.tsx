import { Button, Form, Input, message, Modal, Space, Spin, Table } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import moment from 'moment'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    addCatalogClassify,
    delCatalogClassify,
    detailsCatalogClassify,
    editCatalogClassify,
    formatError,
    getCatalogClassifyNameCheck,
    moveCatalogClassify,
    queryCatalogClassify,
} from '@/core'
import { AddOutlined } from '@/icons'
import Empty from '@/ui/Empty'
import { confirm } from '@/utils/modalHelper'
import { keyboardInputValidator, nameRepeatValidator } from '@/utils/validate'
import __ from './locale'
import styles from './styles.module.less'

import { RefreshBtn } from '@/components/ToolbarComponents'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { SearchInput } from '@/ui'
import DraggableBodyRow from './DraggableBodyRow'
import { findFromData, OperateType } from './const'

const { TextArea } = Input

interface DataType {
    id: string
    name: string
    mgm_dep_id: string
    mgm_dep_name: string
    children?: DataType[]
    parent_id?: string
    created_at?: number
    expansion?: boolean
    updated_at?: number
    level: number
    describe?: string
}

const CatalogClassify: React.FC = () => {
    const { checkPermission } = useUserPermCtx()

    const [open, setOpen] = useState<boolean>(false)
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false)
    const [fetching, setFetching] = useState(false)
    const [dataSource, setDataSource] = useState<any[]>([])
    const [expandedRowKeys, setExpandedRowKeys] = useState<any[]>([])
    const [searchExpandedKeys, setSearchExpandedKeys] = useState<any[]>([])
    const [form] = Form.useForm()
    const [curRow, setCurRow] = useState<any>()
    const [details, setDetails] = useState<any>()
    const [curOperateType, setCurOperateType] = useState<OperateType>()
    const [searchValue, setSearchValue] = useState('')
    const [modalTitle, setModalTitle] = useState<string>('')

    useUpdateEffect(() => {
        getTable()
    }, [searchValue])

    useEffect(() => {
        getTable()
    }, [])

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    }

    const moveRow = useCallback(async (props) => {
        // eslint-disable-next-line react/prop-types
        const { dragId, dropId, dropParentId, operateType } = props
        if (operateType === 'drop' && dropParentId && dragId !== dropId) {
            try {
                await moveCatalogClassify({
                    id: dragId,
                    dest_parent_id: dropParentId,
                    next_id: dropId,
                })
                message.success('移动成功')
                getTable()
            } catch (err) {
                formatError(err)
            }
        }
    }, [])

    const findRow = (id) => {
        const { row, index, parentIndex } = findFromData(dataSource, id)
        return {
            row,
            rowIndex: index,
            rowParentIndex: parentIndex,
        }
    }

    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('manageResourceCatalog'),
        [checkPermission],
    )

    const columns = [
        {
            title: __('类目名称'),
            dataIndex: 'name',
            key: 'name',
            className: 'drag-visible',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {/* <CatalogMoveOutlined /> */}

                    <div
                        className={styles.catlgName}
                        onClick={() =>
                            handleOperate(OperateType.DETAIL, record)
                        }
                    >
                        <span
                            title={record?.raw_name || record?.name}
                            dangerouslySetInnerHTML={{ __html: text }}
                        />
                    </div>
                </div>
            ),
            ellipsis: true,
        },
        {
            title: __('类目编号'),
            dataIndex: 'category_id',
            key: 'category_id',
            ellipsis: true,
        },
        // {
        //     title: __('管理部门'),
        //     dataIndex: 'mgm_dep_name',
        //     key: 'mgm_dep_name',
        // },
        hasOprAccess
            ? {
                  title: '操作',
                  key: 'action',
                  width: 200,
                  className: 'option-btn',
                  render: (_: string, record: DataType, index) => {
                      return (
                          <Space size={16}>
                              {hasOprAccess && (
                                  <Button
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          handleOperate(OperateType.ADD, record)
                                      }}
                                      type="link"
                                      disabled={record?.level === 4}
                                  >
                                      {__('添加子分类')}
                                  </Button>
                              )}
                              {hasOprAccess && (
                                  <Button
                                      type="link"
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          handleOperate(
                                              OperateType.EDIT,
                                              record,
                                          )
                                      }}
                                  >
                                      {__('编辑')}
                                  </Button>
                              )}
                              {hasOprAccess && (
                                  <Button
                                      type="link"
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          handleOperate(
                                              OperateType.DELETE,
                                              record,
                                          )
                                      }}
                                  >
                                      {__('删除')}
                                  </Button>
                              )}
                          </Space>
                      )
                  },
              }
            : {},
    ].filter((item) => item.key)

    // 查询
    const getTable = async () => {
        try {
            setFetching(true)
            const res = await queryCatalogClassify({ keyword: searchValue })
            setDataSource(treeFlagLevel(res?.entries) || [])
            if (searchValue && res?.entries.length > 0) {
                setSearchExpandedKeys(getExpandedKeys(res?.entries))
            }
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 获取展开树结构id
    const getExpandedKeys = (tree: any[], ids: any = []) => {
        tree.forEach((item) => {
            ids.push(item.id)
            if (item.children) {
                getExpandedKeys(item.children, ids)
            }
        })
        return ids
    }

    // 添加层级、序号字段
    const treeFlagLevel = (
        tree: any[],
        level: number = 1,
        pLevel: any[] = [],
    ) => {
        if (!tree || !tree.length) return []
        tree.forEach((item, index) => {
            // eslint-disable-next-line no-param-reassign
            item.level = level
            let parentLevel: any[] = []
            parentLevel = [...pLevel, index + 1]
            // 层级序号
            // eslint-disable-next-line no-param-reassign
            item.parentLevel = parentLevel
            // eslint-disable-next-line no-param-reassign
            item.name = `${parentLevel.join('.')} ${item.name}`
            if (item.children && item.children.length) {
                treeFlagLevel(item.children, level + 1, parentLevel)
            }
        })
        return tree
    }

    // 校验重名
    const nameRepeatCb = useCallback(
        () =>
            nameRepeatValidator({
                action: getCatalogClassifyNameCheck,
                repeatMessage: '类目名称已存在，请重新输入',
                validateMsg: '仅支持中英文、数字、下划线及中划线',
                nameRegFlag: true,
                showBackendTips: true,
                params:
                    curOperateType === OperateType.ADD
                        ? { parent_id: curRow?.id }
                        : { parent_id: curRow?.parent_id, cur_id: curRow?.id },
            }),
        [curRow],
    )

    const handleOperate = async (op: OperateType, item: DataType) => {
        setCurRow(item)
        setCurOperateType(op)
        let res: any
        try {
            switch (op) {
                case OperateType.ADD:
                    setOpen(true)
                    setModalTitle(__('新建子分类'))
                    form.resetFields()
                    form.setFieldValue('mgm_dep_name', '数据资源管理局')
                    break
                case OperateType.EDIT:
                    res = await detailsCatalogClassify({ id: item.id })
                    form.setFieldValue('name', res.name)
                    form.setFieldValue('mgm_dep_name', res.mgm_dep_name)
                    form.setFieldValue('mgm_dep_id', res.mgm_dep_id)
                    form.setFieldValue('describe', res.describe)
                    setModalTitle(
                        res.parent_id === '1'
                            ? __('编辑父分类')
                            : __('编辑子分类'),
                    )
                    setOpen(true)
                    break
                case OperateType.DELETE:
                    confirm({
                        title: `${__(`确定要删除吗？`)}`,
                        icon: (
                            <ExclamationCircleFilled
                                style={{ color: '#faad14' }}
                            />
                        ),
                        content: __(
                            '删除后，该节点下的所有目录都将被删除，请谨慎操作！',
                        ),
                        async onOk() {
                            await delCatalogClassify({ id: item.id })
                            message.success(__(`删除成功`))
                            getTable()
                        },
                        onCancel() {},
                    })
                    break
                case OperateType.DETAIL:
                    res = await detailsCatalogClassify({ id: item.id })
                    setDetails(res)
                    setDetailsOpen(true)
                    break
                default:
                    break
            }
        } catch (error) {
            formatError(error)
        }
    }

    const onFinish = async (values: any) => {
        const data: any = {
            ...values,
            // 当前部门id固定为1
            mgm_dep_id: '1',
            mgm_dep_name: '数据资源管理局',
        }
        try {
            if (curOperateType === OperateType.ADD) {
                data.parent_id = curRow?.id
                await addCatalogClassify(data)
                message.success('新建成功')
                setExpandedRowKeys([...expandedRowKeys, curRow?.id])
            } else if (curOperateType === OperateType.EDIT) {
                data.id = curRow?.id
                await editCatalogClassify(data)
                message.success('编辑成功')
            }
            getTable()
            setOpen(false)
        } catch (err) {
            formatError(err)
        }
    }

    const detailsData = [
        { label: __('类目名称'), key: 'name' },
        { label: __('类目编号'), key: 'category_id' },
        // { label: __('管理部门'), key: 'mgm_dep_name' },
        { label: __('描述'), key: 'describe' },
        { label: __('创建人/时间'), key: 'created_by', secKey: 'created_at' },
        {
            label: __('最终修改人/时间'),
            key: 'updated_by',
            secKey: 'updated_at',
        },
    ]

    // 新增
    const toAdd = () => {
        setCurOperateType(OperateType.ADD)
        setCurRow({})
        form.resetFields()
        form.setFieldValue('mgm_dep_name', '数据资源管理局')
        setOpen(true)
        setModalTitle(__('新建父分类'))
    }

    const renderEmpty = () => {
        return (
            <Spin spinning={fetching}>
                <Empty
                    desc={
                        fetching ? undefined : __('暂无数据')
                        // (
                        //     <div>
                        //         {__('点击')}
                        //         <Button type="link" onClick={toAdd}>
                        //             【{__('新建父分类')}】
                        //         </Button>
                        //         {__('按钮可新建目录分类')}
                        //     </div>
                        // )
                    }
                    iconSrc={fetching ? undefined : dataEmpty}
                />
            </Spin>
        )
    }

    return (
        <div className={styles.catalogClassifyBox}>
            <div className={styles.title}> {__('目录分类')}</div>
            <div className={styles.searchBox}>
                {hasOprAccess ? (
                    <Button
                        type="primary"
                        onClick={toAdd}
                        icon={<AddOutlined />}
                    >
                        {__('新建父分类')}
                    </Button>
                ) : (
                    <div />
                )}
                {/* {!(dataSource.length === 0 && !searchValue) && ( */}
                <Space size={4}>
                    <SearchInput
                        placeholder={`${__('搜索')}${__('类目名称')}`}
                        value={searchValue}
                        onKeyChange={(value: string) => {
                            setSearchValue(value)
                        }}
                        className={styles.searchInput}
                        style={{ width: 272 }}
                    />
                    <RefreshBtn onClick={() => getTable()} />
                </Space>
                {/* )} */}
            </div>
            {!searchValue && dataSource.length === 0 ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <DndProvider backend={HTML5Backend}>
                    <Table
                        columns={columns}
                        rowClassName={styles.tableRow}
                        expandable={{
                            expandedRowKeys: searchValue
                                ? searchExpandedKeys
                                : expandedRowKeys,
                            indentSize: 20,
                        }}
                        onExpand={(expanded: boolean, record: any) => {
                            const data = expanded
                                ? [...expandedRowKeys, record.id]
                                : expandedRowKeys.filter(
                                      (item) => item !== record.id,
                                  )
                            setExpandedRowKeys(data)
                        }}
                        dataSource={dataSource}
                        pagination={false}
                        rowKey="id"
                        loading={fetching}
                        locale={{
                            emptyText: <Empty />,
                        }}
                        onRow={(record, index) => ({
                            record,
                            index,
                            moveRow,
                            findRow,
                            resource: '',
                        })}
                        scroll={{
                            y:
                                dataSource.length === 0
                                    ? undefined
                                    : 'calc(100vh - 248px)',
                        }}
                        components={
                            dataSource.length === 0 ? undefined : components
                        }
                    />
                </DndProvider>
            )}

            <Modal
                // title={`${
                //     curOperateType === OperateType.ADD ? __('新建') : __('编辑')
                // }${__('目录分类')}`}
                title={modalTitle}
                width={640}
                open={open}
                onOk={() => form.submit()}
                onCancel={() => setOpen(false)}
                destroyOnClose
                wrapClassName="noPaddingBottom"
                maskClosable={false}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label={__('类目名称')}
                        rules={[
                            {
                                required: true,
                                message: __('输入不能为空'),
                            },
                            {
                                validator: nameRepeatCb(),
                            },
                        ]}
                        validateFirst
                        name="name"
                    >
                        <Input
                            placeholder={`${__('请输入')}${__('类目名称')}`}
                            maxLength={128}
                        />
                    </Form.Item>
                    {/* <Form.Item
                        label={__('管理部门')}
                        validateFirst
                        // rules={[
                        //     {
                        //         required: true,
                        //         message: `${__('请输入')}${__('管理部门')}`,
                        //     },
                        // ]}
                        name="mgm_dep_name"
                    >
                        <Input maxLength={128} disabled />
                    </Form.Item> */}
                    <Form.Item
                        label={__('描述')}
                        name="describe"
                        rules={[
                            {
                                validator: keyboardInputValidator(),
                            },
                        ]}
                    >
                        <TextArea
                            rows={3}
                            maxLength={255}
                            placeholder={`${__('请输入')}${__('描述')}`}
                            style={{
                                height: `76px`,
                                resize: 'none',
                            }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 详情弹窗 */}
            <Modal
                title={`${__('目录分类')}${__('详情')}`}
                width={800}
                open={detailsOpen}
                onOk={() => setDetailsOpen(false)}
                onCancel={() => setDetailsOpen(false)}
                footer={null}
                destroyOnClose
            >
                <div className={styles.detailBox}>
                    {detailsData.map((item) => {
                        return (
                            <div className={styles.detailRow} key={item.key}>
                                <div className={styles.detailLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.detailText}>
                                    {details ? details[item.key] || '--' : ''}
                                    <div>
                                        {details &&
                                            item.secKey &&
                                            moment(details[item.secKey]).format(
                                                'YYYY-MM-DD HH:mm:ss',
                                            )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal>
        </div>
    )
}

export default CatalogClassify
