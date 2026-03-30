import { ConfigProvider, message } from 'antd'
import enUS from 'antd/lib/locale/en_US'
import zhCN from 'antd/lib/locale/zh_CN'
import zhTW from 'antd/lib/locale/zh_TW'
import 'moment/locale/zh-cn'
import 'normalize.css'
import 'antd/dist/antd.less'
import '../../common.less'
import '../../resetAntd.less'
import { BrowserRouter } from 'react-router-dom'
import DmdAudit from '@/components/DmdAudit'
// import { getLanguage, i18n } from '@/utils'

ConfigProvider.config({
    prefixCls: 'any-fabric-ant',
    iconPrefixCls: 'any-fabric-anticon',
})

message.config({
    maxCount: 1,
    duration: 3,
})

function DmdAuditApp(props: any) {
    // const language: string = getLanguage() || 'zh-cn'
    const language: string = 'zh-cn'

    const getAntdLocal = (lang: string) => {
        switch (lang) {
            case 'zh-cn':
                return zhCN

            case 'zh-tw':
                return zhTW

            default:
                return enUS
        }
    }

    // i18n.setup({
    //     locale: language,
    // })

    return (
        <BrowserRouter>
            <ConfigProvider
                locale={getAntdLocal(language)}
                prefixCls="any-fabric-ant"
                iconPrefixCls="any-fabric-anticon"
                autoInsertSpaceInButton={false}
                getPopupContainer={() =>
                    document.getElementById('dmdAudit') || document.body
                }
            >
                <DmdAudit props={props} />
            </ConfigProvider>
        </BrowserRouter>
    )
}

export default DmdAuditApp
