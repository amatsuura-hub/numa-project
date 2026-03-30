package main

import (
	"context"
	"os"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_MissingSub(t *testing.T) {
	os.Setenv("TABLE_NAME", "test-table")
	event := events.CognitoEventUserPoolsPostConfirmation{
		Request: events.CognitoEventUserPoolsPostConfirmationRequest{
			UserAttributes: map[string]string{
				"email": "test@example.com",
			},
		},
	}

	_, err := handler(context.Background(), event)
	if err == nil {
		t.Fatal("expected error for missing sub attribute")
	}
	if err.Error() != "sub attribute missing from Cognito event" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestHandler_MissingEmail(t *testing.T) {
	os.Setenv("TABLE_NAME", "test-table")
	event := events.CognitoEventUserPoolsPostConfirmation{
		Request: events.CognitoEventUserPoolsPostConfirmationRequest{
			UserAttributes: map[string]string{
				"sub": "user-123",
			},
		},
	}

	_, err := handler(context.Background(), event)
	if err == nil {
		t.Fatal("expected error for missing email attribute")
	}
	if err.Error() != "email attribute missing from Cognito event" {
		t.Errorf("unexpected error: %v", err)
	}
}

func TestHandler_InvalidEmail(t *testing.T) {
	os.Setenv("TABLE_NAME", "test-table")
	event := events.CognitoEventUserPoolsPostConfirmation{
		Request: events.CognitoEventUserPoolsPostConfirmationRequest{
			UserAttributes: map[string]string{
				"sub":   "user-123",
				"email": "no-at-sign",
			},
		},
	}

	_, err := handler(context.Background(), event)
	if err == nil {
		t.Fatal("expected error for invalid email format")
	}
}
