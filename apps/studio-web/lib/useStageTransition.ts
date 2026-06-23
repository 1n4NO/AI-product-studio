"use client";

import { useEffect, useRef, useState } from "react";
import type { Stage } from "@/components/organisms/StageBar";

type TransitionState = "idle" | "exiting" | "entering";

interface StageTransition {
  /** The stage content that should currently be rendered */
  displayedStage: Stage;
  /** CSS class to apply to the stage container */
  transitionClass: string;
}

/**
 * Drives a two-phase exit→enter transition whenever `stage` changes.
 *
 * Usage:
 *   const { displayedStage, transitionClass } = useStageTransition(currentStage);
 *   // render content for `displayedStage`, apply `transitionClass` to wrapper
 */
export function useStageTransition(stage: Stage, exitDurationMs = 150): StageTransition {
  const [displayedStage, setDisplayedStage] = useState<Stage>(stage);
  const [state, setState] = useState<TransitionState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<Stage>(stage);

  useEffect(() => {
    if (stage === displayedStage) return;

    pendingRef.current = stage;

    // Phase 1: exit current content
    setState("exiting");
    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      // Phase 2: swap content and enter
      setDisplayedStage(pendingRef.current);
      setState("entering");

      // Reset to idle after entrance animation completes
      timerRef.current = setTimeout(() => setState("idle"), 240);
    }, exitDurationMs);

    return () => clearTimeout(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  const transitionClass =
    state === "exiting"  ? "ps-stage-exit"  :
    state === "entering" ? "ps-stage-enter"  :
    "";

  return { displayedStage, transitionClass };
}
