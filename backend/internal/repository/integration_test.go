package repository

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

const testTableName = "test-numa-integration"

// setupTestDB creates a DynamoDB client and test table for integration tests.
// Tests are skipped if DynamoDB Local is not running.
func setupTestDB(t *testing.T) *DynamoDB {
	t.Helper()

	endpoint := os.Getenv("DYNAMODB_ENDPOINT")
	if endpoint == "" {
		endpoint = "http://localhost:8000"
	}

	ctx := context.Background()
	cfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion("ap-northeast-1"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider("dummy", "dummy", "dummy")),
	)
	if err != nil {
		t.Skipf("skipping integration test: cannot load AWS config: %v", err)
	}

	client := dynamodb.NewFromConfig(cfg, func(o *dynamodb.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.RetryMaxAttempts = 1
	})

	// Check connectivity with short timeout
	checkCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()
	_, err = client.ListTables(checkCtx, &dynamodb.ListTablesInput{})
	if err != nil {
		t.Skipf("skipping integration test: DynamoDB Local not available at %s", endpoint)
	}

	// Create unique table name per test to avoid interference
	tableName := fmt.Sprintf("%s-%s", testTableName, uuid.New().String()[:8])

	_, err = client.CreateTable(ctx, &dynamodb.CreateTableInput{
		TableName: &tableName,
		AttributeDefinitions: []types.AttributeDefinition{
			{AttributeName: aws.String("PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI1PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI1SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI2PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI2SK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI3PK"), AttributeType: types.ScalarAttributeTypeS},
			{AttributeName: aws.String("GSI3SK"), AttributeType: types.ScalarAttributeTypeS},
		},
		KeySchema: []types.KeySchemaElement{
			{AttributeName: aws.String("PK"), KeyType: types.KeyTypeHash},
			{AttributeName: aws.String("SK"), KeyType: types.KeyTypeRange},
		},
		GlobalSecondaryIndexes: []types.GlobalSecondaryIndex{
			{
				IndexName: aws.String("GSI1"),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("GSI1PK"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("GSI1SK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName: aws.String("GSI2"),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("GSI2PK"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("GSI2SK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
			{
				IndexName: aws.String("GSI3"),
				KeySchema: []types.KeySchemaElement{
					{AttributeName: aws.String("GSI3PK"), KeyType: types.KeyTypeHash},
					{AttributeName: aws.String("GSI3SK"), KeyType: types.KeyTypeRange},
				},
				Projection: &types.Projection{ProjectionType: types.ProjectionTypeAll},
			},
		},
		BillingMode: types.BillingModePayPerRequest,
	})
	if err != nil {
		t.Fatalf("failed to create test table: %v", err)
	}

	t.Cleanup(func() {
		_, _ = client.DeleteTable(ctx, &dynamodb.DeleteTableInput{
			TableName: &tableName,
		})
	})

	return &DynamoDB{Client: client, TableName: tableName}
}

// --- User Repository Tests ---

func TestIntegration_UserCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()
	user := &model.User{
		PK:          "USER#" + userID,
		SK:          "PROFILE",
		UserID:      userID,
		DisplayName: "TestUser",
		Bio:         "Hello",
		XHandle:     "testuser",
		CreatedAt:   time.Now().UTC().Format(time.RFC3339),
	}

	// PutUser
	if err := db.PutUser(ctx, user); err != nil {
		t.Fatalf("PutUser failed: %v", err)
	}

	// GetUser
	got, err := db.GetUser(ctx, userID)
	if err != nil {
		t.Fatalf("GetUser failed: %v", err)
	}
	if got == nil {
		t.Fatal("GetUser returned nil")
	}
	if got.DisplayName != "TestUser" {
		t.Errorf("DisplayName = %q, want %q", got.DisplayName, "TestUser")
	}
	if got.Bio != "Hello" {
		t.Errorf("Bio = %q, want %q", got.Bio, "Hello")
	}

	// UpdateUser
	updated, err := db.UpdateUser(ctx, userID, "UpdatedName", "Updated Bio", "newhandle")
	if err != nil {
		t.Fatalf("UpdateUser failed: %v", err)
	}
	if updated.DisplayName != "UpdatedName" {
		t.Errorf("DisplayName = %q, want %q", updated.DisplayName, "UpdatedName")
	}
	if updated.Bio != "Updated Bio" {
		t.Errorf("Bio = %q, want %q", updated.Bio, "Updated Bio")
	}
	if updated.XHandle != "newhandle" {
		t.Errorf("XHandle = %q, want %q", updated.XHandle, "newhandle")
	}

	// GetUser - nonexistent
	notFound, err := db.GetUser(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("GetUser for nonexistent failed: %v", err)
	}
	if notFound != nil {
		t.Error("GetUser should return nil for nonexistent user")
	}
}

// --- Roadmap Repository Tests ---

func TestIntegration_RoadmapCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()
	roadmapID := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	meta := &model.RoadmapMeta{
		PK:          "ROADMAP#" + roadmapID,
		SK:          "META",
		RoadmapID:   roadmapID,
		Title:       "Test Roadmap",
		Description: "A test roadmap",
		UserID:      userID,
		Category:    "programming",
		Tags:        []string{"go", "testing"},
		IsPublic:    true,
		LikeCount:   0,
		CreatedAt:   now,
		UpdatedAt:   now,
		GSI1PK:      "USER#" + userID,
		GSI1SK:      now,
		GSI2PK:      "PUBLIC",
		GSI2SK:      now,
	}

	// PutRoadmap
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatalf("PutRoadmap failed: %v", err)
	}

	// GetRoadmapMeta
	got, err := db.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		t.Fatalf("GetRoadmapMeta failed: %v", err)
	}
	if got == nil {
		t.Fatal("GetRoadmapMeta returned nil")
	}
	if got.Title != "Test Roadmap" {
		t.Errorf("Title = %q, want %q", got.Title, "Test Roadmap")
	}
	if got.Category != "programming" {
		t.Errorf("Category = %q, want %q", got.Category, "programming")
	}

	// UpdateRoadmapMeta
	meta.Title = "Updated Title"
	meta.IsPublic = false
	meta.GSI2PK = ""
	meta.GSI2SK = ""
	if err := db.UpdateRoadmapMeta(ctx, meta); err != nil {
		t.Fatalf("UpdateRoadmapMeta failed: %v", err)
	}
	updated, err := db.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		t.Fatalf("GetRoadmapMeta after update failed: %v", err)
	}
	if updated.Title != "Updated Title" {
		t.Errorf("Title = %q, want %q", updated.Title, "Updated Title")
	}

	// GetRoadmapMeta - nonexistent
	notFound, err := db.GetRoadmapMeta(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("GetRoadmapMeta for nonexistent failed: %v", err)
	}
	if notFound != nil {
		t.Error("GetRoadmapMeta should return nil for nonexistent roadmap")
	}
}

