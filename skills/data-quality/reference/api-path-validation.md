# API路径规范与验证机制

> **重要**: 本文档定义了所有API路径的规范，并提供验证机制以防止路径错误。

## 1. API路径常量定义

### 1.1 知识网络API路径 (Knowledge Network API)

```javascript
// API路径常量 - JavaScript
const KNOWLEDGE_NETWORK_API = {
    // 基础路径
    BASE: '/api/ontology-manager/v1',
    
    // 知识网络列表 - ✅ 必须使用复数形式 knowledge-networks
    KNOWLEDGE_NETWORKS: '/api/ontology-manager/v1/knowledge-networks',
    
    // 对象类型列表 - ✅ 必须使用复数形式 knowledge-networks
    OBJECT_TYPES: (knId) => `/api/ontology-manager/v1/knowledge-networks/${knId}/object-types`,
    
    // 路径验证正则
    VALIDATION_REGEX: {
        // 验证知识网络列表路径
        KNOWLEDGE_NETWORKS_LIST: /^\/api\/ontology-manager\/v1\/knowledge-networks$/,
        // 验证对象类型路径
        OBJECT_TYPES: /^\/api\/ontology-manager\/v1\/knowledge-networks\/[^\/]+\/object-types$/
    }
};
```

```python
# API路径常量 - Python
class KnowledgeNetworkAPI:
    """知识网络API路径常量"""
    
    # 基础路径
    BASE = '/api/ontology-manager/v1'
    
    # 知识网络列表 - ✅ 必须使用复数形式 knowledge-networks
    KNOWLEDGE_NETWORKS = '/api/ontology-manager/v1/knowledge-networks'
    
    @staticmethod
    def object_types(kn_id: str) -> str:
        """获取对象类型列表路径"""
        return f'/api/ontology-manager/v1/knowledge-networks/{kn_id}/object-types'
    
    # 路径验证正则
    VALIDATION_REGEX = {
        # 验证知识网络列表路径
        'knowledge_networks_list': r'^/api/ontology-manager/v1/knowledge-networks$',
        # 验证对象类型路径
        'object_types': r'^/api/ontology-manager/v1/knowledge-networks/[^/]+/object-types$'
    }
```

### 1.2 所有API路径常量汇总

| 服务 | 常量名 | 路径 | 说明 |
|------|--------|------|------|
| Knowledge Network | `KNOWLEDGE_NETWORKS` | `/api/ontology-manager/v1/knowledge-networks` | ✅ 复数形式 |
| Knowledge Network | `OBJECT_TYPES(knId)` | `/api/ontology-manager/v1/knowledge-networks/{knId}/object-types` | ✅ 复数形式 |
| Data View | `FORM_VIEW` | `/api/data-view/v1/form-view` | - |
| Data View | `EXPLORE_RULE` | `/api/data-view/v1/explore-rule` | - |
| Task Center | `WORK_ORDER` | `/api/task-center/v1/work-order` | - |

## 2. API路径验证机制

### 2.1 路径验证函数

```javascript
// JavaScript路径验证
function validateApiPath(path, apiType) {
    const errors = [];
    
    // 检查知识网络API路径
    if (apiType === 'knowledge_network') {
        // ❌ 错误：使用单数形式
        if (path.includes('/knowledge-network?') || 
            path.includes('/knowledge-network/') ||
            path.match(/\/knowledge-network$/)) {
            errors.push({
                type: 'PATH_ERROR',
                message: '知识网络API路径必须使用复数形式: /knowledge-networks',
                incorrect: path,
                correct: path.replace(/knowledge-network(?!s)/g, 'knowledge-networks')
            });
        }
        
        // ✅ 验证正确的复数形式
        const validKnowledgeNetworkRegex = /^\/api\/ontology-manager\/v1\/knowledge-networks/;
        if (!validKnowledgeNetworkRegex.test(path)) {
            errors.push({
                type: 'PATH_FORMAT_ERROR',
                message: '知识网络API路径格式不正确',
                path: path,
                expected: '/api/ontology-manager/v1/knowledge-networks...'
            });
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}
```

