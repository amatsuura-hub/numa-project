package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

// PutEdge creates or overwrites an edge record.
func (d *DynamoDB) PutEdge(ctx context.Context, edge *model.Edge) error {
	item, err := attributevalue.MarshalMap(edge)
	if err != nil {
		return fmt.Errorf("marshaling edge: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.TableName,
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("putting edge: %w", err)
	}
	return nil
}

// DeleteEdge removes an edge from DynamoDB.
func (d *DynamoDB) DeleteEdge(ctx context.Context, roadmapID, edgeID string) error {
	_, err := d.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: model.PKPrefixRoadmap + roadmapID},
			"SK": &types.AttributeValueMemberS{Value: model.SKPrefixEdge + edgeID},
		},
	})
	if err != nil {
		return fmt.Errorf("deleting edge: %w", err)
	}
	return nil
}
