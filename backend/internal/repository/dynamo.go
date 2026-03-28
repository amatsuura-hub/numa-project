package repository

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type DynamoDB struct {
	Client    *dynamodb.Client
	TableName string
}

func NewDynamoDB(ctx context.Context, tableName string) (*DynamoDB, error) {
	var opts []func(*config.LoadOptions) error
	opts = append(opts, config.WithRegion("ap-northeast-1"))

	// Support DynamoDB Local
	endpoint := os.Getenv("DYNAMODB_ENDPOINT")
	if endpoint != "" {
		opts = append(opts, config.WithEndpointResolverWithOptions(
			aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
				if service == dynamodb.ServiceID {
					return aws.Endpoint{URL: endpoint}, nil
				}
				return aws.Endpoint{}, fmt.Errorf("unknown endpoint requested for %s", service)
			}),
		))
	}

	cfg, err := config.LoadDefaultConfig(ctx, opts...)
	if err != nil {
		return nil, fmt.Errorf("loading AWS config: %w", err)
	}

	client := dynamodb.NewFromConfig(cfg)

	return &DynamoDB{
		Client:    client,
		TableName: tableName,
	}, nil
}
