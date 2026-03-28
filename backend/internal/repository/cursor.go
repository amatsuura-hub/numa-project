package repository

import (
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// encodeCursor encodes a DynamoDB LastEvaluatedKey to a base64 string.
func encodeCursor(key map[string]types.AttributeValue) string {
	m := make(map[string]string)
	for k, v := range key {
		if s, ok := v.(*types.AttributeValueMemberS); ok {
			m[k] = s.Value
		}
	}
	b, _ := json.Marshal(m)
	return base64.URLEncoding.EncodeToString(b)
}

// decodeCursor decodes a base64 cursor string to a DynamoDB ExclusiveStartKey.
func decodeCursor(cursor string) (map[string]types.AttributeValue, error) {
	b, err := base64.URLEncoding.DecodeString(cursor)
	if err != nil {
		return nil, fmt.Errorf("invalid cursor: %w", err)
	}

	var m map[string]string
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, fmt.Errorf("invalid cursor format: %w", err)
	}

	key := make(map[string]types.AttributeValue)
	for k, v := range m {
		key[k] = &types.AttributeValueMemberS{Value: v}
	}
	return key, nil
}
