import { useState } from 'react'
import { Tooltip } from 'antd'
import { QuestionMarkOutlined, ShouQiOutlined } from '@/icons'
import { settingInstructions, settingInstructions2 } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { getPlatformNumber } from '@/utils'
import { LoginPlatform } from '@/core'

const SettingInstructions = () => {
    const [isExpand, setIsExpand] = useState(true)
    const platformNumber = getPlatformNumber()

    return (
        <div className={styles['setting-instructions-container']}>
            {isExpand ? (
                <div className={styles['setting-instructions']}>
                    <div className={styles['setting-instructions-title']}>
                        {__('设置说明')}
                        <ShouQiOutlined
                            className={styles['shrink-icon']}
                            onClick={() => setIsExpand(false)}
                        />
                    </div>
                    <div className={styles['instruction-container']}>
                        {platformNumber === LoginPlatform.default
                            ? settingInstructions.map((instruction, index) => (
                                  <div
                                      className={styles.instruction}
                                      key={index}
                                  >
                                      {instruction}
                                  </div>
                              ))
                            : settingInstructions2.map((instruction, index) => (
                                  <div
                                      className={styles.instruction}
                                      key={index}
                                  >
                                      {instruction}
                                  </div>
                              ))}
                    </div>
                </div>
            ) : (
                <Tooltip title={__('展开设置说明')} placement="bottom">
                    <div
                        className={styles['expand-setting-instructions']}
                        onClick={() => setIsExpand(true)}
                    >
                        <QuestionMarkOutlined
                            className={
                                styles['expand-setting-instructions-icon']
                            }
                        />
                    </div>
                </Tooltip>
            )}
        </div>
    )
}
export default SettingInstructions
