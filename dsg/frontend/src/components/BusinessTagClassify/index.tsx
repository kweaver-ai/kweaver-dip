import { Button, List, Space, Spin, message } from 'antd'
import React, { useEffect, useState } from 'react'

import { InfoCircleFilled } from '@ant-design/icons'
import { useDebounceFn, useUpdateEffect } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import {
    ITagCategoryRes,
    LoginPlatform,
    formatError,
    getAuditProcessFromConfCenter,
    getTagCategory,
    tagAuditCancel,
    tagCategoryRemoves,
    tagCategoryUpdateState,
} from '@/core'
import { AddOutlined } from '@/icons'
import {
    Empty,
    ListDefaultPageSize,
    ListPagination,
    ListType,
    SearchInput,
} from '@/ui'
import { getPlatformActualUrl } from '@/utils'
import { confirm, info as modalInfo } from '@/utils/modalHelper'
import { RefreshBtn } from '../ToolbarComponents'
import {
    OperateType,
    auditTypeMap,
    cancelTipsMap,
    stateLableType,
} from './const'
import CreateTagClassify from './CreateTagClassify'
import TagDetails from './Details'
import { submitTips } from './helper'
import __ from './locale'
import styles from './styles.module.less'
import TagClassifyCard from './TagClassifyCard'

