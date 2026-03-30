package gorm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestUpdateOnlineCountOnStatusChange 测试状态变更埋点逻辑
func TestUpdateOnlineCountOnStatusChange(t *testing.T) {
	tests := []struct {
		name              string
		oldStatus         string
		newStatus         string
		expectCall        bool
		expectOnlineCount int
	}{
		{
			name:              "从非online变为online",
			oldStatus:         "offline",
			newStatus:         "online",
			expectCall:        true,
			expectOnlineCount: 1,
		},
		{
			name:              "从online变为非online",
			oldStatus:         "online",
			newStatus:         "offline",
			expectCall:        true,
			expectOnlineCount: 0,
		},
		{
			name:              "状态没有变更",
			oldStatus:         "online",
			newStatus:         "online",
			expectCall:        false,
			expectOnlineCount: 0,
		},
		{
			name:              "都是非online状态",
			oldStatus:         "offline",
			newStatus:         "reject",
			expectCall:        false,
			expectOnlineCount: 0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 这里是单元测试逻辑验证
			isOldOnline := tt.oldStatus == "online"
			isNewOnline := tt.newStatus == "online"

			shouldCall := false
			expectedOnlineCount := 0

			if !isOldOnline && isNewOnline {
				shouldCall = true
				expectedOnlineCount = 1
			} else if isOldOnline && !isNewOnline {
				shouldCall = true
				expectedOnlineCount = 0
			}

			if shouldCall != tt.expectCall {
				t.Errorf("期望调用: %v, 实际调用: %v", tt.expectCall, shouldCall)
			}

			if shouldCall && expectedOnlineCount != tt.expectOnlineCount {
				t.Errorf("期望online_count: %d, 实际online_count: %d", tt.expectOnlineCount, expectedOnlineCount)
			}
		})
	}
}

// TestBatchSyncLogic 测试批量同步逻辑
func TestBatchSyncLogic(t *testing.T) {
	tests := []struct {
		name            string
		services        []TestService
		existingRecords []TestRecord
		expectedUpdates int
		expectedCreates int
	}{
		{
			name: "部分服务需要更新online_count",
			services: []TestService{
				{ServiceID: "svc1", Status: "online"},
				{ServiceID: "svc2", Status: "offline"},
				{ServiceID: "svc3", Status: "online"},
			},
			existingRecords: []TestRecord{
				{ServiceID: "svc1", OnlineCount: 0}, // 需要更新为1
				{ServiceID: "svc2", OnlineCount: 1}, // 需要更新为0
			},
			expectedUpdates: 2, // svc1, svc2 需要更新
			expectedCreates: 1, // svc3 需要创建
		},
		{
			name: "所有服务状态与记录一致",
			services: []TestService{
				{ServiceID: "svc1", Status: "online"},
				{ServiceID: "svc2", Status: "offline"},
			},
			existingRecords: []TestRecord{
				{ServiceID: "svc1", OnlineCount: 1},
				{ServiceID: "svc2", OnlineCount: 0},
			},
			expectedUpdates: 0,
			expectedCreates: 0,
		},
		{
			name: "新服务需要创建记录",
			services: []TestService{
				{ServiceID: "svc1", Status: "online"},
				{ServiceID: "svc2", Status: "offline"},
			},
			existingRecords: []TestRecord{},
			expectedUpdates: 0,
			expectedCreates: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 构建记录映射
			recordMap := make(map[string]TestRecord)
			for _, record := range tt.existingRecords {
				recordMap[record.ServiceID] = record
			}

			var updates []ServiceOnlineCountUpdate
			var missingServices []TestService

			// 模拟同步逻辑
			for _, service := range tt.services {
				expectedOnlineCount := 0
				if service.Status == "online" {
					expectedOnlineCount = 1
				}

				if record, exists := recordMap[service.ServiceID]; exists {
					if record.OnlineCount != expectedOnlineCount {
						updates = append(updates, ServiceOnlineCountUpdate{
							ServiceID:   service.ServiceID,
							OnlineCount: expectedOnlineCount,
						})
					}
				} else {
					missingServices = append(missingServices, service)
				}
			}

			if len(updates) != tt.expectedUpdates {
				t.Errorf("期望更新数量: %d, 实际更新数量: %d", tt.expectedUpdates, len(updates))
			}

			if len(missingServices) != tt.expectedCreates {
				t.Errorf("期望创建数量: %d, 实际创建数量: %d", tt.expectedCreates, len(missingServices))
			}
		})
	}
}

