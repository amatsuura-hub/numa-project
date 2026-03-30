package handler

import (
	"context"
	"fmt"

	"github.com/numa-project/backend/internal/model"
)

// ProgressResponse is the JSON response for progress tracking.
type ProgressResponse struct {
	RoadmapID      string   `json:"roadmapId"`
	CompletedNodes []string `json:"completedNodes"`
	TotalNodes     int      `json:"totalNodes"`
	NumaLevel      int      `json:"numaLevel"`
	StartedAt      string   `json:"startedAt,omitempty"`
	UpdatedAt      string   `json:"updatedAt,omitempty"`
}

// toProgressResponse converts a model.Progress to a ProgressResponse,
// ensuring CompletedNodes is never nil.
func toProgressResponse(roadmapID string, p *model.Progress, totalNodes int) ProgressResponse {
	nodes := p.CompletedNodes
	if nodes == nil {
		nodes = []string{}
	}
	return ProgressResponse{
		RoadmapID:      roadmapID,
		CompletedNodes: nodes,
		TotalNodes:     totalNodes,
		NumaLevel:      p.NumaLevel,
		StartedAt:      p.StartedAt,
		UpdatedAt:      p.UpdatedAt,
	}
}

// GetProgress returns the authenticated user's progress on a roadmap.
func (h *Handler) GetProgress(ctx context.Context, userID, roadmapID string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	p, err := h.repo.GetProgress(ctx, userID, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get progress")
	}

	if p == nil {
		return ProgressResponse{
			RoadmapID:      roadmapID,
			CompletedNodes: []string{},
		}, nil
	}

	return toProgressResponse(roadmapID, p, p.TotalNodes), nil
}

// CompleteNode marks a node as completed for the authenticated user.
func (h *Handler) CompleteNode(ctx context.Context, userID, roadmapID, nodeID string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	if !detail.Meta.IsPublic && detail.Meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Cannot track progress on a private roadmap")
	}

	if !containsNode(detail.Nodes, nodeID) {
		return nil, NewAPIError(ErrNotFound, fmt.Sprintf("Node %s not found in roadmap", nodeID))
	}

	totalNodes := len(detail.Nodes)
	p, err := h.repo.CompleteNode(ctx, userID, roadmapID, nodeID, totalNodes)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to complete node")
	}

	return toProgressResponse(roadmapID, p, totalNodes), nil
}

// UncompleteNode marks a node as incomplete for the authenticated user.
func (h *Handler) UncompleteNode(ctx context.Context, userID, roadmapID, nodeID string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	if !detail.Meta.IsPublic && detail.Meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Cannot track progress on a private roadmap")
	}

	if !containsNode(detail.Nodes, nodeID) {
		return nil, NewAPIError(ErrNotFound, fmt.Sprintf("Node %s not found in roadmap", nodeID))
	}

	totalNodes := len(detail.Nodes)
	p, err := h.repo.UncompleteNode(ctx, userID, roadmapID, nodeID, totalNodes)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to uncomplete node")
	}

	return toProgressResponse(roadmapID, p, totalNodes), nil
}

// GetMyProgress returns all progress records for the authenticated user.
func (h *Handler) GetMyProgress(ctx context.Context, userID string) (interface{}, error) {
	if err := requireAuth(userID); err != nil {
		return nil, err
	}

	progressList, err := h.repo.GetMyProgress(ctx, userID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get progress list")
	}

	results := make([]ProgressResponse, 0, len(progressList))
	for _, p := range progressList {
		results = append(results, toProgressResponse(p.RoadmapID, &p, p.TotalNodes))
	}

	return map[string]interface{}{"progress": results}, nil
}

// containsNode checks if a nodeID exists in the node list.
func containsNode(nodes []model.Node, nodeID string) bool {
	for _, n := range nodes {
		if n.NodeID == nodeID {
			return true
		}
	}
	return false
}
