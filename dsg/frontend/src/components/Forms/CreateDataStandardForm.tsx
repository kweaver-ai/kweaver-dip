import { Button, Modal, Radio, Space } from 'antd'
import { FC, useEffect, useRef, useState, useMemo } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import __ from './locale'
import styles from './styles.module.less'
import { Empty, Loader, SearchInput } from '@/ui'
import { RefreshBtn } from '../ToolbarComponents'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import {
    formatError,
    formsCreate,
    formsQuery,
    SortDirection,
    transformQuery,
} from '@/core'
import { FormTableKind, NewFormType } from './const'
import SelFileByType from '../CAFileManage/SelFileByType'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

import dataEmpty from '../../assets/dataEmpty.svg'

interface CreateDataStandardFormProps {
    visible: boolean
    onClose: () => void
    onConfirm: () => void
    mid: string
    taskId?: string
}
const CreateDataStandardForm: FC<CreateDataStandardFormProps> = ({
    visible,
    onClose,
    onConfirm,
    mid,
    taskId,
}) => {
    const [keyword, setKeyword] = useState<string>('')

    const [originForms, setOriginForms] = useState<Array<any>>([])
    // 关联文件
    const [fileList, setFileList] = useState<Array<any>>()

    const [totalCount, setTotalCount] = useState<number>(0)

    const [selectedFormId, setSelectedFormId] = useState<string>('')

    const { isDraft, selectedVersion } = useBusinessModelContext()

    const scrollRef = useRef(null)

    const scrollListId = 'scrollableDiv'

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    useEffect(() => {
        getOriginForms([])
    }, [keyword])

    const handleConfirmForm = async () => {
        try {
            const selectedFormInfo = originForms.find(
                (it) => it.id === selectedFormId,
            )
            // 发送请求
            if (selectedFormInfo) {
                await formsCreate(mid, {
                    name: selectedFormInfo.name,
                    description: '',
                    table_kind: FormTableKind.DATA_STANDARD,
                    technical_name: selectedFormInfo.technical_name,
                    from_table_id: selectedFormInfo.id,
                    stand_file_ids: fileList?.map(
                        (item) => item?.value || item?.id || item,
                    ),
                    task_id: taskId,
                })
            }
            onConfirm()
        } catch (err) {
            formatError(err)
        }
    }

    const handleReload = () => {
        getOriginForms([])
    }

    const getOriginForms = async (lastData: Array<any>) => {
        try {
            const res = await formsQuery(mid, {
                offset: Math.ceil(lastData.length / 20) + 1,
                limit: 20,
                table_kind: FormTableKind.DATA_ORIGIN,
                direction: SortDirection.DESC,
                sort: 'updated_at',
                keyword,
                ...versionParams,
            })
            setTotalCount(res.total_count)
            setOriginForms([...lastData, ...res.entries])
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <Modal
            title={__('新建数据标准表')}
            width={480}
            onCancel={onClose}
            footer={
                <Space size={8}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Button onClick={handleConfirmForm} type="primary">
                        {__('确认生成')}
                    </Button>
                </Space>
            }
            open={visible}
        >
            {!originForms?.length && !keyword ? (
                <div className={styles.standardFormEmptyContainer}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={
                            <div className={styles.emptyDesc}>
                                <div>{__('此模型下暂无可用的数据原始表')}</div>
                                <div>{__('请先生成数据原始表')}</div>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div className={styles.standardFormContainer}>
                    <div className={styles.title}>
                        {__('请选择数据原始表，确认后将生成数据标准表')}
                    </div>
                    <div className={styles.contentWrapper}>
                        <div className={styles.itemTitle}>
                            {__('数据原始表')}
                        </div>
                        <div className={styles.searchBar}>
                            <Space size={4}>
                                <SearchInput
                                    onKeyChange={(value) => setKeyword(value)}
                                    style={{
                                        width: 364,
                                    }}
                                    placeholder={__('搜索数据原始表')}
                                />
                                <RefreshBtn onClick={handleReload} />
                            </Space>
                        </div>
                        <div
                            ref={scrollRef}
                            id={scrollListId}
                            className={styles.scrollWrapper}
                        >
                            <InfiniteScroll
                                hasMore={originForms.length < totalCount}
                                loader={
                                    <div
                                        className={styles.listLoading}
                                        // hidden={!listDataLoading}
                                    >
                                        <Loader />
                                    </div>
                                }
                                next={() => {
                                    getOriginForms(originForms)
                                }}
                                dataLength={originForms.length}
                                scrollableTarget={scrollListId}
                            >
                                {originForms.map((item) => (
                                    <div
                                        className={styles.itemWrapper}
                                        onClick={() => {
                                            setSelectedFormId(item.id)
                                        }}
                                    >
                                        <Radio
                                            checked={selectedFormId === item.id}
                                        />
                                        <div className={styles.iconWrapper}>
                                            <FontIcon
                                                type={IconType.COLOREDICON}
                                                name="icon-shujumuluguanli1"
                                            />
                                        </div>
                                        <div className={styles.textWrapper}>
                                            <div
                                                className={styles.firstText}
                                                title={item.name}
                                            >
                                                {item.name || '--'}
                                            </div>
                                            <div
                                                className={styles.lastText}
                                                title={item.technical_name}
                                            >
                                                {item.technical_name || '--'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </InfiniteScroll>
                        </div>
                    </div>
                    <div className={styles.selFileTitle}>
                        {__('关联标准文件')}
                    </div>

                    {/* 关联标准文件 */}
                    <SelFileByType
                        value={fileList}
                        onChange={(val) => {
                            setFileList(val)
                        }}
                    />
                </div>
            )}
        </Modal>
    )
}

export default CreateDataStandardForm
