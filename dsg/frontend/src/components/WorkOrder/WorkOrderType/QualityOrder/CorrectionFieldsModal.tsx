import { Button, Modal, Space, Tooltip } from 'antd'
import { useEffect, useState } from 'react'

import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { SearchInput } from '@/ui'
import CorrectionTable from './CorrectionTable'
import __ from './locale'
import styles from './styles.module.less'

const ScoreTypeKey = ['all', '60', '70', '80', '90', '100']
const ScoreType = {
    all: __('全部'),
    '60': __('60分以下'),
    '70': __('70分以下'),
    '80': __('80分以下'),
    '90': __('90分以下'),
    '100': __('100分以下'),
}

const CorrectionFieldsModal = ({
    fields,
    bindKeys = [],
    visible,
    onClose,
    onSure,
}: any) => {
    const [rows, setRows] = useState<any[]>([])
    const [checkedKeys, setCheckedKeys] = useState<any[]>([])
    const [curType, setCurType] = useState('all')
    const [searchCondition, setSearchCondition] = useState({
        keyword: '',
        score: 0,
    })
    const [data, setData] = useState([])
    const [showData, setShowData] = useState([])

    const handleCheck = (selectedRowKeys, selectedRows) => {
        setRows(selectedRows)
        setCheckedKeys(selectedRowKeys)
    }

    const handleSure = () => {
        if (rows?.length) {
            onSure?.(rows)
        }
    }

    useEffect(() => {
        if (fields) {
            setData(fields)
            setShowData(fields)
        }
    }, [fields])

    const handleSearchScore = (key) => {
        setCurType(key)
        setSearchCondition((prev) => ({
            ...prev,
            score: key === 'all' ? 0 : Number(key),
        }))
    }

    useEffect(() => {
        if (searchCondition.score > 0 || searchCondition.keyword) {
            let newData = data
            if (searchCondition.keyword) {
                newData = newData.filter(
                    (it: any) =>
                        it?.field_business_name
                            ?.toLowerCase()
                            ?.includes(
                                searchCondition.keyword?.toLowerCase(),
                            ) ||
                        it?.field_technical_name
                            ?.toLowerCase()
                            ?.includes(searchCondition.keyword?.toLowerCase()),
                )
            }
            if (searchCondition.score > 0) {
                newData = newData.filter(
                    (it: any) => it?.score < searchCondition.score,
                )
            }
            setShowData(newData)
        } else {
            setShowData(data)
        }
    }, [data, searchCondition])

    return (
        <Modal
            title={__('选择整改字段')}
            open={visible}
            onCancel={onClose}
            maskClosable={false}
            destroyOnClose
            getContainer={false}
            width={1200}
            bodyStyle={{ height: 560, overflow: 'auto', paddingBottom: 0 }}
            footer={
                <div className={styles.drawerFootWrapper}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            columnGap: 6,
                        }}
                    >
                        <span>已选：</span>
                        <span>{rows?.length || 0}</span>
                        <FontIcon
                            name="icon-qingkong"
                            type={IconType.COLOREDICON}
                            style={{
                                cursor: 'pointer',
                                fontSize: '16px',
                                marginLeft: '10px',
                            }}
                            onClick={() => {
                                if (rows?.length) {
                                    setCheckedKeys([])
                                    setRows([])
                                }
                            }}
                        />
                    </div>
                    <div>
                        <Space size={8}>
                            <Button onClick={onClose} className={styles.btn}>
                                {__('取消')}
                            </Button>
                            <Tooltip
                                title={
                                    !rows?.length ? __('请选择整改字段') : ''
                                }
                            >
                                <Button
                                    onClick={handleSure}
                                    type="primary"
                                    className={styles.btn}
                                    disabled={!rows?.length}
                                >
                                    {__('确定')}
                                </Button>
                            </Tooltip>
                        </Space>
                    </div>
                </div>
            }
        >
            <div className={styles.fieldsModalWrapper}>
                <div className={styles.top}>
                    <div className={styles.scoreType}>
                        {ScoreTypeKey?.map((key) => (
                            <div
                                key={key}
                                onClick={() => handleSearchScore(key)}
                                className={key === curType ? styles.active : ''}
                            >
                                {ScoreType[key]}
                            </div>
                        ))}
                    </div>
                    <div>
                        <SearchInput
                            placeholder={__('搜索字段业务名称、技术名称')}
                            onKeyChange={(keyword) =>
                                setSearchCondition((prev) => ({
                                    ...prev,
                                    keyword,
                                }))
                            }
                        />
                    </div>
                </div>
                <div style={{ width: '100%', overflow: 'hidden' }}>
                    <CorrectionTable
                        bindKeys={bindKeys}
                        checkedKeys={checkedKeys}
                        readOnly
                        canCheck
                        onCheck={handleCheck}
                        data={showData}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default CorrectionFieldsModal
