package handler

import (
	"context"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

// CreateNodeRequest is the JSON body for creating a node.
type CreateNodeRequest struct {
	Label       string  `json:"label"`
	Description string  `json:"description"`
	PosX        float64 `json:"posX"`
	PosY        float64 `json:"posY"`
	Color       string  `json:"color"`
	URL         string  `json:"url"`
	Order       int     `json:"order"`
}

// BatchUpdateNodesRequest is the JSON body for batch updating nodes.
type BatchUpdateNodesRequest struct {
	Nodes []UpdateNodeBatchItem `json:"nodes"`
}

// UpdateNodeBatchItem represents a single node in a batch update request.
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

// checkRoadmapOwnership verifies the user owns the given roadmap.
func (h *Handler) checkRoadmapOwnership(ctx context.Context, userID, roadmapID string) error {
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
		return NewAPIError(ErrForbidden, "Only the owner can modify this roadmap")
	}
	return nil
}

// CreateNode adds a new node to a roadmap.
func (h *Handler) CreateNode(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req CreateNodeRequest
	if err := validateCreateNodeBody(body, &req); err != nil {
		return nil, err
	}

	detail, err := h.repo.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to check node count")
	}
	if detail != nil && len(detail.Nodes) >= model.MaxNodesPerRoadmap {
		return nil, NewAPIError(ErrBadRequest, "maximum 100 nodes per roadmap")
	}

	nodeID := uuid.New().String()
	node := &model.Node{
		PK:          model.PKPrefixRoadmap + roadmapID,
		SK:          model.SKPrefixNode + nodeID,
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

// UpdateNode updates an existing node in a roadmap.
func (h *Handler) UpdateNode(ctx context.Context, userID string, roadmapID string, nodeID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var cnReq CreateNodeRequest
	if err := validateCreateNodeBody(body, &cnReq); err != nil {
		return nil, err
	}

	node := &model.Node{
		PK:          model.PKPrefixRoadmap + roadmapID,
		SK:          model.SKPrefixNode + nodeID,
		NodeID:      nodeID,
		Label:       cnReq.Label,
		Description: cnReq.Description,
		PosX:        cnReq.PosX,
		PosY:        cnReq.PosY,
		Color:       cnReq.Color,
		URL:         cnReq.URL,
		Order:       cnReq.Order,
	}

	if err := h.repo.PutNode(ctx, node); err != nil {
		return nil, NewAPIError(ErrInternal, "Failed to update node")
	}

	return node, nil
}

// DeleteNode removes a node from a roadmap.
func (h *Handler) DeleteNode(ctx context.Context, userID string, roadmapID string, nodeID string) error {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return err
	}

	if err := h.repo.DeleteNode(ctx, roadmapID, nodeID); err != nil {
		return NewAPIError(ErrInternal, "Failed to delete node")
	}
	return nil
}

// BatchUpdateNodes updates multiple nodes in a roadmap at once.
func (h *Handler) BatchUpdateNodes(ctx context.Context, userID string, roadmapID string, body string) (interface{}, error) {
	if err := h.checkRoadmapOwnership(ctx, userID, roadmapID); err != nil {
		return nil, err
	}

	var req BatchUpdateNodesRequest
	if err := validateBatchUpdateNodesBody(body, &req); err != nil {
		return nil, err
	}

	var nodes []model.Node
	for _, n := range req.Nodes {
		nodes = append(nodes, model.Node{
			PK:          model.PKPrefixRoadmap + roadmapID,
			SK:          model.SKPrefixNode + n.NodeID,
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
