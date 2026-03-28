package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/numa-project/backend/internal/handler"
	"github.com/numa-project/backend/internal/middleware"
	"github.com/numa-project/backend/internal/repository"
)

func main() {
	tableName := os.Getenv("TABLE_NAME")
	if tableName == "" {
		tableName = "dev-numa-main"
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "*"
	}

	repo, err := repository.NewDynamoDB(context.Background(), tableName)
	if err != nil {
		log.Fatalf("failed to initialize repository: %v", err)
	}

	h := handler.New(repo)

	lambda.Start(func(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
		return route(ctx, req, h, allowedOrigin)
	})
}

func route(ctx context.Context, req events.APIGatewayProxyRequest, h *handler.Handler, allowedOrigin string) (events.APIGatewayProxyResponse, error) {
	// CORS headers
	corsHeaders := map[string]string{
		"Access-Control-Allow-Origin":  allowedOrigin,
		"Access-Control-Allow-Headers": "Content-Type,Authorization",
		"Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
		"Content-Type":                 "application/json",
	}

	// OPTIONS preflight
	if req.HTTPMethod == "OPTIONS" {
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusOK,
			Headers:    corsHeaders,
		}, nil
	}

	// Extract user ID from JWT claims
	userID := middleware.ExtractUserID(req)

	path := req.Path
	method := req.HTTPMethod

	var resp interface{}
	var statusCode int
	var handleErr error

	switch {
	// User endpoints
	case method == "GET" && path == "/api/users/me":
		resp, handleErr = h.GetMyProfile(ctx, userID)
		statusCode = http.StatusOK
	case method == "PUT" && path == "/api/users/me":
		resp, handleErr = h.UpdateMyProfile(ctx, userID, req.Body)
		statusCode = http.StatusOK
	case method == "GET" && matchPath(path, "/api/users/*/roadmaps"):
		targetUserID := extractSegment(path, 3)
		resp, handleErr = h.GetUserPublicRoadmaps(ctx, targetUserID, req.QueryStringParameters)
		statusCode = http.StatusOK
	case method == "GET" && strings.HasPrefix(path, "/api/users/") && !strings.Contains(strings.TrimPrefix(path, "/api/users/"), "/"):
		targetUserID := strings.TrimPrefix(path, "/api/users/")
		resp, handleErr = h.GetUserProfile(ctx, targetUserID)
		statusCode = http.StatusOK

	// Roadmap endpoints
	case method == "POST" && path == "/api/roadmaps":
		resp, handleErr = h.CreateRoadmap(ctx, userID, req.Body)
		statusCode = http.StatusCreated
	case method == "GET" && path == "/api/roadmaps/my":
		resp, handleErr = h.GetMyRoadmaps(ctx, userID, req.QueryStringParameters)
		statusCode = http.StatusOK
	case method == "GET" && path == "/api/roadmaps/explore":
		resp, handleErr = h.ExploreRoadmaps(ctx, req.QueryStringParameters)
		statusCode = http.StatusOK
	case method == "GET" && strings.HasPrefix(path, "/api/roadmaps/") && !strings.Contains(strings.TrimPrefix(path, "/api/roadmaps/"), "/"):
		roadmapID := strings.TrimPrefix(path, "/api/roadmaps/")
		resp, handleErr = h.GetRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusOK
	case method == "PUT" && strings.HasPrefix(path, "/api/roadmaps/") && !strings.Contains(strings.TrimPrefix(path, "/api/roadmaps/"), "/"):
		roadmapID := strings.TrimPrefix(path, "/api/roadmaps/")
		resp, handleErr = h.UpdateRoadmap(ctx, userID, roadmapID, req.Body)
		statusCode = http.StatusOK
	case method == "DELETE" && strings.HasPrefix(path, "/api/roadmaps/") && !strings.Contains(strings.TrimPrefix(path, "/api/roadmaps/"), "/"):
		roadmapID := strings.TrimPrefix(path, "/api/roadmaps/")
		handleErr = h.DeleteRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusNoContent

	// Node endpoints
	case method == "POST" && matchPath(path, "/api/roadmaps/*/nodes"):
		roadmapID := extractSegment(path, 3)
		resp, handleErr = h.CreateNode(ctx, userID, roadmapID, req.Body)
		statusCode = http.StatusCreated
	case method == "PUT" && matchPath(path, "/api/roadmaps/*/nodes/batch"):
		roadmapID := extractSegment(path, 3)
		resp, handleErr = h.BatchUpdateNodes(ctx, userID, roadmapID, req.Body)
		statusCode = http.StatusOK
	case method == "PUT" && matchPath(path, "/api/roadmaps/*/nodes/*"):
		roadmapID := extractSegment(path, 3)
		nodeID := extractSegment(path, 5)
		resp, handleErr = h.UpdateNode(ctx, userID, roadmapID, nodeID, req.Body)
		statusCode = http.StatusOK
	case method == "DELETE" && matchPath(path, "/api/roadmaps/*/nodes/*"):
		roadmapID := extractSegment(path, 3)
		nodeID := extractSegment(path, 5)
		handleErr = h.DeleteNode(ctx, userID, roadmapID, nodeID)
		statusCode = http.StatusNoContent

	// Edge endpoints
	case method == "POST" && matchPath(path, "/api/roadmaps/*/edges"):
		roadmapID := extractSegment(path, 3)
		resp, handleErr = h.CreateEdge(ctx, userID, roadmapID, req.Body)
		statusCode = http.StatusCreated
	case method == "DELETE" && matchPath(path, "/api/roadmaps/*/edges/*"):
		roadmapID := extractSegment(path, 3)
		edgeID := extractSegment(path, 5)
		handleErr = h.DeleteEdge(ctx, userID, roadmapID, edgeID)
		statusCode = http.StatusNoContent

	// Like endpoints
	case method == "POST" && matchPath(path, "/api/roadmaps/*/like"):
		roadmapID := extractSegment(path, 3)
		handleErr = h.LikeRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusCreated
	case method == "DELETE" && matchPath(path, "/api/roadmaps/*/like"):
		roadmapID := extractSegment(path, 3)
		handleErr = h.UnlikeRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusNoContent

	// Bookmark endpoints
	case method == "POST" && matchPath(path, "/api/roadmaps/*/bookmark"):
		roadmapID := extractSegment(path, 3)
		handleErr = h.BookmarkRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusCreated
	case method == "DELETE" && matchPath(path, "/api/roadmaps/*/bookmark"):
		roadmapID := extractSegment(path, 3)
		handleErr = h.UnbookmarkRoadmap(ctx, userID, roadmapID)
		statusCode = http.StatusNoContent
	case method == "GET" && path == "/api/bookmarks":
		resp, handleErr = h.GetMyBookmarks(ctx, userID, req.QueryStringParameters)
		statusCode = http.StatusOK

	default:
		return events.APIGatewayProxyResponse{
			StatusCode: http.StatusNotFound,
			Headers:    corsHeaders,
			Body:       `{"error":{"code":"NOT_FOUND","message":"Endpoint not found"}}`,
		}, nil
	}

	if handleErr != nil {
		return handler.ErrorResponse(handleErr, corsHeaders), nil
	}

	if statusCode == http.StatusNoContent {
		return events.APIGatewayProxyResponse{
			StatusCode: statusCode,
			Headers:    corsHeaders,
		}, nil
	}

	body, _ := json.Marshal(map[string]interface{}{"data": resp})
	return events.APIGatewayProxyResponse{
		StatusCode: statusCode,
		Headers:    corsHeaders,
		Body:       string(body),
	}, nil
}

// matchPath checks if a path matches a pattern with * wildcards
func matchPath(path, pattern string) bool {
	pathParts := strings.Split(strings.Trim(path, "/"), "/")
	patternParts := strings.Split(strings.Trim(pattern, "/"), "/")

	if len(pathParts) != len(patternParts) {
		return false
	}

	for i, p := range patternParts {
		if p != "*" && p != pathParts[i] {
			return false
		}
	}
	return true
}

// extractSegment extracts a path segment by index (1-based)
func extractSegment(path string, index int) string {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if index > 0 && index <= len(parts) {
		return parts[index-1]
	}
	return ""
}
