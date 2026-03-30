import { Modal, List, Progress, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { forwardRef, useEffect, useState } from 'react'
import styles from './styles.module.less'
import {
    SearchInput,
    ListType,
    ListDefaultPageSize,
    ListPagination,
    Empty,
    Loader,
} from '@/ui'
import { getRecognitionAlgorithms, formatError } from '@/core'
import __ from './locale'
import dataEmpty from '@/assets/dataEmpty.svg'

// 初始搜索条件
const initialQueryParams = {
    offset: 1,
    limit: ListDefaultPageSize[ListType.CardList],
    sort: 'name',
    direction: 'desc',
    trim_default: true,
}
const AlgorithmTemplateModal = (props: any, ref) => {
    const { open, onClose, onOk } = props
    const navigate = useNavigate()

    const [data, setData] = useState<any[]>([])
    // 查询params
    const [queryParams, setQueryParams] = useState<any>(initialQueryParams)
    // 总数
    const [total, setTotal] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        queryAssemblyLineList(initialQueryParams)
    }, [])

    const handlePageChange = (offset: number, limit: number) => {
        queryAssemblyLineList({
            ...queryParams,
            offset,
            limit,
        })
    }

    const empty = () => {
        return (
            <Empty
                style={{ height: '400px', marginTop: '100px' }}
                iconSrc={dataEmpty}
                desc={
                    <div style={{ textAlign: 'center' }}>
                        <div>{__('暂无可用模版')}</div>
                        <div>
                            {__('可进入「')}
                            <span
                                style={{
                                    color: '#126ee3',
                                    cursor: 'pointer',
                                }}
                                onClick={() =>
                                    navigate(
                                        '/dataLevelManage/recognition-algorithm-config',
                                    )
                                }
                            >
                                {__('算法模版')}
                            </span>
                            {__('」进行添加')}
                        </div>
                    </div>
                }
            />
        )
    }

    // 获取工作流程列表
    const queryAssemblyLineList = async (params: any) => {
        try {
            setLoading(true)
            const { entries, total_count } = await getRecognitionAlgorithms(
                params,
            )
            setData(entries)
            setQueryParams(params)
            setTotal(total_count)
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }
    const renderListItem = (item) => {
        return (
            <List.Item key={item.res_id} className={styles['list-item']}>
                <div className={styles['item-container']}>
                    <div className={styles['item-name']}>
                        <div
                            className={styles['item-name-text']}
                            title={item.name}
                        >
                            {item.name}
                        </div>
                        <div
                            className={styles['item-name-desc']}
                            title={item.algorithm}
                        >
                            {__('算法信息：')} {item.algorithm}
                        </div>
                    </div>
                    <Button type="primary" onClick={() => onOk(item)}>
                        {__('导入')}
                    </Button>
                </div>
            </List.Item>
        )
    }
    return (
        <Modal
            open={open}
            title="算法模版"
            footer={null}
            width={760}
            getContainer={false}
            maskClosable={false}
            onCancel={() => onClose()}
        >
            {loading ? (
                <div style={{ height: '500px' }}>
                    <Loader />
                </div>
            ) : !data.length && !queryParams.keyword ? (
                empty()
            ) : (
                <div className={styles.tempModalWrapper}>
                    <SearchInput
                        placeholder={__('搜索模版名称')}
                        value={queryParams.keyword}
                        onKeyChange={(keyword: string) =>
                            queryAssemblyLineList({ ...queryParams, keyword })
                        }
                        onChange={(e) => {
                            const { value } = e.target
                            if (!value) {
                                queryAssemblyLineList({
                                    ...queryParams,
                                    keyword: undefined,
                                })
                            }
                        }}
                        className={styles.searchInput}
                        style={{ width: '100%' }}
                        maxLength={128}
                    />
                    <List
                        dataSource={data}
                        renderItem={(item) => renderListItem(item)}
                        locale={{
                            emptyText: <Empty />,
                        }}
                    />
                    <ListPagination
                        listType={ListType.CardList}
                        queryParams={queryParams}
                        totalCount={total}
                        onChange={handlePageChange}
                        className={styles.pagination}
                    />
                </div>
            )}
        </Modal>
    )
}

export default forwardRef(AlgorithmTemplateModal)
