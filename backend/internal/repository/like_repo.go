package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func (d *DynamoDB) IsLiked(ctx context.Context, roadmapID, userID string) (bool, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "ROADMAP#" + roadmapID},
			"SK": &types.AttributeValueMemberS{Value: "LIKE#" + userID},
		},
		ProjectionExpression: aws.String("PK"),
	})
	if err != nil {
		return false, fmt.Errorf("checking like: %w", err)
	}
	return out.Item != nil, nil
}

// LikeRoadmap adds a like and increments likeCount atomically.
func (d *DynamoDB) LikeRoadmap(ctx context.Context, roadmapID, userID string) error {
	now := time.Now().UTC().Format(time.RFC3339)

	_, err := d.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Put: &types.Put{
					TableName: &d.TableName,
					Item: map[string]types.AttributeValue{
						"PK":        &types.AttributeValueMemberS{Value: "ROADMAP#" + roadmapID},
						"SK":        &types.AttributeValueMemberS{Value: "LIKE#" + userID},
						"createdAt": &types.AttributeValueMemberS{Value: now},
					},
					ConditionExpression: aws.String("attribute_not_exists(PK)"),
				},
			},
			{
				Update: &types.Update{
					TableName: &d.TableName,
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "ROADMAP#" + roadmapID},
						"SK": &types.AttributeValueMemberS{Value: "META"},
					},
					UpdateExpression: aws.String("ADD likeCount :one"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":one": &types.AttributeValueMemberN{Value: "1"},
					},
				},
			},
		},
	})
	return err
}

// UnlikeRoadmap removes a like and decrements likeCount atomically.
func (d *DynamoDB) UnlikeRoadmap(ctx context.Context, roadmapID, userID string) error {
	_, err := d.Client.TransactWriteItems(ctx, &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Delete: &types.Delete{
					TableName: &d.TableName,
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "ROADMAP#" + roadmapID},
						"SK": &types.AttributeValueMemberS{Value: "LIKE#" + userID},
					},
					ConditionExpression: aws.String("attribute_exists(PK)"),
				},
			},
			{
				Update: &types.Update{
					TableName: &d.TableName,
					Key: map[string]types.AttributeValue{
						"PK": &types.AttributeValueMemberS{Value: "ROADMAP#" + roadmapID},
						"SK": &types.AttributeValueMemberS{Value: "META"},
					},
					UpdateExpression: aws.String("ADD likeCount :neg"),
					ExpressionAttributeValues: map[string]types.AttributeValue{
						":neg": &types.AttributeValueMemberN{Value: "-1"},
					},
				},
			},
		},
	})
	return err
}
