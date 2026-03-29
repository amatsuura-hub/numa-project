package handler

import (
	"context"
	"fmt"
)

type ProgressResponse struct {
	RoadmapID      string   `json:"roadmapId"`
	CompletedNodes []string `json:"completedNodes"`
	TotalNodes     int      `json:"totalNodes"`
	NumaLevel      int      `json:"numaLevel"`
	StartedAt      string   `json:"startedAt,omitempty"`
	UpdatedAt      string   `json:"updatedAt,omitempty"`
}

func (h *Handler) GetProgress(ctx context.Context, userID, roadmapID string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	p, err := h.repo.GetProgress(ctx, userID, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get progress")
	}

	if p == nil {
		return ProgressResponse{
			RoadmapID:      roadmapID,
			CompletedNodes: []string{},
			TotalNodes:     0,
			NumaLevel:      0,
		}, nil
	}

	nodes := p.CompletedNodes
	if nodes == nil {
		nodes = []string{}
	}

	return ProgressResponse{
		RoadmapID:      roadmapID,
		CompletedNodes: nodes,
		TotalNodes:     p.TotalNodes,
		NumaLevel:      p.NumaLevel,
		StartedAt:      p.StartedAt,
		UpdatedAt:      p.UpdatedAt,
	}, nil
}

func (h *Handler) CompleteNode(ctx context.Context, userID, roadmapID, nodeID string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	// Get roadmap detail to verify the node exists and get total count
	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	// Check the roadmap is public (only public roadmaps can be progressed by non-owners)
	if !detail.Meta.IsPublic && detail.Meta.UserID != userID {
		return nil, NewAPIError(ErrForbidden, "Cannot track progress on a private roadmap")
	}

	// Verify node exists
	nodeExists := false
	for _, n := range detail.Nodes {
		if n.NodeID == nodeID {
			nodeExists = true
			break
		}
	}
	if !nodeExists {
		return nil, NewAPIError(ErrNotFound, fmt.Sprintf("Node %s not found in roadmap", nodeID))
	}

	totalNodes := len(detail.Nodes)
	p, err := h.repo.CompleteNode(ctx, userID, roadmapID, nodeID, totalNodes)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to complete node")
	}

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
	}, nil
}

func (h *Handler) UncompleteNode(ctx context.Context, userID, roadmapID, nodeID string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if detail == nil {
		return nil, NewAPIError(ErrNotFound, "Roadmap not found")
	}

	totalNodes := len(detail.Nodes)
	p, err := h.repo.UncompleteNode(ctx, userID, roadmapID, nodeID, totalNodes)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to uncomplete node")
	}

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
	}, nil
}

func (h *Handler) GetMyProgress(ctx context.Context, userID string) (interface{}, error) {
	if userID == "" {
		return nil, NewAPIError(ErrUnauthorized, "Authentication required")
	}

	progressList, err := h.repo.GetMyProgress(ctx, userID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to get progress list")
	}

	var results []ProgressResponse
	for _, p := range progressList {
		nodes := p.CompletedNodes
		if nodes == nil {
			nodes = []string{}
		}
		results = append(results, ProgressResponse{
			RoadmapID:      p.RoadmapID,
			CompletedNodes: nodes,
			TotalNodes:     p.TotalNodes,
			NumaLevel:      p.NumaLevel,
			StartedAt:      p.StartedAt,
			UpdatedAt:      p.UpdatedAt,
		})
	}

	if results == nil {
		results = []ProgressResponse{}
	}

	return map[string]interface{}{"progress": results}, nil
}
