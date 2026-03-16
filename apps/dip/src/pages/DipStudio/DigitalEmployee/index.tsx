import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { Button, message, Spin, Tooltip } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Employee } from '@/apis'
import { getDigitalEmployees } from '@/apis'
import DEList from '@/components/DEList'
import ActionModal from '@/components/DESetting/ActionModal/ActionModal'
import Empty from '@/components/Empty'
import SearchInput from '@/components/SearchInput'
import { useListService } from '@/hooks/useListService'
import { useUserInfoStore } from '@/stores/userInfoStore'

const DigitalEmployee = () => {
  const navigate = useNavigate()
  const { userInfo } = useUserInfoStore()
  const [, messageContextHolder] = message.useMessage()
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const hasEverHadDataRef = useRef(false)
  const prevSearchValueRef = useRef('')
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Employee>()

  const { items, loading, error, searchValue, handleSearch, handleRefresh } =
    useListService<Employee>({
      fetchFn: getDigitalEmployees,
    })

  const employees = useMemo(() => {
    if (loading) {
      return []
    }
    return [
      {
        id: 1,
        name: '运营小助手',
        description: '负责日常运营数据统计、报表生成和用户消息回复',
        icon: '',
        creator: '张三',
        created_at: new Date().toISOString(),
        editor: '张三',
        edited_at: new Date().toISOString(),
        status: 1,
        users: [
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
          userInfo,
        ],
        plan_count: 100,
        task_success_rate: [
          { day: '2026-03-13', value: 80 },
          { day: '2026-03-12', value: 90 },
          { day: '2026-03-11', value: 60 },
          { day: '2026-03-10', value: 50 },
          { day: '2026-03-09', value: 70 },
          { day: '2026-03-08', value: 30 },
          { day: '2026-03-07', value: 50 },
        ],
      },
      {
        id: 2,
        name: '销售小助手',
        description: '负责日常销售数据统计、报表生成和用户消息回复',
        icon: '',
        creator: '张三',
        created_at: new Date().toISOString(),
        editor: '张三',
        edited_at: new Date().toISOString(),
        status: 1,
        users: [userInfo],
        plan_count: 100,
        task_success_rate: [
          { day: '2026-03-13', value: 80 },
          { day: '2026-03-12', value: 90 },
          { day: '2026-03-11', value: 60 },
          { day: '2026-03-10', value: 50 },
        ],
      },
    ]
  }, [loading, userInfo])

  // 对齐项目列表页：根据是否曾经有过数据、是否是搜索态，控制头部和空态展示逻辑
  useEffect(() => {
    const wasSearching = prevSearchValueRef.current !== ''

    if (!loading) {
      if (employees.length > 0) {
        setHasLoadedData(true)
        hasEverHadDataRef.current = true
      } else if (!searchValue && hasEverHadDataRef.current) {
        if (!wasSearching) {
          setHasLoadedData(false)
          hasEverHadDataRef.current = false
        }
      }
    }

    prevSearchValueRef.current = searchValue
  }, [loading, employees.length, searchValue])

  /** 新建数字员工 */
  const handleCreate = () => {
    setAddModalVisible(true)
  }

  /** 配置数字员工 */
  const handleSetting = (employee: Employee) => {
    if (!employee?.id) {
      return
    }
    navigate(`/studio/digital-employee/${employee.id}/setting`)
  }

  const handleCardClick = (employee: Employee) => {
    navigate(`/studio/digital-employee/${employee.id}/setting`)
  }

  const renderStateContent = () => {
    if (loading && !employees.length) {
      return <Spin size="large" />
    }

    // if (error) {
    //   return (
    //     <Empty type="failed" title="数字员工加载失败">
    //       <Button type="primary" onClick={handleRefresh}>
    //         重试
    //       </Button>
    //     </Empty>
    //   )
    // }

    if (employees.length === 0) {
      if (searchValue) {
        return <Empty type="search" desc="抱歉，没有找到相关内容" />
      }
      return (
        <Empty
          title="暂无数字员工"
          subDesc="当前数字员工空空如也，您可以点击下方按钮新建第一个数字员工。"
        >
          <Button
            className="mt-2"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              handleCreate()
            }}
          >
            新建数字员工
          </Button>
        </Empty>
      )
    }

    return null
  }

  const renderContent = () => {
    const stateContent = renderStateContent()

    if (stateContent) {
      return <div className="absolute inset-0 flex items-center justify-center">{stateContent}</div>
    }

    return <DEList employees={employees} onCardClick={handleCardClick} />
  }

  return (
    <div className="h-full p-6 flex flex-col relative">
      {messageContextHolder}
      <div className="flex justify-between mb-6 flex-shrink-0 z-20">
        <div className="flex flex-col gap-y-2">
          <span className="font-medium text-base text-[--dip-text-color]">数字员工</span>
          <span className="text-[--dip-text-color-65]">管理数字员工市场，创建或删除数字员工</span>
        </div>
        {(hasLoadedData || searchValue) && (
          <div className="flex items-center gap-x-3">
            <SearchInput onSearch={handleSearch} placeholder="搜索数字员工" />
            <Tooltip title="刷新">
              <Button type="text" icon={<ReloadOutlined />} onClick={handleRefresh} />
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              新建
            </Button>
          </div>
        )}
      </div>
      {renderContent()}

      <ActionModal
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false)
          setSelectedItem(undefined)
        }}
        onSuccess={handleSetting}
        operationType={selectedItem ? 'edit' : 'add'}
      />
    </div>
  )
}

export default memo(DigitalEmployee)
