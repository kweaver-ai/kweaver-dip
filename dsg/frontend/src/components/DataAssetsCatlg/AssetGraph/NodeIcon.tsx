import {
    AppDataContentColored,
    BusinessSystemColored,
    DepartmentColored,
    DSFormOutlined,
    ObjL3Outlined,
    TagColored,
    User1Colored,
    AppApiColored,
    DatasheetViewColored,
} from '@/icons'
import SchemaColored from '@/icons/SchemaColored'
import { NodeInfo, NodeTypes } from './const'

interface IProps {
    type: NodeTypes
    fontSize?: number
}
export const NodeIcon = ({ type, fontSize = 18 }: IProps) => {
    if (type === NodeTypes.data_asset) {
        return (
            <AppDataContentColored
                style={{
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.business_obj) {
        return (
            <ObjL3Outlined
                style={{
                    color: NodeInfo[NodeTypes.business_obj].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.owner) {
        return (
            <User1Colored
                style={{ color: NodeInfo[NodeTypes.owner].color, fontSize }}
            />
        )
    }
    if (type === NodeTypes.department) {
        return (
            <DepartmentColored
                style={{
                    color: NodeInfo[NodeTypes.department].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.info_system) {
        return (
            <BusinessSystemColored
                style={{
                    color: NodeInfo[NodeTypes.info_system].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.asset_tag) {
        return (
            <TagColored
                style={{ color: NodeInfo[NodeTypes.asset_tag].color, fontSize }}
            />
        )
    }
    if (type === NodeTypes.data_source) {
        return (
            <DSFormOutlined
                style={{
                    color: NodeInfo[NodeTypes.data_source].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.schema) {
        return (
            <SchemaColored
                style={{
                    color: NodeInfo[NodeTypes.schema].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.api) {
        return (
            <AppApiColored
                style={{
                    color: NodeInfo[NodeTypes.api].color,
                    fontSize,
                }}
            />
        )
    }
    if (type === NodeTypes.data_view) {
        return (
            <DatasheetViewColored
                style={{
                    color: NodeInfo[NodeTypes.api].color,
                    fontSize,
                }}
            />
        )
    }
    return null
}
