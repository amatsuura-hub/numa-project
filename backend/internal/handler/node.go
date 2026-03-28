package handler

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

type CreateNodeRequest struct {
	Label       string  `json:"label"`
	Description string  `json:"description"`
	PosX        float64 `json:"posX"`
	PosY        float64 `json:"posY"`
	Color       string  `json:"color"`
	URL         string  `json:"url"`
	Order       int     `json:"order"`
}

type UpdateNodeRequest struct {
	Label       string  `json:"label"`
	Description string  `json:"description"`
	PosX        float64 `json:"posX"`
	PosY        float64 `json:"posY"`
	Color       string  `json:"color"`
	URL         string  `json:"url"`
	Order       int     `json:"order"`
}

type BatchUpdateNodesRequest struct {
	Nodes []UpdateNodeBatchItem `json:"nodes"`
}

type UpdateNodeBatchItem struct {
	NodeID      string  `json:"nodeId"`
	Label       string  `json:"label"`
	Description string  `json:"description"`
	PosX        float64 `json:"posX"`
	PosY        float64 `json:"posY"`
	Color       string  `json:"color"`
	URL         string  `json:"url"`
	Order       int     `json:"order"`
}

func (h *Handler) checkRoadmapOwnership(ctx context.Context, userID, roadmapID string) error {
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
		return NewAPIError(ErrForbidden, "Only the owner can modify this roadmap")
	}
	return nil
}

func (h *Handler) CreateNode(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req CreateNodeRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return nil, NewAPIError(ErrBadRequest, "Invalid request body")
	}

	if req.Label == "" {
		return nil, NewAPIError(ErrBadRequest, "label is required")
	}
	if len(req.Label) > 50 {
		return nil, NewAPIError(ErrBadRequest, "label must be 50 characters or less")
	}
	if len(req.Description) > 500 {
		return nil, NewAPIError(ErrBadRequest, "description must be 500 characters or less")
	}

	// Check node count limit
	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to check node count")
	}
	if detail != nil && len(detail.Nodes) >= 100 {
		return nil, NewAPIError(ErrBadRequest, "maximum 100 nodes per roadmap")
	}

	nodeID := uuid.New().String()
	node := &model.Node{
		PK:          "ROADMAP#" + roadmapID,
		SK:          "NODE#" + nodeID,
		NodeID:      nodeID,
		Label:       req.Label,
		Description: req.Description,
		PosX:        req.PosX,
		PosY:        req.PosY,
		Color:       req.Color,
		URL:         req.URL,
		Order:       req.Order,
	}

	if err := h.repo.PutNode(ctx, node); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to create node")
	}

	return node, nil
}

func (h *Handler) UpdateNode(ctx context.Context, userID string, roadmapID string, nodeID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req UpdateNodeRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return nil, NewAPIError(ErrBadRequest, "Invalid request body")
	}

	if req.Label == "" {
		return nil, NewAPIError(ErrBadRequest, "label is required")
	}
	if len(req.Label) > 50 {
		return nil, NewAPIError(ErrBadRequest, "label must be 50 characters or less")
	}
	if len(req.Description) > 500 {
		return nil, NewAPIError(ErrBadRequest, "description must be 500 characters or less")
	}

	node := &model.Node{
		PK:          "ROADMAP#" + roadmapID,
		SK:          "NODE#" + nodeID,
		NodeID:      nodeID,
		Label:       req.Label,
		Description: req.Description,
		PosX:        req.PosX,
		PosY:        req.PosY,
		Color:       req.Color,
		URL:         req.URL,
		Order:       req.Order,
	}

	if err := h.repo.PutNode(ctx, node); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to update node")
	}

	return node, nil
}

func (h *Handler) DeleteNode(ctx context.Context, userID string, roadmapID string, nodeID string) error {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return err
	}

	if err := h.repo.DeleteNode(ctx, roadmapID, nodeID); err != nil {
		return NewAPIError(ErrInternal, "Failed to delete node")
	}
	return nil
}

func (h *Handler) BatchUpdateNodes(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req BatchUpdateNodesRequest
	if err := json.Unmarshal([]byte(body), &req); err != nil {
		return nil, NewAPIError(ErrBadRequest, "Invalid request body")
	}

	if len(req.Nodes) == 0 {
		return nil, NewAPIError(ErrBadRequest, "nodes array is required")
	}
	if len(req.Nodes) > 100 {
		return nil, NewAPIError(ErrBadRequest, "maximum 100 nodes per batch")
	}

	var nodes []model.Node
	for _, n := range req.Nodes {
		if n.NodeID == "" {
			return nil, NewAPIError(ErrBadRequest, "nodeId is required for each node")
		}
		nodes = append(nodes, model.Node{
			PK:          "ROADMAP#" + roadmapID,
			SK:          "NODE#" + n.NodeID,
			NodeID:      n.NodeID,
			Label:       n.Label,
			Description: n.Description,
			PosX:        n.PosX,
			PosY:        n.PosY,
			Color:       n.Color,
			URL:         n.URL,
			Order:       n.Order,
		})
	}

	if err := h.repo.BatchPutNodes(ctx, nodes); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to batch update nodes")
	}

	return map[string]interface{}{"nodes": nodes}, nil
}
