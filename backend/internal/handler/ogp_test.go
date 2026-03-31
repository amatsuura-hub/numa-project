package handler

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/numa-project/backend/internal/model"
)

func TestHandleOGP(t *testing.T) {
	ctx := context.Background()
	siteURL := "https://numa.example.com"

	tests := []struct {
		name       string
		roadmapID  string
		meta       *model.RoadmapMeta
		wantErr    bool
		errCode    error
		checkTitle string
		checkURL   string
	}{
		{
			name:      "success with description",
			roadmapID: "r1",
			meta: &model.RoadmapMeta{
				RoadmapID:   "r1",
				Title:       "Go入門",
				Description: "Goの基礎を学ぶ",
			},
			checkTitle: "Go入門",
			checkURL:   "https://numa.example.com/roadmaps/r1",
		},
		{
			name:      "success without description uses fallback",
			roadmapID: "r2",
			meta: &model.RoadmapMeta{
				RoadmapID: "r2",
				Title:     "React Roadmap",
			},
			checkTitle: "React Roadmap",
		},
		{
			name:      "HTML escaping",
			roadmapID: "r3",
			meta: &model.RoadmapMeta{
				RoadmapID:   "r3",
				Title:       `<script>alert("xss")</script>`,
				Description: `"desc" & <b>bold</b>`,
			},
			checkTitle: "&lt;script&gt;",
		},
		{
			name:      "roadmap not found",
			roadmapID: "nonexistent",
			wantErr:   true,
			errCode:   ErrNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := newMockRepo()
			if tt.meta != nil {
				mock.roadmaps[tt.meta.RoadmapID] = tt.meta
			}
			h := New(mock)

			html, err := h.HandleOGP(ctx, tt.roadmapID, siteURL)

			if tt.wantErr {
				if err == nil {
					t.Fatal("expected error, got nil")
				}
				if tt.errCode != nil && !errors.Is(err, tt.errCode) {
					t.Errorf("expected error code %v, got %v", tt.errCode, err)
				}
				return
			}

			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			if !strings.Contains(html, "<!DOCTYPE html>") {
				t.Error("expected HTML doctype")
			}
			if tt.checkTitle != "" && !strings.Contains(html, tt.checkTitle) {
				t.Errorf("expected HTML to contain %q", tt.checkTitle)
			}
			if tt.checkURL != "" && !strings.Contains(html, tt.checkURL) {
				t.Errorf("expected HTML to contain %q", tt.checkURL)
			}
			if !strings.Contains(html, `og:title`) {
				t.Error("expected og:title meta tag")
			}
			if !strings.Contains(html, `og:description`) {
				t.Error("expected og:description meta tag")
			}
			if !strings.Contains(html, `twitter:card`) {
				t.Error("expected twitter:card meta tag")
			}

			// Verify fallback description
			if tt.meta != nil && tt.meta.Description == "" {
				if !strings.Contains(html, "のロードマップ | Numa") {
					t.Error("expected fallback description")
				}
			}
		})
	}
}
