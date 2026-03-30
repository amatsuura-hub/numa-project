package handler

import (
	"strings"
	"testing"
	"unicode/utf8"
)

func TestValidateRoadmapFields_TitleLength(t *testing.T) {
	tests := []struct {
		name    string
		title   string
		wantErr bool
	}{
		{"exactly 100 ascii chars", strings.Repeat("a", 100), false},
		{"101 ascii chars", strings.Repeat("a", 101), true},
		{"empty", "", true},
		{"normal", "My Roadmap", false},
		{"100 japanese chars", strings.Repeat("あ", 100), false},
		{"101 japanese chars", strings.Repeat("あ", 101), true},
		{"mixed CJK 100 chars", strings.Repeat("Go言語", 25), false}, // 4*25 = 100 runes
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRoadmapFields(tt.title, "", "", nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v (runes=%d, bytes=%d)", tt.wantErr, err,
					utf8.RuneCountInString(tt.title), len(tt.title))
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
		{"exactly 1000 ascii chars", strings.Repeat("a", 1000), false},
		{"1001 ascii chars", strings.Repeat("a", 1001), true},
		{"empty", "", false},
		{"1000 japanese chars", strings.Repeat("あ", 1000), false},
		{"1001 japanese chars", strings.Repeat("あ", 1001), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateRoadmapFields("title", tt.desc, "", nil)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v (runes=%d)", tt.wantErr, err,
					utf8.RuneCountInString(tt.desc))
			}
		})
	}
}

func TestValidateTags(t *testing.T) {
	tests := []struct {
		name    string
		tags    []string
		wantErr bool
	}{
		{"nil tags", nil, false},
		{"empty slice", []string{}, false},
		{"5 tags ok", []string{"a", "b", "c", "d", "e"}, false},
		{"6 tags too many", []string{"a", "b", "c", "d", "e", "f"}, true},
		{"empty tag", []string{"ok", ""}, true},
		{"ascii tag too long", []string{strings.Repeat("a", 31)}, true},
		{"duplicate tags", []string{"go", "go"}, true},
		{"30 japanese chars ok", []string{strings.Repeat("あ", 30)}, false},
		{"31 japanese chars fail", []string{strings.Repeat("あ", 31)}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateTags(tt.tags)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
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
	}{
		{"valid minimal", "Node", "", "", "", false},
		{"valid full", "Node", "desc", "#16a34a", "https://example.com", false},
		{"empty label", "", "", "", "", true},
		{"ascii label 50 chars", strings.Repeat("a", 50), "", "", "", false},
		{"ascii label 51 chars", strings.Repeat("a", 51), "", "", "", true},
		{"ascii desc 500 chars", "Node", strings.Repeat("a", 500), "", "", false},
		{"ascii desc 501 chars", "Node", strings.Repeat("a", 501), "", "", true},
		{"invalid color", "Node", "", "red", "", true},
		{"color without hash", "Node", "", "16a34a", "", true},
		{"valid color", "Node", "", "#AABBCC", "", false},
		{"invalid url", "Node", "", "", "not-a-url", true},
		{"ftp url", "Node", "", "", "ftp://example.com", true},
		{"http url", "Node", "", "", "http://example.com", false},
		{"https url", "Node", "", "", "https://example.com/path", false},
		// Japanese character count tests
		{"japanese label 20 chars ok", "科目B対策（アルゴリズム・プログラミング）", "", "", "", false},
		{"japanese label 50 chars ok", strings.Repeat("あ", 50), "", "", "", false},
		{"japanese label 51 chars fail", strings.Repeat("あ", 51), "", "", "", true},
		{"japanese desc 500 chars ok", "Node", strings.Repeat("い", 500), "", "", false},
		{"japanese desc 501 chars fail", "Node", strings.Repeat("い", 501), "", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateNodeFields(tt.label, tt.desc, tt.color, tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v (label runes=%d, desc runes=%d)",
					tt.wantErr, err,
					utf8.RuneCountInString(tt.label),
					utf8.RuneCountInString(tt.desc))
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
