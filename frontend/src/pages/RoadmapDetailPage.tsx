import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "@xyflow/react";
import { DEFAULT_NODE_COLOR } from "../constants/depth";
import "@xyflow/react/dist/style.css";
import RoadmapNode from "../components/editor/RoadmapNode";
import LikeButton from "../components/common/LikeButton";
import BookmarkButton from "../components/common/BookmarkButton";
import ShareButton from "../components/common/ShareButton";
import LoadingSpinner from "../components/common/LoadingSpinner";
import PageHead from "../components/common/PageHead";
import { useRoadmapDetail } from "../hooks/useRoadmapDetail";
import type { Progress } from "../types";
import { CATEGORIES, NUMA_LEVELS, type Category } from "../types";

function ProgressDashboard({
  progress,
  totalNodes,
}: {
  progress: Progress;
  totalNodes: number;
}) {
  const completedCount = progress.completedNodes.length;
  const rate = totalNodes > 0 ? Math.round((completedCount / totalNodes) * 100) : 0;
  const levelInfo = NUMA_LEVELS[progress.numaLevel] || NUMA_LEVELS[0];

  return (
    <div className="mt-6 rounded-lg border border-numa-200 bg-white p-4 sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-gray-900">進捗状況</h3>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-numa-50 p-3 text-center">
          <div className="text-2xl font-bold text-numa-700">
            {completedCount}/{totalNodes}
          </div>
          <div className="text-xs text-gray-500">完了ノード</div>
        </div>
        <div className="rounded-lg bg-numa-50 p-3 text-center">
          <div className="text-2xl font-bold text-numa-700">{rate}%</div>
          <div className="text-xs text-gray-500">達成率</div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ backgroundColor: levelInfo.color + "33" }}>
          <div className="text-2xl font-bold" style={{ color: levelInfo.color }}>
            Lv.{progress.numaLevel}
          </div>
          <div className="text-xs text-gray-500">{levelInfo.name}</div>
        </div>
      </div>

      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${rate}%`, backgroundColor: levelInfo.color }}
        />
      </div>

      <div className="flex justify-between">
        {NUMA_LEVELS.map((l) => (
          <div
            key={l.level}
            className={`text-xs ${progress.numaLevel >= l.level ? "font-bold" : "text-gray-300"}`}
            style={{ color: progress.numaLevel >= l.level ? l.color : undefined }}
          >
            Lv.{l.level}
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, isLoading, error, progress, user, handleToggleComplete, retry } =
    useRoadmapDetail(id);

  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNode }), []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !detail) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">{error || "ロードマップが見つかりません"}</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          {error && id && (
            <button
              onClick={retry}
              className="rounded-md bg-numa-600 px-4 py-2 text-sm font-medium text-white hover:bg-numa-700"
            >
              再試行
            </button>
          )}
          <Link to="/explore" className="text-sm text-numa-600 hover:underline">
            ロードマップを探す
          </Link>
        </div>
      </div>
    );
  }

  const completedSet = new Set(progress?.completedNodes ?? []);

  const flowNodes: Node[] = detail.nodes.map((n) => ({
    id: n.nodeId,
    position: { x: n.posX, y: n.posY },
    data: {
      label: n.label,
      description: n.description || "",
      color: n.color || DEFAULT_NODE_COLOR,
      url: n.url || "",
      isCompleted: completedSet.has(n.nodeId),
      onToggleComplete: user ? handleToggleComplete : undefined,
      nodeId: n.nodeId,
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
    style: { strokeWidth: 2 },
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
                {CATEGORIES[detail.meta.category as Category] || detail.meta.category}
              </span>
            )}
            <span>{new Date(detail.meta.createdAt).toLocaleDateString("ja-JP")}</span>
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
          <ShareButton title={detail.meta.title} roadmapId={detail.meta.roadmapId} />
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

      {user && (
        <p className="mb-2 text-xs text-gray-400">
          ノードの丸ボタンをクリックして進捗を記録できます
        </p>
      )}

      <div className="h-[70vh] w-full rounded-lg border border-numa-200 sm:h-[calc(100vh-220px)]" style={{ minHeight: 700 }}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={(n) => (n.data?.color as string) || DEFAULT_NODE_COLOR}
            className="hidden sm:block"
          />
        </ReactFlow>
      </div>

      {user && progress && progress.completedNodes.length > 0 && (
        <ProgressDashboard progress={progress} totalNodes={detail.nodes.length} />
      )}
    </div>
  );
}

export default RoadmapDetailPage;
