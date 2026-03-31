package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

// PutRoadmap creates or overwrites a roadmap metadata record.
func (d *DynamoDB) PutRoadmap(ctx context.Context, meta *model.RoadmapMeta) error {
	item, err := attributevalue.MarshalMap(meta)
	if err != nil {
		return fmt.Errorf("marshaling roadmap: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.TableName,
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("putting roadmap: %w", err)
	}
	return nil
}

// GetRoadmapMeta returns the metadata for a roadmap, or nil if not found.
func (d *DynamoDB) GetRoadmapMeta(ctx context.Context, roadmapID string) (*model.RoadmapMeta, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: model.PKPrefixRoadmap + roadmapID},
			"SK": &types.AttributeValueMemberS{Value: model.SKMeta},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("getting roadmap meta: %w", err)
	}
	if out.Item == nil {
		return nil, nil
	}

	var meta model.RoadmapMeta
	if err := attributevalue.UnmarshalMap(out.Item, &meta); err != nil {
		return nil, fmt.Errorf("unmarshaling roadmap meta: %w", err)
	}
	return &meta, nil
}

// GetRoadmapDetail fetches META + all Nodes + all Edges in a single Query.
func (d *DynamoDB) GetRoadmapDetail(ctx context.Context, roadmapID string) (*model.RoadmapDetail, error) {
	out, err := d.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &d.TableName,
		KeyConditionExpression: aws.String("PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: model.PKPrefixRoadmap + roadmapID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("querying roadmap detail: %w", err)
	}

	detail := &model.RoadmapDetail{}
	for _, item := range out.Items {
		sk := ""
		if v, ok := item["SK"].(*types.AttributeValueMemberS); ok {
			sk = v.Value
		}

		switch {
		case sk == model.SKMeta:
			if err := attributevalue.UnmarshalMap(item, &detail.Meta); err != nil {
				return nil, fmt.Errorf("unmarshaling meta: %w", err)
			}
		case strings.HasPrefix(sk, model.SKPrefixNode):
			var node model.Node
			if err := attributevalue.UnmarshalMap(item, &node); err != nil {
				return nil, fmt.Errorf("unmarshaling node: %w", err)
			}
			detail.Nodes = append(detail.Nodes, node)
		case strings.HasPrefix(sk, model.SKPrefixEdge):
			var edge model.Edge
			if err := attributevalue.UnmarshalMap(item, &edge); err != nil {
				return nil, fmt.Errorf("unmarshaling edge: %w", err)
			}
			detail.Edges = append(detail.Edges, edge)
		}
	}

	if detail.Meta.RoadmapID == "" {
		return nil, nil
	}

	if detail.Nodes == nil {
		detail.Nodes = []model.Node{}
	}
	if detail.Edges == nil {
		detail.Edges = []model.Edge{}
	}

	return detail, nil
}

// UpdateRoadmapMeta updates the mutable fields of a roadmap metadata record.
func (d *DynamoDB) UpdateRoadmapMeta(ctx context.Context, meta *model.RoadmapMeta) error {
	_, err := d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: meta.PK},
			"SK": &types.AttributeValueMemberS{Value: meta.SK},
		},
		UpdateExpression: aws.String("SET title = :t, description = :d, category = :c, tags = :tags, isPublic = :pub, updatedAt = :ua, GSI1PK = :g1pk, GSI1SK = :g1sk, GSI2PK = :g2pk, GSI2SK = :g2sk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":t":    &types.AttributeValueMemberS{Value: meta.Title},
			":d":    &types.AttributeValueMemberS{Value: meta.Description},
			":c":    &types.AttributeValueMemberS{Value: meta.Category},
			":tags": marshalTags(meta.Tags),
			":pub":  &types.AttributeValueMemberBOOL{Value: meta.IsPublic},
			":ua":   &types.AttributeValueMemberS{Value: meta.UpdatedAt},
			":g1pk": &types.AttributeValueMemberS{Value: meta.GSI1PK},
			":g1sk": &types.AttributeValueMemberS{Value: meta.GSI1SK},
			":g2pk": &types.AttributeValueMemberS{Value: meta.GSI2PK},
			":g2sk": &types.AttributeValueMemberS{Value: meta.GSI2SK},
		},
	})
	if err != nil {
		return fmt.Errorf("updating roadmap meta: %w", err)
	}
	return nil
}

func marshalTags(tags []string) types.AttributeValue {
	if len(tags) == 0 {
		return &types.AttributeValueMemberL{Value: []types.AttributeValue{}}
	}
	var items []types.AttributeValue
	for _, t := range tags {
		items = append(items, &types.AttributeValueMemberS{Value: t})
	}
	return &types.AttributeValueMemberL{Value: items}
}

