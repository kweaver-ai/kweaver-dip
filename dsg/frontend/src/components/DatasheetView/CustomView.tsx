import React, { useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import styles from './styles.module.less'
import __ from './locale'
import { LogicViewType } from '@/core'
import DatasheetTable from './DatasheetTable'
import dataEmpty from '@/assets/dataEmpty.svg'
import Empty from '@/ui/Empty'
import { AddOutlined } from '@/icons'
import { OperateType } from '@/utils'
import { ModuleType } from '../SceneAnalysis/const'

/**
 * 自定义库表
 */
const CustomView = () => {
    const navigator = useNavigate()
    const [isEmpty, setIsEmpty] = useState<boolean>(false)

    const handleCreateLogicView = () => {
        navigator(
            `/datasheet-view/graph?operate=${OperateType.CREATE}&module=${ModuleType.CustomView}`,
        )
    }

    const showEmpty = () => {
        return (
            <div className={styles.indexEmptyBox}>
                <Empty
                    desc={__(
                        '暂无数据，可基于已有的库表进行二次开发，创建出新的库表',
                    )}
                    iconSrc={dataEmpty}
                />
                <div className={styles.emptyBtn}>
                    <Button
                        type="primary"
                        onClick={handleCreateLogicView}
                        icon={<AddOutlined />}
                    >
                        {__('新建库表')}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.customView}>
            {/* <div className={styles['customView-title']}>
                {__(
                    '自定义库表：可根据已有的库表进行二次开发，创建出新的库表，列表内展示的库表，均为已发布的库表',
                )}
            </div> */}
            {isEmpty ? (
                showEmpty()
            ) : (
                <DatasheetTable
                    getTableEmptyFlag={(flag) => {
                        setIsEmpty(flag)
                    }}
                    logicType={LogicViewType.Custom}
                />
            )}
        </div>
    )
}

export default CustomView