const BussinessTagClassify: React.FC = () => {
    const navigator = useNavigate()

    const [fetching, setFetching] = useState(false)
    const [itemFetching, setItemFetching] = useState(false)
    const [delLoad, setDelLoad] = useState(false)
    const [createVisible, setCreateVisible] = useState(false)
    const [detailsVisible, setDetailsVisible] = useState(false)
    const [operate, setOperate] = useState<OperateType>()
    const [opItem, setOpItem] = useState<ITagCategoryRes>()
    const [searchValue, setSearchValue] = useState<string>('')
    const [params, setParams] = useState<any>({
        limit: ListDefaultPageSize[ListType.CardList],
        offset: 1,
        keyword: '',
    })
    const [tagList, setTagList] = useState<ITagCategoryRes[]>([])
    // 编辑撤销时的id
    const [editId, setEditId] = useState<string>('')
    const [total, setTotal] = useState(0)

    useEffect(() => {
        queryTagList()
    }, [params])

    useUpdateEffect(() => {
        setParams({
            ...params,
            keyword: searchValue,
            offset: 1,
        })
    }, [searchValue])

    // 获取列表
    const queryTagList = async () => {
        try {
            setFetching(true)
            const res = await getTagCategory(params)
            setTagList(res?.entries || [])
            setTotal(res?.total_count)
            // 编辑恢复时，弹窗没有关闭，重新添加当前选择项数据
            if (editId && createVisible) {
                const item = res?.entries?.find((o) => o.id === editId)
                handleOperate(OperateType.EDIT, item)
            }
        } catch (err) {
            formatError(err)
        } finally {
            setFetching(false)
        }
    }

    // 操作处理
    const handleOperate = (op: OperateType, item?: any) => {
        setOperate(op)
        setOpItem(item)
        switch (op) {
            // 创建
            case OperateType.CREATE:
                setCreateVisible(true)
                break
            // 编辑
            case OperateType.EDIT:
                setCreateVisible(true)
                break
            // 刷新
            case OperateType.REFRESH:
                queryTagList()
                break
            // 删除
            case OperateType.DELETE:
                confirm({
                    title: __('确认要删除整个标签类型吗？'),
                    icon: <InfoCircleFilled style={{ color: '#faad14' }} />,
                    content: __('删除后，此类标签不再可用且不能还原。'),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    okButtonProps: { loading: delLoad },
                    onOk() {
                        handleDelete(item)
                    },
                })
                break
            // 取消
            case OperateType.CANCEL:
                confirm({
                    title: __('确认要撤销${type}审核吗？', {
                        type: cancelTipsMap[item.audit_status],
                    }),
                    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                    okText: __('确定'),
                    cancelText: __('取消'),
                    okButtonProps: { loading: delLoad },
                    onOk() {
                        handleCancel(item)
                    },
                })
                break
            // 停用/启用
            case OperateType.STATE:
                modalInfo({
                    title: __('确定要${state}吗？', {
                        state:
                            item.state === stateLableType.enabled
                                ? __('停用')
                                : __('启用'),
                    }),
                    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                    okText: __('确定'),
                    onOk() {
                        handleChangeState(item)
                    },
                })
                break
            case OperateType.MORE:
                setDetailsVisible(true)
                break
            default:
                break
        }
    }
    const { run: deHandleOperate } = useDebounceFn(handleOperate, {
        wait: 400,
        leading: true,
        trailing: false,
    })

    // 启用/停用 状态变更
    const handleChangeState = async (item: ITagCategoryRes) => {
        if (!item) return
        try {
            await tagCategoryUpdateState({
                state: item.state ? 0 : 1,
                id: item.id,
            })
            message.success(item.state ? __('禁用成功') : __('启用成功'))
            handleOperate(OperateType.REFRESH)
        } catch (err) {
            formatError(err)
        }
    }

    const toAudit = () => {
        const url = getPlatformActualUrl(
            '/personal-center/doc-audit-client/?target=apply',
            LoginPlatform.drmb, // 审核列表在资源管理平台
        )
        if (url.startsWith('/anyfabric')) {
            window.open(url, '_blank')
        } else {
            navigator(url)
        }
    }

    // 删除类目
    const handleDelete = async (item: any) => {
        if (!item) return
        try {
            setDelLoad(true)
            await tagCategoryRemoves(item.id)
            const auditRes = await getAuditProcessFromConfCenter({
                audit_type: auditTypeMap[OperateType.DELETE],
            })
            const hasAuditProcess = auditRes.entries?.length > 0
            if (hasAuditProcess) {
                submitTips(OperateType.DELETE, () => toAudit())
            } else {
                message.success(__('删除成功'))
            }
        } catch (err) {
            formatError(err)
        } finally {
            setDelLoad(false)
            handleOperate(OperateType.REFRESH)
        }
    }

    // 撤销审核
    const handleCancel = async (item: any) => {
        if (!item) return
        try {
            setDelLoad(true)
            await tagAuditCancel({
                id: item.id,
                audit_type: auditTypeMap[item.audit_status],
            })
            message.success(__('撤销成功'))
        } catch (err) {
            formatError(err)
        } finally {
            setDelLoad(false)
            handleOperate(OperateType.REFRESH)
        }
    }

    const showEmpty = () => {
        const desc = params.keyword ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : (
            __('暂无数据')
        )
        const icon = params.keyword ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    const handlePageChange = (offset: number, limit: number) => {
        setParams({ ...params, offset, limit })
    }

    return (
        <div className={styles.bussinessTagClassify}>
            <span className={styles['bussinessTagClassify-title']}>
                {__('标签类型')}
            </span>
            <div className={styles['bussinessTagClassify-top']}>
                <div>
                    <Button
                        type="primary"
                        onClick={() => deHandleOperate(OperateType.CREATE)}
                        icon={<AddOutlined />}
                    >
                        {__('新建标签类型')}
                    </Button>
                </div>
                <Space
                    size={4}
                    className={styles['bussinessTagClassify-top-searchBox']}
                >
                    <SearchInput
                        placeholder={__('搜索标签类型名称')}
                        onKeyChange={(value: string) => {
                            setSearchValue(value)
                        }}
                        style={{ width: 272 }}
                    />
                    <RefreshBtn
                        onClick={() => deHandleOperate(OperateType.REFRESH)}
                    />
                </Space>
            </div>
            {fetching ? (
                <div className={styles['bussinessTagClassify-load']}>
                    <Spin />
                </div>
            ) : tagList.length === 0 ? (
                <div className={styles['bussinessTagClassify-empty']}>
                    {showEmpty()}
                </div>
            ) : (
                <div className={styles['bussinessTagClassify-bottom']}>
                    <div className={styles['bussinessTagClassify-bottom-list']}>
                        <List
                            grid={{
                                gutter: 16,
                                column: 3,
                            }}
                            dataSource={tagList}
                            renderItem={(item) => (
                                <List.Item>
                                    <TagClassifyCard
                                        item={item}
                                        onOperate={(op) =>
                                            deHandleOperate(op, item)
                                        }
                                        loading={
                                            itemFetching &&
                                            item.id === opItem?.id
                                        }
                                    />
                                </List.Item>
                            )}
                            className={styles.list}
                        />
                    </div>
                    <ListPagination
                        listType={ListType.CardList}
                        queryParams={params}
                        totalCount={total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </div>
            )}
            {createVisible && (
                <CreateTagClassify
                    visible={createVisible}
                    item={opItem}
                    operate={operate}
                    onClose={() => setCreateVisible(false)}
                    onSure={(info) => {
                        setEditId(info?.id || '')
                        deHandleOperate(OperateType.REFRESH)
                    }}
                />
            )}
            {detailsVisible && (
                <TagDetails
                    open={detailsVisible}
                    id={opItem?.id}
                    showUpdateInfo
                    showAuditInfo
                    showAuditButton
                    onClose={() => setDetailsVisible(false)}
                />
            )}
        </div>
    )
}

export default BussinessTagClassify
