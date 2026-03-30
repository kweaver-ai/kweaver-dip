import { OrderType } from '@/components/WorkOrder/helper'
import AggregationOpt from '@/components/WorkOrder/WorkOrderType/AggregationOrder/OptModal'
import ComprehensionOpt from '@/components/WorkOrder/WorkOrderType/ComprehensionOrder/OptModal'
import EditFusionOpt from '@/components/WorkOrder/WorkOrderType/DataFusion/EditFusionOpt'
import StandardOpt from '@/components/WorkOrder/WorkOrderType/StandardOrder/OptModal'
import QualityExamineOpt from '@/components/WorkOrder/WorkOrderType/QualityExamineOrder/OptModal'
import ResearchReportOpt from '@/components/WorkOrder/WorkOrderType/ResearchReportOrder/OptModal'
import DataCatalogOpt from '@/components/WorkOrder/WorkOrderType/DataCatalogOrder/OptModal'
import FrontProcessorsOpt from '@/components/WorkOrder/WorkOrderType/FrontProcessorsOrder/OptModal'

const CreateWorkOrder = (props: any) => {
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

export default CreateWorkOrder
