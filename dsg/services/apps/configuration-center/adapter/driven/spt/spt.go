package spt

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"google.golang.org/grpc"
)

func NewGRPCClient() (grpc.ClientConnInterface, error) {
	return grpc.NewClient(settings.ConfigInstance.Config.DepServices.DataAdaptorHost, grpc.WithInsecure())
}
func NewUserRegisterClient(conn grpc.ClientConnInterface) register.UserServiceClient {
	return register.NewUserServiceClient(conn)
}
