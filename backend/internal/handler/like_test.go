package handler

import (
	"testing"
)

func TestLikeRequiresAuth(t *testing.T) {
	h := &Handler{repo: nil}

	err := h.LikeRoadmap(nil, "", "roadmap-1")
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
	if err.Error() != "Authentication required" {
		t.Errorf("got %q, want %q", err.Error(), "Authentication required")
	}
}

func TestUnlikeRequiresAuth(t *testing.T) {
	h := &Handler{repo: nil}

	err := h.UnlikeRoadmap(nil, "", "roadmap-1")
	if err == nil {
		t.Fatal("expected error for empty userID")
	}
}
