package common

type PubMsg struct {
	key   []byte // 消息key
	value []byte // 消息内容
}

type PubResult struct {
	err    error
	srcMsg *PubMsg
}

func MQMsgBuilder(key, value []byte) *PubMsg {
	msg := new(PubMsg)
	// msg.topic = topic
	msg.key = key
	msg.value = value
	return msg
}

func (pm *PubMsg) Key() []byte {
	return pm.key
}

func (pm *PubMsg) Value() []byte {
	return pm.value
}

func (pr *PubResult) Error() error {
	return pr.err
}

func (pr *PubResult) SrcMsg() *PubMsg {
	return pr.srcMsg
}

func (pr *PubResult) SetError(err error) {
	pr.err = err
}

func (pr *PubResult) SetSrcMsg(key, value []byte) {
	pr.srcMsg = &PubMsg{key: key, value: value}
}
