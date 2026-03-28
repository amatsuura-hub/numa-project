package handler

import (
	"testing"
)

func TestBookmarkRequiresAuth(t *testing.T) {
	h := &Handler{repo: nil}

	err := h.BookmarkRoadmap(nil, "", "roadmap-1")
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
	if err.Error() != "Authentication required" {
		t.Errorf("got %q, want %q", err.Error(), "Authentication required")
	}
}

func TestUnbookmarkRequiresAuth(t *testing.T) {
	h := &Handler{repo: nil}

	err := h.UnbookmarkRoadmap(nil, "", "roadmap-1")
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
}

func TestGetMyBookmarksRequiresAuth(t *testing.T) {
	h := &Handler{repo: nil}

	_, err := h.GetMyBookmarks(nil, "", nil)
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
}
