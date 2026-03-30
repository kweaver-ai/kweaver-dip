import { Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { nodeInfo } from '@/components/BusinessArchitecture/const'
import { mainDeptTips, typeOptions } from './const'
import __ from './locale'
import styles from './styles.module.less'

export const organizationType = (data: {
    type: string
    subtype: number
    path?: string
}) => {
    const pathLevel = data?.path?.split('/')?.length
    const name =
        data?.subtype || (data?.subtype === 0 && pathLevel === 1) ? (
            typeOptions.find((item) => item.value === data?.subtype)?.label ||
            '--'
        ) : (
            <span title={nodeInfo[data.type].name}>
                {nodeInfo[data.type].name}
            </span>
        )
    return name
}

export const getFileList = (res: any) => {
    const fileIds = res?.attributes?.file_specification_id?.split(',') || []
    const fileNames = res?.attributes?.file_specification_name?.split(',') || []
    const fileList = fileIds
        .filter((item) => item)
        .map((it, index) => ({
            id: it,
            name: fileNames[index],
        }))
    return fileList
}
export const orgDeptTitle = () => {
    return (
        <Tooltip
            autoAdjustOverflow={false}
            color="white"
            placement="bottom"
            overlayClassName="orgDeptTitleTipsWrapper"
            title={
                <div className="roleTipsWrapper">
                    <div className="roleName">{__('主部门')}</div>
                    <div className="definition">
                        {__(
                            '主部门是用户在系统中的业务归属部门，用于确定部门数据范围（如：本部门数据资源目录范围）和目录提供归属方等。',
                        )}
                    </div>
                    <div className="scopeWrapper">
                        <div className="scopeItems">
                            {mainDeptTips.first.map((item) => (
                                <div className="item" key={item}>
                                    {item}
                                </div>
                            ))}
                        </div>
                        <div className="secondItems">
                            {mainDeptTips.second.map((item) => (
                                <div className="item" key={item}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <InfoCircleOutlined className={styles.titleTipIcon} />
        </Tooltip>
    )
}
export const baseInfoFields = [
    { title: __('名称：'), key: 'name' },
    {
        title: __('类型：'),
        key: 'subtype',
    },
    {
        title: __('路径：'),
        key: 'path',
    },
    // {
    //     title: (
    //         <span>
    //             {__('设为主部门')}
    //             {orgDeptTitle()} ：
    //         </span>
    //     ),
    //     key: 'main_dept_type',
    // },
]
