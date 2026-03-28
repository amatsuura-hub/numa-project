package handler

import (
	"context"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

type CreateEdgeRequest struct {
	SourceNodeID string `json:"sourceNodeId"`
	TargetNodeID string `json:"targetNodeId"`
	Label        string `json:"label"`
}

func (h *Handler) CreateEdge(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req CreateEdgeRequest
	if err := validateCreateEdgeBody(body, &req); err != nil {
		return nil, err
	}

	// Check edge count limit
	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to check edge count")
	}
	if detail != nil && len(detail.Edges) >= 200 {
		return nil, NewAPIError(ErrBadRequest, "maximum 200 edges per roadmap")
	}

	edgeID := uuid.New().String()
	edge := &model.Edge{
		PK:           "ROADMAP#" + roadmapID,
		SK:           "EDGE#" + edgeID,
		EdgeID:       edgeID,
		SourceNodeID: req.SourceNodeID,
		TargetNodeID: req.TargetNodeID,
		Label:        req.Label,
	}

	if err := h.repo.PutEdge(ctx, edge); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to create edge")
	}

	return edge, nil
}

func (h *Handler) DeleteEdge(ctx context.Context, userID string, roadmapID string, edgeID string) error {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return err
	}

	if err := h.repo.DeleteEdge(ctx, roadmapID, edgeID); err != nil {
		return NewAPIError(ErrInternal, "Failed to delete edge")
	}
	return nil
}