func TestIntegration_RoadmapDetail(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()
	userID := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	// Create roadmap with nodes and edges
	meta := &model.RoadmapMeta{
		PK:        "ROADMAP#" + roadmapID,
		SK:        "META",
		RoadmapID: roadmapID,
		Title:     "Detail Test",
		UserID:    userID,
		Tags:      []string{},
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatalf("PutRoadmap failed: %v", err)
	}

	node1 := &model.Node{
		PK:     "ROADMAP#" + roadmapID,
		SK:     "NODE#n1",
		NodeID: "n1",
		Label:  "Node 1",
		PosX:   100,
		PosY:   200,
	}
	node2 := &model.Node{
		PK:     "ROADMAP#" + roadmapID,
		SK:     "NODE#n2",
		NodeID: "n2",
		Label:  "Node 2",
		PosX:   300,
		PosY:   400,
	}
	if err := db.PutNode(ctx, node1); err != nil {
		t.Fatalf("PutNode n1 failed: %v", err)
	}
	if err := db.PutNode(ctx, node2); err != nil {
		t.Fatalf("PutNode n2 failed: %v", err)
	}

	edge := &model.Edge{
		PK:           "ROADMAP#" + roadmapID,
		SK:           "EDGE#e1",
		EdgeID:       "e1",
		SourceNodeID: "n1",
		TargetNodeID: "n2",
	}
	if err := db.PutEdge(ctx, edge); err != nil {
		t.Fatalf("PutEdge failed: %v", err)
	}

	// GetRoadmapDetail
	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatalf("GetRoadmapDetail failed: %v", err)
	}
	if detail == nil {
		t.Fatal("GetRoadmapDetail returned nil")
	}
	if detail.Meta.Title != "Detail Test" {
		t.Errorf("Meta.Title = %q, want %q", detail.Meta.Title, "Detail Test")
	}
	if len(detail.Nodes) != 2 {
		t.Errorf("len(Nodes) = %d, want 2", len(detail.Nodes))
	}
	if len(detail.Edges) != 1 {
		t.Errorf("len(Edges) = %d, want 1", len(detail.Edges))
	}

	// GetRoadmapDetail - nonexistent
	notFound, err := db.GetRoadmapDetail(ctx, "nonexistent")
	if err != nil {
		t.Fatalf("GetRoadmapDetail for nonexistent failed: %v", err)
	}
	if notFound != nil {
		t.Error("GetRoadmapDetail should return nil for nonexistent roadmap")
	}
}

