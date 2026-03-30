package openai

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"github.com/sashabaranov/go-openai"
)

const (
	apiType = "azure"
)

type OpenAI interface {
	Chat(ctx context.Context, prompt any, options ...ChatOption) (string, error)
	ChatGPT35(ctx context.Context, prompt string, options ...ChatGPTOption) (string, error)
	//ChatGPT(ctx context.Context, messages []ChatGPTMessage, options ...ChatGPTOption) (string, error)
}

type ChatOption interface {
	apply(*openai.CompletionRequest)
}

type chatOption func(*openai.CompletionRequest)

func (c chatOption) apply(req *openai.CompletionRequest) {
	c(req)
}

func WithModelByChat(model string) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.Model = model
	})
}

func WithMaxTokensByChat(maxTokens int) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.MaxTokens = maxTokens
	})
}

func WithTemperatureByChat(temperature float32) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.Temperature = temperature
	})
}

func WithNByChat(n int) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.N = n
	})
}

func WithFrequencyPenaltyByChat(frequencyPenalty float32) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.FrequencyPenalty = frequencyPenalty
	})
}

func WithPresencePenaltyByChat(presencePenalty float32) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.PresencePenalty = presencePenalty
	})
}

func WithStopByChat(stop []string) ChatOption {
	return chatOption(func(req *openai.CompletionRequest) {
		req.Stop = stop
	})
}

type ChatGPTOption interface {
	apply(*openai.ChatCompletionRequest)
}

type chatGPTOption func(*openai.ChatCompletionRequest)

func (c chatGPTOption) apply(req *openai.ChatCompletionRequest) {
	c(req)
}

func WithModelByChatGPT(model string) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.Model = model
	})
}

func WithTemperatureByChatGPT(temperature float32) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.Temperature = temperature
	})
}

func WithMaxTokensByChatGPT(maxTokens int) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.MaxTokens = maxTokens
	})
}

func WithTopPByChatGPT(topP float32) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.TopP = topP
	})
}

func WithFrequencyPenaltyByChatGPT(frequencyPenalty float32) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.FrequencyPenalty = frequencyPenalty
	})
}

func WithPresencePenaltyByChatGPT(presencePenalty float32) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.PresencePenalty = presencePenalty
	})
}

func WithStopByChatGPT(stop []string) ChatGPTOption {
	return chatGPTOption(func(req *openai.ChatCompletionRequest) {
		req.Stop = stop
	})
}

type openAI struct {
	apiKey     string
	endpoint   string
	apiVersion string
	apiType    string

	httpClient *http.Client
	client     *openai.Client
}

func NewOpenAI(httpClient *http.Client) OpenAI {
	cfg := settings.GetConfig().OpenAIConf
	o := &openAI{
		apiKey:     cfg.APIKey,
		endpoint:   cfg.URL,
		apiVersion: cfg.APIVersion,
		apiType:    cfg.APIType,
		//httpClient: httpClient,
	}
	o.init()
	return o
}

func (o *openAI) init() {
	var cfg openai.ClientConfig
	if o.apiType == apiType {
		cfg = openai.DefaultAzureConfig(o.apiKey, o.endpoint)
	} else {
		cfg = openai.DefaultConfig(o.apiKey)
	}

	cfg.BaseURL = o.endpoint
	cfg.APIVersion = o.apiVersion
	if o.httpClient != nil {
		cfg.HTTPClient = o.httpClient
	}

	o.client = openai.NewClientWithConfig(cfg)
}

func (*openAI) defaultChatCompletionReq(prompt any) openai.CompletionRequest {
	return openai.CompletionRequest{
		Model:            "asdavinci003",
		Prompt:           prompt,
		Suffix:           "",
		MaxTokens:        2048,
		Temperature:      0,
		TopP:             0,
		N:                1,
		Stream:           false,
		LogProbs:         0,
		Echo:             false,
		Stop:             nil,
		PresencePenalty:  0,
		FrequencyPenalty: 0,
		BestOf:           0,
		LogitBias:        nil,
		User:             "",
	}
}

func (o *openAI) genChatCompletionReq(prompt any, options ...ChatOption) openai.CompletionRequest {
	req := o.defaultChatCompletionReq(prompt)
	for _, option := range options {
		option.apply(&req)
	}

	return req
}

