package main

import "testing"

func TestMatchPath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		pattern string
		want    bool
	}{
		{"exact match", "/api/health", "/api/health", true},
		{"wildcard single", "/api/roadmaps/abc123", "/api/roadmaps/*", true},
		{"wildcard nested", "/api/roadmaps/abc123/nodes", "/api/roadmaps/*/nodes", true},
		{"wildcard double", "/api/roadmaps/abc123/nodes/n1", "/api/roadmaps/*/nodes/*", true},
		{"mismatch verb", "/api/roadmaps/abc123/edges", "/api/roadmaps/*/nodes", false},
		{"too many segments", "/api/roadmaps/abc123/nodes/extra/path", "/api/roadmaps/*/nodes/*", false},
		{"too few segments", "/api/roadmaps", "/api/roadmaps/*", false},
		{"empty path", "/", "/api/health", false},
		{"trailing slash stripped", "/api/roadmaps/abc/nodes/", "/api/roadmaps/*/nodes", true}, // Trim normalizes trailing slash
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := matchPath(tt.path, tt.pattern); got != tt.want {
				t.Errorf("matchPath(%q, %q) = %v, want %v", tt.path, tt.pattern, got, tt.want)
			}
		})
	}
}

func TestExtractSegment(t *testing.T) {
	tests := []struct {
		name  string
		path  string
		index int
		want  string
	}{
		{"first segment", "/api/roadmaps/abc123", 1, "api"},
		{"roadmap id", "/api/roadmaps/abc123", 3, "abc123"},
		{"node id", "/api/roadmaps/r1/nodes/n1", 5, "n1"},
		{"progress node id", "/api/roadmaps/r1/progress/nodes/n1", 6, "n1"},
		{"zero index", "/api/test", 0, ""},
		{"out of bounds", "/api/test", 10, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := extractSegment(tt.path, tt.index); got != tt.want {
				t.Errorf("extractSegment(%q, %d) = %q, want %q", tt.path, tt.index, got, tt.want)
			}
		})
	}
}
