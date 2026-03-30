import { useState, useEffect, useMemo, useRef } from 'react'
import moment from 'moment'
import { Button } from 'antd'
import { trim } from 'lodash'
import { formatError, getFileCatalogDetail } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { DetailsLabel, SearchInput, Loader } from '@/ui'
import { LabelTitle } from '@/components/ResourcesDir/BaseInfo'
import { fileInfoDetailsList } from './helper'
import FilesTable from '../DataFiles/FileTable'
import { getActualUrl } from '@/utils'

interface IFileInfoDetail {
    isMarket?: boolean
    // 目录关联的文件雪花id
    fileId?: string
}

const FileInfoDetail = ({ isMarket = false, fileId = '' }: IFileInfoDetail) => {
    const [loading, setLoading] = useState<boolean>(true)
    const [fileInfo, setFileInfo] = useState<any>({})
    const [fileList, setFileList] = useState<Array<any>>()

    const fileTableRef = useRef<any>()
    const [totalCount, setTotalCount] = useState<number>(0)
    const [basicInfoDetailsData, setBasicInfoDetailsData] =
        useState<any[]>(fileInfoDetailsList)

    const rightNode = useMemo(() => {
        return (
            !!totalCount && (
                <SearchInput
                    placeholder={__('搜索文件名称')}
                    style={{ width: 246 }}
                    maxLength={255}
                    onKeyChange={(val: string) => {
                        fileTableRef?.current?.handleKeywordChange?.(trim(val))
                    }}
                />
            )
        )
    }, [totalCount])

    // 获取文件详情
    const getFileInfo = async () => {
        try {
            setLoading(true)
            const res = await getFileCatalogDetail(fileId)
            setFileInfo(res)
            valueDetailsInfo(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!fileId) return
        getFileInfo()
    }, [fileId])

    const valueDetailsInfo = (data: any, categorys?: any[]) => {
        if (!data) return
        const list = basicInfoDetailsData?.map((item) => {
            const itemList = item?.list.map((it) => {
                const { key, subKey } = it
                const value = key && subKey ? data[key]?.[subKey] : data?.[key]
                const obj = { ...it, value: value || '--' }

                // 资源目录详情中-名称为连接形式
                if (key === 'name' && !isMarket) {
                    obj.render = () => {
                        return (
                            <Button
                                type="link"
                                onClick={() => {
                                    // 查看详情
                                    const linkUrl = getActualUrl(
                                        `/data-files/detail?id=${data.id}&backUrl=${window.location.pathname}`,
                                    )
                                    window.open(linkUrl, '_blank')
                                }}
                            >
                                {data[key] || '--'}
                            </Button>
                        )
                    }
                }
                if (key === 'updated_at') {
                    obj.value = data[key]
                        ? moment(data[key]).format('YYYY-MM-DD HH:mm:ss')
                        : '--'
                }
                return obj
            })
            return {
                ...item,
                list: itemList,
            }
        })
        setBasicInfoDetailsData(list.filter((item) => item.list?.length))
    }

    return (
        <div className={styles.fileInfoDetailWrapper}>
            {loading ? (
                <Loader />
            ) : (
                <>
                    {basicInfoDetailsData.map((item) => {
                        return (
                            <div key={item.key}>
                                <LabelTitle label={item.label} />

                                <div style={{ marginBottom: '20px' }}>
                                    <DetailsLabel
                                        wordBreak
                                        labelWidth="160px"
                                        detailsList={item.list}
                                    />
                                </div>
                            </div>
                        )
                    })}
                    <LabelTitle label={__('附件清单')} rightNode={rightNode} />
                    <div className={styles.detailsLabelBox}>
                        {fileId && (
                            <FilesTable
                                ref={fileTableRef}
                                id={fileId}
                                onListResCallback={(res) => {
                                    setTotalCount(res?.total_count || 0)
                                }}
                            />
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default FileInfoDetail
