package model

type User struct {
	PK          string `dynamodbav:"PK" json:"-"`
	SK          string `dynamodbav:"SK" json:"-"`
	UserID      string `dynamodbav:"userId" json:"userId"`
	DisplayName string `dynamodbav:"displayName" json:"displayName"`
	AvatarURL   string `dynamodbav:"avatarUrl,omitempty" json:"avatarUrl,omitempty"`
	Bio         string `dynamodbav:"bio,omitempty" json:"bio,omitempty"`
	XHandle     string `dynamodbav:"xHandle,omitempty" json:"xHandle,omitempty"`
	CreatedAt   string `dynamodbav:"createdAt" json:"createdAt"`
}
