import { ConfigProvider, message } from 'antd'
import StandardTaskManage from '@/components/StandardTaskManage'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function TaskManage({ props }: any) {
    return <StandardTaskManage />
}

export default TaskManage
