package handler

import (
	"context"
	"fmt"
	"html"
)

// HandleOGP returns an HTML string with OGP meta tags for bot crawlers.
func (h *Handler) HandleOGP(ctx context.Context, roadmapID, siteURL string) (string, error) {
	meta, err := h.repo.GetRoadmapMeta(ctx, roadmapID)
	if err != nil {
		return "", NewAPIError(ErrInternal, "Failed to get roadmap")
	}
	if meta == nil {
		return "", NewAPIError(ErrNotFound, "Roadmap not found")
	}

	title := html.EscapeString(meta.Title)
	description := html.EscapeString(meta.Description)
	if description == "" {
		description = html.EscapeString(meta.Title + " のロードマップ | Numa")
	}
	pageURL := fmt.Sprintf("%s/roadmaps/%s", siteURL, roadmapID)

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>%s | Numa</title>
<meta name="description" content="%s">
<meta property="og:title" content="%s | Numa">
<meta property="og:description" content="%s">
<meta property="og:type" content="article">
<meta property="og:url" content="%s">
<meta property="og:site_name" content="Numa">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="%s | Numa">
<meta name="twitter:description" content="%s">
<meta http-equiv="refresh" content="0;url=%s">
</head>
<body>
<p>Redirecting to <a href="%s">%s</a>...</p>
</body>
</html>`, title, description, title, description, pageURL, title, description, pageURL, pageURL, title)

	return htmlContent, nil
}
