import { useState, useRef, useEffect } from 'react'
import { Input, Button, Modal, Radio } from 'antd'
import { useDebounce } from 'ahooks'
import { noop, stubArray } from 'lodash'
import { SearchOutlined } from '@ant-design/icons'
import InfiniteScroll from 'react-infinite-scroll-component'
import __ from './locale'
import ResourcesDirTree from '../ResourcesDir/ResourcesDirTree'
import {
    Architecture,
    RescCatlgType,
    initSearchCondition,
} from '../ResourcesDir/const'
import styles from './styles.module.less'
import { formatError, getRescCatlgList } from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'

interface SelectedDataCatalogType {
    onChange?: (value) => void
    value?: {
        name: string
        id: string
        code: string
    }
    placeholder?: string
}

const SelectedDataCatalog = ({
    onChange = noop,
    value,
    placeholder,
}: SelectedDataCatalogType) => {
    const [open, setOpen] = useState<boolean>(false)
    const [keyword, setKeyword] = useState<string>('')
    const ref: any = useRef()
    const [selectedDepartment, setSelectedDepartment] = useState<string>('')
    const [totalCount, setTotalCount] = useState<number>(0)
    const [selectedNodesInfo, setSelectedNodesInfo] = useState<any>(null)
    const [dataCatalogData, setDataCatalogData] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(false)
    const [selectedDirData, setSelectedDirData] = useState<
        | {
              name: string
              id: string
              code: string
          }
        | undefined
    >(undefined)

    useEffect(() => {
        if (selectedNodesInfo) {
            getDataCatalogsList(selectedNodesInfo, [])
        }
    }, [selectedNodesInfo])

    useEffect(() => {
        getDataCatalogsList(
            {
                ...initSearchCondition,
                keyword,
            },
            [],
        )
    }, [keyword])

    const getDataCatalogsList = async (params, initData) => {
        try {
            setLoading(true)
            const { total_count, entries } = await getRescCatlgList({
                ...params,
                limit: 20,
                offset: initData.length / 20 + 1,
            })
            setTotalCount(total_count)
            if (entries?.length) {
                setDataCatalogData([...initData, ...entries])
            } else {
                setDataCatalogData(initData)
            }
            setLoading(false)
        } catch (ex) {
            setLoading(false)
            formatError(ex)
        }
    }

    return (
        <div className={styles.selectDataCatalog}>
            <div className={styles.selectDataCatalogInput}>
                <Input
                    placeholder={__('请选择')}
                    readOnly
                    value={value?.name || undefined}
                />
            </div>
            <div className={styles.selectDataCatalogBtn}>
                <Button
                    className={styles.btn}
                    onClick={() => {
                        setOpen(true)
                        if (value?.id) {
                            setSelectedDirData(value)
                        } else {
                            setSelectedDirData(undefined)
                        }
                    }}
                >
                    {__('选择')}
                </Button>
            </div>

            <Modal
                open={open}
                title={__('选择资源目录')}
                width={644}
                bodyStyle={{
                    padding: 0,
                    height: '450px',
                }}
                maskClosable={false}
                onCancel={() => {
                    setOpen(false)
                    setSelectedDirData(undefined)
                    setKeyword('')
                }}
                onOk={() => {
                    onChange(selectedDirData)
                    setOpen(false)
                    setSelectedDirData(undefined)
                }}
            >
                <div className={styles.selectDataCatalogModal}>
                    <div>
                        <SearchInput
                            placeholder={__('搜索资源目录名称')}
                            value={keyword}
                            onKeyChange={(val: string) => {
                                setKeyword(val)
                            }}
                        />
                    </div>
                    {keyword ? (
                        <div className={styles.searchContent}>
                            <div className={styles.searchTitle}>
                                {__('搜索结果')}
                            </div>
                            <div
                                className={styles.selectedListContent}
                                id="scrollableDiv"
                            >
                                <InfiniteScroll
                                    hasMore={
                                        dataCatalogData.length < totalCount
                                    }
                                    endMessage={
                                        dataCatalogData.length === 0 ? (
                                            <Empty
                                                desc={__(
                                                    '抱歉，没有找到相关内容',
                                                )}
                                            />
                                        ) : (
                                            ''
                                        )
                                    }
                                    loader={
                                        <div className={styles.listLoading}>
                                            <Loader />
                                        </div>
                                    }
                                    next={() => {
                                        getDataCatalogsList(
                                            {
                                                ...initSearchCondition,
                                                keyword,
                                            },
                                            dataCatalogData,
                                        )
                                    }}
                                    dataLength={dataCatalogData.length}
                                    scrollableTarget="scrollableDiv"
                                >
                                    {dataCatalogData.map((currentCatalog) => {
                                        const { id, title, code } =
                                            currentCatalog
                                        return (
                                            <div
                                                className={styles.selectedItem}
                                                onClick={() => {
                                                    setSelectedDirData({
                                                        id,
                                                        code,
                                                        name: title,
                                                    })
                                                }}
                                            >
                                                <div className={styles.dirInfo}>
                                                    <div
                                                        title={
                                                            currentCatalog.title
                                                        }
                                                        className={
                                                            styles.dirName
                                                        }
                                                    >
                                                        {currentCatalog.title}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.orgName
                                                        }
                                                        title={
                                                            currentCatalog.orgname
                                                        }
                                                    >
                                                        {currentCatalog.orgname}
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.selectedBtn
                                                    }
                                                >
                                                    <Radio
                                                        checked={
                                                            currentCatalog.id ===
                                                            selectedDirData?.id
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </InfiniteScroll>
                                {/* {loading ? (
                                    <div className={styles.listLoading}>
                                        <Loader />
                                    </div>
                                ) : dataCatalogData.length ? (
                                    dataCatalogData.map((currentCatalog) => {
                                        const { id, title, code } =
                                            currentCatalog
                                        return (
                                            <div
                                                className={styles.selectedItem}
                                                onClick={() => {
                                                    setSelectedDirData({
                                                        id,
                                                        code,
                                                        name: title,
                                                    })
                                                }}
                                            >
                                                <div className={styles.dirInfo}>
                                                    <div
                                                        title={
                                                            currentCatalog.title
                                                        }
                                                        className={
                                                            styles.dirName
                                                        }
                                                    >
                                                        {currentCatalog.title}
                                                    </div>
                                                    <div
                                                        className={
                                                            styles.orgName
                                                        }
                                                        title={
                                                            currentCatalog.orgname
                                                        }
                                                    >
                                                        {currentCatalog.orgname}
                                                    </div>
                                                </div>
                                                <div
                                                    className={
                                                        styles.selectedBtn
                                                    }
                                                >
                                                    <Radio
                                                        checked={
                                                            currentCatalog.id ===
                                                            selectedDirData?.id
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div>
                                        <Empty />
                                    </div>
                                )} */}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.bodyContent}>
                            <div className={styles.selectedContent}>
                                <ResourcesDirTree
                                    getCurTabKey={(tabKey) => {
                                        // setSelectedNodesInfo({
                                        //     ...initSearchCondition,
                                        // })
                                    }}
                                    getSelectedNode={(department, tabKey) => {
                                        let paramsQuery = {}
                                        if (tabKey === RescCatlgType.ORGSTRUC) {
                                            paramsQuery = {
                                                orgcode: department?.id,
                                            }
                                        } else if (
                                            tabKey ===
                                            RescCatlgType.RESC_CLASSIFY
                                        ) {
                                            paramsQuery = {
                                                categoryID: department?.id,
                                            }
                                        } else if (
                                            tabKey === RescCatlgType.DOAMIN
                                        ) {
                                            paramsQuery = {
                                                business_domain_id:
                                                    department?.id,
                                            }
                                        }
                                        setSelectedNodesInfo({
                                            ...initSearchCondition,
                                            ...paramsQuery,
                                        })
                                    }}
                                    ref={ref}
                                    initNodeType={[
                                        Architecture.ORGANIZATION,
                                        Architecture.DEPARTMENT,
                                    ].join()}
                                    isShowAll
                                    isShowSearch={false}
                                />
                            </div>

                            <div className={styles.selectedDirContent}>
                                <div className={styles.selectedDirTitle}>
                                    {__('资源目录')}
                                </div>
                                <div
                                    className={styles.selectDirContent}
                                    id="scrollableDiv"
                                >
                                    <InfiniteScroll
                                        hasMore={
                                            dataCatalogData.length < totalCount
                                        }
                                        endMessage={
                                            dataCatalogData.length === 0 ? (
                                                <Empty
                                                    iconSrc={dataEmpty}
                                                    desc={__('暂无数据')}
                                                />
                                            ) : (
                                                ''
                                            )
                                        }
                                        loader=""
                                        next={() => {
                                            getDataCatalogsList(
                                                {
                                                    ...initSearchCondition,
                                                    keyword: '',
                                                },
                                                dataCatalogData,
                                            )
                                        }}
                                        dataLength={dataCatalogData.length}
                                        scrollableTarget="scrollableDiv"
                                    >
                                        {dataCatalogData.map(
                                            (currentCatalog) => {
                                                const { id, title, code } =
                                                    currentCatalog
                                                return (
                                                    <div
                                                        className={
                                                            styles.selectDirContentItem
                                                        }
                                                        onClick={() => {
                                                            setSelectedDirData({
                                                                id,
                                                                name: title,
                                                                code,
                                                            })
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.dirName
                                                            }
                                                            title={
                                                                currentCatalog.title
                                                            }
                                                        >
                                                            {
                                                                currentCatalog.title
                                                            }
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.selectedBtn
                                                            }
                                                        >
                                                            <Radio
                                                                checked={
                                                                    currentCatalog.id ===
                                                                    selectedDirData?.id
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            },
                                        )}
                                    </InfiniteScroll>
                                    {/* {loading ? (
                                        <div className={styles.listLoading}>
                                            <Loader />
                                        </div>
                                    ) : dataCatalogData.length ? (
                                        dataCatalogData.map(
                                            (currentCatalog) => {
                                                const { id, title, code } =
                                                    currentCatalog
                                                return (
                                                    <div
                                                        className={
                                                            styles.selectDirContentItem
                                                        }
                                                        onClick={() => {
                                                            setSelectedDirData({
                                                                id,
                                                                name: title,
                                                                code,
                                                            })
                                                        }}
                                                    >
                                                        <div
                                                            className={
                                                                styles.dirName
                                                            }
                                                            title={
                                                                currentCatalog.title
                                                            }
                                                        >
                                                            {
                                                                currentCatalog.title
                                                            }
                                                        </div>
                                                        <div
                                                            className={
                                                                styles.selectedBtn
                                                            }
                                                        >
                                                            <Radio
                                                                checked={
                                                                    currentCatalog.id ===
                                                                    selectedDirData?.id
                                                                }
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            },
                                        )
                                    ) : (
                                        <div>
                                            <Empty
                                                iconSrc={dataEmpty}
                                                desc={__('暂无数据')}
                                            />
                                        </div>
                                    )} */}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default SelectedDataCatalog
