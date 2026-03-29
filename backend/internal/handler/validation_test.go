package handler

import (
	"strings"
	"testing"
)

func TestValidateRoadmapFields_TitleLength(t *testing.T) {
	tests := []struct {
		name    string
		title   string
		wantErr bool
	}{
		{"exactly 100 chars", strings.Repeat("a", 100), false},
		{"101 chars", strings.Repeat("a", 101), true},
		{"empty", "", true},
		{"normal", "My Roadmap", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRoadmapFields(tt.title, "", "", nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestValidateRoadmapFields_DescriptionLength(t *testing.T) {
	tests := []struct {
		name    string
		desc    string
		wantErr bool
	}{
		{"exactly 1000 chars", strings.Repeat("a", 1000), false},
		{"1001 chars", strings.Repeat("a", 1001), true},
		{"empty", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRoadmapFields("title", tt.desc, "", nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestValidateTags(t *testing.T) {
	tests := []struct {
		name    string
		tags    []string
		wantErr bool
		errMsg  string
	}{
		{"nil tags", nil, false, ""},
		{"empty slice", []string{}, false, ""},
		{"5 tags ok", []string{"a", "b", "c", "d", "e"}, false, ""},
		{"6 tags too many", []string{"a", "b", "c", "d", "e", "f"}, true, "maximum 5 tags allowed"},
		{"empty tag", []string{"ok", ""}, true, "tags cannot be empty"},
		{"tag too long", []string{strings.Repeat("a", 31)}, true, "each tag must be 30 characters or less"},
		{"duplicate tags", []string{"go", "go"}, true, "duplicate tags are not allowed"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateTags(tt.tags)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
			if tt.errMsg != "" && err != nil && err.Error() != tt.errMsg {
				t.Errorf("got err=%q, want %q", err.Error(), tt.errMsg)
			}
		})
	}
}

func TestValidateNodeFields(t *testing.T) {
	tests := []struct {
		name    string
		label   string
		desc    string
		color   string
		url     string
		wantErr bool
		errMsg  string
	}{
		{"valid minimal", "Node", "", "", "", false, ""},
		{"valid full", "Node", "desc", "#16a34a", "https://example.com", false, ""},
		{"empty label", "", "", "", "", true, "label is required"},
		{"label 50 chars", strings.Repeat("a", 50), "", "", "", false, ""},
		{"label 51 chars", strings.Repeat("a", 51), "", "", "", true, "label must be 50 characters or less"},
		{"desc 500 chars", "Node", strings.Repeat("a", 500), "", "", false, ""},
		{"desc 501 chars", "Node", strings.Repeat("a", 501), "", "", true, "description must be 500 characters or less"},
		{"invalid color", "Node", "", "red", "", true, "color must be a valid hex color (e.g. #4c6ef5)"},
		{"color without hash", "Node", "", "16a34a", "", true, "color must be a valid hex color (e.g. #4c6ef5)"},
		{"valid color", "Node", "", "#AABBCC", "", false, ""},
		{"invalid url", "Node", "", "", "not-a-url", true, "url must be a valid HTTP or HTTPS URL"},
		{"ftp url", "Node", "", "", "ftp://example.com", true, "url must be a valid HTTP or HTTPS URL"},
		{"http url", "Node", "", "", "http://example.com", false, ""},
		{"https url", "Node", "", "", "https://example.com/path", false, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateNodeFields(tt.label, tt.desc, tt.color, tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
			if tt.errMsg != "" && err != nil && err.Error() != tt.errMsg {
				t.Errorf("got err=%q, want %q", err.Error(), tt.errMsg)
			}
		})
	}
}

func TestValidateBatchUpdateNodesBody_Limits(t *testing.T) {
	t.Run("empty nodes", func(t *testing.T) {
		var req BatchUpdateNodesRequest
		err := validateBatchUpdateNodesBody(`{"nodes":[]}`, &req)
		if err == nil || err.Error() != "nodes array is required" {
			t.Errorf("got err=%v, want 'nodes array is required'", err)
		}
	})

	t.Run("1 node ok", func(t *testing.T) {
		var req BatchUpdateNodesRequest
		err := validateBatchUpdateNodesBody(`{"nodes":[{"nodeId":"n-1","label":"A"}]}`, &req)
		if err != nil {
			t.Errorf("unexpected error: %v", err)
		}
	})

	t.Run("101 nodes too many", func(t *testing.T) {
		// Build JSON with 101 nodes
		body := `{"nodes":[`
		for i := 0; i < 101; i++ {
			if i > 0 {
				body += ","
			}
			body += `{"nodeId":"n-` + strings.Repeat("a", 3) + `","label":"Node"}`
		}
		body += `]}`

		var req BatchUpdateNodesRequest
		err := validateBatchUpdateNodesBody(body, &req)
		if err == nil || err.Error() != "maximum 100 nodes per batch" {
			t.Errorf("got err=%v, want 'maximum 100 nodes per batch'", err)
		}
	})
}
