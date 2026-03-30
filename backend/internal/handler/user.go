package handler

// TODO: Implement DeleteUser endpoint for GDPR compliance.
// Should cascade-delete: roadmaps, progress, likes, bookmarks, and Cognito user.

import (
	"context"
	"encoding/json"
	"fmt"
	"unicode/utf8"

	"github.com/numa-project/backend/internal/model"
)

// UpdateProfileRequest is the JSON body for updating a user profile.
type UpdateProfileRequest struct {
	DisplayName string `json:"displayName"`
	Bio         string `json:"bio"`
	XHandle     string `json:"xHandle"`
}

// Profile field limits.
const (
	maxDisplayNameLen = 50
	maxBioLen         = 500
	maxXHandleLen     = 30
)

// GetMyProfile returns the authenticated user's profile.
func (h *Handler) GetMyProfile(ctx context.Context, userID string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
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

// UpdateMyProfile updates the authenticated user's profile.
func (h *Handler) UpdateMyProfile(ctx context.Context, userID string, body string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	var req UpdateProfileRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return nil, NewAPIError(ErrBadRequest, "Invalid request body")
	}

	if req.DisplayName == "" {
		return nil, NewAPIError(ErrBadRequest, "displayName is required")
	}
	if utf8.RuneCountInString(req.DisplayName) > maxDisplayNameLen {
		return nil, NewAPIError(ErrBadRequest, fmt.Sprintf("displayName must be %d characters or less (got %d)", maxDisplayNameLen, utf8.RuneCountInString(req.DisplayName)))
	}
	if utf8.RuneCountInString(req.Bio) > maxBioLen {
		return nil, NewAPIError(ErrBadRequest, fmt.Sprintf("bio must be %d characters or less (got %d)", maxBioLen, utf8.RuneCountInString(req.Bio)))
	}
	if utf8.RuneCountInString(req.XHandle) > maxXHandleLen {
		return nil, NewAPIError(ErrBadRequest, fmt.Sprintf("xHandle must be %d characters or less (got %d)", maxXHandleLen, utf8.RuneCountInString(req.XHandle)))
	}

	user, err := h.repo.UpdateUser(ctx, userID, req.DisplayName, req.Bio, req.XHandle)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to update profile")
	}
	return user, nil
}

// GetUserProfile returns a public user profile by ID.
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

// GetUserPublicRoadmaps returns a user's public roadmaps.
// TODO: Currently fetches all user roadmaps and filters in-memory.
// Optimize with a GSI2 query filtered by userId when data volume grows.
func (h *Handler) GetUserPublicRoadmaps(ctx context.Context, targetUserID string, params map[string]string) (interface{}, error) {
	limit := parseLimit(params, model.DefaultPageLimit, model.MaxPageLimitDefault)

	roadmaps, cursor, err := h.repo.GetMyRoadmaps(ctx, targetUserID, limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmaps")
	}

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
