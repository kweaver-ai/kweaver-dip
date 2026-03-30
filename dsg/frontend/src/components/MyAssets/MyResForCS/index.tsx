import { Tabs } from 'antd'
import { useState } from 'react'
import { ResRangeEnum } from './const'
import styles from './styles.module.less'
import __ from './locale'
import ResForApply from './ResForApply'
import ResForDep from './ResForDep'

const MyResForCS = () => {
    const [activeKey, setActiveKey] = useState(ResRangeEnum.Apply)

    return (
        <div className={styles['res-for-cs-container']}>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => setActiveKey(key as ResRangeEnum)}
                items={[
                    {
                        label: __('申请通过的'),
                        key: ResRangeEnum.Apply,
                        children: <ResForApply />,
                    },
                    {
                        label: __('本部门的'),
                        key: ResRangeEnum.Department,
                        children: <ResForDep />,
                    },
                ]}
            />
        </div>
    )
}

export default MyResForCS
