import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import { Drawer, Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import DrawerHeader from '@/components/CitySharing/component/DrawerHeader'
import { CommonTitle } from '@/ui'
import ShareApplyList from './ShareApplyList'
import { ResTypeEnum } from '../const'
import DetailsPage from '@/components/CitySharing/Details/DetailsPage'
import DataPushInfo from './DataPushInfo'
import AppInfo from './AppInfo'
import CallLog from './CallLog'
import { IAppliedApiShareApplyItem, IAppliedViewShareApplyItem } from '@/core'

interface IDetails {
    id: string
    open: boolean
    onClose?: () => void
    type?: ResTypeEnum
    serviceId?: string
}

const Details: React.FC<IDetails> = ({
    id,
    open,
    onClose = noop,
    type = ResTypeEnum.View,
    serviceId = '',
}) => {
    const [selectedApply, setSelectedApply] = useState<
        IAppliedApiShareApplyItem | IAppliedViewShareApplyItem
    >()

    const tabs = useMemo(() => {
        return type === ResTypeEnum.View
            ? [
                  {
                      key: 'share-info',
                      label: __('共享信息'),
                      children: (
                          <DetailsPage
                              applyId={selectedApply?.share_apply_id || ''}
                          />
                      ),
                  },
                  {
                      key: 'push-info',
                      label: __('数据推送信息'),
                      children: (
                          <DataPushInfo
                              dataPushId={
                                  (selectedApply as IAppliedViewShareApplyItem)
                                      ?.push_job_id || ''
                              }
                          />
                      ),
                  },
                  {
                      key: 'push-log',
                      label: __('数据推送日志'),
                      children: (
                          <DataPushInfo
                              dataPushId={
                                  (selectedApply as IAppliedViewShareApplyItem)
                                      ?.push_job_id || ''
                              }
                              isLog
                          />
                      ),
                  },
              ]
            : [
                  {
                      key: 'share-info',
                      label: __('共享信息'),
                      children: (
                          <DetailsPage
                              applyId={selectedApply?.share_apply_id || ''}
                          />
                      ),
                  },
                  {
                      key: 'app-info',
                      label: __('应用信息'),
                      children: (
                          <AppInfo
                              appId={
                                  (selectedApply as IAppliedApiShareApplyItem)
                                      ?.app_id || ''
                              }
                          />
                      ),
                  },
                  {
                      key: 'call-log',
                      label: __('调用日志'),
                      children: (
                          <CallLog
                              serviceId={serviceId}
                              appId={
                                  (selectedApply as IAppliedApiShareApplyItem)
                                      ?.app_id || ''
                              }
                          />
                      ),
                  },
              ]
    }, [type, selectedApply])

    return (
        <Drawer
            width="100%"
            open={open}
            onClose={onClose}
            headerStyle={{ display: 'none' }}
            bodyStyle={{ padding: 0 }}
        >
            <div className={classnames(styles.details)}>
                {/* 导航头部 */}
                <DrawerHeader
                    title={__('查看共享信息')}
                    fullScreen
                    onClose={onClose}
                />

                {/* 内容 */}
                <div className={styles.bottom}>
                    <div className={styles.content}>
                        <div className={styles['left-content']}>
                            <ShareApplyList
                                id={id}
                                type={type}
                                getSelectedApply={setSelectedApply}
                            />
                        </div>
                        <div className={styles['split-line']} />
                        <div className={styles['right-content']}>
                            <Tabs items={tabs} />
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    )
}
export default Details
