import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import DetailDialog from './DetailDialog'
import styles from './styles.module.less'
import __ from './locale'
import { getRescDirDetail, getInfoCatlgDetailByOper } from '@/core'

const InfoCatlgAudit = ({ props }: any) => {
    const {
        props: {
            data: { title, code, id, version, submitter_name, submit_time },
            process: { audit_type },
        },
    } = props
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [detailDisable, setDetailDisable] = useState(false)

    const viewDetail = () => {
        setDetailDialogOpen(true)
    }

    const getRescDir = async () => {
        try {
            await getInfoCatlgDetailByOper(id)
            setDetailDisable(false)
        } catch (error) {
            if (error?.data?.code === 'DataCatalog.Public.ResourceNotExisted') {
                setDetailDisable(true)
            }
        }
    }

    useEffect(() => {
        if (id) {
            getRescDir()
        }
    }, [id])

    const handleCancel = () => {
        setDetailDialogOpen(false)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>{__('目录名称：')}</div>
                <div className={styles.texts}>{title || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>
                    {`信息资源${__('目录编号：')}`}
                </div>
                <div className={styles.texts}>{code || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('目录版本：')}</div>
                <div className={styles.texts}>{version || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起人：')}</div>
                <div className={styles.texts} title={submitter_name || ''}>
                    {submitter_name || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起时间：')}</div>
                <div className={styles.texts}>
                    {moment(submit_time || '').format('YYYY-MM-DD HH:mm')}
                </div>
            </div>
            {audit_type !== 'af-data-catalog-offline' && (
                <div className={styles.text}>
                    <div className={classnames(styles.clums, styles.details)}>
                        {__('详情：')}
                    </div>
                    <Button
                        className={classnames(styles.texts, styles.link)}
                        onClick={viewDetail}
                        disabled={detailDisable}
                        title={
                            detailDisable
                                ? __('信息资源目录已被删除，无法查看')
                                : ''
                        }
                        type="text"
                    >
                        {__('查看全部')}
                    </Button>
                </div>
            )}
            {detailDialogOpen ? (
                <DetailDialog
                    id={id}
                    open={detailDialogOpen}
                    onCancel={handleCancel}
                />
            ) : null}
        </div>
    )
}

export default InfoCatlgAudit
