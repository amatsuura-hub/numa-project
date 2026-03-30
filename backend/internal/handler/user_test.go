package handler

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/numa-project/backend/internal/model"
)

func TestGetMyProfile(t *testing.T) {
	tests := []struct {
		name    string
		userID  string
		setup   func(*mockRepo)
		wantErr string
	}{
		{
			name:    "requires auth",
			userID:  "",
			wantErr: "Authentication required",
		},
		{
			name:   "user not found",
			userID: "user-1",
			setup: func(_ *mockRepo) {
				// no user in repo
			},
			wantErr: "User not found",
		},
		{
			name:   "success",
			userID: "user-1",
			setup: func(m *mockRepo) {
				m.users["user-1"] = &model.User{UserID: "user-1", DisplayName: "Test"}
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

			resp, err := h.GetMyProfile(context.Background(), tt.userID)
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			user := resp.(*model.User)
			if user.UserID != tt.userID {
				t.Errorf("got userID=%q, want %q", user.UserID, tt.userID)
			}
		})
	}
}

func TestUpdateMyProfile(t *testing.T) {
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
			name:    "empty display name",
			userID:  "user-1",
			body:    `{"displayName":"","bio":"hi"}`,
			wantErr: "displayName is required",
		},
		{
			name:    "display name too long",
			userID:  "user-1",
			body:    `{"displayName":"` + strings.Repeat("a", 51) + `"}`,
			wantErr: "displayName must be 50 characters or less (got 51)",
		},
		{
			name:   "success",
			userID: "user-1",
			body:   `{"displayName":"Alice","bio":"Hello","xHandle":"alice"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			repo.users["user-1"] = &model.User{UserID: "user-1"}
			h := New(repo)

			_, err := h.UpdateMyProfile(context.Background(), tt.userID, tt.body)
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

func TestGetUserProfile(t *testing.T) {
	repo := newMockRepo()
	repo.users["user-1"] = &model.User{UserID: "user-1", DisplayName: "Bob"}
	h := New(repo)

	resp, err := h.GetUserProfile(context.Background(), "user-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	user := resp.(*model.User)
	if user.DisplayName != "Bob" {
		t.Errorf("got displayName=%q, want Bob", user.DisplayName)
	}

	_, err = h.GetUserProfile(context.Background(), "nonexistent")
	if err == nil || err.Error() != "User not found" {
		t.Errorf("expected 'User not found', got %v", err)
	}
}

func TestGetUserPublicRoadmaps(t *testing.T) {
	repo := newMockRepo()
	repo.roadmaps["r1"] = &model.RoadmapMeta{RoadmapID: "r1", UserID: "user-1", IsPublic: true, Title: "Public"}
	repo.roadmaps["r2"] = &model.RoadmapMeta{RoadmapID: "r2", UserID: "user-1", IsPublic: false, Title: "Private"}
	h := New(repo)

	resp, err := h.GetUserPublicRoadmaps(context.Background(), "user-1", map[string]string{})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	result := resp.(map[string]interface{})
	roadmaps := result["roadmaps"].([]model.RoadmapMeta)
	if len(roadmaps) != 1 {
		t.Errorf("expected 1 public roadmap, got %d", len(roadmaps))
	}
	if roadmaps[0].Title != "Public" {
		t.Errorf("expected Public roadmap, got %q", roadmaps[0].Title)
	}
}

func TestGetMyProfile_RepoError(t *testing.T) {
	repo := newMockRepo()
	repo.err = errors.New("db error")
	h := New(repo)

	_, err := h.GetMyProfile(context.Background(), "user-1")
	if err == nil {
		t.Fatal("expected error")
	}
}
