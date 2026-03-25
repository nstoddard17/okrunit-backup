// Package okrunit provides a Go client for the OKRunit approval gateway API.
package okrunit

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

const (
	defaultBaseURL = "https://okrunit.com"
	defaultTimeout = 30 * time.Second
	userAgent      = "okrunit-go/0.1.0"
)

// Client is the OKRunit API client.
type Client struct {
	apiKey  string
	baseURL string
	http    *http.Client
}

// Option configures the Client.
type Option func(*Client)

// WithBaseURL sets a custom API base URL.
func WithBaseURL(url string) Option {
	return func(c *Client) { c.baseURL = url }
}

// WithTimeout sets the HTTP client timeout.
func WithTimeout(d time.Duration) Option {
	return func(c *Client) { c.http.Timeout = d }
}

// WithHTTPClient sets a custom http.Client.
func WithHTTPClient(hc *http.Client) Option {
	return func(c *Client) { c.http = hc }
}

// NewClient creates a new OKRunit API client.
func NewClient(apiKey string, opts ...Option) *Client {
	c := &Client{
		apiKey:  apiKey,
		baseURL: defaultBaseURL,
		http:    &http.Client{Timeout: defaultTimeout},
	}
	for _, o := range opts {
		o(c)
	}
	return c
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApprovalStatus string

const (
	StatusPending   ApprovalStatus = "pending"
	StatusApproved  ApprovalStatus = "approved"
	StatusRejected  ApprovalStatus = "rejected"
	StatusCancelled ApprovalStatus = "cancelled"
	StatusExpired   ApprovalStatus = "expired"
)

type ApprovalPriority string

const (
	PriorityLow      ApprovalPriority = "low"
	PriorityMedium   ApprovalPriority = "medium"
	PriorityHigh     ApprovalPriority = "high"
	PriorityCritical ApprovalPriority = "critical"
)

// Approval represents an OKRunit approval request.
type Approval struct {
	ID                string                  `json:"id"`
	OrgID             string                  `json:"org_id"`
	ConnectionID      *string                 `json:"connection_id"`
	FlowID            *string                 `json:"flow_id"`
	Source            *string                 `json:"source"`
	Title             string                  `json:"title"`
	Description       *string                 `json:"description"`
	ActionType        string                  `json:"action_type"`
	Priority          ApprovalPriority        `json:"priority"`
	Status            ApprovalStatus          `json:"status"`
	CallbackURL       *string                 `json:"callback_url"`
	CallbackHeaders   map[string]interface{}  `json:"callback_headers"`
	Metadata          map[string]interface{}  `json:"metadata"`
	ContextHTML       *string                 `json:"context_html"`
	DecidedBy         *string                 `json:"decided_by"`
	DecidedAt         *string                 `json:"decided_at"`
	DecisionComment   *string                 `json:"decision_comment"`
	DecisionSource    *string                 `json:"decision_source"`
	ExpiresAt         *string                 `json:"expires_at"`
	IdempotencyKey    *string                 `json:"idempotency_key"`
	RequiredApprovals int                     `json:"required_approvals"`
	CurrentApprovals  int                     `json:"current_approvals"`
	AutoApproved      bool                    `json:"auto_approved"`
	RiskScore         *float64                `json:"risk_score"`
	RiskLevel         *string                 `json:"risk_level"`
	CreatedAt         string                  `json:"created_at"`
	UpdatedAt         string                  `json:"updated_at"`
}

// Comment represents a comment on an approval request.
type Comment struct {
	ID           string  `json:"id"`
	RequestID    string  `json:"request_id"`
	UserID       *string `json:"user_id"`
	ConnectionID *string `json:"connection_id"`
	Body         string  `json:"body"`
	CreatedAt    string  `json:"created_at"`
}

// CreateApprovalParams are the parameters for creating an approval.
type CreateApprovalParams struct {
	Title                   string                 `json:"title"`
	Description             string                 `json:"description,omitempty"`
	ActionType              string                 `json:"action_type,omitempty"`
	Priority                ApprovalPriority       `json:"priority,omitempty"`
	CallbackURL             string                 `json:"callback_url,omitempty"`
	CallbackHeaders         map[string]string      `json:"callback_headers,omitempty"`
	Metadata                map[string]interface{} `json:"metadata,omitempty"`
	ContextHTML             string                 `json:"context_html,omitempty"`
	ExpiresAt               string                 `json:"expires_at,omitempty"`
	IdempotencyKey          string                 `json:"idempotency_key,omitempty"`
	RequiredApprovals       int                    `json:"required_approvals,omitempty"`
	AssignedApprovers       []string               `json:"assigned_approvers,omitempty"`
	AssignedTeamID          string                 `json:"assigned_team_id,omitempty"`
	Source                  string                 `json:"source,omitempty"`
	SourceID                string                 `json:"source_id,omitempty"`
	IsSequential            bool                   `json:"is_sequential,omitempty"`
	AutoAction              string                 `json:"auto_action,omitempty"`
	AutoActionAfterMinutes  int                    `json:"auto_action_after_minutes,omitempty"`
	RequireRejectionReason  bool                   `json:"require_rejection_reason,omitempty"`
}

// ListApprovalsParams are the query parameters for listing approvals.
type ListApprovalsParams struct {
	Status   ApprovalStatus   `json:"status,omitempty"`
	Priority ApprovalPriority `json:"priority,omitempty"`
	Search   string           `json:"search,omitempty"`
	Page     int              `json:"page,omitempty"`
	PageSize int              `json:"page_size,omitempty"`
}

// RespondApprovalParams are the parameters for responding to an approval.
type RespondApprovalParams struct {
	Decision             string `json:"decision"`
	Comment              string `json:"comment,omitempty"`
	Source               string `json:"source,omitempty"`
	ScheduledExecutionAt string `json:"scheduled_execution_at,omitempty"`
}

// BatchApprovalParams are the parameters for batch approval operations.
type BatchApprovalParams struct {
	IDs      []string `json:"ids"`
	Decision string   `json:"decision"`
	Comment  string   `json:"comment,omitempty"`
}

// PaginatedResponse wraps a paginated list of approvals.
type PaginatedResponse struct {
	Data     []Approval `json:"data"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"page_size"`
}

// APIError is an error returned by the OKRunit API.
type APIError struct {
	StatusCode int    `json:"-"`
	Message    string `json:"error"`
	Code       string `json:"code,omitempty"`
}

func (e *APIError) Error() string {
	if e.Code != "" {
		return fmt.Sprintf("okrunit: %s (code: %s, status: %d)", e.Message, e.Code, e.StatusCode)
	}
	return fmt.Sprintf("okrunit: %s (status: %d)", e.Message, e.StatusCode)
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

func (c *Client) doRequest(ctx context.Context, method, path string, body interface{}, query url.Values) ([]byte, error) {
	u := fmt.Sprintf("%s/api/v1%s", c.baseURL, path)
	if len(query) > 0 {
		u += "?" + query.Encode()
	}

	var bodyReader io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("okrunit: failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequestWithContext(ctx, method, u, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("okrunit: failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", userAgent)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("okrunit: request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("okrunit: failed to read response: %w", err)
	}

	if resp.StatusCode >= 400 {
		apiErr := &APIError{StatusCode: resp.StatusCode}
		if json.Unmarshal(respBody, apiErr) != nil {
			apiErr.Message = string(respBody)
		}
		return nil, apiErr
	}

	return respBody, nil
}

// ---------------------------------------------------------------------------
// Approvals
// ---------------------------------------------------------------------------

// CreateApproval creates a new approval request.
func (c *Client) CreateApproval(ctx context.Context, params CreateApprovalParams) (*Approval, error) {
	body, err := c.doRequest(ctx, http.MethodPost, "/approvals", params, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data Approval `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result.Data, nil
}

// GetApproval retrieves a single approval by ID.
func (c *Client) GetApproval(ctx context.Context, id string) (*Approval, error) {
	body, err := c.doRequest(ctx, http.MethodGet, "/approvals/"+id, nil, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data Approval `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result.Data, nil
}

// ListApprovals lists approvals with optional filters.
func (c *Client) ListApprovals(ctx context.Context, params *ListApprovalsParams) (*PaginatedResponse, error) {
	query := url.Values{}
	if params != nil {
		if params.Status != "" {
			query.Set("status", string(params.Status))
		}
		if params.Priority != "" {
			query.Set("priority", string(params.Priority))
		}
		if params.Search != "" {
			query.Set("search", params.Search)
		}
		if params.Page > 0 {
			query.Set("page", fmt.Sprintf("%d", params.Page))
		}
		if params.PageSize > 0 {
			query.Set("page_size", fmt.Sprintf("%d", params.PageSize))
		}
	}

	body, err := c.doRequest(ctx, http.MethodGet, "/approvals", nil, query)
	if err != nil {
		return nil, err
	}
	var result PaginatedResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result, nil
}

// RespondToApproval approves or rejects an approval.
func (c *Client) RespondToApproval(ctx context.Context, id string, params RespondApprovalParams) (*Approval, error) {
	body, err := c.doRequest(ctx, http.MethodPatch, "/approvals/"+id, params, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data Approval `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result.Data, nil
}

// CancelApproval cancels a pending approval.
func (c *Client) CancelApproval(ctx context.Context, id string) (*Approval, error) {
	body, err := c.doRequest(ctx, http.MethodDelete, "/approvals/"+id, nil, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data Approval `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result.Data, nil
}

// BatchRespond batch approves or rejects multiple approvals.
func (c *Client) BatchRespond(ctx context.Context, params BatchApprovalParams) ([]byte, error) {
	return c.doRequest(ctx, http.MethodPost, "/approvals/batch", params, nil)
}

// WaitForDecision polls an approval until it reaches a terminal state or the context is done.
func (c *Client) WaitForDecision(ctx context.Context, id string, pollInterval time.Duration) (*Approval, error) {
	if pollInterval == 0 {
		pollInterval = 2 * time.Second
	}

	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		approval, err := c.GetApproval(ctx, id)
		if err != nil {
			return nil, err
		}

		switch approval.Status {
		case StatusApproved, StatusRejected, StatusCancelled, StatusExpired:
			return approval, nil
		}

		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
		}
	}
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

// ListComments lists comments on an approval.
func (c *Client) ListComments(ctx context.Context, approvalID string) ([]Comment, error) {
	body, err := c.doRequest(ctx, http.MethodGet, "/approvals/"+approvalID+"/comments", nil, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data []Comment `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return result.Data, nil
}

// AddComment adds a comment to an approval.
func (c *Client) AddComment(ctx context.Context, approvalID, commentBody string) (*Comment, error) {
	body, err := c.doRequest(ctx, http.MethodPost, "/approvals/"+approvalID+"/comments", map[string]string{"body": commentBody}, nil)
	if err != nil {
		return nil, err
	}
	var result struct{ Data Comment `json:"data"` }
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("okrunit: failed to parse response: %w", err)
	}
	return &result.Data, nil
}
