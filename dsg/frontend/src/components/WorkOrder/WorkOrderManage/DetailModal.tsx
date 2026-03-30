import { OrderType } from '../helper'
import AggregationDetail from '../WorkOrderType/AggregationOrder/DetailModal'
import ComprehensionDetail from '../WorkOrderType/ComprehensionOrder/DetailModal'
import StandardDetail from '../WorkOrderType/StandardOrder/DetailModal'
import QualityDetail from '../WorkOrderType/QualityOrder/DetailModal'
import QualityExamineDetail from '../WorkOrderType/QualityExamineOrder/DetailModal'
import DataFusionDetail from '../WorkOrderType/DataFusion/detail'
import ResearchReportDetail from '../WorkOrderType/ResearchReportOrder/DetailModal'
import DataCatalogDetail from '../WorkOrderType/DataCatalogOrder/DetailModal'
import FrontProcessorsDetail from '../WorkOrderType/FrontProcessorsOrder/DetailModal'

function DetailModal(props: any) {
    const { type, ...rest } = props
    return (
        <>
            {type === OrderType.AGGREGATION && <AggregationDetail {...rest} />}
            {type === OrderType.COMPREHENSION && (
                <ComprehensionDetail {...rest} />
            )}
            {type === OrderType.STANDARD && <StandardDetail {...rest} />}
            {type === OrderType.QUALITY && <QualityDetail {...rest} />}
            {type === OrderType.QUALITY_EXAMINE && (
                <QualityExamineDetail {...rest} />
            )}
            {type === OrderType.FUNSION && <DataFusionDetail {...rest} />}
            {type === OrderType.RESEARCH_REPORT && (
                <ResearchReportDetail {...rest} />
            )}
            {type === OrderType.DATA_CATALOG && <DataCatalogDetail {...rest} />}
            {type === OrderType.FRONT_PROCESSORS && (
                <FrontProcessorsDetail {...rest} />
            )}
        </>
    )
}
export default DetailModal