func TestIntegration_DeleteRoadmap(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()
	userID := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	// Create roadmap + nodes + edges
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "ToDelete", UserID: userID,
		Tags: []string{}, CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}
	if err := db.PutNode(ctx, &model.Node{PK: "ROADMAP#" + roadmapID, SK: "NODE#n1", NodeID: "n1", Label: "N"}); err != nil {
		t.Fatal(err)
	}
	if err := db.PutEdge(ctx, &model.Edge{PK: "ROADMAP#" + roadmapID, SK: "EDGE#e1", EdgeID: "e1", SourceNodeID: "n1", TargetNodeID: "n1"}); err != nil {
		t.Fatal(err)
	}

	// Delete
	if err := db.DeleteRoadmap(ctx, roadmapID); err != nil {
		t.Fatalf("DeleteRoadmap failed: %v", err)
	}

	// Verify deleted
	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatalf("GetRoadmapDetail after delete failed: %v", err)
	}
	if detail != nil {
		t.Error("Roadmap should be nil after delete")
	}
}

// --- Node Repository Tests ---

func TestIntegration_NodeCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()
	nodeID := uuid.New().String()

	node := &model.Node{
		PK:          "ROADMAP#" + roadmapID,
		SK:          "NODE#" + nodeID,
		NodeID:      nodeID,
		Label:       "Test Node",
		Description: "A test node",
		PosX:        150.5,
		PosY:        250.3,
		Color:       "#4c6ef5",
		Order:       1,
	}

	// PutNode
	if err := db.PutNode(ctx, node); err != nil {
		t.Fatalf("PutNode failed: %v", err)
	}

	// Verify via GetRoadmapDetail (no GetNode method exists)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "T", Tags: []string{},
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 1 {
		t.Fatalf("expected 1 node, got %d", len(detail.Nodes))
	}
	if detail.Nodes[0].Label != "Test Node" {
		t.Errorf("Label = %q, want %q", detail.Nodes[0].Label, "Test Node")
	}
	if detail.Nodes[0].Color != "#4c6ef5" {
		t.Errorf("Color = %q, want %q", detail.Nodes[0].Color, "#4c6ef5")
	}

	// DeleteNode
	if err := db.DeleteNode(ctx, roadmapID, nodeID); err != nil {
		t.Fatalf("DeleteNode failed: %v", err)
	}

	detail, err = db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 0 {
		t.Errorf("expected 0 nodes after delete, got %d", len(detail.Nodes))
	}
}

