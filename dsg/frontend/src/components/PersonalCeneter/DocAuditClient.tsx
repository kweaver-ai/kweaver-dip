import { getActualUrl } from '@/utils'
import DocAuditClientPlugin from '../DocAuditClientPlugin'

const DocAuditClient = () => {
    return (
        <DocAuditClientPlugin
            basePath={getActualUrl(
                '/personal-center/doc-audit-client',
            ).substring(1)}
        />
    )
}

export default DocAuditClient
