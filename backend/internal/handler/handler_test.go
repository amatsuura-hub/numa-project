package handler

import (
	"errors"
	"testing"
)

func TestNewAPIError(t *testing.T) {
	tests := []struct {
		name    string
		code    error
		message string
	}{
		{"bad request", ErrBadRequest, "invalid input"},
		{"not found", ErrNotFound, "resource not found"},
		{"forbidden", ErrForbidden, "access denied"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := NewAPIError(tt.code, tt.message)
			if err.Error() != tt.message {
				t.Errorf("got message %q, want %q", err.Error(), tt.message)
			}

			var ae *apiError
			if !errors.As(err, &ae) {
				t.Fatal("expected apiError type")
			}
			if !errors.Is(ae.code, tt.code) {
				t.Errorf("got code %v, want %v", ae.code, tt.code)
			}
		})
	}
}

func TestErrorResponse(t *testing.T) {
	headers := map[string]string{"Content-Type": "application/json"}

	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{"bad request", NewAPIError(ErrBadRequest, "bad"), 400, "BAD_REQUEST"},
		{"unauthorized", NewAPIError(ErrUnauthorized, "unauth"), 401, "UNAUTHORIZED"},
		{"forbidden", NewAPIError(ErrForbidden, "denied"), 403, "FORBIDDEN"},
		{"not found", NewAPIError(ErrNotFound, "missing"), 404, "NOT_FOUND"},
		{"conflict", NewAPIError(ErrConflict, "dup"), 409, "CONFLICT"},
		{"internal", NewAPIError(ErrInternal, "oops"), 500, "INTERNAL_ERROR"},
		{"plain error", errors.New("unexpected"), 500, "INTERNAL_ERROR"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resp := ErrorResponse(tt.err, headers)
			if resp.StatusCode != tt.wantStatus {
				t.Errorf("got status %d, want %d", resp.StatusCode, tt.wantStatus)
			}
		})
	}
}
