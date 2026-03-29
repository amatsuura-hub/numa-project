package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

// CreateRoadmapRequest is the JSON body for creating a roadmap.
type CreateRoadmapRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	IsPublic    bool     `json:"isPublic"`
}

// UpdateRoadmapRequest is the JSON body for updating a roadmap.
type UpdateRoadmapRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	IsPublic    bool     `json:"isPublic"`
}

// RoadmapResponse is the JSON response for a roadmap detail.
type RoadmapResponse struct {
	Meta         model.RoadmapMeta `json:"meta"`
	Nodes        []model.Node      `json:"nodes"`
	Edges        []model.Edge      `json:"edges"`
	IsLiked      bool              `json:"isLiked"`
	IsBookmarked bool              `json:"isBookmarked"`
}

// CreateRoadmap creates a new roadmap for the authenticated user.
func (h *Handler) CreateRoadmap(ctx context.Context, userID string, body string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	var req CreateRoadmapRequest
	if err := validateCreateRoadmapBody(body, &req); err != nil {
		return nil, err
	}

	existingRoadmaps, _, err := h.repo.GetMyRoadmaps(ctx, userID, model.MaxRoadmapsPerUser, "")
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to check roadmap count")
	}
	if len(existingRoadmaps) >= model.MaxRoadmapsPerUser {
		return nil, NewAPIError(ErrBadRequest, "maximum 50 roadmaps per user")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	roadmapID := uuid.New().String()

	meta := &model.RoadmapMeta{
		PK:          model.PKPrefixRoadmap + roadmapID,
		SK:          model.SKMeta,
		RoadmapID:   roadmapID,
		Title:       req.Title,
		Description: req.Description,
		UserID:      userID,
		Category:    req.Category,
		Tags:        req.Tags,
		IsPublic:    req.IsPublic,
		LikeCount:   0,
		CreatedAt:   now,
		UpdatedAt:   now,
		GSI1PK:      model.PKPrefixUser + userID,
		GSI1SK:      model.PKPrefixRoadmap + now,
	}

	if req.IsPublic {
		meta.GSI2PK = model.GSI2Public
		meta.GSI2SK = now
	}

	if err := h.repo.PutRoadmap(ctx, meta); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to create roadmap")
	}

	return meta, nil
}

// GetRoadmap returns a roadmap detail with like/bookmark status.
func (h *Handler) GetRoadmap(ctx context.Context, userID string, roadmapID string) (interface{}, error) {
	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	if !detail.Meta.IsPublic && detail.Meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Access denied")
	}

	resp := RoadmapResponse{
		Meta:  detail.Meta,
		Nodes: detail.Nodes,
		Edges: detail.Edges,
	}

	if userID != "" {
		liked, err := h.repo.IsLiked(ctx, roadmapID, userID)
		if err != nil {
			return nil, NewAPIError(ErrInternal, "Failed to check like status")
		}
		resp.IsLiked = liked

		bookmarked, err := h.repo.IsBookmarked(ctx, userID, roadmapID)
		if err != nil {
			return nil, NewAPIError(ErrInternal, "Failed to check bookmark status")
		}
		resp.IsBookmarked = bookmarked
	}

	return resp, nil
}

// UpdateRoadmap updates a roadmap owned by the authenticated user.
func (h *Handler) UpdateRoadmap(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	meta, err := h.repo.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if meta == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}
	if meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Only the owner can edit this roadmap")
	}

	var req UpdateRoadmapRequest
	if err := validateUpdateRoadmapBody(body, &req); err != nil {
		return nil, err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	meta.Title = req.Title
	meta.Description = req.Description
	meta.Category = req.Category
	meta.Tags = req.Tags
	meta.IsPublic = req.IsPublic
	meta.UpdatedAt = now

	if req.IsPublic {
		if meta.GSI2PK == "" {
			meta.GSI2PK = model.GSI2Public
			meta.GSI2SK = meta.CreatedAt
		}
	} else {
		meta.GSI2PK = ""
		meta.GSI2SK = ""
	}

	if err := h.repo.UpdateRoadmapMeta(ctx, meta); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to update roadmap")
	}

	return meta, nil
}

// DeleteRoadmap deletes a roadmap owned by the authenticated user.
func (h *Handler) DeleteRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if err := requireAuth(userID); err != nil {
		return err
	}

	meta, err := h.repo.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		return NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if meta == nil {
		return NewAPIError(ErrNotFound, "Roadmap not found")
	}
	if meta.UserID != userID {
		return NewAPIError(ErrForbidden, "Only the owner can delete this roadmap")
	}

	if err := h.repo.DeleteRoadmap(ctx, roadmapID); err != nil {
		return NewAPIError(ErrInternal, "Failed to delete roadmap")
	}
	return nil
}

// GetMyRoadmaps returns the authenticated user's roadmaps.
func (h *Handler) GetMyRoadmaps(ctx context.Context, userID string, params map[string]string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	limit := parseLimit(params, model.DefaultPageLimit, model.MaxPageLimitDefault)

	roadmaps, cursor, err := h.repo.GetMyRoadmaps(ctx, userID, limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmaps")
	}

	if roadmaps == nil {
		roadmaps = []model.RoadmapMeta{}
	}

	result := map[string]interface{}{
		"roadmaps": roadmaps,
	}
	if cursor != "" {
		result["cursor"] = cursor
	}
	return result, nil
}

// ExploreRoadmaps returns public roadmaps, optionally filtered by category.
func (h *Handler) ExploreRoadmaps(ctx context.Context, params map[string]string) (interface{}, error) {
	limit := parseLimit(params, model.DefaultPageLimit, model.MaxPageLimitExplore)

	roadmaps, cursor, err := h.repo.ExploreRoadmaps(ctx, params["category"], limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmaps")
	}

	if roadmaps == nil {
		roadmaps = []model.RoadmapMeta{}
	}

	result := map[string]interface{}{
		"roadmaps": roadmaps,
	}
	if cursor != "" {
		result["cursor"] = cursor
	}
	return result, nil
}

// parseLimit extracts "limit" from query params, clamped to [1, max].
func parseLimit(params map[string]string, defaultVal, max int) int32 {
	if l, ok := params["limit"]; ok {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= max {
			return int32(v)
		}
	}
	return int32(defaultVal)
}
