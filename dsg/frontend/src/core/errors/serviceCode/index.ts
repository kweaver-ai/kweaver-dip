import { TaskCenterCodeMessage } from './taskCenter'
import { DataCatalogCodeMessage } from './dataCatalog'
import { ConfigurationCenterCodeMessage } from './configurationCenter'
import { SceneAnalysisCodeMessage } from './sceneAnalysis'
import { SessionCodeMessage } from './session'
import { DataApplicationGatewayMessage } from './dataApplicationGateway'
import { DemandManagementCodeMessage } from './demandManagement'
import { AssetPortalCodeMessage } from './assetPortal'
import { metadataManagerCodeMessage } from './metadataManager'
import { dataSyncCodeMessage } from './dataSync'
import { ExternalPluginFrameworkCodeMessage } from './externalPluginFramework'
import { VirtualizationEngineCodeMessage } from './virtualizationEngine'
import { IndicatorManagementCodeMessage } from './indicatorManagement'
import { BusinessGroomingCodeMessage } from './businessGrooming'
import { StandardardizationCodeMessage } from './standardardization'
import { AuthServiceCodeMessage } from './authService'

// 所有服务错误提示语
const ServiceCodeMessage: Record<string, any> = {
    ...AuthServiceCodeMessage,
    ...TaskCenterCodeMessage,
    ...DataCatalogCodeMessage,
    ...ConfigurationCenterCodeMessage,
    ...SceneAnalysisCodeMessage,
    ...SessionCodeMessage,
    ...DataApplicationGatewayMessage,
    ...DemandManagementCodeMessage,
    ...AssetPortalCodeMessage,
    ...metadataManagerCodeMessage,
    ...dataSyncCodeMessage,
    ...ExternalPluginFrameworkCodeMessage,
    ...VirtualizationEngineCodeMessage,
    ...IndicatorManagementCodeMessage,
    ...BusinessGroomingCodeMessage,
    ...StandardardizationCodeMessage,
}

export default ServiceCodeMessage
