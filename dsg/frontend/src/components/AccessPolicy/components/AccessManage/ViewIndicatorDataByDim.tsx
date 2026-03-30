import IndicatorPreview from '@/components/IndicatorManage/IndicatorPreview'

const ViewIndicatorDataByDim = ({
    allFields,
    formData,
    formId,
    exampleData,
    openProbe,
    onDataChange,
    initialParams,
    passParams,
}: any) => {
    return (
        <div
            style={{
                position: 'relative',
                height: 'calc(100vh - 282px)',
            }}
        >
            <IndicatorPreview indicatorId={formId} formData={formData} />
        </div>
    )
}

export default ViewIndicatorDataByDim
