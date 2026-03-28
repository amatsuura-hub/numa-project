package model

type User struct {
	PK          string `dynamodbav:"PK"`
	SK          string `dynamodbav:"SK"`
	UserID      string `dynamodbav:"userId"`
	DisplayName string `dynamodbav:"displayName"`
	AvatarURL   string `dynamodbav:"avatarUrl,omitempty"`
	Bio         string `dynamodbav:"bio,omitempty"`
	XHandle     string `dynamodbav:"xHandle,omitempty"`
	CreatedAt   string `dynamodbav:"createdAt"`
}
