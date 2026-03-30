import { ExclamationCircleOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface TestFailProps {
    errorInfo: string
}

const TestFail = ({ errorInfo }: TestFailProps) => {
    return (
        <div className={styles['test-failed']}>
            <ExclamationCircleOutlined className={styles['test-failed-icon']} />
            {/* <FontIcon
                name="icon-gantanhao"
                type={IconType.COLOREDICON}
                className={styles['test-failed-icon']}
            /> */}
            <div className={styles['test-failed-title']}>{__('运行失败')}</div>
            <div className={styles['test-failed-desc']}>
                {__('规则存在错误，请修改')}
            </div>
            <div className={styles['test-failed-info']}>{errorInfo}</div>
        </div>
    )
}

export default TestFail