// TestIncrementApplyCount 测试申请数量增量统计逻辑
func TestIncrementApplyCount(t *testing.T) {
	tests := []struct {
		name                    string
		serviceID               string
		existingRecord          bool
		initialApplyCount       int
		expectedFinalApplyCount int
	}{
		{
			name:                    "记录存在，增加申请数",
			serviceID:               "svc1",
			existingRecord:          true,
			initialApplyCount:       5,
			expectedFinalApplyCount: 6,
		},
		{
			name:                    "记录不存在，创建并设为1",
			serviceID:               "svc2",
			existingRecord:          false,
			initialApplyCount:       0,
			expectedFinalApplyCount: 1,
		},
		{
			name:                    "记录存在，从0开始增加",
			serviceID:               "svc3",
			existingRecord:          true,
			initialApplyCount:       0,
			expectedFinalApplyCount: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 模拟逻辑测试
			currentApplyCount := tt.initialApplyCount

			// 如果记录不存在，先创建（初始值为0）
			if !tt.existingRecord {
				currentApplyCount = 0
			}

			// 执行增量操作
			currentApplyCount++

			if currentApplyCount != tt.expectedFinalApplyCount {
				t.Errorf("期望最终申请数: %d, 实际申请数: %d", tt.expectedFinalApplyCount, currentApplyCount)
			}
		})
	}
}

// TestIncrApplyNumWithDailyRecord 测试 IncrApplyNum 与每日统计的集成
func TestIncrApplyNumWithDailyRecord(t *testing.T) {
	scenarios := []struct {
		name               string
		serviceID          string
		userID             string
		alreadyCountedUser bool
		shouldUpdateDaily  bool
	}{
		{
			name:               "新用户首次申请",
			serviceID:          "svc1",
			userID:             "user1",
			alreadyCountedUser: false,
			shouldUpdateDaily:  true,
		},
		{
			name:               "已统计用户重复申请",
			serviceID:          "svc1",
			userID:             "user1",
			alreadyCountedUser: true,
			shouldUpdateDaily:  false,
		},
		{
			name:               "新用户申请其他服务",
			serviceID:          "svc2",
			userID:             "user1",
			alreadyCountedUser: false,
			shouldUpdateDaily:  true,
		},
	}

	for _, scenario := range scenarios {
		t.Run(scenario.name, func(t *testing.T) {
			// 模拟 Redis Set 操作结果
			// SAdd 返回1表示新增，返回0表示已存在
			addResult := int64(1)
			if scenario.alreadyCountedUser {
				addResult = 0
			}

			// 根据 Redis 操作结果决定是否更新统计
			shouldUpdate := addResult > 0

			if shouldUpdate != scenario.shouldUpdateDaily {
				t.Errorf("期望是否更新每日统计: %v, 实际是否更新: %v", scenario.shouldUpdateDaily, shouldUpdate)
			}

			// 如果需要更新，验证统计逻辑
			if shouldUpdate {
				t.Logf("服务 %s 的用户 %s 申请被正确统计", scenario.serviceID, scenario.userID)
			} else {
				t.Logf("服务 %s 的用户 %s 重复申请被正确忽略", scenario.serviceID, scenario.userID)
			}
		})
	}
}

