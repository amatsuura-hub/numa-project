package handler

import (
	"context"
	"errors"
	"log/slog"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

// BookmarkRoadmap adds a bookmark for the authenticated user.
func (h *Handler) BookmarkRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if err := requireAuth(userID); err != nil {
		return err
	}

	err := h.repo.BookmarkRoadmap(ctx, userID, roadmapID)
	if err != nil {
		var condErr *types.ConditionalCheckFailedException
		if errors.As(err, &condErr) {
			return NewAPIError(ErrConflict, "Already bookmarked")
		}
		return NewAPIError(ErrInternal, "Failed to bookmark roadmap")
	}
	return nil
}

// UnbookmarkRoadmap removes a bookmark for the authenticated user.
func (h *Handler) UnbookmarkRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if err := requireAuth(userID); err != nil {
		return err
	}

	if err := h.repo.UnbookmarkRoadmap(ctx, userID, roadmapID); err != nil {
		return NewAPIError(ErrInternal, "Failed to remove bookmark")
	}
	return nil
}

// GetMyBookmarks returns the authenticated user's bookmarks with roadmap metadata.
func (h *Handler) GetMyBookmarks(ctx context.Context, userID string, params map[string]string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	limit := parseLimit(params, model.DefaultPageLimit, model.MaxPageLimitDefault)

	bookmarks, cursor, err := h.repo.GetMyBookmarks(ctx, userID, limit, params["cursor"])
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get bookmarks")
	}

	if bookmarks == nil {
		bookmarks = []model.Bookmark{}
	}

	type BookmarkItem struct {
		RoadmapID string             `json:"roadmapId"`
		CreatedAt string             `json:"createdAt"`
		Roadmap   *model.RoadmapMeta `json:"roadmap,omitempty"`
	}

	// TODO: This is an N+1 query — each bookmark triggers a separate GetRoadmapMeta call.
	// Optimize with BatchGetItem when bookmark counts grow.
	var items []BookmarkItem
	for _, b := range bookmarks {
		roadmapID := strings.TrimPrefix(b.SK, model.SKPrefixBookmark)
		item := BookmarkItem{
			RoadmapID: roadmapID,
			CreatedAt: b.CreatedAt,
		}
		meta, err := h.repo.GetRoadmapMeta(ctx, roadmapID)
		if err != nil {
			slog.Warn("failed to resolve bookmark roadmap", "roadmapId", roadmapID, "error", err)
			continue
		}
		if meta == nil {
			continue
		}
		item.Roadmap = meta
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
