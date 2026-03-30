import React, { useEffect, useMemo, useState } from 'react'
import { Modal } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { format } from 'sql-formatter'
import ReactCodeMirror, { EditorView } from '@uiw/react-codemirror'
import { vscodeLight } from '@uiw/codemirror-theme-vscode'
import { sql } from '@codemirror/lang-sql'
import styles from './styles.module.less'
import __ from './locale'
import { formatError, getFusionPreviewSql } from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface ISqlViewModal {
    inMode?: 'view' | 'edit'
    sqlViewData?: any
    open: boolean
    onClose: () => void
}

const SqlViewModal = ({
    inMode = 'view',
    sqlViewData,
    open,
    onClose,
}: ISqlViewModal) => {
    const [loading, setLoading] = useState(false)
    const [sqlText, setSqlText] = useState('')

    const getSqlData = async () => {
        try {
            setLoading(true)
            if (sqlViewData?.exec_sql && inMode === 'view') {
                setSqlText(sqlViewData?.exec_sql)
            } else {
                const res = await getFusionPreviewSql({
                    datasource_id: sqlViewData?.datasource_id,
                    table_name: sqlViewData?.table_name,
                    scene_sql: sqlViewData?.scene_sql,
                    fields: sqlViewData?.fields,
                })
                setSqlText(res.hua_ao_sql)
            }
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (open) {
            getSqlData()
        } else {
            setSqlText('')
        }
    }, [sqlViewData, open])

    // 格式化 sql 语句
    const getFormatSql = (value) => {
        try {
            return format(value, {
                // language: 'mysql',
                tabWidth: 2,
                keywordCase: 'upper',
                linesBetweenQueries: 2,
            })
        } catch (err) {
            return value
        }
    }

    return (
        <Modal
            title={__('预览融合语句')}
            width={800}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            destroyOnClose
            footer={null}
            getContainer={false}
            className={styles.sqlViewModalWrap}
            bodyStyle={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 24px',
                height: 545,
            }}
        >
            <div className={styles.sqlViewModalTitle}>
                <InfoCircleOutlined className={styles.sqlViewModalIcon} />
                <span>{__('以下是系统自动生成的SQL融合语句')}</span>
            </div>
            {loading ? (
                <div style={{ marginTop: 140 }}>
                    <Loader />
                </div>
            ) : sqlText ? (
                <div className={styles.sqlWrap}>
                    <ReactCodeMirror
                        value={getFormatSql(sqlText)}
                        theme={vscodeLight}
                        extensions={[sql(), EditorView.lineWrapping]}
                        readOnly
                        editable={false}
                        basicSetup={{
                            highlightActiveLine: false,
                        }}
                        height="467px"
                        style={{
                            backgroundColor: '#fff',
                        }}
                    />
                </div>
            ) : (
                <Empty
                    desc={__('暂无数据')}
                    iconSrc={dataEmpty}
                    style={{ marginTop: 60 }}
                />
            )}
        </Modal>
    )
}

export default SqlViewModal