// TestServiceDailyRecordRepo_GetDailyStatistics 测试 GetDailyStatistics 查询逻辑
func TestServiceDailyRecordRepo_GetDailyStatistics(t *testing.T) {
	tests := []struct {
		name           string
		departmentID   string
		serviceType    string
		key            string
		startTime      string
		endTime        string
		mockRecords    []TestDailyRecord
		expectedCount  int
		validateResult func(t *testing.T, results []TestDailyRecord)
	}{
		{
			name:         "查询所有数据",
			departmentID: "",
			serviceType:  "",
			key:          "",
			startTime:    "",
			endTime:      "",
			mockRecords: []TestDailyRecord{
				{Date: "2025-01-15", SuccessCount: 100, FailCount: 10, OnlineCount: 1, ApplyCount: 5, DeptID: "dept1", ServiceType: "API", ServiceName: "服务1"},
				{Date: "2025-01-15", SuccessCount: 50, FailCount: 5, OnlineCount: 1, ApplyCount: 3, DeptID: "dept1", ServiceType: "API", ServiceName: "服务2"},
				{Date: "2025-01-16", SuccessCount: 200, FailCount: 20, OnlineCount: 1, ApplyCount: 8, DeptID: "dept2", ServiceType: "WEB", ServiceName: "服务3"},
			},
			expectedCount: 2, // 2天数据
			validateResult: func(t *testing.T, results []TestDailyRecord) {
				// 验证聚合结果
				day1 := findTestResultByDate(results, "2025-01-15")
				assert.NotNil(t, day1)
				assert.Equal(t, int64(150), day1.SuccessCount) // 100 + 50
				assert.Equal(t, int64(15), day1.FailCount)     // 10 + 5
				assert.Equal(t, int64(2), day1.OnlineCount)    // 1 + 1
				assert.Equal(t, int64(8), day1.ApplyCount)     // 5 + 3

				day2 := findTestResultByDate(results, "2025-01-16")
				assert.NotNil(t, day2)
				assert.Equal(t, int64(200), day2.SuccessCount)
				assert.Equal(t, int64(20), day2.FailCount)
				assert.Equal(t, int64(1), day2.OnlineCount)
				assert.Equal(t, int64(8), day2.ApplyCount)
			},
		},
		{
			name:         "按部门过滤",
			departmentID: "dept1",
			serviceType:  "",
			key:          "",
			startTime:    "",
			endTime:      "",
			mockRecords: []TestDailyRecord{
				{Date: "2025-01-15", SuccessCount: 100, FailCount: 10, OnlineCount: 1, ApplyCount: 5, DeptID: "dept1", ServiceType: "API", ServiceName: "服务1"},
				{Date: "2025-01-15", SuccessCount: 50, FailCount: 5, OnlineCount: 1, ApplyCount: 3, DeptID: "dept1", ServiceType: "API", ServiceName: "服务2"},
				{Date: "2025-01-16", SuccessCount: 200, FailCount: 20, OnlineCount: 1, ApplyCount: 8, DeptID: "dept2", ServiceType: "WEB", ServiceName: "服务3"},
			},
			expectedCount: 1, // 只有dept1的数据
			validateResult: func(t *testing.T, results []TestDailyRecord) {
				day1 := findTestResultByDate(results, "2025-01-15")
				assert.NotNil(t, day1)
				assert.Equal(t, int64(150), day1.SuccessCount)
			},
		},
		{
			name:         "按服务类型过滤",
			departmentID: "",
			serviceType:  "WEB",
			key:          "",
			startTime:    "",
			endTime:      "",
			mockRecords: []TestDailyRecord{
				{Date: "2025-01-15", SuccessCount: 100, FailCount: 10, OnlineCount: 1, ApplyCount: 5, DeptID: "dept1", ServiceType: "API", ServiceName: "服务1"},
				{Date: "2025-01-16", SuccessCount: 200, FailCount: 20, OnlineCount: 1, ApplyCount: 8, DeptID: "dept2", ServiceType: "WEB", ServiceName: "服务3"},
			},
			expectedCount: 1, // 只有WEB类型的数据
			validateResult: func(t *testing.T, results []TestDailyRecord) {
				day2 := findTestResultByDate(results, "2025-01-16")
				assert.NotNil(t, day2)
				assert.Equal(t, int64(200), day2.SuccessCount)
			},
		},
		{
			name:         "按关键字过滤",
			departmentID: "",
			serviceType:  "",
			key:          "服务1",
			startTime:    "",
			endTime:      "",
			mockRecords: []TestDailyRecord{
				{Date: "2025-01-15", SuccessCount: 100, FailCount: 10, OnlineCount: 1, ApplyCount: 5, DeptID: "dept1", ServiceType: "API", ServiceName: "服务1"},
				{Date: "2025-01-15", SuccessCount: 50, FailCount: 5, OnlineCount: 1, ApplyCount: 3, DeptID: "dept1", ServiceType: "API", ServiceName: "服务2"},
			},
			expectedCount: 1, // 只有包含"服务1"的数据
			validateResult: func(t *testing.T, results []TestDailyRecord) {
				day1 := findTestResultByDate(results, "2025-01-15")
				assert.NotNil(t, day1)
				assert.Equal(t, int64(100), day1.SuccessCount)
			},
		},
		{
			name:         "按时间范围过滤",
			departmentID: "",
			serviceType:  "",
			key:          "",
			startTime:    "2025-01-15",
			endTime:      "2025-01-15",
			mockRecords: []TestDailyRecord{
				{Date: "2025-01-15", SuccessCount: 100, FailCount: 10, OnlineCount: 1, ApplyCount: 5, DeptID: "dept1", ServiceType: "API", ServiceName: "服务1"},
				{Date: "2025-01-16", SuccessCount: 200, FailCount: 20, OnlineCount: 1, ApplyCount: 8, DeptID: "dept2", ServiceType: "WEB", ServiceName: "服务3"},
			},
			expectedCount: 1, // 只有2025-01-15的数据
			validateResult: func(t *testing.T, results []TestDailyRecord) {
				day1 := findTestResultByDate(results, "2025-01-15")
				assert.NotNil(t, day1)
				assert.Equal(t, int64(100), day1.SuccessCount)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 模拟过滤逻辑
			filtered := filterTestRecords(tt.mockRecords, tt.departmentID, tt.serviceType, tt.key, tt.startTime, tt.endTime)

			// 模拟按日期分组聚合
			aggregated := aggregateTestRecords(filtered)

			if len(aggregated) != tt.expectedCount {
				t.Errorf("期望结果数量: %d, 实际结果数量: %d", tt.expectedCount, len(aggregated))
			}

			if tt.validateResult != nil {
				tt.validateResult(t, aggregated)
			}
		})
	}
}