// --- Edge Repository Tests ---

func TestIntegration_EdgeCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()
	edgeID := uuid.New().String()

	// Create roadmap first
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "T", Tags: []string{},
		CreatedAt: time.Now().UTC().Format(time.RFC3339),
		UpdatedAt: time.Now().UTC().Format(time.RFC3339),
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	edge := &model.Edge{
		PK:           "ROADMAP#" + roadmapID,
		SK:           "EDGE#" + edgeID,
		EdgeID:       edgeID,
		SourceNodeID: "n1",
		TargetNodeID: "n2",
		Label:        "connects",
	}

	// PutEdge
	if err := db.PutEdge(ctx, edge); err != nil {
		t.Fatalf("PutEdge failed: %v", err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Edges) != 1 {
		t.Fatalf("expected 1 edge, got %d", len(detail.Edges))
	}
	if detail.Edges[0].SourceNodeID != "n1" {
		t.Errorf("SourceNodeID = %q, want %q", detail.Edges[0].SourceNodeID, "n1")
	}

	// DeleteEdge
	if err := db.DeleteEdge(ctx, roadmapID, edgeID); err != nil {
		t.Fatalf("DeleteEdge failed: %v", err)
	}

	detail, err = db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Edges) != 0 {
		t.Errorf("expected 0 edges after delete, got %d", len(detail.Edges))
	}
}

// --- Like Repository Tests ---

func TestIntegration_LikeCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()
	userID := uuid.New().String()
	now := time.Now().UTC().Format(time.RFC3339)

	// Create roadmap first (needed for like count)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Like Test", UserID: "owner",
		Tags: []string{}, LikeCount: 0, CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// IsLiked - not yet liked
	liked, err := db.IsLiked(ctx, roadmapID, userID)
	if err != nil {
		t.Fatal(err)
	}
	if liked {
		t.Error("should not be liked initially")
	}

	// LikeRoadmap
	if err := db.LikeRoadmap(ctx, roadmapID, userID); err != nil {
		t.Fatalf("LikeRoadmap failed: %v", err)
	}

	// IsLiked - now liked
	liked, err = db.IsLiked(ctx, roadmapID, userID)
	if err != nil {
		t.Fatal(err)
	}
	if !liked {
		t.Error("should be liked after LikeRoadmap")
	}

	// Verify likeCount incremented
	gotMeta, err := db.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if gotMeta.LikeCount != 1 {
		t.Errorf("LikeCount = %d, want 1", gotMeta.LikeCount)
	}

	// UnlikeRoadmap
	if err := db.UnlikeRoadmap(ctx, roadmapID, userID); err != nil {
		t.Fatalf("UnlikeRoadmap failed: %v", err)
	}

	liked, err = db.IsLiked(ctx, roadmapID, userID)
	if err != nil {
		t.Fatal(err)
	}
	if liked {
		t.Error("should not be liked after unlike")
	}

	// Verify likeCount decremented
	gotMeta, err = db.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if gotMeta.LikeCount != 0 {
		t.Errorf("LikeCount = %d, want 0", gotMeta.LikeCount)
	}
}

// --- Bookmark Repository Tests ---

