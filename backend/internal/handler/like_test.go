package handler

import (
	"context"
	"testing"
)

func TestLikeRoadmap(t *testing.T) {
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
			name:   "success",
			userID: "user-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			h := New(repo)

			err := h.LikeRoadmap(context.Background(), tt.userID, "roadmap-1")
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.likeRoadmapCalled {
				t.Error("expected LikeRoadmap to be called")
			}
		})
	}
}

func TestUnlikeRoadmap(t *testing.T) {
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
			name:   "success",
			userID: "user-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := newMockRepo()
			h := New(repo)

			err := h.UnlikeRoadmap(context.Background(), tt.userID, "roadmap-1")
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.unlikeRoadmapCalled {
				t.Error("expected UnlikeRoadmap to be called")
			}
		})
	}
}
