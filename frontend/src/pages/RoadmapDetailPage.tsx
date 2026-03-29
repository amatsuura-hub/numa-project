import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import { useAuthStore } from "../stores/authStore";
import RoadmapNode from "../components/editor/RoadmapNode";
import LikeButton from "../components/common/LikeButton";
import BookmarkButton from "../components/common/BookmarkButton";
import ShareButton from "../components/common/ShareButton";
import type { RoadmapDetail } from "../types";
import { CATEGORIES, type Category } from "../types";
import PageHead from "../components/common/PageHead";

function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNode }), []);

  useEffect(() => {
    if (!id) return;
    loadRoadmap(id);
  }, [id]);

  const loadRoadmap = async (roadmapId: string) => {
    try {
      const { data } = await roadmapApi.get(roadmapId);
      setDetail(data);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg || "ロードマップの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-numa-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">{error || "ロードマップが見つかりません"}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          {error && id && (
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                loadRoadmap(id);
              }}
              className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
            >
              再試行
            </button>
          )}
          <Link
            to="/explore"
            className="text-sm text-numa-600 hover:underline"
          >
            ロードマップを探す
          </Link>
        </div>
      </div>
    );
  }

  const flowNodes: Node[] = detail.nodes.map((n) => ({
    id: n.nodeId,
    position: { x: n.posX, y: n.posY },
    data: {
      label: n.label,
      description: n.description || "",
      color: n.color || "#16a34a",
      url: n.url || "",
    },
    type: "roadmapNode",
    draggable: false,
    selectable: false,
  }));

  const flowEdges: Edge[] = detail.edges.map((e) => ({
    id: e.edgeId,
    source: e.sourceNodeId,
    target: e.targetNodeId,
    label: e.label || "",
    type: "smoothstep",
    animated: true,
  }));

  const isOwner = user?.userId === detail.meta.userId;

  return (
    <div>
      <PageHead
        title={detail.meta.title}
        description={detail.meta.description || `${detail.meta.title} のロードマップ`}
        ogType="article"
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold sm:text-2xl">{detail.meta.title}</h1>
          {detail.meta.description && (
            <p className="mt-1 text-sm text-gray-500 sm:text-base">{detail.meta.description}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-400 sm:gap-3">
            {detail.meta.category && (
              <span className="rounded-full bg-numa-50 px-2 py-0.5 text-xs text-numa-600">
                {CATEGORIES[detail.meta.category as Category] ||
                  detail.meta.category}
              </span>
            )}
            <span>
              {new Date(detail.meta.createdAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <LikeButton
            roadmapId={detail.meta.roadmapId}
            initialLiked={detail.isLiked}
            initialCount={detail.meta.likeCount}
          />
          <BookmarkButton
            roadmapId={detail.meta.roadmapId}
            initialBookmarked={detail.isBookmarked}
          />
          <ShareButton
            title={detail.meta.title}
            roadmapId={detail.meta.roadmapId}
          />
          {isOwner && (
            <Link
              to={`/roadmaps/${id}/edit`}
              className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
            >
              編集
            </Link>
          )}
        </div>
      </div>

      <div className="h-[60vh] w-full rounded-lg border border-numa-200 sm:h-[calc(100vh-250px)]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => (n.data?.color as string) || "#16a34a"}
            className="hidden sm:block"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default RoadmapDetailPage;
