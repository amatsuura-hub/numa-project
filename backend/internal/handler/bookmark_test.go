package handler

import (
	"context"
	"testing"
)

func TestBookmarkRoadmap(t *testing.T) {
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

			err := h.BookmarkRoadmap(context.Background(), tt.userID, "roadmap-1")
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.bookmarkCalled {
				t.Error("expected BookmarkRoadmap to be called")
			}
		})
	}
}

func TestUnbookmarkRoadmap(t *testing.T) {
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

			err := h.UnbookmarkRoadmap(context.Background(), tt.userID, "roadmap-1")
			if tt.wantErr != "" {
				if err == nil || err.Error() != tt.wantErr {
					t.Errorf("got err=%v, want %q", err, tt.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if !repo.unbookmarkCalled {
				t.Error("expected UnbookmarkRoadmap to be called")
			}
		})
	}
}

func TestGetMyBookmarks(t *testing.T) {
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

			_, err := h.GetMyBookmarks(context.Background(), tt.userID, map[string]string{})
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
