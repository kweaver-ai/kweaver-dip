import { Button, List, Space, Spin, message } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'

import { InfoCircleFilled } from '@ant-design/icons'
import { useDebounceFn, useUpdateEffect } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import {
    CategoryType,
    ICategoryItem,
    ISystemItem,
    deleteCategoryItem,
    formatError,
    getCategory,
    getCategoryItem,
    putCategoryItemUsing,
    reqInfoSystemList,
} from '@/core'
import { AddOutlined } from '@/icons'
import { Empty, SearchInput } from '@/ui'
import { confirm, info as modalInfo } from '@/utils/modalHelper'
import { RefreshBtn } from '../ToolbarComponents'
import CategoryCard from './CategoryCard'
import ConfigSortNew from './ConfigSortNew'
import ConfigTree from './ConfigTree'
import CreateCategory from './CreateCategory'
import { OperateType } from './helper'
import __ from './locale'
import styles from './styles.module.less'

const CategoryManage: React.FC = () => {
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()
    const [fetching, setFetching] = useState(false)
    const [itemFetching, setItemFetching] = useState(false)
    const [delLoad, setDelLoad] = useState(false)
    const [createVisible, setCreateVisible] = useState(false)
    const [configVisible, setConfigVisible] = useState(false)
    const [configTreeVisible, setConfigTreeVisible] = useState(false)
    const [operate, setOperate] = useState<OperateType>()
    const [opItem, setOpItem] = useState<ICategoryItem>()
    const [searchValue, setSearchValue] = useState<string>('')
    const [params, setParams] = useState<any>({})
    const [categorys, setCategorys] = useState<ICategoryItem[]>([])
    const [systems, setSystems] = useState<ISystemItem[]>([])

    useEffect(() => {
        querySystems()
    }, [])

    useEffect(() => {
        queryCategoryList(params)
    }, [params])

    useUpdateEffect(() => {
        setParams({
            ...params,
            keyword: searchValue,
        })
    }, [searchValue])

    // 获取类目列表
    const queryCategoryList = async (value: any = {}) => {
        try {
            setFetching(true)
            const { entries } = await getCategory(params)
            setCategorys(entries || [])
        } catch (err) {
            formatError(err)
        } finally {
            setFetching(false)
        }
    }

    // 获取信息系统
    const querySystems = async () => {
        try {
            const res = await reqInfoSystemList({
                limit: 2000,
                offset: 1,
            })
            setSystems(res.entries || [])
        } catch (error) {
            formatError(error)
        }
    }

    const queryCategoryItem = async (val?: string) => {
        const id = val || opItem?.id
        if (!id) return
        try {
            setItemFetching(true)
            await querySystems()
            const res = await getCategoryItem(id)
            setOpItem(res)
        } catch (err) {
            formatError(err)
        } finally {
            setItemFetching(false)
        }
    }

    // 类目操作处理
    const handleOperate = (op: OperateType, item?: any) => {
        setOperate(op)
        setOpItem(item)
        switch (op) {
            // 创建
            case OperateType.CREATE:
                if (
                    categorys.filter((it) => it.type === CategoryType.CUSTOM)
                        .length >= 20
                ) {
                    modalInfo({
                        title: __('提示'),
                        icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                        content: (
                            <div>
                                <div>{__('已达到自定义类目最大数：20。')}</div>
                                <div>
                                    {__('请先删除无用类目，再进行新建操作')}
                                </div>
                            </div>
                        ),
                        okText: __('确定'),
                    })
                } else {
                    setCreateVisible(true)
                }
                break
            // 编辑
            case OperateType.EDIT:
                setCreateVisible(true)
                break
            // 配置
            case OperateType.CONFIG:
                setConfigVisible(true)
                break
            // 刷新
            case OperateType.REFRESH:
                setParams({
                    ...params,
                })
                querySystems()
                break
            // 刷新item
            // case OperateType.REFRESHITEM:

            // break
            // 删除
            case OperateType.DELETE:
                confirm({
                    title: __('确认要删除该类目？'),
                    icon: <InfoCircleFilled style={{ color: '#faad14' }} />,
                    content: __('类目删除后将无法找回，请谨慎操作！'),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    okButtonProps: { loading: delLoad },
                    onOk() {
                        handleDelete(item)
                    },
                })
                break
            // 停用/启用
            case OperateType.STATE:
                {
                    const allStartNum = categorys.filter(
                        (info) => info.using,
                    ).length
                    const customStartNum = categorys.filter(
                        (info) =>
                            info.using && info.type === CategoryType.CUSTOM,
                    ).length
                    if (item.using) {
                        if (allStartNum === 1) {
                            modalInfo({
                                title: __('提示'),
                                icon: (
                                    <InfoCircleFilled
                                        style={{ color: '#1890ff' }}
                                    />
                                ),
                                content: __('请至少启用一个类目'),
                                okText: __('确定'),
                            })
                        } else {
                            confirm({
                                title: __('确认要停用该类目吗？'),
                                icon: (
                                    <InfoCircleFilled
                                        style={{ color: '#faad14' }}
                                    />
                                ),
                                content: __(
                                    '停用后，数据目录编目及服务超市均无法继续使用该类目',
                                ),
                                okText: __('确定'),
                                cancelText: __('取消'),
                                onOk() {
                                    handleChangeState(item)
                                },
                            })
                        }
                    } else if (
                        customStartNum === 10 &&
                        item.type === CategoryType.CUSTOM
                    ) {
                        modalInfo({
                            title: __('提示'),
                            icon: (
                                <InfoCircleFilled
                                    style={{ color: '#1890ff' }}
                                />
                            ),
                            content: __('自定义目录最大允许启用10个'),
                            okText: __('确定'),
                        })
                    } else {
                        handleChangeState(item)
                    }
                }
                break
            // 跳转
            case OperateType.JUMP:
                if (item.name === '组织架构') {
                    navigator('/systemConfig/businessArchitecture')
                } else if (item.name === '信息系统') {
                    navigator('/systemConfig/infoSystem')
                } else if (item.name === '主题域') {
                    navigator('/standards/business-domain')
                }
                break
            // 配置类目树
            case OperateType.CONFIGTREE:
                setConfigTreeVisible(true)
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
    const handleChangeState = async (item: ICategoryItem) => {
        if (!item) return
        try {
            await putCategoryItemUsing(item.id, { using: !item.using })
            message.success(item.using ? __('停用成功') : __('启用成功'))
            handleOperate(OperateType.REFRESH)
        } catch (err) {
            if (
                err?.data?.code === 'DataCatalog.Category.CategoryUsingOverMax'
            ) {
                modalInfo({
                    title: __('提示'),
                    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                    content: __('自定义目录最大允许启用10个'),
                    okText: __('确定'),
                })
            } else if (
                err?.data?.code === 'DataCatalog.Category.CategoryTreeNotExist'
            ) {
                modalInfo({
                    title: __('提示'),
                    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
                    content: __('无类目结构，无法启用'),
                    okText: __('确定'),
                })
            } else {
                formatError(err)
            }
        }
    }

    // 删除类目
    const handleDelete = async (item: any) => {
        if (!item) return
        try {
            setDelLoad(true)
            await deleteCategoryItem(item.id)
            message.success(__('删除成功'))
        } catch (err) {
            formatError(err)
        } finally {
            setDelLoad(false)
            handleOperate(OperateType.REFRESH)
        }
    }

    const hasOprAccess = useMemo(
        () => checkPermission('manageResourceCatalog'),
        [checkPermission],
    )

    const showEmpty = () => {
        const desc = params.keyword ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : hasOprAccess ? (
            <div style={{ textAlign: 'center' }}>
                <div>{__('暂无数据，可通过【新建类目】来添加类目')}</div>
                <Button
                    type="primary"
                    onClick={() => deHandleOperate(OperateType.CREATE)}
                    icon={<AddOutlined />}
                    style={{ marginTop: 16 }}
                >
                    {__('新建类目')}
                </Button>
            </div>
        ) : (
            __('暂无数据')
        )
        const icon = params.keyword ? searchEmpty : dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <div className={styles.categoryManage}>
            <span className={styles['categoryManage-title']}>
                {__('类目管理')}
            </span>
            <div
                className={styles['categoryManage-top']}
                hidden={!params.keyword && categorys.length === 0}
            >
                <div hidden={!hasOprAccess}>
                    <Button
                        type="primary"
                        onClick={() => deHandleOperate(OperateType.CREATE)}
                        icon={<AddOutlined />}
                    >
                        {__('新建类目')}
                    </Button>
                    <Button
                        onClick={() => deHandleOperate(OperateType.CONFIG)}
                        style={{ marginLeft: 8 }}
                    >
                        {__('配置')}
                    </Button>
                </div>
                <Space
                    size={4}
                    className={styles['categoryManage-top-searchBox']}
                >
                    <SearchInput
                        placeholder={__('搜索类目名称')}
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
                <div className={styles['categoryManage-load']}>
                    <Spin />
                </div>
            ) : categorys.length === 0 ? (
                <div className={styles['categoryManage-empty']}>
                    {showEmpty()}
                </div>
            ) : (
                <div className={styles['categoryManage-bottom']}>
                    <div className={styles['categoryManage-bottom-list']}>
                        <List
                            grid={{
                                gutter: 16,
                                column: 4,
                            }}
                            dataSource={categorys}
                            renderItem={(item) => (
                                <List.Item>
                                    <CategoryCard
                                        item={item}
                                        onOperate={(op) =>
                                            deHandleOperate(op, item)
                                        }
                                        systems={systems}
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
                </div>
            )}
            <CreateCategory
                visible={createVisible}
                item={opItem}
                operate={operate}
                onClose={() => setCreateVisible(false)}
                onSure={(info) => {
                    if (operate === OperateType.CREATE) {
                        deHandleOperate(OperateType.REFRESH)
                    } else {
                        // queryCategoryItem()
                        deHandleOperate(OperateType.REFRESH)
                    }
                }}
            />
            {/* <ConfigSort
                visible={configVisible}
                items={categorys.filter((it) => it.using)}
                onClose={() => setConfigVisible(false)}
                onSure={() => deHandleOperate(OperateType.REFRESH)}
            /> */}
            {configVisible && (
                <ConfigSortNew
                    visible={configVisible}
                    onClose={() => {
                        setConfigVisible(false)
                        // 关闭时刷新列表，确保排序和配置更新
                        queryCategoryList(params)
                    }}
                    onSure={() => {}}
                />
            )}
            <ConfigTree
                visible={configTreeVisible}
                item={opItem}
                onClose={() => {
                    setConfigTreeVisible(false)
                    // queryCategoryItem()
                    deHandleOperate(OperateType.REFRESH)
                }}
            />
        </div>
    )
}

export default CategoryManage
