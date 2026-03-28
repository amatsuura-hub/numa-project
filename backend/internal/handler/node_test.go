package handler

import (
	"strings"
	"testing"
)

func TestCreateNodeRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"label":"Step 1","posX":100,"posY":200}`,
			wantErr: false,
		},
		{
			name:    "empty label",
			body:    `{"label":"","posX":100,"posY":200}`,
			wantErr: true,
		},
		{
			name:    "label too long",
			body:    `{"label":"` + strings.Repeat("a", 51) + `","posX":100,"posY":200}`,
			wantErr: true,
		},
		{
			name:    "description too long",
			body:    `{"label":"ok","description":"` + strings.Repeat("a", 501) + `"}`,
			wantErr: true,
		},
		{
			name:    "invalid json",
			body:    `{bad`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateNodeRequest
			err := validateCreateNodeBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}

func TestCreateEdgeRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		wantErr bool
	}{
		{
			name:    "valid",
			body:    `{"sourceNodeId":"abc","targetNodeId":"def"}`,
			wantErr: false,
		},
		{
			name:    "missing source",
			body:    `{"sourceNodeId":"","targetNodeId":"def"}`,
			wantErr: true,
		},
		{
			name:    "missing target",
			body:    `{"sourceNodeId":"abc","targetNodeId":""}`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req CreateEdgeRequest
			err := validateCreateEdgeBody(tt.body, &req)
			if (err != nil) != tt.wantErr {
				t.Errorf("wantErr=%v, got err=%v", tt.wantErr, err)
			}
		})
	}
}
