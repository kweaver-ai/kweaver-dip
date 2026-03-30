import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Drawer, Button, Tabs, Space, message } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import TagsSelect from '@/components/GeneralConfig/TagsSelect'
import {
    formatError,
    getTimestampBlacklist,
    setTimestampBlacklist,
} from '@/core'
import { cnLowercaseEnNumNameReg } from '@/utils'

interface IFieldBlackList {
    open: boolean
    onClose: () => void
}

const FieldBlackList: React.FC<IFieldBlackList> = ({ open, onClose }) => {
    const [blackList, setBlackList] = useState<string[]>([])

    useEffect(() => {
        getBlacklist()
    }, [])

    const getBlacklist = async () => {
        try {
            const res = await getTimestampBlacklist()
            setBlackList(res)
        } catch (err) {
            formatError(err)
        }
    }

    const updateBlacklist = async (val) => {
        try {
            const res = await setTimestampBlacklist({
                timestamp_blacklist: val,
            })
        } catch (err) {
            formatError(err)
        }
    }
    return (
        <Drawer
            title={__('字段黑名单')}
            placement="right"
            onClose={onClose}
            open={open}
            width={980}
            className={styles.taskWrapper}
            push={false}
        >
            <div className={styles.drawerBox}>
                <div className={styles.title}>
                    {__('黑名单配置')}
                    <span className={styles.subTitle}>
                        {__('( 配置库表探查业务更新时间字段黑名单 )')}
                    </span>
                </div>
                <div className={styles.configItem}>
                    <div className={styles.text}>
                        <div className={styles.textTitle}>
                            {__('以下字段不会被探查为业务更新时间字段')}
                        </div>
                        <TagsSelect
                            onValChange={(val) => {
                                setBlackList(val)
                                updateBlacklist(val)
                            }}
                            validateRule={{
                                ruleReg: cnLowercaseEnNumNameReg,
                                msg: __(
                                    '仅支持中文、小写字母、数字及下划线，且不能以数字开头',
                                ),
                            }}
                            value={blackList}
                            maxLength={128}
                        />
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default FieldBlackList
