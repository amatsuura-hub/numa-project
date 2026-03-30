package handler

import (
	"encoding/json"
	"fmt"
	"net/url"
	"regexp"
	"unicode/utf8"
)

// Validation limits for user-submitted text fields.
const (
	maxTitleLen       = 100
	maxDescriptionLen = 1000
	maxCategoryLen    = 50
	maxNodeLabelLen   = 50
	maxNodeDescLen    = 500
	maxTagLen         = 30
	maxTagsCount      = 5
	maxBatchNodes     = 100
)

func validateTags(tags []string) error {
	if len(tags) > maxTagsCount {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("maximum %d tags allowed", maxTagsCount))
	}
	seen := make(map[string]bool, len(tags))
	for _, tag := range tags {
		if tag == "" {
			return NewAPIError(ErrBadRequest, "tags cannot be empty")
		}
		if utf8.RuneCountInString(tag) > maxTagLen {
			return NewAPIError(ErrBadRequest, fmt.Sprintf("each tag must be %d characters or less (got %d)", maxTagLen, utf8.RuneCountInString(tag)))
		}
		if seen[tag] {
			return NewAPIError(ErrBadRequest, "duplicate tags are not allowed")
		}
		seen[tag] = true
	}
	return nil
}

// validateRoadmapFields validates fields common to create and update roadmap requests.
func validateRoadmapFields(title string, description string, category string, tags []string) error {
	if title == "" {
		return NewAPIError(ErrBadRequest, "title is required")
	}
	if utf8.RuneCountInString(title) > maxTitleLen {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("title must be %d characters or less (got %d)", maxTitleLen, utf8.RuneCountInString(title)))
	}
	if utf8.RuneCountInString(description) > maxDescriptionLen {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("description must be %d characters or less (got %d)", maxDescriptionLen, utf8.RuneCountInString(description)))
	}
	if utf8.RuneCountInString(category) > maxCategoryLen {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("category must be %d characters or less (got %d)", maxCategoryLen, utf8.RuneCountInString(category)))
	}
	if err := validateTags(tags); err != nil {
		return err
	}
	return nil
}

func validateCreateRoadmapBody(body string, req *CreateRoadmapRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	return validateRoadmapFields(req.Title, req.Description, req.Category, req.Tags)
}

func validateUpdateRoadmapBody(body string, req *UpdateRoadmapRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	return validateRoadmapFields(req.Title, req.Description, req.Category, req.Tags)
}

var hexColorRegex = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

// validateNodeFields validates fields common to single-node and batch-node requests.
func validateNodeFields(label, description, color, rawURL string) error {
	if label == "" {
		return NewAPIError(ErrBadRequest, "label is required")
	}
	if utf8.RuneCountInString(label) > maxNodeLabelLen {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("node label must be %d characters or less (got %d)", maxNodeLabelLen, utf8.RuneCountInString(label)))
	}
	if utf8.RuneCountInString(description) > maxNodeDescLen {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("node description must be %d characters or less (got %d)", maxNodeDescLen, utf8.RuneCountInString(description)))
	}
	if color != "" && !hexColorRegex.MatchString(color) {
		return NewAPIError(ErrBadRequest, "color must be a valid hex color (e.g. #4c6ef5)")
	}
	if rawURL != "" {
		if u, err := url.ParseRequestURI(rawURL); err != nil || (u.Scheme != "http" && u.Scheme != "https") {
			return NewAPIError(ErrBadRequest, "url must be a valid HTTP or HTTPS URL")
		}
	}
	return nil
}

func validateCreateNodeBody(body string, req *CreateNodeRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	return validateNodeFields(req.Label, req.Description, req.Color, req.URL)
}

func validateBatchUpdateNodesBody(body string, req *BatchUpdateNodesRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	if len(req.Nodes) == 0 {
		return NewAPIError(ErrBadRequest, "nodes array is required")
	}
	if len(req.Nodes) > maxBatchNodes {
		return NewAPIError(ErrBadRequest, fmt.Sprintf("maximum %d nodes per batch", maxBatchNodes))
	}
	for _, n := range req.Nodes {
		if n.NodeID == "" {
			return NewAPIError(ErrBadRequest, "nodeId is required for each node")
		}
		if err := validateNodeFields(n.Label, n.Description, n.Color, n.URL); err != nil {
			return err
		}
	}
	return nil
}

func validateCreateEdgeBody(body string, req *CreateEdgeRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	if req.SourceNodeID == "" || req.TargetNodeID == "" {
		return NewAPIError(ErrBadRequest, "sourceNodeId and targetNodeId are required")
	}
	return nil
}
