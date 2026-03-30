import { Col, Form, FormInstance, Row } from 'antd'
import { FolderFilled } from '@ant-design/icons'
import React, {
    FC,
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react'
import { useGetState } from 'ahooks'
import CustomSelectTree from './CustomSelectTree'
import {
    formatError,
    getCategory,
    getApplyScopeConfig,
    ICategoryItem,
    ScopeModuleCategory,
} from '@/core'
import __ from './locale'

interface ICategorySelectsProps {
    ref?: any
    form?: FormInstance
    // allowSystem?: boolean
    value?: string[]
    onChange?: (value: string[]) => void
    formName?: string
    gutter?: number
    itemName?: string
    scopeModuleCategory?: ScopeModuleCategory
    applyScopeId?: string // 新版应用范围ID（如："00000000-0000-0000-0000-000000000001"）
    initData?: any[]
    updateCategorys?: (categorys: ICategoryItem[]) => void
}

const CategorySelects: FC<Partial<ICategorySelectsProps>> = forwardRef(
    (props: any, ref) => {
        const {
            form,
            //  allowSystem,
            formName,
            value,
            onChange,
            gutter = 24,
            itemName = 'category_node_id',
            scopeModuleCategory,
            applyScopeId,
            initData,
            updateCategorys,
        } = props
        const [categorys, setCategorys] = useState<ICategoryItem[]>([])
        const [fetching, setFetching] = useState<boolean>(false)
        // const [initData, setInitData, getInitData] = useGetState<any[] | null>(
        //     null,
        // )

        // const categoryInfo = Form.useWatch(formName || 'category_info', form)

        const [hasInit, setHasInit] = useState<boolean>(false)

        useImperativeHandle(
            ref,
            () => ({
                categorys,
                getCategorys: () => categorys,
            }),
            [categorys],
        )

        useEffect(() => {
            refreshCategorys()
        }, [])

        useEffect(() => {
            if (
                initData &&
                initData?.length > 0 &&
                categorys?.length > 0 &&
                hasInit
            ) {
                updateInitData()
            }
        }, [initData, categorys, hasInit])

        useEffect(() => {
            if (categorys) {
                updateCategorys(categorys)
            }
        }, [categorys])

        const updateInitData = () => {
            const newCategoryInfo = categorys.map((item) => {
                const findCategory = (initData as any[])?.find(
                    (it) => it?.category_id === item.id,
                )
                return {
                    category_id: findCategory?.category_id,
                    category_node_id: findCategory?.category_node_id,
                }
            })
            form.setFieldValue(formName || 'category_info', newCategoryInfo)
            setHasInit(false)
        }

        const refreshCategorys = async () => {
            try {
                setFetching(true)
                const { entries } = await getCategory({})
                let list =
                    entries?.filter(
                        (item) => item.type !== 'system' && item.using,
                    ) || []

                // 如果指定了 applyScopeId，使用新的配置逻辑
                if (applyScopeId) {
                    try {
                        const config = await getApplyScopeConfig()

                        // 创建类目配置映射表
                        const categoryConfigMap = new Map<
                            string,
                            { selected: boolean; required: boolean }
                        >()

                        config.categories?.forEach((category) => {
                            // 查找指定的 apply_scope_id
                            const module = category.modules?.find(
                                (m) => m.apply_scope_id === applyScopeId,
                            )
                            if (module) {
                                categoryConfigMap.set(category.id, {
                                    selected: module.selected,
                                    required: module.required,
                                })
                            }
                        })

                        // 过滤并设置必填状态
                        list = list
                            .filter((item) => {
                                const itemConfig = categoryConfigMap.get(
                                    item.id,
                                )
                                return itemConfig?.selected === true
                            })
                            .map((item) => {
                                const itemConfig = categoryConfigMap.get(
                                    item.id,
                                )
                                return {
                                    ...item,
                                    required: itemConfig?.required || false,
                                }
                            })
                    } catch (error) {
                        formatError(error)
                    }
                } else if (scopeModuleCategory) {
                    // 保留旧逻辑（兼容性）
                    list = list.filter((item) => {
                        const applyScopeInfo = item.apply_scope_info?.find(
                            (it) => it.id === scopeModuleCategory,
                        )
                        return !!applyScopeInfo
                    })
                }

                setCategorys(list)
            } catch (err) {
                formatError(err)
            } finally {
                setFetching(false)
            }
        }

        /**
         * 格式化树节点
         * @param treeNode 树节点
         * @returns 格式化后的树节点
         */
        const formatTreeNode = (treeNode: any) => {
            return treeNode.map((item: any) => ({
                ...item,
                title: (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: '8px',
                        }}
                    >
                        <FolderFilled
                            style={{
                                color: '#59A3FF',
                                fontSize: '16px',
                            }}
                        />
                        {item.name}
                    </div>
                ),
                key: item.id,
                isLeaf: !item?.children || item?.children?.length === 0,
                children: item?.children ? formatTreeNode(item.children) : [],
            }))
        }

        return (
            <Form.List name={formName || 'category_info'}>
                {(fields, { remove }) => {
                    return (
                        <Row gutter={gutter}>
                            {categorys.map((item, index) => (
                                <Col span={12} key={index}>
                                    <Form.Item
                                        key={item.id}
                                        name={[index]}
                                        label={item.name}
                                        required={item.required}
                                        rules={[
                                            {
                                                validator: (
                                                    _,
                                                    currentValue,
                                                ) => {
                                                    if (
                                                        !item.required ||
                                                        currentValue?.category_node_id
                                                    ) {
                                                        return Promise.resolve()
                                                    }
                                                    return Promise.reject(
                                                        new Error(__('请选择')),
                                                    )
                                                },
                                                validateTrigger: ['onBlur'],
                                            },
                                        ]}
                                        validateTrigger={['onBlur']}
                                    >
                                        <CustomSelectTree
                                            treeData={
                                                formatTreeNode(
                                                    item.tree_node,
                                                ) || []
                                            }
                                            category_id={item.id}
                                            onDataNotFind={() => {
                                                form.setFields([
                                                    {
                                                        name: [
                                                            formName ||
                                                                'category_info',
                                                            index,
                                                        ],
                                                        errors: [
                                                            __(
                                                                '已删除。请重新选择',
                                                            ),
                                                        ],
                                                        value: {
                                                            category_node_id:
                                                                undefined,
                                                            category_id:
                                                                item.id,
                                                        },
                                                    },
                                                ])
                                            }}
                                            onNotThisCategory={() => {
                                                setHasInit(true)
                                            }}
                                            // value={field.value}
                                            // onChange={field.onChange}
                                        />
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    )
                }}
            </Form.List>
        )
    },
)

export default CategorySelects
