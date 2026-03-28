package handler

import (
	"context"
	"testing"

	"github.com/numa-project/backend/internal/model"
)

func TestCreateRoadmapRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid request",
			body:    `{"title":"My Roadmap","description":"desc","category":"programming","tags":["go"],"isPublic":true}`,
			wantErr: false,
		},
		{
			name:    "empty title",
			body:    `{"title":"","category":"programming"}`,
			wantErr: true,
		},
		{
			name:    "invalid json",
			body:    `{invalid`,
			wantErr: true,
		},
		{
			name:    "too many tags",
			body:    `{"title":"Test","tags":["a","b","c","d","e","f"]}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateRoadmapRequest
			err := validateCreateRoadmapBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestUpdateRoadmapRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"title":"Updated","description":"new desc","category":"music","tags":[],"isPublic":false}`,
			wantErr: false,
		},
		{
			name:    "empty title",
			body:    `{"title":"","category":"music"}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req UpdateRoadmapRequest
			err := validateUpdateRoadmapBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestCreateRoadmap(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		body    string
		wantErr string
	}{
		{
			name:    "requires auth",
			userID:  "",
			body:    `{}`,
			wantErr: "Authentication required",
		},
		{
			name:    "invalid body",
			userID:  "user-1",
			body:    `{bad`,
			wantErr: "Invalid request body",
		},
		{
			name:    "empty title",
			userID:  "user-1",
			body:    `{"title":""}`,
			wantErr: "title is required",
		},
		{
			name:   "success",
			userID: "user-1",
			body:   `{"title":"My Roadmap","category":"programming","tags":[],"isPublic":true}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			h := New(repo)

			resp, err := h.CreateRoadmap(context.Background(), tt.userID, tt.body)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			meta := resp.(*model.RoadmapMeta)
			if meta.Title != "My Roadmap" {
				t.Errorf("got title=%q, want 'My Roadmap'", meta.Title)
			}
			if meta.UserID != tt.userID {
				t.Errorf("got userID=%q, want %q", meta.UserID, tt.userID)
			}
			if !repo.putRoadmapCalled {
				t.Error("expected PutRoadmap to be called")
			}
		})
	}
}

func TestGetRoadmap(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		setup     func(*mockRepo)
		wantErr   string
	}{
		{
			name:      "not found",
			userID:    "user-1",
			roadmapID: "r-999",
			setup:     func(_ *mockRepo) {},
			wantErr:   "Roadmap not found",
		},
		{
			name:      "private roadmap denied",
			userID:    "user-2",
			roadmapID: "r-1",
			setup: func(m *mockRepo) {
				m.details["r-1"] = &model.RoadmapDetail{
					Meta:  model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", IsPublic: false},
					Nodes: []model.Node{},
					Edges: []model.Edge{},
				}
			},
			wantErr: "Access denied",
		},
		{
			name:      "owner can view private",
			userID:    "user-1",
			roadmapID: "r-1",
			setup: func(m *mockRepo) {
				m.details["r-1"] = &model.RoadmapDetail{
					Meta:  model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", IsPublic: false},
					Nodes: []model.Node{},
					Edges: []model.Edge{},
				}
			},
		},
		{
			name:      "public roadmap anyone can view",
			userID:    "",
			roadmapID: "r-1",
			setup: func(m *mockRepo) {
				m.details["r-1"] = &model.RoadmapDetail{
					Meta:  model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", IsPublic: true},
					Nodes: []model.Node{},
					Edges: []model.Edge{},
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			tt.setup(repo)
			h := New(repo)

			_, err := h.GetRoadmap(context.Background(), tt.userID, tt.roadmapID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
		})
	}
}

func TestUpdateRoadmap(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		body      string
		setup     func(*mockRepo)
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
			name:      "not found",
			userID:    "user-1",
			roadmapID: "r-999",
			body:      `{"title":"Updated"}`,
			setup:     func(_ *mockRepo) {},
			wantErr:   "Roadmap not found",
		},
		{
			name:      "not owner",
			userID:    "user-2",
			roadmapID: "r-1",
			body:      `{"title":"Updated"}`,
			setup: func(m *mockRepo) {
				m.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", PK: "ROADMAP#r-1", SK: "META"}
			},
			wantErr: "Only the owner can edit this roadmap",
		},
		{
			name:      "success",
			userID:    "user-1",
			roadmapID: "r-1",
			body:      `{"title":"Updated","description":"new","category":"music","tags":[],"isPublic":true}`,
			setup: func(m *mockRepo) {
				m.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", PK: "ROADMAP#r-1", SK: "META", CreatedAt: "2024-01-01T00:00:00Z"}
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

			_, err := h.UpdateRoadmap(context.Background(), tt.userID, tt.roadmapID, tt.body)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.updateRoadmapMetaCalled {
				t.Error("expected UpdateRoadmapMeta to be called")
			}
		})
	}
}

func TestDeleteRoadmap(t *testing.T) {
	tests := []struct {
		name      string
		userID    string
		roadmapID string
		setup     func(*mockRepo)
		wantErr   string
	}{
		{
			name:      "requires auth",
			userID:    "",
			roadmapID: "r-1",
			wantErr:   "Authentication required",
		},
		{
			name:      "not owner",
			userID:    "user-2",
			roadmapID: "r-1",
			setup: func(m *mockRepo) {
				m.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1"}
			},
			wantErr: "Only the owner can delete this roadmap",
		},
		{
			name:      "success",
			userID:    "user-1",
			roadmapID: "r-1",
			setup: func(m *mockRepo) {
				m.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1"}
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

			err := h.DeleteRoadmap(context.Background(), tt.userID, tt.roadmapID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.deleteRoadmapCalled {
				t.Error("expected DeleteRoadmap to be called")
			}
		})
	}
}

func TestGetMyRoadmaps(t *testing.T) {
	repo := newMockRepo()
	repo.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", Title: "Test"}
	h := New(repo)

	// Requires auth
	_, err := h.GetMyRoadmaps(context.Background(), "", map[string]string{})
	if err == nil || err.Error() != "Authentication required" {
		t.Errorf("expected auth error, got %v", err)
	}

	// Success
	resp, err := h.GetMyRoadmaps(context.Background(), "user-1", map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	result := resp.(map[string]interface{})
	roadmaps := result["roadmaps"].([]model.RoadmapMeta)
	if len(roadmaps) != 1 {
		t.Errorf("expected 1 roadmap, got %d", len(roadmaps))
	}
}

func TestExploreRoadmaps(t *testing.T) {
	repo := newMockRepo()
	repo.roadmaps["r-1"] = &model.RoadmapMeta{RoadmapID: "r-1", UserID: "user-1", IsPublic: true}
	repo.roadmaps["r-2"] = &model.RoadmapMeta{RoadmapID: "r-2", UserID: "user-1", IsPublic: false}
	h := New(repo)

	resp, err := h.ExploreRoadmaps(context.Background(), map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	result := resp.(map[string]interface{})
	roadmaps := result["roadmaps"].([]model.RoadmapMeta)
	if len(roadmaps) != 1 {
		t.Errorf("expected 1 public roadmap, got %d", len(roadmaps))
	}
}
