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

func (d *DynamoDB) IsBookmarked(ctx context.Context, userID, roadmapID string) (bool, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "BOOKMARK#" + roadmapID},
		},
		ProjectionExpression: aws.String("PK"),
	})
	if err != nil {
		return false, fmt.Errorf("checking bookmark: %w", err)
	}
	return out.Item != nil, nil
}

func (d *DynamoDB) BookmarkRoadmap(ctx context.Context, userID, roadmapID string) error {
	now := time.Now().UTC().Format(time.RFC3339)

	bookmark := model.Bookmark{
		PK:        "USER#" + userID,
		SK:        "BOOKMARK#" + roadmapID,
		CreatedAt: now,
		GSI3PK:    "ROADMAP#" + roadmapID,
		GSI3SK:    "BOOKMARK#" + userID,
	}

	item, err := attributevalue.MarshalMap(bookmark)
	if err != nil {
		return fmt.Errorf("marshaling bookmark: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           &d.TableName,
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(PK)"),
	})
	return err
}

func (d *DynamoDB) UnbookmarkRoadmap(ctx context.Context, userID, roadmapID string) error {
	_, err := d.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "BOOKMARK#" + roadmapID},
		},
	})
	return err
}

func (d *DynamoDB) GetMyBookmarks(ctx context.Context, userID string, limit int32, cursor string) ([]model.Bookmark, string, error) {
	input := &dynamodb.QueryInput{
		TableName:              &d.TableName,
		KeyConditionExpression: aws.String("PK = :pk AND begins_with(SK, :prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":     &types.AttributeValueMemberS{Value: "USER#" + userID},
			":prefix": &types.AttributeValueMemberS{Value: "BOOKMARK#"},
		},
		ScanIndexForward: aws.Bool(false),
		Limit:            &limit,
	}

	if cursor != "" {
		key, err := decodeCursor(cursor)
		if err != nil {
			return nil, "", fmt.Errorf("decoding cursor: %w", err)
		}
		input.ExclusiveStartKey = key
	}

	out, err := d.Client.Query(ctx, input)
	if err != nil {
		return nil, "", fmt.Errorf("querying bookmarks: %w", err)
	}

	var bookmarks []model.Bookmark
	for _, item := range out.Items {
		var b model.Bookmark
		if err := attributevalue.UnmarshalMap(item, &b); err != nil {
			return nil, "", fmt.Errorf("unmarshaling bookmark: %w", err)
		}
		bookmarks = append(bookmarks, b)
	}

	nextCursor := ""
	if out.LastEvaluatedKey != nil {
		nextCursor = encodeCursor(out.LastEvaluatedKey)
	}

	return bookmarks, nextCursor, nil
}
