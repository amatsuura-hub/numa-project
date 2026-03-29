package handler

import (
	"context"
	"testing"

	"github.com/numa-project/backend/internal/model"
)

func setupPublicRoadmap(repo *mockRepo) {
	repo.details["r-1"] = &model.RoadmapDetail{
		Meta: model.RoadmapMeta{RoadmapID: "r-1", UserID: "owner-1", IsPublic: true},
		Nodes: []model.Node{
			{NodeID: "n-1", Label: "Node 1"},
			{NodeID: "n-2", Label: "Node 2"},
			{NodeID: "n-3", Label: "Node 3"},
		},
		Edges: []model.Edge{},
	}
}

func setupPrivateRoadmap(repo *mockRepo, ownerID string) {
	repo.details["r-priv"] = &model.RoadmapDetail{
		Meta: model.RoadmapMeta{RoadmapID: "r-priv", UserID: ownerID, IsPublic: false},
		Nodes: []model.Node{
			{NodeID: "n-1", Label: "Node 1"},
		},
		Edges: []model.Edge{},
	}
}

func TestGetProgress(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		wantErr   string
	}{
		{
			name:    "requires auth",
			userID:  "",
			wantErr: "Authentication required",
		},
		{
			name:      "no progress returns empty",
			userID:    "user-1",
			roadmapID: "r-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			h := New(repo)

			resp, err := h.GetProgress(context.Background(), tt.userID, tt.roadmapID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			pr := resp.(ProgressResponse)
			if pr.RoadmapID != tt.roadmapID {
				t.Errorf("got roadmapID=%q, want %q", pr.RoadmapID, tt.roadmapID)
			}
			if pr.CompletedNodes == nil {
				t.Error("CompletedNodes should not be nil")
			}
		})
	}
}

func TestCompleteNode(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		nodeID    string
		setup     func(*mockRepo)
		wantErr   string
	}{
		{
			name:    "requires auth",
			userID:  "",
			wantErr: "Authentication required",
		},
		{
			name:      "roadmap not found",
			userID:    "user-1",
			roadmapID: "r-999",
			nodeID:    "n-1",
			setup:     func(_ *mockRepo) {},
			wantErr:   "Roadmap not found",
		},
		{
			name:      "private roadmap denied for non-owner",
			userID:    "user-2",
			roadmapID: "r-priv",
			nodeID:    "n-1",
			setup: func(m *mockRepo) {
				setupPrivateRoadmap(m, "owner-1")
			},
			wantErr: "Cannot track progress on a private roadmap",
		},
		{
			name:      "node not found in roadmap",
			userID:    "user-1",
			roadmapID: "r-1",
			nodeID:    "n-999",
			setup: func(m *mockRepo) {
				setupPublicRoadmap(m)
			},
			wantErr: "Node n-999 not found in roadmap",
		},
		{
			name:      "success",
			userID:    "user-1",
			roadmapID: "r-1",
			nodeID:    "n-1",
			setup: func(m *mockRepo) {
				setupPublicRoadmap(m)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			if tt.setup != nil {
				tt.setup(repo)
			}
			h := New(repo)

			resp, err := h.CompleteNode(context.Background(), tt.userID, tt.roadmapID, tt.nodeID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			pr := resp.(ProgressResponse)
			if pr.RoadmapID != tt.roadmapID {
				t.Errorf("got roadmapID=%q, want %q", pr.RoadmapID, tt.roadmapID)
			}
			if pr.TotalNodes != 3 {
				t.Errorf("got totalNodes=%d, want 3", pr.TotalNodes)
			}
		})
	}
}

func TestUncompleteNode(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		nodeID    string
		setup     func(*mockRepo)
		wantErr   string
	}{
		{
			name:    "requires auth",
			userID:  "",
			wantErr: "Authentication required",
		},
		{
			name:      "roadmap not found",
			userID:    "user-1",
			roadmapID: "r-999",
			nodeID:    "n-1",
			setup:     func(_ *mockRepo) {},
			wantErr:   "Roadmap not found",
		},
		{
			name:      "private roadmap denied for non-owner",
			userID:    "user-2",
			roadmapID: "r-priv",
			nodeID:    "n-1",
			setup: func(m *mockRepo) {
				setupPrivateRoadmap(m, "owner-1")
			},
			wantErr: "Cannot track progress on a private roadmap",
		},
		{
			name:      "success",
			userID:    "user-1",
			roadmapID: "r-1",
			nodeID:    "n-1",
			setup: func(m *mockRepo) {
				setupPublicRoadmap(m)
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			if tt.setup != nil {
				tt.setup(repo)
			}
			h := New(repo)

			resp, err := h.UncompleteNode(context.Background(), tt.userID, tt.roadmapID, tt.nodeID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			pr := resp.(ProgressResponse)
			if pr.RoadmapID != tt.roadmapID {
				t.Errorf("got roadmapID=%q, want %q", pr.RoadmapID, tt.roadmapID)
			}
		})
	}
}

func TestGetMyProgress(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		wantErr string
	}{
		{
			name:    "requires auth",
			userID:  "",
			wantErr: "Authentication required",
		},
		{
			name:   "success empty list",
			userID: "user-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			h := New(repo)

			resp, err := h.GetMyProgress(context.Background(), tt.userID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			result := resp.(map[string]interface{})
			progress := result["progress"].([]ProgressResponse)
			if progress == nil {
				t.Error("progress should not be nil")
			}
		})
	}
}

func TestContainsNode(t *testing.T) {
	nodes := []model.Node{
		{NodeID: "n-1"},
		{NodeID: "n-2"},
		{NodeID: "n-3"},
	}

	tests := []struct {
		nodeID string
		want   bool
	}{
		{"n-1", true},
		{"n-2", true},
		{"n-3", true},
		{"n-4", false},
		{"", false},
	}

	for _, tt := range tests {
		t.Run(tt.nodeID, func(t *testing.T) {
			got := containsNode(nodes, tt.nodeID)
			if got != tt.want {
				t.Errorf("containsNode(nodes, %q) = %v, want %v", tt.nodeID, got, tt.want)
			}
		})
	}

	// Empty nodes list
	if containsNode(nil, "n-1") {
		t.Error("containsNode(nil, ...) should return false")
	}
}

func TestToProgressResponse_NilCompletedNodes(t *testing.T) {
	p := &model.Progress{
		CompletedNodes: nil,
		NumaLevel:      0,
	}

	resp := toProgressResponse("r-1", p, 5)
	if resp.CompletedNodes == nil {
		t.Error("CompletedNodes should be empty slice, not nil")
	}
	if len(resp.CompletedNodes) != 0 {
		t.Errorf("CompletedNodes should be empty, got %d", len(resp.CompletedNodes))
	}
	if resp.TotalNodes != 5 {
		t.Errorf("got totalNodes=%d, want 5", resp.TotalNodes)
	}
}
