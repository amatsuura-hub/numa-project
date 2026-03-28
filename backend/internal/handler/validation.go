package handler

import "encoding/json"

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
