package repository

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/numa-project/backend/internal/model"
)

// --- Cursor Pagination Edge Cases (Integration) ---

func TestIntegration_Pagination_EmptyResult(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Query with no data
	roadmaps, cursor, err := db.GetMyRoadmaps(ctx, userID, 10, "")
	if err != nil {
		t.Fatalf("GetMyRoadmaps failed: %v", err)
	}
	if len(roadmaps) != 0 {
		t.Errorf("expected 0 roadmaps, got %d", len(roadmaps))
	}
	if cursor != "" {
		t.Errorf("expected empty cursor for empty result, got %q", cursor)
	}
}

func TestIntegration_Pagination_ExactPageSize(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Create exactly 5 roadmaps, query with limit 5
	for i := 0; i < 5; i++ {
		rid := uuid.New().String()
		ts := time.Now().Add(time.Duration(i) * time.Second).UTC().Format(time.RFC3339)
		m := &model.RoadmapMeta{
			PK: "ROADMAP#" + rid, SK: "META",
			RoadmapID: rid, Title: fmt.Sprintf("R%d", i),
			UserID: userID, Tags: []string{},
			CreatedAt: ts, UpdatedAt: ts,
			GSI1PK: "USER#" + userID, GSI1SK: ts,
		}
		if err := db.PutRoadmap(ctx, m); err != nil {
			t.Fatal(err)
		}
	}

	roadmaps, _, err := db.GetMyRoadmaps(ctx, userID, 5, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 5 {
		t.Errorf("expected 5 roadmaps, got %d", len(roadmaps))
	}
}

func TestIntegration_Pagination_MultiPage(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Create 7 roadmaps, paginate with limit 3
	for i := 0; i < 7; i++ {
		rid := uuid.New().String()
		ts := time.Now().Add(time.Duration(i) * time.Second).UTC().Format(time.RFC3339)
		m := &model.RoadmapMeta{
			PK: "ROADMAP#" + rid, SK: "META",
			RoadmapID: rid, Title: fmt.Sprintf("R%d", i),
			UserID: userID, Tags: []string{},
			CreatedAt: ts, UpdatedAt: ts,
			GSI1PK: "USER#" + userID, GSI1SK: ts,
		}
		if err := db.PutRoadmap(ctx, m); err != nil {
			t.Fatal(err)
		}
	}

	var allRoadmaps []model.RoadmapMeta
	cursor := ""

	// Page 1
	roadmaps, cursor, err := db.GetMyRoadmaps(ctx, userID, 3, cursor)
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 3 {
		t.Fatalf("page 1: expected 3, got %d", len(roadmaps))
	}
	if cursor == "" {
		t.Fatal("page 1: expected non-empty cursor")
	}
	allRoadmaps = append(allRoadmaps, roadmaps...)

	// Page 2
	roadmaps, cursor, err = db.GetMyRoadmaps(ctx, userID, 3, cursor)
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 3 {
		t.Fatalf("page 2: expected 3, got %d", len(roadmaps))
	}
	if cursor == "" {
		t.Fatal("page 2: expected non-empty cursor")
	}
	allRoadmaps = append(allRoadmaps, roadmaps...)

	// Page 3 (last page)
	roadmaps, cursor, err = db.GetMyRoadmaps(ctx, userID, 3, cursor)
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 1 {
		t.Fatalf("page 3: expected 1, got %d", len(roadmaps))
	}
	if cursor != "" {
		t.Errorf("last page: expected empty cursor, got %q", cursor)
	}
	allRoadmaps = append(allRoadmaps, roadmaps...)

	// Verify we got all 7
	if len(allRoadmaps) != 7 {
		t.Errorf("total roadmaps = %d, want 7", len(allRoadmaps))
	}

	// Verify no duplicates
	seen := make(map[string]bool)
	for _, r := range allRoadmaps {
		if seen[r.RoadmapID] {
			t.Errorf("duplicate roadmap: %s", r.RoadmapID)
		}
		seen[r.RoadmapID] = true
	}
}

func TestIntegration_Pagination_InvalidCursor(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	_, _, err := db.GetMyRoadmaps(ctx, userID, 10, "invalid-cursor!!!")
	if err == nil {
		t.Error("expected error for invalid cursor")
	}
}

func TestIntegration_Pagination_Bookmarks(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	userID := uuid.New().String()

	// Create 5 bookmarks
	for i := 0; i < 5; i++ {
		rid := uuid.New().String()
		// Small delay to ensure different SK
		time.Sleep(time.Millisecond)
		if err := db.BookmarkRoadmap(ctx, userID, rid); err != nil {
			t.Fatal(err)
		}
	}

	// Page 1
	bookmarks, cursor, err := db.GetMyBookmarks(ctx, userID, 2, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(bookmarks) != 2 {
		t.Fatalf("page 1: expected 2 bookmarks, got %d", len(bookmarks))
	}
	if cursor == "" {
		t.Fatal("page 1: expected non-empty cursor")
	}

	// Page 2
	bookmarks2, cursor2, err := db.GetMyBookmarks(ctx, userID, 2, cursor)
	if err != nil {
		t.Fatal(err)
	}
	if len(bookmarks2) != 2 {
		t.Fatalf("page 2: expected 2 bookmarks, got %d", len(bookmarks2))
	}
	if cursor2 == "" {
		t.Fatal("page 2: expected non-empty cursor")
	}

	// Page 3
	bookmarks3, cursor3, err := db.GetMyBookmarks(ctx, userID, 2, cursor2)
	if err != nil {
		t.Fatal(err)
	}
	if len(bookmarks3) != 1 {
		t.Fatalf("page 3: expected 1 bookmark, got %d", len(bookmarks3))
	}
	if cursor3 != "" {
		t.Errorf("last page: expected empty cursor, got %q", cursor3)
	}
}

func TestIntegration_Pagination_Explore(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	// Create 4 public roadmaps
	for i := 0; i < 4; i++ {
		rid := uuid.New().String()
		ts := time.Now().Add(time.Duration(i) * time.Second).UTC().Format(time.RFC3339)
		m := &model.RoadmapMeta{
			PK: "ROADMAP#" + rid, SK: "META",
			RoadmapID: rid, Title: fmt.Sprintf("Public %d", i),
			UserID: "u1", Tags: []string{}, IsPublic: true,
			CreatedAt: ts, UpdatedAt: ts,
			GSI2PK: "PUBLIC", GSI2SK: ts,
		}
		if err := db.PutRoadmap(ctx, m); err != nil {
			t.Fatal(err)
		}
	}

	// Page through with limit 2
	roadmaps, cursor, err := db.ExploreRoadmaps(ctx, "", 2, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps) != 2 {
		t.Fatalf("page 1: expected 2, got %d", len(roadmaps))
	}
	if cursor == "" {
		t.Fatal("expected non-empty cursor")
	}

	roadmaps2, cursor2, err := db.ExploreRoadmaps(ctx, "", 2, cursor)
	if err != nil {
		t.Fatal(err)
	}
	if len(roadmaps2) != 2 {
		t.Fatalf("page 2: expected 2, got %d", len(roadmaps2))
	}
	if cursor2 != "" {
		t.Errorf("expected empty cursor on last page, got %q", cursor2)
	}
}

// --- Batch Operations Tests ---

func TestIntegration_BatchPutNodes_Small(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()

	// Create roadmap
	now := time.Now().UTC().Format(time.RFC3339)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Batch Test", Tags: []string{},
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// Batch put 10 nodes
	nodes := make([]model.Node, 10)
	for i := range nodes {
		nodes[i] = model.Node{
			PK:     "ROADMAP#" + roadmapID,
			SK:     fmt.Sprintf("NODE#n%d", i),
			NodeID: fmt.Sprintf("n%d", i),
			Label:  fmt.Sprintf("Node %d", i),
			PosX:   float64(i * 100),
			PosY:   float64(i * 50),
			Order:  i,
		}
	}

	if err := db.BatchPutNodes(ctx, nodes); err != nil {
		t.Fatalf("BatchPutNodes failed: %v", err)
	}

	// Verify all nodes exist
	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 10 {
		t.Errorf("expected 10 nodes, got %d", len(detail.Nodes))
	}
}

func TestIntegration_BatchPutNodes_ExactChunkBoundary(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()

	now := time.Now().UTC().Format(time.RFC3339)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Boundary Test", Tags: []string{},
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// Exactly 25 nodes (one full chunk)
	nodes := make([]model.Node, 25)
	for i := range nodes {
		nodes[i] = model.Node{
			PK:     "ROADMAP#" + roadmapID,
			SK:     fmt.Sprintf("NODE#n%d", i),
			NodeID: fmt.Sprintf("n%d", i),
			Label:  fmt.Sprintf("Node %d", i),
			PosX:   float64(i * 10),
			PosY:   float64(i * 10),
			Order:  i,
		}
	}

	if err := db.BatchPutNodes(ctx, nodes); err != nil {
		t.Fatalf("BatchPutNodes (25) failed: %v", err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 25 {
		t.Errorf("expected 25 nodes, got %d", len(detail.Nodes))
	}
}

func TestIntegration_BatchPutNodes_MultiChunk(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()

	now := time.Now().UTC().Format(time.RFC3339)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Multi-chunk Test", Tags: []string{},
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// 26 nodes — crosses chunk boundary (25 + 1)
	nodes := make([]model.Node, 26)
	for i := range nodes {
		nodes[i] = model.Node{
			PK:     "ROADMAP#" + roadmapID,
			SK:     fmt.Sprintf("NODE#n%d", i),
			NodeID: fmt.Sprintf("n%d", i),
			Label:  fmt.Sprintf("Node %d", i),
			PosX:   float64(i),
			PosY:   float64(i),
			Order:  i,
		}
	}

	if err := db.BatchPutNodes(ctx, nodes); err != nil {
		t.Fatalf("BatchPutNodes (26) failed: %v", err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 26 {
		t.Errorf("expected 26 nodes, got %d", len(detail.Nodes))
	}
}

func TestIntegration_BatchPutNodes_MaxSize(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()

	now := time.Now().UTC().Format(time.RFC3339)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Max Batch Test", Tags: []string{},
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// 100 nodes — maximum allowed by handler validation
	nodes := make([]model.Node, 100)
	for i := range nodes {
		nodes[i] = model.Node{
			PK:          "ROADMAP#" + roadmapID,
			SK:          fmt.Sprintf("NODE#n%03d", i),
			NodeID:      fmt.Sprintf("n%03d", i),
			Label:       fmt.Sprintf("Node %d", i),
			Description: "A test node for batch operation",
			PosX:        float64(i % 10 * 100),
			PosY:        float64(i / 10 * 100),
			Color:       "#4c6ef5",
			Order:       i,
		}
	}

	if err := db.BatchPutNodes(ctx, nodes); err != nil {
		t.Fatalf("BatchPutNodes (100) failed: %v", err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 100 {
		t.Errorf("expected 100 nodes, got %d", len(detail.Nodes))
	}

	// Verify data integrity — check first and last nodes
	nodeMap := make(map[string]model.Node)
	for _, n := range detail.Nodes {
		nodeMap[n.NodeID] = n
	}
	if n, ok := nodeMap["n000"]; !ok || n.Label != "Node 0" {
		t.Error("first node missing or incorrect")
	}
	if n, ok := nodeMap["n099"]; !ok || n.Label != "Node 99" {
		t.Error("last node missing or incorrect")
	}
}

func TestIntegration_BatchPutNodes_Empty(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	// Batch put 0 nodes should not error
	err := db.BatchPutNodes(ctx, []model.Node{})
	if err != nil {
		t.Errorf("BatchPutNodes with empty slice should not error: %v", err)
	}
}

func TestIntegration_BatchPutNodes_Overwrite(t *testing.T) {
	db := setupTestDB(t)
	ctx := context.Background()

	roadmapID := uuid.New().String()

	now := time.Now().UTC().Format(time.RFC3339)
	meta := &model.RoadmapMeta{
		PK: "ROADMAP#" + roadmapID, SK: "META",
		RoadmapID: roadmapID, Title: "Overwrite Test", Tags: []string{},
		CreatedAt: now, UpdatedAt: now,
	}
	if err := db.PutRoadmap(ctx, meta); err != nil {
		t.Fatal(err)
	}

	// Create initial node
	initial := model.Node{
		PK: "ROADMAP#" + roadmapID, SK: "NODE#n1",
		NodeID: "n1", Label: "Original", PosX: 0, PosY: 0,
	}
	if err := db.PutNode(ctx, &initial); err != nil {
		t.Fatal(err)
	}

	// Batch update with new label and position
	updated := []model.Node{
		{
			PK: "ROADMAP#" + roadmapID, SK: "NODE#n1",
			NodeID: "n1", Label: "Updated", PosX: 500, PosY: 300,
		},
	}
	if err := db.BatchPutNodes(ctx, updated); err != nil {
		t.Fatal(err)
	}

	detail, err := db.GetRoadmapDetail(ctx, roadmapID)
	if err != nil {
		t.Fatal(err)
	}
	if len(detail.Nodes) != 1 {
		t.Fatalf("expected 1 node, got %d", len(detail.Nodes))
	}
	if detail.Nodes[0].Label != "Updated" {
		t.Errorf("Label = %q, want %q", detail.Nodes[0].Label, "Updated")
	}
	if detail.Nodes[0].PosX != 500 {
		t.Errorf("PosX = %f, want 500", detail.Nodes[0].PosX)
	}
}
