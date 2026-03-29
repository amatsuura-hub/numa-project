import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { roadmapApi } from "../api/roadmap";
import { useAuthStore } from "../stores/authStore";
import type { RoadmapDetail, Progress } from "../types";

export function useRoadmapDetail(id: string | undefined) {
  const { user } = useAuthStore();
  const [detail, setDetail] = useState<RoadmapDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);

  const loadRoadmap = useCallback(async (roadmapId: string) => {
    setIsLoading(true);
    setError(null);
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
  }, []);

  const loadProgress = useCallback(async (roadmapId: string) => {
    try {
      const { data } = await roadmapApi.getProgress(roadmapId);
      setProgress(data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (id) loadRoadmap(id);
  }, [id, loadRoadmap]);

  useEffect(() => {
    if (user && id && detail) loadProgress(id);
  }, [user, id, detail, loadProgress]);

  const handleToggleComplete = useCallback(
    async (nodeId: string) => {
      if (!user || !id) {
        toast.error("ログインが必要です");
        return;
      }

      const isCompleted = progress?.completedNodes.includes(nodeId) ?? false;

      try {
        if (isCompleted) {
          const { data } = await roadmapApi.uncompleteNode(id, nodeId);
          setProgress(data);
        } else {
          const { data } = await roadmapApi.completeNode(id, nodeId);
          setProgress(data);
        }
      } catch {
        toast.error("進捗の更新に失敗しました");
      }
    },
    [user, id, progress],
  );

  const retry = useCallback(() => {
    if (id) {
      setError(null);
      loadRoadmap(id);
    }
  }, [id, loadRoadmap]);

  return {
    detail,
    isLoading,
    error,
    progress,
    user,
    handleToggleComplete,
    retry,
  };
}
