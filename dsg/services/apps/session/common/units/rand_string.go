package units

import (
	"math/rand"
	"time"
)

const letterBytes = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func randString(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letterBytes[rand.Intn(len(letterBytes))]
	}
	return string(b)
}
func RandLenRandString(min, max int) string {
	rand.Seed(time.Now().UnixNano())
	strLen := rand.Intn(max-min+1) + min
	return randString(strLen)
}
