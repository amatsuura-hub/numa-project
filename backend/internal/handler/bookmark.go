package handler

import (
	"context"
	"strconv"
	"strings"

	"github.com/numa-project/backend/internal/model"
)

func (h *Handler) BookmarkRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if userID == "" {
		return NewAPIError(ErrUnauthorized, "Authentication required")
	}

	err := h.repo.BookmarkRoadmap(ctx, userID, roadmapID)
	if err != nil {
		if strings.Contains(err.Error(), "ConditionalCheckFailedException") {
			return NewAPIError(ErrConflict, "Already bookmarked")
		}
		return NewAPIError(ErrInternal, "Failed to bookmark roadmap")
	}
	return nil
}

func (h *Handler) UnbookmarkRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if userID == "" {
		return NewAPIError(ErrUnauthorized, "Authentication required")
	}

	if err := h.repo.UnbookmarkRoadmap(ctx, userID, roadmapID); err != nil {
		return NewAPIError(ErrInternal, "Failed to remove bookmark")
	}
	return nil
}

func (h *Handler) GetMyBookmarks(ctx context.Context, userID string, params map[string]string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	limit := int32(20)
	if l, ok := params["limit"]; ok {
		if v, err := strconv.Atoi(l); err == nil && v > 0 && v <= 50 {
			limit = int32(v)
		}
	}

	bookmarks, cursor, err := h.repo.GetMyBookmarks(ctx, userID, limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get bookmarks")
	}

	if bookmarks == nil {
		bookmarks = []model.Bookmark{}
	}

	// Fetch roadmap meta for each bookmark
	type BookmarkItem struct {
		RoadmapID string              `json:"roadmapId"`
		CreatedAt string              `json:"createdAt"`
		Roadmap   *model.RoadmapMeta  `json:"roadmap,omitempty"`
	}

	var items []BookmarkItem
	for _, b := range bookmarks {
		roadmapID := strings.TrimPrefix(b.SK, "BOOKMARK#")
		item := BookmarkItem{
			RoadmapID: roadmapID,
			CreatedAt: b.CreatedAt,
		}
		meta, err := h.repo.GetRoadmapMeta(ctx, roadmapID)
		if err == nil && meta != nil {
			item.Roadmap = meta
		}
		items = append(items, item)
	}

	if items == nil {
		items = []BookmarkItem{}
	}

	result := map[string]interface{}{
		"bookmarks": items,
	}
	if cursor != "" {
		result["cursor"] = cursor
	}
	return result, nil
}
