import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import { LeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@/utils'
import styles from './styles.module.less'
import GlobalMenu from '../GlobalMenu'
import __ from './locale'
import { AttachmentContainer, BasicCantainer, LabelTitle } from './helper'
import FilesTable from './FileTable'
import { getFileCatalogDetail, IFileCatalogDetail } from '@/core'

const ApiDetailContent = (props: any) => {
    const query = useQuery()
    const navigator = useNavigate()
    const [id, setId] = useState('')
    const tableRef = useRef<any>()
    const [fileDetail, setFileDetail] = useState<IFileCatalogDetail>()
    const [fileConfig, setFileConfig] = useState<Array<any>>([])

    useEffect(() => {
        const dataId = query.get('id')
        if (dataId) {
            setId(dataId)
            getFileDetail(dataId)
        }
    }, [query])

    /**
     * 获取文件详情
     * @param dataId
     */
    const getFileDetail = async (dataId: string) => {
        const res = await getFileCatalogDetail(dataId)
        setFileDetail(res)
        getFileConfig(res)
    }

    /**
     * 获取文件配置
     * @param data
     */
    const getFileConfig = (data) => {
        const config = [
            {
                label: __('基础信息'),
                list: [
                    {
                        key: 'name',
                        label: __('文件资源名称'),
                        value: data.name || '--',
                        span: 12,
                    },
                    {
                        key: 'code',
                        label: __('编码'),
                        value: data.code || '--',
                        span: 12,
                    },
                    {
                        key: 'department',
                        label: __('所属部门'),
                        value: (
                            <span title={data.department_path || '--'}>
                                {data.department || '--'}
                            </span>
                        ),
                        span: 12,
                    },
                    {
                        key: 'created_at',
                        label: __('创建时间'),
                        value: moment(data.created_at).format(
                            'YYYY-MM-DD HH:mm:ss',
                        ),
                        span: 12,
                    },
                    {
                        key: 'creator_name',
                        label: __('创建人'),
                        value: data.creator_name || '--',
                        span: 12,
                    },
                    {
                        key: 'updated_at',
                        label: __('更新时间'),
                        value: moment(data.updated_at).format(
                            'YYYY-MM-DD HH:mm:ss',
                        ),
                        span: 12,
                    },
                    {
                        key: 'updater_name',
                        label: __('更新人'),
                        value: data.updater_name || '--',
                        span: 12,
                    },
                    {
                        key: 'description',
                        label: __('描述'),
                        value: data.description || __('暂无描述'),
                        span: 24,
                    },
                ],
            },
        ]
        setFileConfig(config)
    }

    const handleReturn = () => {
        const backUrl = `/dataService/interfaceService`
        if (window.history.length > 2) {
            navigator(-1)
        } else {
            navigator(backUrl)
        }
    }
    return (
        <div className={styles.dataFileDetailWrapper}>
            <div className={styles.title}>
                <GlobalMenu />
                <div onClick={handleReturn} className={styles.returnInfo}>
                    <LeftOutlined className={styles.returnArrow} />
                    <span className={styles.returnText}>{__('返回')}</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.titleText}>{__('数据文件详情')}</div>
            </div>
            <div className={styles.detailsContainer}>
                <BasicCantainer basicCantainerContent={fileConfig} />

                <div>
                    <LabelTitle label={__('附件信息')} />
                    <div className={styles.detailsLabelBox}>
                        {id && <FilesTable ref={tableRef} id={id} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ApiDetailContent
