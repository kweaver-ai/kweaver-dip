package util

import (
	"errors"
	"fmt"
	"github.com/bwmarrin/snowflake"
	"net"
	"os"
	"sync"
)

var (
	once = sync.Once{}
	node *snowflake.Node
)

func init() {
	once.Do(func() {
		node = NewSnowflake()
	})
}

func GetUniqueID() int64 {
	return node.Generate().Int64()
}

func GetUniqueString() string {
	return node.Generate().String()
}

func NewSnowflake() *snowflake.Node {
	snowflake.NodeBits = 8
	snowflake.StepBits = 4

	nodeId, err := Lower8BitIP()
	if err != nil {
		panic(fmt.Errorf("snowflake: failed to create snowflake node, %v", err))
	}
	node, err := snowflake.NewNode(int64(nodeId))
	if err != nil {
		panic(fmt.Errorf("snowflake: failed to create snowflake node, %v", err))
	}

	return node
}

func Lower8BitIP() (uint8, error) {
	ip, err := LocalIP()
	if err != nil {
		return 0, err
	}

	return ip[3], nil
}

func LocalIP() (net.IP, error) {
	ipStr := os.Getenv("POD_IP")
	if ipStr != "" {
		ip := net.ParseIP(ipStr)
		ip = ip.To16()
		if ip == nil || len(ip) < 4 {
			return nil, errors.New("invalid IP")
		}

		return ip, nil
	}

	as, err := net.InterfaceAddrs()
	if err != nil {
		return nil, err
	}

	for _, a := range as {
		ipnet, ok := a.(*net.IPNet)
		if !ok || ipnet.IP.IsLoopback() || ipnet.IP.To4() == nil {
			continue
		}

		return ipnet.IP.To4(), nil
	}

	return nil, errors.New("no ip address")
}
