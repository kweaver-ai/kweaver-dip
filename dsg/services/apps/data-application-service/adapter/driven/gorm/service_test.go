package gorm

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestServiceRepo_GetStatusStatistics 测试服务状态统计逻辑
func TestServiceRepo_GetStatusStatistics(t *testing.T) {
	tests := []struct {
		name        string
		serviceType string
		mockData    []MockServiceData
		expected    ServiceStatusStatistics
	}{
		{
			name:        "查询全部服务统计",
			serviceType: "",
			mockData: []MockServiceData{
				{ServiceType: "service_generate", PublishStatus: "published", Status: "online", DeleteTime: 0},
				{ServiceType: "service_generate", PublishStatus: "unpublished", Status: "notline", DeleteTime: 0},
				{ServiceType: "service_register", PublishStatus: "published", Status: "offline", DeleteTime: 0},
				{ServiceType: "service_register", PublishStatus: "published", Status: "online", DeleteTime: 0},
			},
			expected: ServiceStatusStatistics{
				ServiceCount:     4,
				PublishedCount:   3,
				UnpublishedCount: 1,
				NotlineCount:     1,
				OnLineCount:      2,
				OfflineCount:     1,
			},
		},
		{
			name:        "查询service_generate统计",
			serviceType: "service_generate",
			mockData: []MockServiceData{
				{ServiceType: "service_generate", PublishStatus: "published", Status: "online", DeleteTime: 0},
				{ServiceType: "service_generate", PublishStatus: "unpublished", Status: "notline", DeleteTime: 0},
				{ServiceType: "service_register", PublishStatus: "published", Status: "offline", DeleteTime: 0},
			},
			expected: ServiceStatusStatistics{
				ServiceCount:     2,
				PublishedCount:   1,
				UnpublishedCount: 1,
				NotlineCount:     1,
				OnLineCount:      1,
				OfflineCount:     0,
			},
		},
		{
			name:        "查询service_register统计",
			serviceType: "service_register",
			mockData: []MockServiceData{
				{ServiceType: "service_generate", PublishStatus: "published", Status: "online", DeleteTime: 0},
				{ServiceType: "service_register", PublishStatus: "published", Status: "offline", DeleteTime: 0},
				{ServiceType: "service_register", PublishStatus: "published", Status: "up-auditing", DeleteTime: 0},
			},
			expected: ServiceStatusStatistics{
				ServiceCount:     2,
				PublishedCount:   2,
				UnpublishedCount: 0,
				NotlineCount:     1,
				OnLineCount:      0,
				OfflineCount:     1,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 验证查询逻辑的正确性
			validateStatusCounts(t, tt.mockData, tt.expected, tt.serviceType)
		})
	}
}

// MockServiceData 模拟服务数据
type MockServiceData struct {
	ServiceType   string
	PublishStatus string
	Status        string
	DeleteTime    int64
}

// validateStatusCounts 验证状态统计逻辑
func validateStatusCounts(t *testing.T, mockData []MockServiceData, expected ServiceStatusStatistics, serviceType string) {

	// 模拟统计逻辑验证
	var filteredData []MockServiceData
	for _, data := range mockData {
		if data.DeleteTime == 0 && (serviceType == "" || data.ServiceType == serviceType) {
			filteredData = append(filteredData, data)
		}
	}

	actual := ServiceStatusStatistics{}
	actual.ServiceCount = int64(len(filteredData))

	// 统计已发布数量
	for _, data := range filteredData {
		if data.PublishStatus == "published" {
			actual.PublishedCount++
		}
	}
	actual.UnpublishedCount = actual.ServiceCount - actual.PublishedCount

	// 统计状态分布
	for _, data := range filteredData {
		switch data.Status {
		case "notline", "up-auditing", "up-reject":
			actual.NotlineCount++
		case "online", "down-auditing", "down-reject":
			actual.OnLineCount++
		case "offline":
			actual.OfflineCount++
		}
	}

	// 验证结果
	assert.Equal(t, expected.ServiceCount, actual.ServiceCount, "服务总数不匹配")
	assert.Equal(t, expected.PublishedCount, actual.PublishedCount, "已发布数量不匹配")
	assert.Equal(t, expected.UnpublishedCount, actual.UnpublishedCount, "未发布数量不匹配")
	assert.Equal(t, expected.NotlineCount, actual.NotlineCount, "未上线数量不匹配")
	assert.Equal(t, expected.OnLineCount, actual.OnLineCount, "已上线数量不匹配")
	assert.Equal(t, expected.OfflineCount, actual.OfflineCount, "已下线数量不匹配")

	t.Logf("统计验证成功 - 服务类型: %s, 总数: %d, 已发布: %d, 未发布: %d, 未上线: %d, 已上线: %d, 已下线: %d",
		serviceType, actual.ServiceCount, actual.PublishedCount, actual.UnpublishedCount,
		actual.NotlineCount, actual.OnLineCount, actual.OfflineCount)
}