func (o *openAI) Chat(ctx context.Context, prompt any, options ...ChatOption) (string, error) {
	req := o.genChatCompletionReq(prompt, options...)

	resp, err := o.client.CreateCompletion(ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create completion by chat, prompt: %v, err: %v", prompt, err)
		return "", err
	}

	return strings.TrimSpace(resp.Choices[0].Text), nil
}

type ChatGPTMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func (*openAI) defaultChatGPTCompletionReq(messages []openai.ChatCompletionMessage) openai.ChatCompletionRequest {
	return openai.ChatCompletionRequest{
		Model:            "af-gpt-35-turbo",
		Messages:         messages,
		MaxTokens:        4096,
		Temperature:      0,
		TopP:             0.95,
		N:                0,
		Stream:           false,
		Stop:             nil,
		PresencePenalty:  0,
		FrequencyPenalty: 0,
		LogitBias:        nil,
		User:             "",
		Functions:        nil,
		FunctionCall:     nil,
	}
}

func (o *openAI) genChatCPTCompletionReq(messages []openai.ChatCompletionMessage, options ...ChatGPTOption) openai.ChatCompletionRequest {
	req := o.defaultChatGPTCompletionReq(messages)
	for _, option := range options {
		option.apply(&req)
	}

	return req
}

func (o *openAI) ChatGPT(ctx context.Context, messages []ChatGPTMessage, options ...ChatGPTOption) (string, error) {
	resp, err := o.chatGPT(ctx, lo.Map(messages, func(item ChatGPTMessage, _ int) openai.ChatCompletionMessage {
		return openai.ChatCompletionMessage{
			Role:         item.Role,
			Content:      item.Content,
			Name:         "",
			FunctionCall: nil,
		}
	}), options...)
	if err != nil {
		return "", err
	}

	return strings.TrimSpace(resp.Choices[0].Message.Content), nil
}

func (o *openAI) chatGPT(ctx context.Context, messages []openai.ChatCompletionMessage, options ...ChatGPTOption) (*openai.ChatCompletionResponse, error) {
	req := o.genChatCPTCompletionReq(messages, options...)

	resp, err := o.client.CreateChatCompletion(ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create chat completion by chatgpt, messages: %s, err: %v", lo.T2(json.Marshal(messages)).A, err)
		return nil, err
	}

	return &resp, nil
}

func (o *openAI) genChatGPTMessages(prompt string, msgs []openai.ChatCompletionMessage, preResult *openai.ChatCompletionResponse) []openai.ChatCompletionMessage {
	if len(msgs) < 1 {
		msgs = append(msgs, openai.ChatCompletionMessage{
			Role:         openai.ChatMessageRoleSystem,
			Content:      "You are an AI assistant that helps people find information.",
			Name:         "",
			FunctionCall: nil,
		})
	}

	if preResult != nil {
		message := preResult.Choices[0].Message
		msgs = append(msgs, openai.ChatCompletionMessage{
			Role:    message.Role,
			Content: message.Content,
		})
	}

	if len(prompt) > 0 {
		msgs = append(msgs, openai.ChatCompletionMessage{
			Role:         openai.ChatMessageRoleUser,
			Content:      prompt,
			Name:         "",
			FunctionCall: nil,
		})
	}

	return msgs
}

func (o *openAI) ChatGPT35(ctx context.Context, prompt string, options ...ChatGPTOption) (string, error) {
	msgs := o.genChatGPTMessages(prompt, nil, nil)

	buf := bytes.NewBuffer(nil)
	cnt := 0
	for {
		if cnt > 10 {
			log.WithContext(ctx).Errorf("openai result length too long, cnt: %v, msg: %s, result: %s", cnt, lo.T2(json.Marshal(msgs)).A, buf.String())
			return "", errors.New("openai result length too long")
		}

		resp, err := o.chatGPT(ctx, msgs, options...)
		if err != nil {
			return "", err
		}

		log.WithContext(ctx).Infof("openai result: %s", lo.T2(json.Marshal(resp)).A)

		buf.WriteString(resp.Choices[0].Message.Content)
		if resp.Choices[0].FinishReason != openai.FinishReasonLength {
			break
		}

		msgs = o.genChatGPTMessages("继续", msgs, resp)
		cnt++
	}

	return buf.String(), nil
}
