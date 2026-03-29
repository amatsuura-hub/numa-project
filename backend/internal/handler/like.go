package handler

import (
	"context"
	"errors"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// LikeRoadmap adds a like to a roadmap for the authenticated user.
func (h *Handler) LikeRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if err := requireAuth(userID); err != nil {
		return err
	}

	err := h.repo.LikeRoadmap(ctx, roadmapID, userID)
	if err != nil {
		var txErr *types.TransactionCanceledException
		if errors.As(err, &txErr) {
			// Condition check failed → already liked
			for _, reason := range txErr.CancellationReasons {
				if reason.Code != nil && strings.Contains(*reason.Code, "ConditionalCheckFailed") {
					return NewAPIError(ErrConflict, "Already liked")
				}
			}
		}
		return NewAPIError(ErrInternal, "Failed to like roadmap")
	}
	return nil
}

// UnlikeRoadmap removes a like from a roadmap for the authenticated user.
func (h *Handler) UnlikeRoadmap(ctx context.Context, userID string, roadmapID string) error {
	if err := requireAuth(userID); err != nil {
		return err
	}

	err := h.repo.UnlikeRoadmap(ctx, roadmapID, userID)
	if err != nil {
		var txErr *types.TransactionCanceledException
		if errors.As(err, &txErr) {
			return NewAPIError(ErrNotFound, "Like not found")
		}
		return NewAPIError(ErrInternal, "Failed to unlike roadmap")
	}
	return nil
}
