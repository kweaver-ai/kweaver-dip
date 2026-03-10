import { Modal } from 'antd'
import { useState } from 'react'
import intl from 'react-intl-universal'
import type { MetricModalGroupType, MetricModelType } from '@/apis'
import GroupList from './GroupList'
import MetricList from './MetricList'
import {
  MetricSelectorContext,
  type MetricSelectorContextType,
  type MetricSelectorState,
} from './store'
import { MetricConstants } from './types'

interface MetricSelectorProps {
  initialSelectedMetrics?: Array<MetricModelType>
  onCancel: () => void
  onConfirm: (metrics: Array<MetricModelType>) => void
}

const MetricSelector = ({ initialSelectedMetrics, onCancel, onConfirm }: MetricSelectorProps) => {
  const [metricSelectorStore, setMetricSelectorStore] = useState<MetricSelectorState>({
    allMetricGroup: {
      id: '__all',
      name: intl.get('dataAgent.allIndicatorModels'),
    } as MetricModalGroupType,
    selectedGroup: undefined,
    selectedMetrics: initialSelectedMetrics || [],
  })

  const updateAllMetricGroup = (updates: Record<MetricConstants.MetricModelCount, number>) => {
    setMetricSelectorStore((prev) => ({
      ...prev,
      allMetricGroup: {
        ...prev.allMetricGroup,
        ...updates,
      },
    }))
  }

  const setSelectedGroup = (group: MetricModalGroupType) => {
    setMetricSelectorStore((prev) => ({ ...prev, selectedGroup: group }))
  }

  const setSelectedMetrics = (metrics: MetricModelType[]) => {
    setMetricSelectorStore((prev) => ({ ...prev, selectedMetrics: metrics }))
  }

  const appendSelectedMetric = (metric: MetricModelType) => {
    setMetricSelectorStore((prev) => ({
      ...prev,
      selectedMetrics: [...prev.selectedMetrics, metric],
    }))
  }

  const removeSelectedMetric = (metric: MetricModelType) => {
    setMetricSelectorStore((prev) => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.filter((item) => item.id !== metric.id),
    }))
  }

  const contextValue: MetricSelectorContextType = {
    metricSelectorStore,
    setMetricSelectorStore,
    isAllMetricGroupSetted: MetricConstants.MetricModelCount in metricSelectorStore.allMetricGroup,
    updateAllMetricGroup,
    setSelectedGroup,
    setSelectedMetrics,
    appendSelectedMetric,
    removeSelectedMetric,
  }

  return (
    <MetricSelectorContext.Provider value={contextValue}>
      <Modal
        title={intl.get('dataAgent.selectIndicator')}
        open
        centered
        destroyOnHidden
        maskClosable={false}
        width={800}
        onCancel={onCancel}
        onOk={() => onConfirm(metricSelectorStore.selectedMetrics)}
        okButtonProps={{
          disabled: !metricSelectorStore.selectedMetrics.length,
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        )}
      >
        <div className="flex -mx-6 h-[473px] border-t border-b border-[#eeeeee]">
          <div className="w-[220px] border-r border-[#eeeeee]">
            <GroupList />
          </div>
          <div className="flex-1 min-w-0">
            <MetricList />
          </div>
        </div>
      </Modal>
    </MetricSelectorContext.Provider>
  )
}

export default MetricSelector
