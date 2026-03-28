package repository

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/numa-project/backend/internal/model"
)

func (d *DynamoDB) GetUser(ctx context.Context, userID string) (*model.User, error) {
	out, err := d.Client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "PROFILE"},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("getting user: %w", err)
	}
	if out.Item == nil {
		return nil, nil
	}

	var user model.User
	if err := attributevalue.UnmarshalMap(out.Item, &user); err != nil {
		return nil, fmt.Errorf("unmarshaling user: %w", err)
	}
	return &user, nil
}

func (d *DynamoDB) PutUser(ctx context.Context, user *model.User) error {
	item, err := attributevalue.MarshalMap(user)
	if err != nil {
		return fmt.Errorf("marshaling user: %w", err)
	}

	_, err = d.Client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: &d.TableName,
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("putting user: %w", err)
	}
	return nil
}

func (d *DynamoDB) UpdateUser(ctx context.Context, userID string, displayName, bio, xHandle string) (*model.User, error) {
	out, err := d.Client.UpdateItem(ctx, &dynamodb.UpdateItemInput{
		TableName: &d.TableName,
		Key: map[string]types.AttributeValue{
			"PK": &types.AttributeValueMemberS{Value: "USER#" + userID},
			"SK": &types.AttributeValueMemberS{Value: "PROFILE"},
		},
		UpdateExpression: aws.String("SET displayName = :dn, bio = :bio, xHandle = :xh"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":dn": &types.AttributeValueMemberS{Value: displayName},
			":bio": &types.AttributeValueMemberS{Value: bio},
			":xh":  &types.AttributeValueMemberS{Value: xHandle},
		},
		ReturnValues: types.ReturnValueAllNew,
	})
	if err != nil {
		return nil, fmt.Errorf("updating user: %w", err)
	}

	var user model.User
	if err := attributevalue.UnmarshalMap(out.Attributes, &user); err != nil {
		return nil, fmt.Errorf("unmarshaling user: %w", err)
	}
	return &user, nil
}
