package handler

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/numa-project/backend/internal/model"
)

type UpdateProfileRequest struct {
	DisplayName string `json:"displayName"`
	Bio         string `json:"bio"`
	XHandle     string `json:"xHandle"`
}

func (h *Handler) GetMyProfile(ctx context.Context, userID string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	user, err := h.repo.GetUser(ctx, userID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get profile")
	}
	if user == nil {
		return nil, NewAPIError(ErrNotFound, "User not found")
	}
	return user, nil
}

func (h *Handler) UpdateMyProfile(ctx context.Context, userID string, body string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	var req UpdateProfileRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return nil, NewAPIError(ErrBadRequest, "Invalid request body")
	}

	if req.DisplayName == "" {
		return nil, NewAPIError(ErrBadRequest, "displayName is required")
	}
	if len(req.DisplayName) > 50 {
		return nil, NewAPIError(ErrBadRequest, "displayName must be 50 characters or less")
	}
	if len(req.Bio) > 500 {
		return nil, NewAPIError(ErrBadRequest, "bio must be 500 characters or less")
	}
	if len(req.XHandle) > 30 {
		return nil, NewAPIError(ErrBadRequest, "xHandle must be 30 characters or less")
	}

	user, err := h.repo.UpdateUser(ctx, userID, req.DisplayName, req.Bio, req.XHandle)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to update profile")
	}
	return user, nil
}

func (h *Handler) GetUserProfile(ctx context.Context, targetUserID string) (interface{}, error) {
	user, err := h.repo.GetUser(ctx, targetUserID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get profile")
	}
	if user == nil {
		return nil, NewAPIError(ErrNotFound, "User not found")
	}
	return user, nil
}

func (h *Handler) GetUserPublicRoadmaps(ctx context.Context, targetUserID string, params map[string]string) (interface{}, error) {
	limit := int32(20)
	if l, ok := params["limit"]; ok {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 50 {
			limit = int32(v)
		}
	}

	roadmaps, cursor, err := h.repo.GetMyRoadmaps(ctx, targetUserID, limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmaps")
	}

	// Filter to only public roadmaps
	var publicRoadmaps []model.RoadmapMeta
	for _, r := range roadmaps {
		if r.IsPublic {
			publicRoadmaps = append(publicRoadmaps, r)
		}
	}
	if publicRoadmaps == nil {
		publicRoadmaps = []model.RoadmapMeta{}
	}

	result := map[string]interface{}{
		"roadmaps": publicRoadmaps,
	}
	if cursor != "" {
		result["cursor"] = cursor
	}
	return result, nil
}