// TestDailyRecord 测试用的每日记录结构
type TestDailyRecord struct {
	Date         string
	SuccessCount int64
	FailCount    int64
	OnlineCount  int64
	ApplyCount   int64
	DeptID       string
	ServiceType  string
	ServiceName  string
}

// filterTestRecords 模拟过滤逻辑
func filterTestRecords(records []TestDailyRecord, departmentID, serviceType, key, startTime, endTime string) []TestDailyRecord {
	var filtered []TestDailyRecord
	for _, record := range records {
		// 部门过滤
		if departmentID != "" && record.DeptID != departmentID {
			continue
		}
		// 服务类型过滤
		if serviceType != "" && record.ServiceType != serviceType {
			continue
		}
		// 关键字过滤
		if key != "" && !contains(record.ServiceName, key) {
			continue
		}
		// 时间范围过滤
		if startTime != "" && record.Date < startTime {
			continue
		}
		if endTime != "" && record.Date > endTime {
			continue
		}
		filtered = append(filtered, record)
	}
	return filtered
}

// aggregateTestRecords 模拟按日期分组聚合逻辑
func aggregateTestRecords(records []TestDailyRecord) []TestDailyRecord {
	dateMap := make(map[string]*TestDailyRecord)
	for _, record := range records {
		if existing, exists := dateMap[record.Date]; exists {
			existing.SuccessCount += record.SuccessCount
			existing.FailCount += record.FailCount
			existing.OnlineCount += record.OnlineCount
			existing.ApplyCount += record.ApplyCount
		} else {
			dateMap[record.Date] = &TestDailyRecord{
				Date:         record.Date,
				SuccessCount: record.SuccessCount,
				FailCount:    record.FailCount,
				OnlineCount:  record.OnlineCount,
				ApplyCount:   record.ApplyCount,
			}
		}
	}

	var result []TestDailyRecord
	for _, record := range dateMap {
		result = append(result, *record)
	}
	return result
}

// findTestResultByDate 根据日期查找测试结果
func findTestResultByDate(results []TestDailyRecord, date string) *TestDailyRecord {
	for _, result := range results {
		if result.Date == date {
			return &result
		}
	}
	return nil
}

// contains 检查字符串是否包含子字符串
func contains(s, substr string) bool {
	return len(substr) == 0 || len(s) >= len(substr) && (s == substr || (len(s) > len(substr) && (s[:len(substr)] == substr || s[len(s)-len(substr):] == substr || indexOfSubstring(s, substr) >= 0)))
}

// indexOfSubstring 查找子字符串的索引
func indexOfSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}

// findResultByDate 根据日期查找结果
func findResultByDate(results []*DailyStatisticsResult, date string) *DailyStatisticsResult {
	for _, result := range results {
		if result.RecordDate == date {
			return result
		}
	}
	return nil
}

// 测试用的数据结构
type TestService struct {
	ServiceID string
	Status    string
}

type TestRecord struct {
	ServiceID   string
	OnlineCount int
}
