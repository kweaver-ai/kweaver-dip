import React, { HTMLAttributes, useState } from 'react'
import { Button, Tooltip } from 'antd'
import styles from './styles.module.less'
import { basicInfoList } from './const'
import __ from './locale'
import CommonIcon from '../CommonIcon'
import { ReactComponent as basicInfo } from '@/icons/svg/outlined/basicInfo.svg'
import BasicInfoView from './BasicInfoView'
import { IFormEnumConfigModel } from '@/core'

interface IFixedGraphFieldsView extends HTMLAttributes<HTMLDivElement> {
    data?: any
    enumConfigs?: IFormEnumConfigModel
}

/**
 * 固定属性窗口
 * @param data 基本信息
 */
const FixedGraphFieldsView: React.FC<IFixedGraphFieldsView> = ({
    data,
    enumConfigs,
    ...props
}) => {
    const [hide, setHide] = useState<boolean>(true)

    return (
        <div className={styles.fixedGraphFieldsViewWrap} {...props}>
            <div>
                <Tooltip
                    title={hide ? __('展开基础信息') : __('收起基础信息')}
                    placement="bottom"
                >
                    <div
                        onClick={() => setHide(!hide)}
                        className={styles.fgv_hoverBtnWrap}
                    >
                        <CommonIcon
                            icon={basicInfo}
                            className={styles.fgv_hoverBtn}
                        />
                    </div>
                </Tooltip>
            </div>
            <div hidden={hide} className={styles.fgv_contentWrap}>
                <BasicInfoView
                    columns={basicInfoList
                        .filter(
                            (info) =>
                                ![
                                    'name',
                                    'updater_name',
                                    'updated_at',
                                ].includes(info.name),
                        )
                        .map((info) => ({
                            ...info,
                            col: 24,
                        }))}
                    data={data}
                    enumConfigs={enumConfigs}
                    ellipsis
                />
            </div>
        </div>
    )
}

export default FixedGraphFieldsView
