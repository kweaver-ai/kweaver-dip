import { useEffect, useMemo, useState } from 'react'
import {
    Tooltip,
    Modal,
    Form,
    Radio,
    Input,
    List,
    Button,
    Space,
    Pagination,
    message,
} from 'antd'
import { useBoolean, usePagination, useSetState } from 'ahooks'
import classnames from 'classnames'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { Empty, Loader, SearchInput } from '@/ui'
import {
    addBatchViews,
    createDataset,
    formatError,
    getDatasetList,
    getDatasetTree,
    validateDatasetName,
} from '@/core'
import { getActualUrl } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import empty from '@/assets/searchEmpty.svg'

const { Item } = Form

enum AddType {
    EXIST = 'exist',
    NEW = 'new',
}

const defaultLimit = 5

const AddDataset = (props: {
    item: any
    className: string
    showTitle?: boolean
    disabled?: boolean
}) => {
    const { item, showTitle = false, className, disabled = false } = props
    const [addType, setAddType] = useState<AddType>(AddType.EXIST)
    const [selectedView, setSelectedView] = useState<string>()
    const [searchKey, setSearchKey] = useState<string>('')
    const [open, { setTrue, setFalse }] = useBoolean(false)
    const [datasetTreeData, setDatasetTreeData] = useState<any[]>([])
    const [form] = Form.useForm()
    const onChange = (e) => {
        setAddType(e.target.value)
    }

    const form_view_ids = useMemo(() => {
        // 标品环境直接传id
        return typeof item === 'string'
            ? [item]
            : item.mount_data_resources
                  .filter((res) => res.data_resources_type === 'data_view')
                  .map((res) => res.data_resources_ids[0])
    }, [item])

    const addedDatasetrIds = useMemo(() => {
        return datasetTreeData.reduce((acc, cur) => {
            if (
                cur.children?.find((child) => form_view_ids.includes(child.id))
            ) {
                acc.push(cur.id)
            }
            return acc
        }, [])
    }, [datasetTreeData, form_view_ids])

    const getList = async (
        params: any,
    ): Promise<{ total: number; list: any[] }> => {
        try {
            const { current, pageSize = 10, keyword = '' } = params
            const res = await getDatasetList({
                offset: current,
                limit: pageSize,
                sort: 'updated_at',
                direction: 'desc',
                keyword,
            })

            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        }
    }

    const addViewIntoDataset = async (params) => {
        try {
            await addBatchViews(params)
            const completeUrl = getActualUrl('my-assets/?menuType=dataset')

            // message.success(
            //     <span>
            //         {__('库表添加成功，您可前往')}
            //         <a
            //             href={completeUrl}
            //             target="_blank"
            //             rel="noopener noreferrer"
            //         >
            //             「{__('我的数据集')}」
            //         </a>
            //         {__('中查看')}
            //     </span>,
            //     5,
            // )
            message.success(__('库表添加成功'))
        } catch (err) {
            formatError(err)
        }
        setFalse()
        form.resetFields()
        setSelectedView(undefined)
    }

    const onOk = async (e) => {
        e.stopPropagation()
        if (addType === AddType.EXIST && !selectedView) {
            message.warn(__('请选择数据集'))
            return
        }
        let viewId = selectedView

        if (addType === AddType.NEW) {
            try {
                const params = await form.validateFields()

                const res = await createDataset(params)

                if (res.id) {
                    viewId = res.id
                }
            } catch (error) {
                formatError(error)
                return
            }
        }

        addViewIntoDataset({ id: viewId, form_view_ids })
    }

    const validateNameReq = async (name) => {
        try {
            const res = await validateDatasetName({ name })

            if (res.exists) return false
            return true
        } catch (error) {
            return false
        }
    }

    const validateName = async (_, value) => {
        if (!value) return Promise.reject()
        return validateNameReq(value).then((isPass) => {
            if (!isPass) {
                return Promise.reject(
                    new Error(__('该数据集名称已存在，请重新输入')),
                )
            }
            return Promise.resolve()
        })
    }

    const renderItem = (view) => {
        return (
            <Tooltip
                title={addedDatasetrIds.includes(view.id) ? __('已添加') : ''}
            >
                <div
                    className={classnames(styles.addDatasetListItem, {
                        [styles.isChecked]: view.id === selectedView,
                    })}
                    key={view.id}
                >
                    <Radio
                        value={view.id}
                        disabled={addedDatasetrIds.includes(view.id)}
                        defaultChecked={addedDatasetrIds.includes(view.id)}
                    >
                        <div className={styles.addDatasetLabel}>
                            <div
                                title={view.data_set_name}
                                className={styles.textOverflow}
                            >
                                {view.data_set_name}
                            </div>
                            <div
                                title={view.data_set_description}
                                className={`${styles.descText} ${styles.textOverflow}`}
                            >
                                {view.data_set_description || __('暂无描述')}
                            </div>
                        </div>
                    </Radio>
                </div>
            </Tooltip>
        )
    }

    const addDataset = (e) => {
        e.stopPropagation()
        if (disabled) return
        setTrue()
    }

    // 获取数据集树
    const getDatasetListTree = async () => {
        try {
            const res = await getDatasetTree({
                limit: 2000,
                offset: 1,
            })
            setDatasetTreeData(res || [])
        } catch (error) {
            // formatError(error)
        }
    }

    const { run, data, loading, pagination } = usePagination(getList, {
        defaultPageSize: 10,
    })

    useEffect(() => {
        if (open) {
            getDatasetListTree()
            run({
                current: 1,
                pageSize: 10,
            })
        } else {
            setAddType(AddType.EXIST)
            setSearchKey('')
            setDatasetTreeData([])
        }
    }, [open])

    return (
        <>
            {showTitle ? (
                <Button
                    className={classnames({
                        [`${className}`]: true,
                    })}
                    icon={<FontIcon name="icon-shujuji" />}
                    onClick={addDataset}
                    style={{ marginLeft: 8 }}
                >
                    <span style={{ paddingLeft: '4px' }}>
                        {__('添加到数据集')}
                    </span>
                </Button>
            ) : (
                <Tooltip placement="bottom" title={__('添加到数据集')}>
                    <FontIcon
                        name="icon-shujuji"
                        className={classnames({
                            [className]: true,
                        })}
                        onClick={addDataset}
                    />
                </Tooltip>
            )}
            <Modal
                open={open}
                title={__('添加到数据集')}
                width={640}
                maskClosable={false}
                onOk={onOk}
                onCancel={(e) => {
                    e.stopPropagation()
                    setFalse()
                    // 清空内容
                    form.resetFields()
                    setSelectedView(undefined)
                }}
            >
                <div
                    className={classnames(styles.addDatasetWrapper, {
                        [styles.exist]: addType === AddType.EXIST,
                        [styles.new]: addType === AddType.NEW,
                    })}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.mb10}>{__('选择数据集')}</div>
                    <Radio.Group
                        onChange={onChange}
                        value={addType}
                        className={styles.addDatasetType}
                    >
                        <Radio value={AddType.EXIST}>
                            {__('添加到已有数据集')}
                        </Radio>
                        <Radio value={AddType.NEW}>{__('新建数据集')}</Radio>
                    </Radio.Group>
                    <div
                        className={classnames(styles.addDatasetTab, {
                            [styles.hidden]: addType === AddType.EXIST,
                        })}
                    >
                        <Form layout="vertical" form={form}>
                            <Item
                                label={__('数据集名称')}
                                validateTrigger={['onBlur']}
                                rules={[
                                    {
                                        required: true,
                                        message: __('输入不能为空'),
                                    },
                                    { validator: validateName },
                                ]}
                                name="data_set_name"
                            >
                                <Input
                                    maxLength={128}
                                    placeholder={__('请输入')}
                                />
                            </Item>
                            <Item label={__('描述')} name="description">
                                <Input.TextArea
                                    maxLength={255}
                                    rows={4}
                                    placeholder={__('请输入')}
                                />
                            </Item>
                        </Form>
                    </div>
                    <div
                        className={classnames(styles.addDatasetTab, {
                            [styles.hidden]: addType === AddType.NEW,
                        })}
                    >
                        <SearchInput
                            placeholder={__('搜索数据集名称')}
                            value={searchKey}
                            onKeyChange={(value) => {
                                if (searchKey === value) return
                                setSearchKey(value)
                                run({
                                    current: 1,
                                    pageSize: 10,
                                    keyword: value,
                                })
                            }}
                        />
                        {loading ? (
                            <div className={styles.loader}>
                                <Loader />
                            </div>
                        ) : data?.list?.length ? (
                            <>
                                <div className={styles.addDatasetList}>
                                    <Radio.Group
                                        name="dataset"
                                        onChange={(e) => {
                                            setSelectedView(e.target.value)
                                        }}
                                    >
                                        <Space direction="vertical">
                                            {data?.list?.map((view) =>
                                                renderItem(view),
                                            )}
                                        </Space>
                                    </Radio.Group>
                                </div>
                                <div className={styles.addDatasetPage}>
                                    <Pagination size="small" {...pagination} />
                                </div>
                            </>
                        ) : (
                            <Empty
                                iconSrc={searchKey ? empty : dataEmpty}
                                desc={
                                    searchKey
                                        ? __('抱歉，没有找到相关内容')
                                        : __('暂无数据')
                                }
                            />
                        )}
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default AddDataset