```python
# Python路径验证
import re
from typing import Dict, List, Tuple

class ApiPathValidator:
    """API路径验证器"""
    
    # 错误路径模式（单数形式）
    INVALID_PATTERNS = {
        'knowledge_network': [
            r'/knowledge-network\?',      # /knowledge-network?param=value
            r'/knowledge-network/',        # /knowledge-network/...
            r'/knowledge-network$',        # /knowledge-network (结尾)
        ]
    }
    
    # 正确路径模式（复数形式）
    VALID_PATTERNS = {
        'knowledge_networks_list': r'^/api/ontology-manager/v1/knowledge-networks$',
        'knowledge_networks_with_params': r'^/api/ontology-manager/v1/knowledge-networks\?',
        'object_types': r'^/api/ontology-manager/v1/knowledge-networks/[^/]+/object-types',
    }
    
    @classmethod
    def validate_knowledge_network_path(cls, path: str) -> Tuple[bool, List[Dict]]:
        """
        验证知识网络API路径
        
        Returns:
            (is_valid, errors)
        """
        errors = []
        
        # 检查是否使用了错误的单数形式
        for pattern in cls.INVALID_PATTERNS['knowledge_network']:
            if re.search(pattern, path):
                errors.append({
                    'type': 'PATH_ERROR',
                    'severity': 'CRITICAL',
                    'message': '知识网络API路径必须使用复数形式: /knowledge-networks',
                    'incorrect_path': path,
                    'correct_path': re.sub(r'knowledge-network(?!s)', 'knowledge-networks', path),
                    'suggestion': '请将路径中的 "knowledge-network" 改为 "knowledge-networks"'
                })
                return False, errors
        
        # 验证是否为知识网络相关路径
        if '/api/ontology-manager/v1' in path:
            # 检查是否使用了正确的复数形式
            if not any(re.match(pattern, path) for pattern in cls.VALID_PATTERNS.values()):
                errors.append({
                    'type': 'PATH_FORMAT_ERROR',
                    'severity': 'WARNING',
                    'message': '知识网络API路径格式可能不正确',
                    'path': path,
                    'expected_patterns': list(cls.VALID_PATTERNS.keys())
                })
                return False, errors
        
        return True, []
```

## 3. 错误处理与日志记录

### 3.1 错误处理示例

```javascript
// 带路径验证的API请求函数
async function callKnowledgeNetworkApi(path, options = {}) {
    // 1. 路径验证
    const validation = validateApiPath(path, 'knowledge_network');
    
    if (!validation.isValid) {
        // 记录错误日志
        console.error('[API路径错误]', {
            timestamp: new Date().toISOString(),
            path: path,
            errors: validation.errors
        });
        
        // 抛出明确错误
        const error = validation.errors[0];
        throw new Error(
            `[API路径错误] ${error.message}\n` +
            `错误路径: ${error.incorrect}\n` +
            `正确路径: ${error.correct}`
        );
    }
    
    // 2. 执行API请求
    try {
        const response = await fetch(path, options);
        return response;
    } catch (error) {
        console.error('[API请求错误]', {
            timestamp: new Date().toISOString(),
            path: path,
            error: error.message
        });
        throw error;
    }
}
```

```python
# 带路径验证的API请求函数
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

def call_knowledge_network_api(path: str, **kwargs) -> Dict[str, Any]:
    """
    调用知识网络API（带路径验证）
    
    Args:
        path: API路径
        **kwargs: 请求参数
        
    Returns:
        API响应数据
        
    Raises:
        ValueError: 路径验证失败
        RuntimeError: API请求失败
    """
    # 1. 路径验证
    is_valid, errors = ApiPathValidator.validate_knowledge_network_path(path)
    
    if not is_valid:
        error = errors[0]
        logger.error(f"[API路径错误] {error['message']}")
        logger.error(f"错误路径: {error['incorrect_path']}")
        logger.error(f"正确路径: {error['correct_path']}")
        
        raise ValueError(
            f"[API路径错误] {error['message']}\n"
            f"错误路径: {error['incorrect_path']}\n"
            f"正确路径: {error['correct_path']}\n"
            f"建议: {error.get('suggestion', '请检查API路径')}""
        )
    
    # 2. 执行API请求
    try:
        # 实际请求逻辑...
        logger.info(f"[API请求成功] {path}")
        return {"status": "success", "path": path}
    except Exception as e:
        logger.error(f"[API请求错误] {path}: {str(e)}")
        raise RuntimeError(f"API请求失败: {str(e)}")
```

## 4. 单元测试用例

### 4.1 知识网络API路径测试

