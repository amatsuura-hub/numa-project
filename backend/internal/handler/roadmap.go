package handler

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

type CreateRoadmapRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	IsPublic    bool     `json:"isPublic"`
}

type UpdateRoadmapRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Tags        []string `json:"tags"`
	IsPublic    bool     `json:"isPublic"`
}

func (h *Handler) CreateRoadmap(ctx context.Context, userID string, body string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	var req CreateRoadmapRequest
	if err := validateCreateRoadmapBody(body, &req); err != nil {
		return nil, err
	}

	// Check user roadmap count limit
	existingRoadmaps, _, err := h.repo.GetMyRoadmaps(ctx, userID, 50, "")
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to check roadmap count")
	}
	if len(existingRoadmaps) >= 50 {
		return nil, NewAPIError(ErrBadRequest, "maximum 50 roadmaps per user")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	roadmapID := uuid.New().String()

	meta := &model.RoadmapMeta{
		PK:          "ROADMAP#" + roadmapID,
		SK:          "META",
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
		GSI1PK:      "USER#" + userID,
		GSI1SK:      "ROADMAP#" + now,
	}

	if req.IsPublic {
		meta.GSI2PK = "PUBLIC"
		meta.GSI2SK = now
	}

	if err := h.repo.PutRoadmap(ctx, meta); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to create roadmap")
	}

	return meta, nil
}

type RoadmapResponse struct {
	Meta       model.RoadmapMeta `json:"meta"`
	Nodes      []model.Node      `json:"nodes"`
	Edges      []model.Edge      `json:"edges"`
	IsLiked    bool              `json:"isLiked"`
	IsBookmarked bool            `json:"isBookmarked"`
}

func (h *Handler) GetRoadmap(ctx context.Context, userID string, roadmapID string) (interface{}, error) {
	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	// Private roadmap: only owner can view
	if !detail.Meta.IsPublic && detail.Meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Access denied")
	}

	resp := RoadmapResponse{
		Meta:  detail.Meta,
		Nodes: detail.Nodes,
		Edges: detail.Edges,
	}

	// Check like/bookmark status for authenticated users
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

func (h *Handler) UpdateRoadmap(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
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
			meta.GSI2PK = "PUBLIC"
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

func (h *Handler) DeleteRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if userID == "" {
		return NewAPIError(ErrUnauthorized, "Authentication required")
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

func (h *Handler) GetMyRoadmaps(ctx context.Context, userID string, params map[string]string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	limit := int32(20)
	if l, ok := params["limit"]; ok {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 50 {
			limit = int32(v)
		}
	}

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

func (h *Handler) ExploreRoadmaps(ctx context.Context, params map[string]string) (interface{}, error) {
	limit := int32(20)
	if l, ok := params["limit"]; ok {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 50 {
			limit = int32(v)
		}
	}

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
