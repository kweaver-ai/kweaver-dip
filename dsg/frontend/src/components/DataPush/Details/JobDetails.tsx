import React, { useState, useEffect, useMemo } from 'react'
import { Modal } from 'antd'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import DetailsGroup from './DetailsGroup'
import { renderEmpty, StatusDot, formatTotalTime } from '../helper'
import { executeTypeMap, jobStatusMap } from '../const'
import { formatTime } from '@/utils'

interface IJobDetails {
    jobData?: any // 作业信息
    open: boolean
    onClose: () => void
}

/**
 * 数据推送作业详情
 */
const JobDetails = ({ jobData, open, onClose }: IJobDetails) => {
    // useEffect(() => {
    //     if (open) {

    //     }
    // }, [open])

    const content = [
        {
            key: 'name',
            label: __('作业名称'),
            value: '',
            span: 24,
            render: (value, record) =>
                `${record.name} - ${record.request_time}`,
        },
        {
            key: 'status',
            label: __('状态'),
            value: '',
            span: 24,
            render: (value, record) => (
                <StatusDot data={jobStatusMap[record.status]} />
            ),
        },
        {
            key: 'sync_method',
            label: __('执行方式'),
            value: '',
            span: 24,
            render: (value, record) =>
                value === '手动执行' ? __('手动') : __('自动'),
        },
        {
            key: 'sync_time',
            label: __('耗时'),
            value: '',
            span: 24,
            render: (value) => (value ? formatTotalTime(Number(value)) : '--'),
        },
        {
            key: 'start_time',
            label: __('请求时间'),
            value: '',
            span: 24,
            render: (value, record) => (value ? formatTime(value) : '--'),
        },
        {
            key: 'end_time',
            label: __('完成时间'),
            value: '',
            span: 24,
            render: (value, record) => (value ? formatTime(value) : '--'),
        },
        {
            key: 'sync_count',
            label: __('推送总数'),
            value: '',
            span: 24,
        },
        {
            key: 'sync_success_count',
            label: __('推送成功数'),
            value: '',
            span: 24,
        },
        {
            key: 'source_db_count_before',
            label: __('源数据库总量（推送前）'),
            value: '',
            span: 24,
        },
        {
            key: 'target_db_count_before',
            label: __('目标库数据总量（推送前）'),
            value: '',
            span: 24,
        },
        {
            key: 'target_db_count_after',
            label: __('目标库数据总量（推送后）'),
            value: '',
            span: 24,
        },
        {
            key: 'error_info',
            label: __('报错信息'),
            value: '',
            span: 24,
        },
    ]

    return (
        <Modal
            width={480}
            open={open}
            title={__('详情')}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            footer={null}
            bodyStyle={{
                maxHeight: 521,
                minHeight: 300,
                padding: 16,
                overflow: 'hidden auto',
            }}
            onCancel={onClose}
        >
            <div className={styles.jobDetails}>
                {jobData ? (
                    <div className={styles.group}>
                        <DetailsGroup
                            config={content}
                            data={jobData}
                            labelWidth="200px"
                        />
                    </div>
                ) : (
                    renderEmpty()
                )}
            </div>
        </Modal>
    )
}

export default JobDetails
