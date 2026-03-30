package aiservice

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client represents the AI service client
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// Ensure Client implements ClientInterface at compile time
var _ ClientInterface = (*Client)(nil)

// NewClient creates a new AI service client
func NewClient(baseURL string, timeout time.Duration) *Client {
	if timeout == 0 {
		timeout = 10 * time.Second // default timeout
	}
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: timeout,
		},
	}
}

// Call sends a request to the AI service
func (c *Client) Call(requestType RequestType, messageID string, formView *FormView, token string) (*AIServiceResponse, error) {
	// Build request body
	requestBody := map[string]interface{}{
		"message_id":   messageID,
		"request_type": string(requestType),
		"form_view": map[string]interface{}{
			"form_view_id":             formView.ID,
			"form_view_technical_name": formView.TechnicalName,
			"form_view_business_name":  formView.BusinessName,
			"form_view_desc":           formView.Description,
			"form_view_fields":         formView.Fields,
		},
	}

	// Marshal request body
	jsonBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("marshal request body failed: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("%s/api/af-sailor-agent/v1/assistant/data_understand/view_semantic_and_business_analysis", c.baseURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return nil, fmt.Errorf("create HTTP request failed: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", token)
	}

	// Send request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("send HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	// Check status code (200 OK or 202 Accepted for async processing)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AI service returned error status: %d, body: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var aiResponse AIServiceResponse
	if err := json.NewDecoder(resp.Body).Decode(&aiResponse); err != nil {
		return nil, fmt.Errorf("parse AI service response failed: %w", err)
	}

	// Validate status field
	if aiResponse.Status == "failed" || aiResponse.Status == "cancelled" {
		return nil, fmt.Errorf("AI service returned failed status: %s, message: %s", aiResponse.Status, aiResponse.Message)
	}

	return &aiResponse, nil
}
