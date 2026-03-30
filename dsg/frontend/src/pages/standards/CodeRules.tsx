import { ConfigProvider, message } from 'antd'
import CodeRulesComponent from '@/components/CodeRulesComponent'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function CodeRules({ props }: any) {
    return <CodeRulesComponent />
}

export default CodeRules
