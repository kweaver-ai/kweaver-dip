package common

import (
	"context"
	"sync"
	"sync/atomic"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	initStatus int32 = iota
	endStatus
)

type GetUsernameOP struct {
	repoUser user2.IUserRepo
	uIdSet   map[string]struct{}
	userMap  map[string]*model.User
	initOnce sync.Once
	status   int32
}

func NewGetUsernameOp(repoUser user2.IUserRepo) *GetUsernameOP {
	g := &GetUsernameOP{repoUser: repoUser}
	g.init()
	return g
}

func (g *GetUsernameOP) init() {
	g.initOnce.Do(func() {
		g.reset()
	})
}

func (g *GetUsernameOP) reset() {
	g.uIdSet = make(map[string]struct{})
	g.userMap = make(map[string]*model.User)
	g.status = initStatus
}

func (g *GetUsernameOP) AddUserId(uIds ...string) {
	g.init()

	if atomic.LoadInt32(&g.status) == endStatus {
		log.Warn("user id cannot be added")
		return
	}

	for _, uId := range uIds {
		if _, ok := g.uIdSet[uId]; !ok {
			g.uIdSet[uId] = struct{}{}
		}
	}
}

func (g *GetUsernameOP) GetUsername(uId string) string {
	if atomic.LoadInt32(&g.status) != endStatus {
		panic("pre call GetUser")
	}

	if _, ok := g.uIdSet[uId]; !ok {
		// 没有添加的uid
		log.Warn("unknown user id")
	}

	u := g.userMap[uId]
	if u == nil {
		return uId
	}

	if len(u.Name) < 1 {
		return uId
	}

	return u.Name
}

func (g *GetUsernameOP) GetUser(ctx context.Context) error {
	if !atomic.CompareAndSwapInt32(&g.status, initStatus, endStatus) {
		// already cal
		return nil
	}

	if len(g.uIdSet) < 1 {
		return nil
	}

	uIds := make([]string, 0, len(g.uIdSet))
	for uId := range g.uIdSet {
		uIds = append(uIds, uId)
	}

	users, err := g.repoUser.ListUserByIDs(ctx, uIds...)
	if err != nil {
		return err
	}

	g.userMap = make(map[string]*model.User, len(users))
	for _, u := range users {
		g.userMap[u.ID] = u
	}

	return nil
}
