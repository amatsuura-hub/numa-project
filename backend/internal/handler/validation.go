package handler

import (
	"encoding/json"
	"net/url"
	"regexp"
)

func validateCreateRoadmapBody(body string, req *CreateRoadmapRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	if req.Title == "" {
		return NewAPIError(ErrBadRequest, "title is required")
	}
	if len(req.Title) > 100 {
		return NewAPIError(ErrBadRequest, "title must be 100 characters or less")
	}
	if len(req.Description) > 1000 {
		return NewAPIError(ErrBadRequest, "description must be 1000 characters or less")
	}
	if len(req.Tags) > 5 {
		return NewAPIError(ErrBadRequest, "maximum 5 tags allowed")
	}
	return nil
}

func validateUpdateRoadmapBody(body string, req *UpdateRoadmapRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	if req.Title == "" {
		return NewAPIError(ErrBadRequest, "title is required")
	}
	if len(req.Title) > 100 {
		return NewAPIError(ErrBadRequest, "title must be 100 characters or less")
	}
	if len(req.Description) > 1000 {
		return NewAPIError(ErrBadRequest, "description must be 1000 characters or less")
	}
	if len(req.Tags) > 5 {
		return NewAPIError(ErrBadRequest, "maximum 5 tags allowed")
	}
	return nil
}

var hexColorRegex = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)

func validateCreateNodeBody(body string, req *CreateNodeRequest) error {
	if err := json.Unmarshal([]byte(body), req); err != nil {
		return NewAPIError(ErrBadRequest, "Invalid request body")
	}
	if req.Label == "" {
		return NewAPIError(ErrBadRequest, "label is required")
	}
	if len(req.Label) > 50 {
		return NewAPIError(ErrBadRequest, "label must be 50 characters or less")
	}
	if len(req.Description) > 500 {
		return NewAPIError(ErrBadRequest, "description must be 500 characters or less")
	}
	if req.Color != "" && !hexColorRegex.MatchString(req.Color) {
		return NewAPIError(ErrBadRequest, "color must be a valid hex color (e.g. #4c6ef5)")
	}
	if req.URL != "" {
		if u, err := url.ParseRequestURI(req.URL); err != nil || (u.Scheme != "http" && u.Scheme != "https") {
			return NewAPIError(ErrBadRequest, "url must be a valid HTTP or HTTPS URL")
		}
	}
	return nil
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
		if n.Label == "" {
			return NewAPIError(ErrBadRequest, "label is required for each node")
		}
		if len(n.Label) > 50 {
			return NewAPIError(ErrBadRequest, "label must be 50 characters or less")
		}
		if len(n.Description) > 500 {
			return NewAPIError(ErrBadRequest, "description must be 500 characters or less")
		}
		if n.Color != "" && !hexColorRegex.MatchString(n.Color) {
			return NewAPIError(ErrBadRequest, "color must be a valid hex color (e.g. #4c6ef5)")
		}
		if n.URL != "" {
			if u, err := url.ParseRequestURI(n.URL); err != nil || (u.Scheme != "http" && u.Scheme != "https") {
				return NewAPIError(ErrBadRequest, "url must be a valid HTTP or HTTPS URL")
			}
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
