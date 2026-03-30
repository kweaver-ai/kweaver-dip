import { OrderType } from '../helper'
import AggregationOpt from '../WorkOrderType/AggregationOrder/OptModal'
import ComprehensionOpt from '../WorkOrderType/ComprehensionOrder/OptModal'
import EditFusionOpt from '../WorkOrderType/DataFusion/EditFusionOpt'
import StandardOpt from '../WorkOrderType/StandardOrder/OptModal'
import QualityExamineOpt from '../WorkOrderType/QualityExamineOrder/OptModal'
import ResearchReportOpt from '../WorkOrderType/ResearchReportOrder/OptModal'
import DataCatalogOpt from '../WorkOrderType/DataCatalogOrder/OptModal'
import FrontProcessorsOpt from '../WorkOrderType/FrontProcessorsOrder/OptModal'

const OptModal = (props: any) => {
    return (
        <>
            {props?.type === OrderType.AGGREGATION && (
                <AggregationOpt {...props} />
            )}
            {props?.type === OrderType.COMPREHENSION && (
                <ComprehensionOpt {...props} />
            )}
            {props?.type === OrderType.STANDARD && <StandardOpt {...props} />}
            {props?.type === OrderType.QUALITY_EXAMINE && (
                <QualityExamineOpt {...props} />
            )}
            {/* 融合工单 */}
            {props?.type === OrderType.FUNSION && <EditFusionOpt {...props} />}
            {props?.type === OrderType.RESEARCH_REPORT && (
                <ResearchReportOpt {...props} />
            )}
            {props?.type === OrderType.DATA_CATALOG && (
                <DataCatalogOpt {...props} />
            )}
            {props?.type === OrderType.FRONT_PROCESSORS && (
                <FrontProcessorsOpt {...props} />
            )}
        </>
    )
}

export default OptModal
