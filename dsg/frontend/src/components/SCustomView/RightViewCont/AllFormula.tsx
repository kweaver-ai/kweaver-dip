import React, { Fragment, forwardRef } from 'react'
import { FormulaType, ModuleType, ModeType } from '../const'
import './x6Style.less'
import __ from '../locale'
import JoinFormula from '../UnitForm/JoinFormula'
import SelectFormula from '../UnitForm/SelectFormula'
import IndicatorFormula from '../UnitForm/IndicatorFormula'
import WhereFormula from '../UnitForm/WhereFormula'
import MergeFormula from '../UnitForm/MergeFormula'
import DistinctFormula from '../UnitForm/DistinctFormula'
import CiteViewFormula from '../UnitForm/CiteViewFormula'
import OutputViewFormula from '../UnitForm/OutputViewFormula'
import LogicalViewFormula from '../UnitForm/LogicalViewFormula'
import SQLViewFormula from '../UnitForm/SQLViewFormula'

/**
 * @interface IAllFormula
 * @param {any[]}
 */
interface IAllFormula {
    ref?: any
    editNode: any
    selectedFormula: any
    fieldsData: any
    viewSize: number
    dragExpand: boolean
    handleChangeExpand: () => void
    handleOptionClose: () => void
    graph: any
    module: ModuleType
    fullScreen: boolean
    handleFullScreen?: () => void
}
const AllFormula: React.FC<IAllFormula> = forwardRef((props: any, ref) => {
    const {
        editNode,
        selectedFormula,
        fieldsData,
        viewSize,
        dragExpand,
        handleChangeExpand,
        handleOptionClose,
        graph,
        module,
        fullScreen,
        handleFullScreen,
    } = props

    return (
        <>
            {selectedFormula?.type === FormulaType.FORM && (
                <CiteViewFormula
                    visible={selectedFormula?.type === FormulaType.FORM}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.INDICATOR && (
                <IndicatorFormula
                    visible={selectedFormula?.type === FormulaType.INDICATOR}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                />
            )}
            {selectedFormula?.type === FormulaType.WHERE && (
                <WhereFormula
                    visible={selectedFormula?.type === FormulaType.WHERE}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.JOIN && (
                <JoinFormula
                    visible={selectedFormula?.type === FormulaType.JOIN}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.MERGE && (
                <MergeFormula
                    visible={selectedFormula?.type === FormulaType.MERGE}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.DISTINCT && (
                <DistinctFormula
                    visible={selectedFormula?.type === FormulaType.DISTINCT}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.SELECT && (
                <SelectFormula
                    visible={selectedFormula?.type === FormulaType.SELECT}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    ref={ref}
                />
            )}
            {selectedFormula?.type === FormulaType.OUTPUTVIEW &&
                (module === ModuleType.CustomView ? (
                    <OutputViewFormula
                        visible={
                            selectedFormula?.type === FormulaType.OUTPUTVIEW
                        }
                        graph={graph}
                        node={editNode}
                        formulaData={selectedFormula}
                        fieldsData={fieldsData}
                        viewSize={viewSize}
                        dragExpand={dragExpand}
                        onChangeExpand={handleChangeExpand}
                        onClose={handleOptionClose}
                        ref={ref}
                    />
                ) : (
                    <LogicalViewFormula
                        visible={
                            selectedFormula?.type === FormulaType.OUTPUTVIEW
                        }
                        graph={graph}
                        node={editNode}
                        formulaData={selectedFormula}
                        fieldsData={fieldsData}
                        viewSize={viewSize}
                        dragExpand={dragExpand}
                        onChangeExpand={handleChangeExpand}
                        onClose={handleOptionClose}
                        ref={ref}
                    />
                ))}
            {selectedFormula?.type === FormulaType.SQL && (
                <SQLViewFormula
                    visible={selectedFormula?.type === FormulaType.SQL}
                    graph={graph}
                    node={editNode}
                    formulaData={selectedFormula}
                    fieldsData={fieldsData}
                    viewSize={viewSize}
                    dragExpand={dragExpand}
                    onChangeExpand={handleChangeExpand}
                    onClose={handleOptionClose}
                    fullScreen={fullScreen}
                    handleFullScreen={handleFullScreen}
                    ref={ref}
                />
            )}
        </>
    )
})

export default AllFormula
