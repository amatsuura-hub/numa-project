package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

// PutNode creates or overwrites a node record.
func (d *DynamoDB) PutNode(ctx context.Context, node *model.Node) error {
	item, err := attributevalue.MarshalMap(node)
	if err != nil {
		return fmt.Errorf("marshaling node: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.TableName,
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("putting node: %w", err)
	}
	return nil
}

// DeleteNode removes a node from DynamoDB.
func (d *DynamoDB) DeleteNode(ctx context.Context, roadmapID, nodeID string) error {
	_, err := d.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: model.PKPrefixRoadmap + roadmapID},
			"SK": &types.AttributeValueMemberS{Value: model.SKPrefixNode + nodeID},
		},
	})
	if err != nil {
		return fmt.Errorf("deleting node: %w", err)
	}
	return nil
}

// BatchPutNodes writes multiple nodes in batches of 25.
func (d *DynamoDB) BatchPutNodes(ctx context.Context, nodes []model.Node) error {
	for i := 0; i < len(nodes); i += model.BatchWriteMaxItems {
		end := i + model.BatchWriteMaxItems
		if end > len(nodes) {
			end = len(nodes)
		}

		var requests []types.WriteRequest
		for _, node := range nodes[i:end] {
			item, err := attributevalue.MarshalMap(node)
			if err != nil {
				return fmt.Errorf("marshaling node: %w", err)
			}
			requests = append(requests, types.WriteRequest{
				PutRequest: &types.PutRequest{Item: item},
			})
		}

		_, err := d.Client.BatchWriteItem(ctx, &dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]types.WriteRequest{
				d.TableName: requests,
			},
		})
		if err != nil {
			return fmt.Errorf("batch writing nodes: %w", err)
		}
	}
	return nil
}