```javascript
// JavaScript单元测试
describe('Knowledge Network API Path Validation', () => {
    
    test('should reject singular form path', () => {
        const invalidPaths = [
            '/api/ontology-manager/v1/knowledge-network',
            '/api/ontology-manager/v1/knowledge-network?offset=0',
            '/api/ontology-manager/v1/knowledge-network/123/object-types'
        ];
        
        invalidPaths.forEach(path => {
            const result = validateApiPath(path, 'knowledge_network');
            expect(result.isValid).toBe(false);
            expect(result.errors[0].type).toBe('PATH_ERROR');
        });
    });
    
    test('should accept plural form path', () => {
        const validPaths = [
            '/api/ontology-manager/v1/knowledge-networks',
            '/api/ontology-manager/v1/knowledge-networks?offset=0',
            '/api/ontology-manager/v1/knowledge-networks/123/object-types'
        ];
        
        validPaths.forEach(path => {
            const result = validateApiPath(path, 'knowledge_network');
            expect(result.isValid).toBe(true);
        });
    });
    
    test('should provide correct path suggestion', () => {
        const incorrectPath = '/api/ontology-manager/v1/knowledge-network?offset=0';
        const result = validateApiPath(incorrectPath, 'knowledge_network');
        
        expect(result.errors[0].correct).toBe(
            '/api/ontology-manager/v1/knowledge-networks?offset=0'
        );
    });
});
```

```python
# Python单元测试
import unittest

class TestKnowledgeNetworkPathValidation(unittest.TestCase):
    """知识网络API路径验证测试"""
    
    def test_reject_singular_form(self):
        """测试拒绝单数形式路径"""
        invalid_paths = [
            '/api/ontology-manager/v1/knowledge-network',
            '/api/ontology-manager/v1/knowledge-network?offset=0',
            '/api/ontology-manager/v1/knowledge-network/123/object-types'
        ]
        
        for path in invalid_paths:
            is_valid, errors = ApiPathValidator.validate_knowledge_network_path(path)
            self.assertFalse(is_valid, f"路径应该被拒绝: {path}")
            self.assertEqual(errors[0]['type'], 'PATH_ERROR')
    
    def test_accept_plural_form(self):
        """测试接受复数形式路径"""
        valid_paths = [
            '/api/ontology-manager/v1/knowledge-networks',
            '/api/ontology-manager/v1/knowledge-networks?offset=0',
            '/api/ontology-manager/v1/knowledge-networks/123/object-types'
        ]
        
        for path in valid_paths:
            is_valid, errors = ApiPathValidator.validate_knowledge_network_path(path)
            self.assertTrue(is_valid, f"路径应该被接受: {path}")
    
    def test_correct_path_suggestion(self):
        """测试正确路径建议"""
        incorrect_path = '/api/ontology-manager/v1/knowledge-network?offset=0'
        is_valid, errors = ApiPathValidator.validate_knowledge_network_path(incorrect_path)
        
        self.assertFalse(is_valid)
        self.assertEqual(
            errors[0]['correct_path'],
            '/api/ontology-manager/v1/knowledge-networks?offset=0'
        )

if __name__ == '__main__':
    unittest.main()
```

## 5. 路径检查清单

在编写或修改API调用代码时，请使用以下检查清单：

- [ ] 知识网络列表API路径使用 `/api/ontology-manager/v1/knowledge-networks`（复数）
- [ ] 对象类型API路径使用 `/api/ontology-manager/v1/knowledge-networks/{id}/object-types`（复数）
- [ ] 未使用单数形式 `/knowledge-network`
- [ ] 路径通过验证函数检查
- [ ] 错误处理逻辑完善
- [ ] 单元测试覆盖路径验证

## 6. 常见错误及修正

| 错误路径 | 问题 | 正确路径 |
|----------|------|----------|
| `/api/ontology-manager/v1/knowledge-network` | ❌ 单数形式 | `/api/ontology-manager/v1/knowledge-networks` |
| `/api/ontology-manager/v1/knowledge-network?offset=0` | ❌ 单数形式 | `/api/ontology-manager/v1/knowledge-networks?offset=0` |
| `/api/ontology-manager/v1/knowledge-network/123/object-types` | ❌ 单数形式 | `/api/ontology-manager/v1/knowledge-networks/123/object-types` |

## 7. 文档更新记录

| 日期 | 更新内容 |
|------|----------|
| 2024-01-15 | 创建API路径规范与验证机制文档 |
| 2024-01-15 | 定义知识网络API路径常量（必须使用复数形式） |
| 2024-01-15 | 添加路径验证机制和错误处理示例 |
| 2024-01-15 | 编写单元测试用例 |
