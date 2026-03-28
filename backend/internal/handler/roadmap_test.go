package handler

import (
	"testing"
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
			// Validate the request parsing logic directly
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
