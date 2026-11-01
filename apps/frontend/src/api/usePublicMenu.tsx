import { useEffect, useState } from "react";
import type { MenuSection } from "../data/menu";
import { menuSections } from "../data/menu";
import { loadStoredMenu } from "../menuStore";
import { fetchMenu } from "./menu";
import { demoMode } from "./client";
import { useIntegrationCopy } from "../integrationCopy";
import { Button } from "../components/ui/controls";

export function usePublicMenu() {
  const demo = demoMode();
  const [sections, setSections] = useState<MenuSection[]>(() =>
    demo ? (loadStoredMenu() ?? menuSections) : [],
  );
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const retry = () => setRevision((value) => value + 1);
  useEffect(() => {
    const controller = new AbortController();
    if (demo) {
      const sync = () => setSections(loadStoredMenu() ?? menuSections);
      sync();
      window.addEventListener("picasso-menu-updated", sync);
      return () => window.removeEventListener("picasso-menu-updated", sync);
    }
    setLoading(true);
    setError(false);
    fetchMenu(controller.signal)
      .then((menu) => {
        if (!controller.signal.aborted) setSections(menu);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError(true);
          setSections([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    window.addEventListener("picasso-api-updated", retry);
    return () => {
      controller.abort();
      window.removeEventListener("picasso-api-updated", retry);
    };
  }, [demo, revision]);
  return { sections, loading, error, retry };
}

export function MenuStatus({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: boolean;
  retry: () => void;
}) {
  const labels = useIntegrationCopy();
  if (demoMode() || (!loading && !error)) return null;
  return (
    <div
      className="mx-auto max-w-7xl px-5 pt-28"
      role={error ? "alert" : "status"}
    >
      {loading ? labels.load : labels.unavailable}
      {error && (
        <Button className="ml-4" variant="secondary" onClick={retry}>
          {labels.retry}
        </Button>
      )}
    </div>
  );
}