func TestIntegration_BookmarkCRUD(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()
	roadmapID := uuid.New().String()

	// IsBookmarked - not yet
	bookmarked, err := db.IsBookmarked(ctx, userID, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if bookmarked {
		t.Error("should not be bookmarked initially")
	}

	// BookmarkRoadmap
	if err := db.BookmarkRoadmap(ctx, userID, roadmapID); err != nil {
		t.Fatalf("BookmarkRoadmap failed: %v", err)
	}

	// IsBookmarked - now bookmarked
	bookmarked, err = db.IsBookmarked(ctx, userID, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if !bookmarked {
		t.Error("should be bookmarked after BookmarkRoadmap")
	}

	// GetMyBookmarks
	bookmarks, cursor, err := db.GetMyBookmarks(ctx, userID, 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(bookmarks) != 1 {
		t.Errorf("expected 1 bookmark, got %d", len(bookmarks))
	}
	if cursor != "" {
		t.Errorf("expected empty cursor, got %q", cursor)
	}

	// UnbookmarkRoadmap
	if err := db.UnbookmarkRoadmap(ctx, userID, roadmapID); err != nil {
		t.Fatalf("UnbookmarkRoadmap failed: %v", err)
	}

	bookmarked, err = db.IsBookmarked(ctx, userID, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if bookmarked {
		t.Error("should not be bookmarked after unbookmark")
	}
}

// --- GetMyRoadmaps / ExploreRoadmaps Tests ---

func TestIntegration_GetMyRoadmaps(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Empty result
	roadmaps, cursor, err := db.GetMyRoadmaps(ctx, userID, 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 0 {
		t.Errorf("expected 0 roadmaps, got %d", len(roadmaps))
	}
	if cursor != "" {
		t.Errorf("expected empty cursor, got %q", cursor)
	}

	// Add some roadmaps
	for i := 0; i < 3; i++ {
		rid := uuid.New().String()
		ts := time.Now().Add(time.Duration(i) * time.Second).UTC().Format(time.RFC3339)
		m := &model.RoadmapMeta{
			PK: "ROADMAP#" + rid, SK: "META",
			RoadmapID: rid, Title: fmt.Sprintf("Roadmap %d", i),
			UserID: userID, Tags: []string{}, IsPublic: true,
			CreatedAt: ts, UpdatedAt: ts,
			GSI1PK: "USER#" + userID, GSI1SK: ts,
			GSI2PK: "PUBLIC", GSI2SK: ts,
		}
		if err := db.PutRoadmap(ctx, m); err != nil {
			t.Fatal(err)
		}
	}

	roadmaps, cursor, err = db.GetMyRoadmaps(ctx, userID, 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 3 {
		t.Errorf("expected 3 roadmaps, got %d", len(roadmaps))
	}
	if cursor != "" {
		t.Errorf("expected empty cursor (all returned), got %q", cursor)
	}
}

func TestIntegration_ExploreRoadmaps(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Create roadmaps with different categories
	categories := []string{"programming", "programming", "music"}
	for i, cat := range categories {
		rid := uuid.New().String()
		ts := time.Now().Add(time.Duration(i) * time.Second).UTC().Format(time.RFC3339)
		gsi2pk := "PUBLIC"
		m := &model.RoadmapMeta{
			PK: "ROADMAP#" + rid, SK: "META",
			RoadmapID: rid, Title: fmt.Sprintf("Roadmap %d", i),
			UserID: userID, Category: cat, Tags: []string{}, IsPublic: true,
			CreatedAt: ts, UpdatedAt: ts,
			GSI1PK: "USER#" + userID, GSI1SK: ts,
			GSI2PK: gsi2pk, GSI2SK: ts,
		}
		if err := db.PutRoadmap(ctx, m); err != nil {
			t.Fatal(err)
		}

		// Also create category-specific GSI2 entry
		catMeta := *m
		catMeta.GSI2PK = "CAT#" + cat
		if err := db.PutRoadmap(ctx, &catMeta); err != nil {
			t.Fatal(err)
		}
	}

	// All public roadmaps
	roadmaps, _, err := db.ExploreRoadmaps(ctx, "", 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 3 {
		t.Errorf("expected 3 public roadmaps, got %d", len(roadmaps))
	}

	// Filter by category
	roadmaps, _, err = db.ExploreRoadmaps(ctx, "programming", 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 2 {
		t.Errorf("expected 2 programming roadmaps, got %d", len(roadmaps))
	}

	roadmaps, _, err = db.ExploreRoadmaps(ctx, "music", 10, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 1 {
		t.Errorf("expected 1 music roadmap, got %d", len(roadmaps))
	}
}
