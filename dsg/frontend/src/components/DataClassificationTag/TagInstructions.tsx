import { useState } from 'react'
import { Tooltip } from 'antd'
import { QuestionMarkOutlined, ShouQiOutlined } from '@/icons'
import { tagInstructions } from './const'
import __ from './locale'
import styles from './styles.module.less'

const TagInstructions = () => {
    const [isExpand, setIsExpand] = useState(true)

    return (
        <div className={styles['setting-instructions-container']}>
            {isExpand ? (
                <div className={styles['setting-instructions']}>
                    <div className={styles['setting-instructions-title']}>
                        {__('标签说明')}
                        <ShouQiOutlined
                            className={styles['shrink-icon']}
                            onClick={() => setIsExpand(false)}
                        />
                    </div>
                    <div className={styles['instruction-container']}>
                        {tagInstructions.map((instruction, index) => (
                            <div className={styles.instruction} key={index}>
                                {instruction}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <Tooltip title={__('展开标签说明')} placement="bottom">
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
export default TagInstructions
