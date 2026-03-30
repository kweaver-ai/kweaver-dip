import { Popover } from 'antd'
import styles from './styles.module.less'

/**
 * Items => {id, label, value, path}
 */

function PopList(props: any) {
    const { children, popTitle, popContent, ...rest } = props
    return popContent ? (
        <Popover
            content={
                <div className={styles.popContent}>
                    <div>{popTitle}:</div>
                    <div>{popContent}</div>
                </div>
            }
            arrowPointAtCenter
            placement="bottom"
            overlayClassName={styles.pop}
            {...rest}
        >
            {children || '--'}
        </Popover>
    ) : (
        children || '--'
    )
}

export default PopList
