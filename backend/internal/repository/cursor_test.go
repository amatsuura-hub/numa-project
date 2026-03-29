package repository

import (
	"encoding/base64"
	"encoding/json"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func TestEncodeCursor(t *testing.T) {
	tests := []struct {
		name string
		key  map[string]types.AttributeValue
	}{
		{
			name: "single key",
			key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: "USER#123"},
			},
		},
		{
			name: "multiple keys",
			key: map[string]types.AttributeValue{
				"PK":     &types.AttributeValueMemberS{Value: "ROADMAP#abc"},
				"SK":     &types.AttributeValueMemberS{Value: "META"},
				"GSI1PK": &types.AttributeValueMemberS{Value: "USER#456"},
			},
		},
		{
			name: "empty key",
			key:  map[string]types.AttributeValue{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cursor := encodeCursor(tt.key)
			if cursor == "" && len(tt.key) > 0 {
				t.Error("expected non-empty cursor for non-empty key")
			}

			// Verify it's valid base64
			decoded, err := base64.URLEncoding.DecodeString(cursor)
			if err != nil {
				t.Fatalf("cursor is not valid base64: %v", err)
			}

			// Verify it's valid JSON
			var m map[string]string
			if err := json.Unmarshal(decoded, &m); err != nil {
				t.Fatalf("decoded cursor is not valid JSON: %v", err)
			}
		})
	}
}

func TestDecodeCursor(t *testing.T) {
	tests := []struct {
		name     string
		cursor   string
		wantErr  bool
		wantKeys map[string]string
	}{
		{
			name:     "valid cursor",
			cursor:   encodeCursor(map[string]types.AttributeValue{"PK": &types.AttributeValueMemberS{Value: "USER#123"}}),
			wantErr:  false,
			wantKeys: map[string]string{"PK": "USER#123"},
		},
		{
			name:    "invalid base64",
			cursor:  "not-valid-base64!!!",
			wantErr: true,
		},
		{
			name:    "valid base64 but invalid JSON",
			cursor:  base64.URLEncoding.EncodeToString([]byte("not json")),
			wantErr: true,
		},
		{
			name:    "empty string",
			cursor:  "",
			wantErr: true,
		},
		{
			name:     "empty JSON object",
			cursor:   base64.URLEncoding.EncodeToString([]byte("{}")),
			wantErr:  false,
			wantKeys: map[string]string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			key, err := decodeCursor(tt.cursor)
			if tt.wantErr {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}

			for k, v := range tt.wantKeys {
				av, ok := key[k]
				if !ok {
					t.Errorf("missing key %q", k)
					continue
				}
				s, ok := av.(*types.AttributeValueMemberS)
				if !ok {
					t.Errorf("key %q is not a string type", k)
					continue
				}
				if s.Value != v {
					t.Errorf("key %q = %q, want %q", k, s.Value, v)
				}
			}
		})
	}
}

func TestCursorRoundTrip(t *testing.T) {
	// Test that encode -> decode produces the original values
	original := map[string]types.AttributeValue{
		"PK":     &types.AttributeValueMemberS{Value: "ROADMAP#test-id"},
		"SK":     &types.AttributeValueMemberS{Value: "META"},
		"GSI1PK": &types.AttributeValueMemberS{Value: "USER#user-id"},
		"GSI1SK": &types.AttributeValueMemberS{Value: "2025-01-01T00:00:00Z"},
	}

	cursor := encodeCursor(original)
	decoded, err := decodeCursor(cursor)
	if err != nil {
		t.Fatalf("decodeCursor failed: %v", err)
	}

	for k, v := range original {
		origVal := v.(*types.AttributeValueMemberS).Value
		decVal, ok := decoded[k].(*types.AttributeValueMemberS)
		if !ok {
			t.Errorf("decoded key %q is not string type", k)
			continue
		}
		if decVal.Value != origVal {
			t.Errorf("key %q: decoded %q != original %q", k, decVal.Value, origVal)
		}
	}
}

func TestEncodeCursor_SkipsNonStringAttributes(t *testing.T) {
	// Non-S type attributes should be skipped
	key := map[string]types.AttributeValue{
		"PK":    &types.AttributeValueMemberS{Value: "test"},
		"Count": &types.AttributeValueMemberN{Value: "42"},
	}

	cursor := encodeCursor(key)
	decoded, err := decodeCursor(cursor)
	if err != nil {
		t.Fatal(err)
	}

	if _, ok := decoded["Count"]; ok {
		t.Error("non-string attribute Count should not be in decoded cursor")
	}
	if s, ok := decoded["PK"].(*types.AttributeValueMemberS); !ok || s.Value != "test" {
		t.Error("string attribute PK should be preserved")
	}
}
