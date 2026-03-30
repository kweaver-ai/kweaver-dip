import classnames from 'classnames'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { getIconScore } from '@/components/DatasheetView/DataPreview/DataPreviewView'
import __ from '../locale'
import styles from '../styles.module.less'

function ListCard({ data, onClick }: any) {
    return (
        <div className={styles.tagCardWrapper}>
            <div
                className={styles.pTitle}
                title={data?.rule_name}
                onClick={(e) => {
                    e.preventDefault()
                    onClick?.()
                }}
            >
                {data?.rule_name}
            </div>

            <div
                className={classnames(
                    styles.tagInfo,
                    data?.showIsPass
                        ? data?.score
                            ? styles.checkPass
                            : styles.checkError
                        : '',
                )}
            >
                {data?.showIsPass ? (
                    <div className={styles.checkState}>
                        <FontIcon
                            name={
                                data?.score
                                    ? 'icon-chenggong'
                                    : 'icon-gantanhao'
                            }
                            type={IconType.COLOREDICON}
                        />
                        <span>{data?.score ? __('已通过') : __('未通过')}</span>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        {getIconScore(data?.score)}
                        <span
                            style={{
                                marginLeft: '2px',
                            }}
                        >
                            {__('分')}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ListCard
