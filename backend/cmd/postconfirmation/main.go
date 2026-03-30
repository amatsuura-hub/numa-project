package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/numa-project/backend/internal/model"
)

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.CognitoEventUserPoolsPostConfirmation) (events.CognitoEventUserPoolsPostConfirmation, error) {
	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		return event, fmt.Errorf("TABLE_NAME environment variable is required")
	}

	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return event, fmt.Errorf("loading AWS config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	userID := event.Request.UserAttributes["sub"]
	if userID == "" {
		return event, fmt.Errorf("sub attribute missing from Cognito event")
	}

	email := event.Request.UserAttributes["email"]
	if email == "" {
		return event, fmt.Errorf("email attribute missing from Cognito event")
	}

	// Use part before @ as default display name
	parts := strings.Split(email, "@")
	if len(parts) < 2 || parts[0] == "" {
		return event, fmt.Errorf("invalid email format: %s", email)
	}
	displayName := parts[0]

	user := model.User{
		PK:          model.PKPrefixUser + userID,
		SK:          model.SKProfile,
		UserID:      userID,
		DisplayName: displayName,
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return event, fmt.Errorf("marshaling user: %w", err)
	}

	_, err = client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &tableName,
		Item:      item,
	})
	if err != nil {
		return event, fmt.Errorf("putting user item: %w", err)
	}

	slog.Info("created user profile", "userId", userID, "displayName", displayName)
	return event, nil
}