// DeleteRoadmap deletes META + all Nodes + all Edges + all Likes for a roadmap.
// NOTE: Other users' Bookmark (USER#<id>/BOOKMARK#<roadmapId>) and Progress
// (USER#<id>/PROGRESS#<roadmapId>) records are NOT deleted because they live
// in different partition keys. GetMyBookmarks already skips deleted roadmaps.
// A future DynamoDB Streams + Lambda cleanup job should handle async removal.
func (d *DynamoDB) DeleteRoadmap(ctx context.Context, roadmapID string) error {
	// First query all items with this PK
	out, err := d.Client.Query(ctx, &dynamodb.QueryInput{
		TableName:              &d.TableName,
		KeyConditionExpression: aws.String("PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: model.PKPrefixRoadmap + roadmapID},
		},
		ProjectionExpression: aws.String("PK, SK"),
	})
	if err != nil {
		return fmt.Errorf("querying roadmap items: %w", err)
	}

	// Batch delete in groups of 25
	for i := 0; i < len(out.Items); i += model.BatchWriteMaxItems {
		end := i + model.BatchWriteMaxItems
		if end > len(out.Items) {
			end = len(out.Items)
		}

		var requests []types.WriteRequest
		for _, item := range out.Items[i:end] {
			requests = append(requests, types.WriteRequest{
				DeleteRequest: &types.DeleteRequest{Key: map[string]types.AttributeValue{
					"PK": item["PK"],
					"SK": item["SK"],
				}},
			})
		}

		_, err := d.Client.BatchWriteItem(ctx, &dynamodb.BatchWriteItemInput{
			RequestItems: map[string][]types.WriteRequest{
				d.TableName: requests,
			},
		})
		if err != nil {
			return fmt.Errorf("batch deleting roadmap items: %w", err)
		}
	}

	return nil
}

// GetMyRoadmaps queries GSI1 for user's roadmaps.
func (d *DynamoDB) GetMyRoadmaps(ctx context.Context, userID string, limit int32, cursor string) ([]model.RoadmapMeta, string, error) {
	input := &dynamodb.QueryInput{
		TableName:              &d.TableName,
		IndexName:              aws.String("GSI1"),
		KeyConditionExpression: aws.String("GSI1PK = :pk"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk": &types.AttributeValueMemberS{Value: model.PKPrefixUser + userID},
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
		return nil, "", fmt.Errorf("querying my roadmaps: %w", err)
	}

	var roadmaps []model.RoadmapMeta
	for _, item := range out.Items {
		var meta model.RoadmapMeta
		if err := attributevalue.UnmarshalMap(item, &meta); err != nil {
			return nil, "", fmt.Errorf("unmarshaling roadmap: %w", err)
		}
		roadmaps = append(roadmaps, meta)
	}

	nextCursor := ""
	if out.LastEvaluatedKey != nil {
		nextCursor = encodeCursor(out.LastEvaluatedKey)
	}

	return roadmaps, nextCursor, nil
}

// ExploreRoadmaps queries GSI2 for public roadmaps.
// Category filtering uses FilterExpression on the GSI2 "PUBLIC" partition
// because all public roadmaps share GSI2PK = "PUBLIC".
func (d *DynamoDB) ExploreRoadmaps(ctx context.Context, category string, limit int32, cursor string) ([]model.RoadmapMeta, string, error) {
	exprValues := map[string]types.AttributeValue{
		":pk": &types.AttributeValueMemberS{Value: model.GSI2Public},
	}

	input := &dynamodb.QueryInput{
		TableName:              &d.TableName,
		IndexName:              aws.String("GSI2"),
		KeyConditionExpression: aws.String("GSI2PK = :pk"),
		ExpressionAttributeValues: exprValues,
		ScanIndexForward: aws.Bool(false),
		Limit:            &limit,
	}

	if category != "" {
		input.FilterExpression = aws.String("category = :cat")
		exprValues[":cat"] = &types.AttributeValueMemberS{Value: category}
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
		return nil, "", fmt.Errorf("querying explore roadmaps: %w", err)
	}

	var roadmaps []model.RoadmapMeta
	for _, item := range out.Items {
		var meta model.RoadmapMeta
		if err := attributevalue.UnmarshalMap(item, &meta); err != nil {
			return nil, "", fmt.Errorf("unmarshaling roadmap: %w", err)
		}
		roadmaps = append(roadmaps, meta)
	}

	nextCursor := ""
	if out.LastEvaluatedKey != nil {
		nextCursor = encodeCursor(out.LastEvaluatedKey)
	}

	return roadmaps, nextCursor, nil
}
