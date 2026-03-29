package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

func (d *DynamoDB) GetProgress(ctx context.Context, userID, roadmapID string) (*model.Progress, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "PROGRESS#" + roadmapID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("getting progress: %w", err)
	}
	if out.Item == nil {
		return nil, nil
	}

	var p model.Progress
	if err := attributevalue.UnmarshalMap(out.Item, &p); err != nil {
		return nil, fmt.Errorf("unmarshaling progress: %w", err)
	}
	return &p, nil
}

func (d *DynamoDB) PutProgress(ctx context.Context, p *model.Progress) error {
	item, err := attributevalue.MarshalMap(p)
	if err != nil {
		return fmt.Errorf("marshaling progress: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.TableName,
		Item:      item,
	})
	return err
}

func (d *DynamoDB) GetMyProgress(ctx context.Context, userID string) ([]model.Progress, error) {
	input := &dynamodb.QueryInput{
		TableName:              &d.TableName,
		KeyConditionExpression: aws.String("PK = :pk AND begins_with(SK, :prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":     &types.AttributeValueMemberS{Value: "USER#" + userID},
			":prefix": &types.AttributeValueMemberS{Value: "PROGRESS#"},
		},
		ScanIndexForward: aws.Bool(false),
	}

	out, err := d.Client.Query(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("querying progress: %w", err)
	}

	var results []model.Progress
	for _, item := range out.Items {
		var p model.Progress
		if err := attributevalue.UnmarshalMap(item, &p); err != nil {
			return nil, fmt.Errorf("unmarshaling progress: %w", err)
		}
		results = append(results, p)
	}
	return results, nil
}

func (d *DynamoDB) CompleteNode(ctx context.Context, userID, roadmapID, nodeID string, totalNodes int) (*model.Progress, error) {
	now := time.Now().UTC().Format(time.RFC3339)

	// Use UpdateItem with ADD for StringSet to atomically add the node
	out, err := d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "PROGRESS#" + roadmapID},
		},
		UpdateExpression: aws.String(
			"ADD completedNodes :nodeId " +
				"SET roadmapId = :rid, totalNodes = :total, updatedAt = :now, " +
				"startedAt = if_not_exists(startedAt, :now)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":nodeId": &types.AttributeValueMemberSS{Value: []string{nodeID}},
			":rid":    &types.AttributeValueMemberS{Value: roadmapID},
			":total":  &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", totalNodes)},
			":now":    &types.AttributeValueMemberS{Value: now},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("completing node: %w", err)
	}

	var p model.Progress
	if err := attributevalue.UnmarshalMap(out.Attributes, &p); err != nil {
		return nil, fmt.Errorf("unmarshaling progress: %w", err)
	}

	// Calculate and update numa level
	level := model.CalcNumaLevel(len(p.CompletedNodes), totalNodes)
	if level != p.NumaLevel {
		p.NumaLevel = level
		_, err = d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
			TableName: &d.TableName,
			Key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
				"SK": &types.AttributeValueMemberS{Value: "PROGRESS#" + roadmapID},
			},
			UpdateExpression: aws.String("SET numaLevel = :level"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":level": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", level)},
			},
		})
		if err != nil {
			return nil, fmt.Errorf("updating numa level: %w", err)
		}
	}

	return &p, nil
}

func (d *DynamoDB) UncompleteNode(ctx context.Context, userID, roadmapID, nodeID string, totalNodes int) (*model.Progress, error) {
	now := time.Now().UTC().Format(time.RFC3339)

	out, err := d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "PROGRESS#" + roadmapID},
		},
		UpdateExpression: aws.String(
			"DELETE completedNodes :nodeId " +
				"SET updatedAt = :now"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":nodeId": &types.AttributeValueMemberSS{Value: []string{nodeID}},
			":now":    &types.AttributeValueMemberS{Value: now},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("uncompleting node: %w", err)
	}

	var p model.Progress
	if err := attributevalue.UnmarshalMap(out.Attributes, &p); err != nil {
		return nil, fmt.Errorf("unmarshaling progress: %w", err)
	}

	// Recalculate numa level
	level := model.CalcNumaLevel(len(p.CompletedNodes), totalNodes)
	if level != p.NumaLevel {
		p.NumaLevel = level
		_, err = d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
			TableName: &d.TableName,
			Key: map[string]types.AttributeValue{
				"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
				"SK": &types.AttributeValueMemberS{Value: "PROGRESS#" + roadmapID},
			},
			UpdateExpression: aws.String("SET numaLevel = :level"),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":level": &types.AttributeValueMemberN{Value: fmt.Sprintf("%d", level)},
			},
		})
		if err != nil {
			return nil, fmt.Errorf("updating numa level: %w", err)
		}
	}

	return &p, nil
}
