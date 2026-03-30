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

// IsBookmarked checks if a user has bookmarked a roadmap.
func (d *DynamoDB) IsBookmarked(ctx context.Context, userID, roadmapID string) (bool, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: model.PKPrefixUser + userID},
			"SK": &types.AttributeValueMemberS{Value: model.SKPrefixBookmark + roadmapID},
		},
		ProjectionExpression: aws.String("PK"),
	})
	if err != nil {
		return false, fmt.Errorf("checking bookmark: %w", err)
	}
	return out.Item != nil, nil
}

// BookmarkRoadmap creates a bookmark for a user on a roadmap.
func (d *DynamoDB) BookmarkRoadmap(ctx context.Context, userID, roadmapID string) error {
	now := time.Now().UTC().Format(time.RFC3339)

	bookmark := model.Bookmark{
		PK:        model.PKPrefixUser + userID,
		SK:        model.SKPrefixBookmark + roadmapID,
		CreatedAt: now,
		GSI3PK:    model.PKPrefixRoadmap + roadmapID,
		GSI3SK:    model.SKPrefixBookmark + userID,
	}

	item, err := attributevalue.MarshalMap(bookmark)
	if err != nil {
		return fmt.Errorf("marshaling bookmark: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           &d.TableName,
		Item:                item,
		ConditionExpression: aws.String("attribute_not_exists(PK) AND attribute_not_exists(SK)"),
	})
	if err != nil {
		return fmt.Errorf("bookmarking roadmap: %w", err)
	}
	return nil
}

// UnbookmarkRoadmap removes a bookmark.
func (d *DynamoDB) UnbookmarkRoadmap(ctx context.Context, userID, roadmapID string) error {
	_, err := d.Client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: model.PKPrefixUser + userID},
			"SK": &types.AttributeValueMemberS{Value: model.SKPrefixBookmark + roadmapID},
		},
	})
	if err != nil {
		return fmt.Errorf("removing bookmark: %w", err)
	}
	return nil
}

// GetMyBookmarks returns a user's bookmarks with pagination.
func (d *DynamoDB) GetMyBookmarks(ctx context.Context, userID string, limit int32, cursor string) ([]model.Bookmark, string, error) {
	input := &dynamodb.QueryInput{
		TableName:              &d.TableName,
		KeyConditionExpression: aws.String("PK = :pk AND begins_with(SK, :prefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":     &types.AttributeValueMemberS{Value: model.PKPrefixUser + userID},
			":prefix": &types.AttributeValueMemberS{Value: model.SKPrefixBookmark},
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
