package conf

type Bootstrap struct {
	Server *Server `json:"server"`
	Data   *Data   `json:"data"`
}

type Server struct {
	Http *Http
	Grpc *Grpc
}

type Http struct {
	NetWork string `json:"network"`
	Addr    string `json:"addr"`
}

type Grpc struct {
}

type Data struct {
}
