package handler

import (
	"context"
	"strings"
	"testing"

	"github.com/numa-project/backend/internal/model"
)

func TestCreateNodeRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"label":"Step 1","posX":100,"posY":200}`,
			wantErr: false,
		},
		{
			name:    "empty label",
			body:    `{"label":"","posX":100,"posY":200}`,
			wantErr: true,
		},
		{
			name:    "label too long",
			body:    `{"label":"` + strings.Repeat("a", 51) + `","posX":100,"posY":200}`,
			wantErr: true,
		},
		{
			name:    "description too long",
			body:    `{"label":"ok","description":"` + strings.Repeat("a", 501) + `"}`,
			wantErr: true,
		},
		{
			name:    "invalid json",
			body:    `{bad`,
			wantErr: true,
		},
		{
			name:    "invalid color format",
			body:    `{"label":"ok","color":"red"}`,
			wantErr: true,
		},
		{
			name:    "valid hex color",
			body:    `{"label":"ok","color":"#4c6ef5"}`,
			wantErr: false,
		},
		{
			name:    "invalid URL",
			body:    `{"label":"ok","url":"not-a-url"}`,
			wantErr: true,
		},
		{
			name:    "valid URL",
			body:    `{"label":"ok","url":"https://example.com"}`,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateNodeRequest
			err := validateCreateNodeBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestCreateEdgeRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"sourceNodeId":"abc","targetNodeId":"def"}`,
			wantErr: false,
		},
		{
			name:    "missing source",
			body:    `{"sourceNodeId":"","targetNodeId":"def"}`,
			wantErr: true,
		},
		{
			name:    "missing target",
			body:    `{"sourceNodeId":"abc","targetNodeId":""}`,
			wantErr: true,
		},
		{
			name:    "self-loop",
			body:    `{"sourceNodeId":"abc","targetNodeId":"abc"}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateEdgeRequest
			err := validateCreateEdgeBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestBatchUpdateNodesValidation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"nodes":[{"nodeId":"n1","label":"Step 1","posX":0,"posY":0}]}`,
			wantErr: false,
		},
		{
			name:    "empty nodes",
			body:    `{"nodes":[]}`,
			wantErr: true,
		},
		{
			name:    "missing nodeId",
			body:    `{"nodes":[{"nodeId":"","label":"Step 1"}]}`,
			wantErr: true,
		},
		{
			name:    "missing label",
			body:    `{"nodes":[{"nodeId":"n1","label":""}]}`,
			wantErr: true,
		},
		{
			name:    "invalid color in batch",
			body:    `{"nodes":[{"nodeId":"n1","label":"ok","color":"bad"}]}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req BatchUpdateNodesRequest
			err := validateBatchUpdateNodesBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func setupRoadmapOwner(repo *mockRepo, roadmapID, ownerID string) {
	repo.roadmaps[roadmapID] = &model.RoadmapMeta{RoadmapID: roadmapID, UserID: ownerID, PK: "ROADMAP#" + roadmapID, SK: "META"}
	repo.details[roadmapID] = &model.RoadmapDetail{
		Meta:  *repo.roadmaps[roadmapID],
		Nodes: []model.Node{},
		Edges: []model.Edge{},
	}
}

func TestCreateNode(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		body      string
		wantErr   string
	}{
		{
			name:      "requires auth",
			userID:    "",
			roadmapID: "r-1",
			body:      `{}`,
			wantErr:   "Authentication required",
		},
		{
			name:      "not owner",
			userID:    "user-2",
			roadmapID: "r-1",
			body:      `{"label":"Step"}`,
			wantErr:   "Only the owner can modify this roadmap",
		},
		{
			name:      "success",
			userID:    "user-1",
			roadmapID: "r-1",
			body:      `{"label":"Step 1","posX":100,"posY":200,"color":"#4c6ef5"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			setupRoadmapOwner(repo, "r-1", "user-1")
			h := New(repo)

			resp, err := h.CreateNode(context.Background(), tt.userID, tt.roadmapID, tt.body)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			node := resp.(*model.Node)
			if node.Label != "Step 1" {
				t.Errorf("got label=%q, want 'Step 1'", node.Label)
			}
			if !repo.putNodeCalled {
				t.Error("expected PutNode to be called")
			}
		})
	}
}

func TestDeleteNode(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	h := New(repo)

	err := h.DeleteNode(context.Background(), "user-1", "r-1", "node-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.deleteNodeCalled {
		t.Error("expected DeleteNode to be called")
	}
}

func TestBatchUpdateNodes(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	h := New(repo)

	body := `{"nodes":[{"nodeId":"n1","label":"Step 1","posX":0,"posY":0},{"nodeId":"n2","label":"Step 2","posX":100,"posY":0}]}`
	resp, err := h.BatchUpdateNodes(context.Background(), "user-1", "r-1", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	result := resp.(map[string]interface{})
	nodes := result["nodes"].([]model.Node)
	if len(nodes) != 2 {
		t.Errorf("expected 2 nodes, got %d", len(nodes))
	}
	if !repo.batchPutNodesCalled {
		t.Error("expected BatchPutNodes to be called")
	}
}

func TestCreateEdge(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	// Add nodes so edge creation can verify they exist.
	repo.details["r-1"].Nodes = []model.Node{
		{NodeID: "n1", Label: "Node 1"},
		{NodeID: "n2", Label: "Node 2"},
	}
	h := New(repo)

	body := `{"sourceNodeId":"n1","targetNodeId":"n2"}`
	resp, err := h.CreateEdge(context.Background(), "user-1", "r-1", body)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	edge := resp.(*model.Edge)
	if edge.SourceNodeID != "n1" {
		t.Errorf("got source=%q, want n1", edge.SourceNodeID)
	}
	if !repo.putEdgeCalled {
		t.Error("expected PutEdge to be called")
	}
}

func TestCreateEdge_SelfLoop(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	h := New(repo)

	body := `{"sourceNodeId":"n1","targetNodeId":"n1"}`
	_, err := h.CreateEdge(context.Background(), "user-1", "r-1", body)
	if err == nil {
		t.Fatal("expected error for self-loop edge")
	}
}

func TestCreateEdge_NodeNotFound(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	repo.details["r-1"].Nodes = []model.Node{
		{NodeID: "n1", Label: "Node 1"},
	}
	h := New(repo)

	body := `{"sourceNodeId":"n1","targetNodeId":"n-missing"}`
	_, err := h.CreateEdge(context.Background(), "user-1", "r-1", body)
	if err == nil {
		t.Fatal("expected error for non-existent target node")
	}
}

func TestDeleteEdge(t *testing.T) {
	repo := newMockRepo()
	setupRoadmapOwner(repo, "r-1", "user-1")
	h := New(repo)

	err := h.DeleteEdge(context.Background(), "user-1", "r-1", "edge-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !repo.deleteEdgeCalled {
		t.Error("expected DeleteEdge to be called")
	}
}
