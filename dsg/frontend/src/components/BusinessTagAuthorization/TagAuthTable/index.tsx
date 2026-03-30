import { useAntdTable, useUpdateEffect } from 'ahooks'
import { Button, Space, Table, Modal, Switch, message } from 'antd'

import { InfoCircleFilled } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import empty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getTagAuthList,
    tagAuthDetele,
    tagAuthUpdateState,
    TagDetailsType,
} from '@/core'
import { AddOutlined } from '@/icons'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import { SearchInput, Empty, Loader } from '@/ui'
import __ from '../locale'
import styles from './styles.module.less'
import CreateAuth from '../CreateAuth'
import TagDetails from '@/components/BusinessTagClassify/Details'
import { StateLabel } from '@/components/BusinessTagClassify/helper'
import { stateLableType } from '@/components/BusinessTagClassify/const'
import ViewDetail from '@/components/ApplicationAuth/ApplicationManage/ViewDetail'
import { TipsLabel } from '../helper'

interface ITagAuthTable {
    selectedTagClassify: any
}
const TagAuthTable = (props: ITagAuthTable) => {
    const { selectedTagClassify } = props
    const [searchKey, setSearchKey] = useState('')
    const [openViewInfoId, setOpenViewInfoId] = useState<string>('')
    const [searchCondition, setSearchCondition] = useState<any>({
        limit: 10,
        offset: 1,
        keyword: '',
    })
    const [createAuthVisible, setCreateAuthVisible] = useState<boolean>(false)
    const [detailsVisible, setDetailsVisible] = useState<boolean>(false)
    const [delLoad, setDelLoad] = useState<boolean>(false)
    const [switchLoad, setSwitchLoad] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(false)

    // 获取列表
    const getTagListData = async (params) => {
        const { offset, limit, sort, direction, keyword } = params
        try {
            const res: any = await getTagAuthList({
                id: selectedTagClassify.id,
                keyword,
                offset,
                limit,
            })
            return {
                total: res?.total_count,
                list: res?.entries || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setIsInit(true)
        }
    }
    const { tableProps, run, pagination, loading } = useAntdTable(
        getTagListData,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )
    useEffect(() => {
        if (!isInit) return
        run({ ...searchCondition, current: searchCondition.offset })
    }, [searchCondition])

    useUpdateEffect(() => {
        run(searchCondition)
    }, [selectedTagClassify?.id])

    useUpdateEffect(() => {
        if (searchKey === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchKey,
            limit: 10,
            offset: 1,
        })
    }, [searchKey])

    // 操作处理
    const cancleAuth = async (item: any) => {
        try {
            setDelLoad(true)
            await tagAuthDetele(item.id)
            message.success(__('取消授权成功'))
            run(searchCondition)
        } catch (err) {
            formatError(err)
        } finally {
            setDelLoad(false)
        }
    }

    // 空库表
    const renderEmpty = () => {
        const createView = <Empty desc={__('暂无数据')} iconSrc={empty} />
        return searchKey ? <Empty /> : createView
    }

    const onStateChange = async (checked: boolean, record) => {
        try {
            setSwitchLoad(true)
            await tagAuthUpdateState({
                id: record.id,
                type: checked ? 1 : 0,
            })
            message.success(
                __('${text}智能成功', {
                    text: checked ? __('开启') : __('关闭'),
                }),
            )
        } catch (err) {
            formatError(err)
        } finally {
            setSwitchLoad(false)
            run(searchCondition)
        }
    }

    // 列表项
    const columns: any = [
        {
            title: (
                <TipsLabel
                    label={__('集成应用')}
                    tips={
                        <div>
                            <div style={{ fontWeight: 550 }}>
                                {__('集成应用')}
                            </div>
                            <div>
                                {__(
                                    '开发者使用应用账号完成认证后，可调用应用内提供的资源/标签的 OpenAPI 接口（使用这些接口需要先获取相关数据授权）。',
                                )}
                            </div>
                        </div>
                    }
                />
            ),
            dataIndex: 'name',
            key: 'name',
            render: (value, record) => value || '--',
            ellipsis: true,
        },
        {
            title: __('应用描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (value) => value || '--',
        },
        {
            title: (
                <TipsLabel
                    label={__('智能标签')}
                    placement="bottom"
                    tips={
                        <div>
                            <div style={{ fontWeight: 550 }}>
                                {__('智能标签')}
                            </div>
                            <div>
                                {__(
                                    '1、智能标签作用：系统可根据打标签的对象，智能推荐标签。',
                                )}
                            </div>
                            <div>
                                {__(
                                    '2、开启智能标签后，开发者通过集成应用调用标签的 OpenAPI 接口时，还可以调用智能标签能力。',
                                )}
                            </div>
                        </div>
                    }
                />
            ),
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            render: (value, record) => (
                <Switch
                    loading={switchLoad}
                    checked={value === 1}
                    onChange={(ck) => onStateChange(ck, record)}
                    size="small"
                />
            ),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            fixed: 'right',
            render: (_, record) => {
                return (
                    <Space size={12} className={styles.optionBtnGroup}>
                        <Button
                            type="link"
                            onClick={(e) =>
                                setOpenViewInfoId(record?.f_apps_id)
                            }
                        >
                            {__('详情')}
                        </Button>
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                confirm({
                                    title: __('确定要取消授权吗？'),
                                    icon: (
                                        <InfoCircleFilled
                                            style={{ color: '#faad14' }}
                                        />
                                    ),
                                    content: __(
                                        '取消后，集成应用“${name}”不再有当前标签的使用权限。',
                                        { name: record.name },
                                    ),
                                    okText: __('确定'),
                                    cancelText: __('取消'),
                                    okButtonProps: { loading: delLoad },
                                    onOk() {
                                        cancleAuth(record)
                                    },
                                })
                            }}
                        >
                            {__('取消授权')}
                        </Button>
                    </Space>
                )
            },
        },
    ]

    return (
        <div className={styles.tagAuthTableWrapper}>
            <div className={styles.top}>
                <div className={styles.topLeft}>
                    <div
                        className={styles.titleWrapper}
                        onClick={() =>
                            setDetailsVisible(!!selectedTagClassify?.id)
                        }
                    >
                        <div className={styles.title}>
                            {selectedTagClassify?.name}
                        </div>
                        <StateLabel state={selectedTagClassify?.state} />
                    </div>
                    <Button
                        type="primary"
                        icon={<AddOutlined />}
                        disabled={
                            selectedTagClassify?.state ===
                                stateLableType.unenable ||
                            !selectedTagClassify.id
                        }
                        style={{ width: 140 }}
                        onClick={() => setCreateAuthVisible(true)}
                    >
                        {__('添加授权应用')}
                    </Button>
                </div>
                <Space
                    size={12}
                    className={styles.topRight}
                    style={{
                        visibility:
                            !searchKey && tableProps.dataSource.length === 0
                                ? 'hidden'
                                : 'visible',
                    }}
                >
                    <SearchInput
                        style={{ width: 272 }}
                        placeholder={__('搜索集成应用名称')}
                        onKeyChange={(kw: string) => {
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: kw,
                            })
                            setSearchKey(kw)
                        }}
                        onPressEnter={(e: any) =>
                            setSearchCondition({
                                ...searchCondition,
                                offset: 1,
                                keyword: e.target.value,
                            })
                        }
                    />
                    <Space size={0}>
                        {/* <SortBtn
                            contentNode={
                                <DropDownFilter
                                    menus={menus}
                                    defaultMenu={defaultMenu}
                                    menuChangeCb={handleMenuChange}
                                    changeMenu={selectedSort}
                                />
                            }
                        /> */}
                        <RefreshBtn
                            onClick={() =>
                                setSearchCondition({
                                    ...searchCondition,
                                    offset: 1,
                                })
                            }
                        />
                    </Space>
                </Space>
            </div>
            {tableProps.dataSource.length ||
            !!searchKey ||
            (!tableProps.dataSource.length &&
                tableProps.pagination.current !== 1) ? (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    scroll={{
                        x: 1340,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - 278px)`,
                    }}
                    loading={loading ? { tip: __('加载中...') } : false}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    bordered={false}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    onChange={(currentPagination) => {
                        setSearchCondition({
                            ...searchCondition,
                            offset: currentPagination?.current || 1,
                        })
                    }}
                />
            ) : loading ? (
                <Loader />
            ) : (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            )}
            {createAuthVisible && (
                <CreateAuth
                    visible={createAuthVisible}
                    onClose={(flag) => {
                        setCreateAuthVisible(false)
                        if (flag) {
                            run(searchCondition)
                        }
                    }}
                    selectedTagClassify={selectedTagClassify}
                />
            )}
            {detailsVisible && (
                <TagDetails
                    open={detailsVisible}
                    id={selectedTagClassify?.id}
                    type={TagDetailsType.auth}
                    showTreeInfo
                    onClose={() => setDetailsVisible(false)}
                />
            )}
            {openViewInfoId && (
                <ViewDetail
                    appId={openViewInfoId}
                    onClose={() => {
                        setOpenViewInfoId('')
                    }}
                    open={!!openViewInfoId}
                />
            )}
        </div>
    )
}

export default TagAuthTable
