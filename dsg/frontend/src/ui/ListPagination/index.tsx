import React, { useEffect, useState } from 'react'
import { Pagination, PaginationProps } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { ListDefaultPageSize, ListPageSizerOptions, ListType } from '../const'

interface IListPagination extends PaginationProps {
    listType: ListType
    queryParams?: any
    listData?: any[]
    totalCount?: number
}

const ListPagination: React.FC<IListPagination> = ({
    listType = ListType.NarrowList,
    queryParams = {},
    listData,
    totalCount = 0,
    ...props
}) => {
    const defaultPageSize = ListDefaultPageSize[listType]
    return (
        <div className={styles.pagination}>
            <Pagination
                current={queryParams?.offset}
                pageSize={queryParams?.limit}
                className={styles.pagination}
                total={totalCount}
                showTotal={(total) => __('共${total}条', { total })}
                pageSizeOptions={ListPageSizerOptions[listType]}
                showSizeChanger={totalCount > defaultPageSize}
                showQuickJumper={totalCount > (queryParams?.limit || 0) * 8}
                hideOnSinglePage={totalCount <= defaultPageSize}
                {...props}
            />
        </div>
    )
}

export default ListPagination
