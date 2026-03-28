package main

import (
	"context"
	"fmt"
	"log"
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
		tableName = "dev-numa-main"
	}

	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion("ap-northeast-1"))
	if err != nil {
		return event, fmt.Errorf("loading AWS config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	userID := event.Request.UserAttributes["sub"]
	email := event.Request.UserAttributes["email"]

	// Use part before @ as default display name
	displayName := strings.Split(email, "@")[0]

	user := model.User{
		PK:          "USER#" + userID,
		SK:          "PROFILE",
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

	log.Printf("Created user profile for %s (%s)", userID, displayName)
	return event, nil
}
