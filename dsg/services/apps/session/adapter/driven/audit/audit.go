package audit

import (
	"context"
	"encoding/json"

	"github.com/IBM/sarama"
	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra"
	"github.com/kweaver-ai/dsg/services/apps/session/domain/d_session"
	v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	middleware_v1 "github.com/kweaver-ai/idrm-go-common/middleware/v1"
	gConfiguration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

const (
	contextAgentKey = "context-agent"
)

type Logger struct {
	ccDriven    gConfiguration_center.Driven
	auditLogger audit.Logger // 审计日志的日志器
}

func NewAuditLogger(
	ccDriven gConfiguration_center.Driven,
	client sarama.SyncProducer,
) *Logger {

	return &Logger{
		ccDriven:    ccDriven,
		auditLogger: audit.NewKafka(client),
	}
}

// AuditLogForLogin 用户登录的审计日志
func (l *Logger) AuditLogForLogin(ctx context.Context, sessionInfo *d_session.SessionInfo) {
	l.auditLog(ctx, v1.OperationLogin, sessionInfo)
}

// AuditLogForLogout 用户登出的审计日志
func (l *Logger) AuditLogForLogout(ctx context.Context, sessionInfo *d_session.SessionInfo) {
	l.auditLog(ctx, v1.OperationLogout, sessionInfo)
}

// auditLog  添加用户审计日志
func (l *Logger) auditLog(ctx context.Context, op v1.Operation, sessionInfo *d_session.SessionInfo) {
	//用户基本信息
	operator := l.getOperatorFromSession(ctx, sessionInfo)
	//审核日志的详情
	auditDetail := NewUserInfoAuditDetail(operator, op)
	log.Infof("operator info: %v", string(lo.T2(json.Marshal(operator)).A))
	//获取发送方法 logger
	logger := l.auditLogger.WithOperator(operator)
	//发送日志
	logger.Info(op, auditDetail)
	return
}

func (l *Logger) getOperatorFromSession(ctx context.Context, sessionInfo *d_session.SessionInfo) v1.Operator {
	operator := v1.Operator{
		ID:    sessionInfo.Userid,
		Name:  sessionInfo.UserName,
		Agent: GetAgent(ctx),
	}
	switch sessionInfo.VisitorTyp {
	case hydra.App, hydra.Business:
		operator.Type = v1.OperatorAPP
	case hydra.RealName, hydra.Anonymous:
		operator.Type = v1.OperatorAuthenticatedUser
	default:
		operator.Type = v1.OperatorUnknown
	}
	// 获取用户所属部门
	user, err := l.ccDriven.GetUserInfo(ctx, operator.ID)
	if err != nil {
		return operator
	}
	operator.LoginName = user.LoginName
	departmentPathSlice := lo.Times(len(user.ParentDeps), func(i int) gConfiguration_center.DepartmentPath {
		departPath := user.ParentDeps[i]
		return lo.Times(len(departPath), func(j int) gConfiguration_center.Department {
			return gConfiguration_center.Department{
				ID:   departPath[j].ID,
				Name: departPath[j].Name,
			}
		})
	})
	operator.DepartmentCode = user.GetFirstDepartCode()
	operator.Department = middleware_v1.AuditDepartmentsFromUserParentDeps(departmentPathSlice)
	return operator
}

func SetAgent() gin.HandlerFunc {
	return func(c *gin.Context) {
		agent := audit.AgentFromRequest(c.Request)
		c.Request.WithContext(context.WithValue(c.Request.Context(), contextAgentKey, agent))
		c.Set(contextAgentKey, agent)
	}
}

func SaveAgent(c *gin.Context, ctx context.Context) context.Context {
	agent := audit.AgentFromRequest(c.Request)
	newCtx := context.WithValue(ctx, contextAgentKey, agent)
	return newCtx
}

func GetAgent(c context.Context) v1.Agent {
	agent, ok := c.Value(contextAgentKey).(v1.Agent)
	if !ok {
		return v1.Agent{
			Type: v1.AgentUnknown,
			IP:   []byte{0, 0, 0, 0},
		}
	}
	//默认都是用户
	agent.Type = v1.AgentWeb
	return agent
}
