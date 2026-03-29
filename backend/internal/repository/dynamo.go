package repository

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

// DynamoDB implements Repository using AWS DynamoDB.
type DynamoDB struct {
	Client    *dynamodb.Client
	TableName string
}

// NewDynamoDB creates a new DynamoDB repository client.
func NewDynamoDB(ctx context.Context, tableName string) (*DynamoDB, error) {
	var opts []func(*config.LoadOptions) error
	opts = append(opts, config.WithRegion("ap-northeast-1"))

	cfg, err := config.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("loading AWS config: %w", err)
	}

	// Support DynamoDB Local
	var ddbOpts []func(*dynamodb.Options)
	endpoint := os.Getenv("DYNAMODB_ENDPOINT")
	if endpoint != "" {
		ddbOpts = append(ddbOpts, func(o *dynamodb.Options) {
			o.BaseEndpoint = &endpoint
		})
	}

	client := dynamodb.NewFromConfig(cfg, ddbOpts...)

	return &DynamoDB{
		Client:    client,
		TableName: tableName,
	}, nil
}
