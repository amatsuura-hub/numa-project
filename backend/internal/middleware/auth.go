package middleware

import (
	"github.com/aws/aws-lambda-go/events"
)

// ExtractUserID extracts the user ID (Cognito sub) from API Gateway request claims.
func ExtractUserID(req events.APIGatewayProxyRequest) string {
	if req.RequestContext.Authorizer == nil {
		return ""
	}

	claims, ok := req.RequestContext.Authorizer["claims"]
	if !ok {
		return ""
	}

	claimsMap, ok := claims.(map[string]interface{})
	if !ok {
		return ""
	}

	sub, ok := claimsMap["sub"].(string)
	if !ok {
		return ""
	}

	return sub
}
