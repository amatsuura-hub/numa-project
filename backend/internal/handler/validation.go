package handler

import (
	"encoding/json"
	"net/url"
	"regexp"
)

func validateTags(tags []string) error {
	if len(tags) > 5 {
		return NewAPIError(ErrBadRequest, "maximum 5 tags allowed")
	}
	seen := make(map[string]bool, len(tags))
	for _, tag := range tags {
		if tag == "" {
			return NewAPIError(ErrBadRequest, "tags cannot be empty")
		}
		if len(tag) > 30 {
			return NewAPIError(ErrBadRequest, "each tag must be 30 characters or less")
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
	if len(title) > 100 {
		return NewAPIError(ErrBadRequest, "title must be 100 characters or less")
	}
	if len(description) > 1000 {
		return NewAPIError(ErrBadRequest, "description must be 1000 characters or less")
	}
	if len(category) > 50 {
		return NewAPIError(ErrBadRequest, "category must be 50 characters or less")
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
	if len(label) > 50 {
		return NewAPIError(ErrBadRequest, "label must be 50 characters or less")
	}
	if len(description) > 500 {
		return NewAPIError(ErrBadRequest, "description must be 500 characters or less")
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
	if len(req.Nodes) > 100 {
		return NewAPIError(ErrBadRequest, "maximum 100 nodes per batch")
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
