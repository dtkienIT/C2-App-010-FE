import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ONBOARDING_CLOSE_MOBILE_MENU_EVENT,
  ONBOARDING_OPEN_MOBILE_MENU_EVENT,
} from "./onboardingStorage";
import { HOME_ROUTE, onboardingSteps, type OnboardingStep } from "./onboardingSteps";

type TargetBox = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type TooltipPosition = {
  left: number;
  placement: "center" | "top" | "bottom";
  top: number;
};

const TARGET_WAIT_MS = 1200;
const TARGET_POLL_MS = 100;

function isVisibleElement(element: Element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
}

function findVisibleTarget(selector?: string) {
  if (!selector || typeof document === "undefined") return null;
  return Array.from(document.querySelectorAll(selector)).find(isVisibleElement) ?? null;
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches;
}

function getTargetBox(element: Element | null): TargetBox | null {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  const padding = 10;
  return {
    height: Math.min(window.innerHeight - 24, rect.height + padding * 2),
    left: Math.max(12, rect.left - padding),
    top: Math.max(12, rect.top - padding),
    width: Math.min(window.innerWidth - 24, rect.width + padding * 2),
  };
}

function getTooltipPosition(targetBox: TargetBox | null, preferredPlacement?: OnboardingStep["placement"]): TooltipPosition {
  const tooltipWidth = Math.min(420, window.innerWidth - 32);

  if (!targetBox || preferredPlacement === "center") {
    return {
      left: Math.max(16, (window.innerWidth - tooltipWidth) / 2),
      placement: "center",
      top: Math.max(72, window.innerHeight * 0.5 - 190),
    };
  }

  const belowTop = targetBox.top + targetBox.height + 18;
  const aboveTop = targetBox.top - 290;
  const fitsBelow = belowTop + 280 < window.innerHeight;
  const placement = preferredPlacement === "top" || (!fitsBelow && preferredPlacement !== "bottom") ? "top" : "bottom";
  const top = placement === "bottom" ? belowTop : Math.max(16, aboveTop);

  return {
    left: Math.min(Math.max(16, targetBox.left + targetBox.width / 2 - tooltipWidth / 2), window.innerWidth - tooltipWidth - 16),
    placement,
    top,
  };
}

function waitForTarget(selector: string, signal: AbortSignal) {
  return new Promise<Element | null>((resolve) => {
    const startedAt = Date.now();

    const check = () => {
      if (signal.aborted) {
        resolve(null);
        return;
      }

      const target = findVisibleTarget(selector);
      if (target) {
        resolve(target);
        return;
      }

      if (Date.now() - startedAt >= TARGET_WAIT_MS) {
        resolve(null);
        return;
      }

      window.setTimeout(check, TARGET_POLL_MS);
    };

    check();
  });
}

export function GuidedTour({
  isOpen,
  onClose,
  runId,
}: {
  isOpen: boolean;
  onClose: (completed: boolean) => void;
  runId: number;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBox, setTargetBox] = useState<TargetBox | null>(null);
  const [isPreparingStep, setIsPreparingStep] = useState(false);
  const currentStep = onboardingSteps[stepIndex];
  const isLastStep = stepIndex === onboardingSteps.length - 1;
  const isMobile = isMobileViewport();
  const activeTarget = isMobile && currentStep?.mobileTarget ? currentStep.mobileTarget : currentStep?.target;

  function moveToStep(nextIndex: number) {
    if (nextIndex >= onboardingSteps.length) {
      onClose(true);
      return;
    }
    if (nextIndex < 0) return;
    setStepIndex(nextIndex);
  }

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
  }, [isOpen, runId]);

  useEffect(() => {
    if (!isOpen || !currentStep) return undefined;

    const controller = new AbortController();

    async function prepareStep() {
      setIsPreparingStep(true);
      setTargetBox(null);

      const nextRoute = currentStep.route ?? HOME_ROUTE;
      if (location.pathname !== nextRoute) {
        navigate(nextRoute);
        return;
      }

      if (isMobile) {
        if (currentStep.beforeStep === "openMobileMenu") {
          window.dispatchEvent(new CustomEvent(ONBOARDING_OPEN_MOBILE_MENU_EVENT));
        } else {
          window.dispatchEvent(new CustomEvent(ONBOARDING_CLOSE_MOBILE_MENU_EVENT));
        }
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }

      if (!activeTarget) {
        setIsPreparingStep(false);
        return;
      }

      const target = await waitForTarget(activeTarget, controller.signal);
      if (controller.signal.aborted) return;

      if (!target) {
        setIsPreparingStep(false);
        moveToStep(stepIndex + 1);
        return;
      }

      target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
      window.setTimeout(() => {
        if (controller.signal.aborted) return;
        setTargetBox(getTargetBox(target));
        setIsPreparingStep(false);
      }, 220);
    }

    void prepareStep();

    return () => {
      controller.abort();
    };
  }, [activeTarget, currentStep, isMobile, isOpen, location.pathname, navigate, stepIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const refreshTargetBox = () => {
      const target = findVisibleTarget(activeTarget);
      setTargetBox(getTargetBox(target));
    };

    window.addEventListener("resize", refreshTargetBox);
    window.addEventListener("scroll", refreshTargetBox, true);

    return () => {
      window.removeEventListener("resize", refreshTargetBox);
      window.removeEventListener("scroll", refreshTargetBox, true);
    };
  }, [activeTarget, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose(false);
      }
      if (event.key === "ArrowRight") {
        moveToStep(stepIndex + 1);
      }
      if (event.key === "ArrowLeft") {
        moveToStep(stepIndex - 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, stepIndex]);

  const tooltipPosition = useMemo(
    () => getTooltipPosition(targetBox, currentStep?.placement),
    [currentStep?.placement, targetBox],
  );

  if (!isOpen || typeof document === "undefined" || !currentStep || isPreparingStep) {
    return null;
  }

  const overlay = (
    <div className="fixed inset-0 z-[100002] pointer-events-auto">
      {targetBox ? (
        <>
          <div className="absolute left-0 top-0 bg-overlay/72 backdrop-blur-[3px]" style={{ height: targetBox.top, width: "100%" }} />
          <div
            className="absolute left-0 bg-overlay/72 backdrop-blur-[3px]"
            style={{ height: targetBox.height, top: targetBox.top, width: targetBox.left }}
          />
          <div
            className="absolute bg-overlay/72 backdrop-blur-[3px]"
            style={{
              height: targetBox.height,
              left: targetBox.left + targetBox.width,
              top: targetBox.top,
              width: `calc(100% - ${targetBox.left + targetBox.width}px)`,
            }}
          />
          <div
            className="absolute left-0 bg-overlay/72 backdrop-blur-[3px]"
            style={{
              height: `calc(100% - ${targetBox.top + targetBox.height}px)`,
              top: targetBox.top + targetBox.height,
              width: "100%",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-overlay/72 backdrop-blur-[3px]" />
      )}

      {targetBox ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[1.35rem] border-2 border-primary bg-transparent shadow-[0_0_0_6px_rgba(139,92,246,0.20),0_18px_45px_rgba(15,23,42,0.22)] transition-all duration-200"
          style={{
            height: targetBox.height,
            left: targetBox.left,
            top: targetBox.top,
            width: targetBox.width,
          }}
        />
      ) : null}

      <section
        aria-live="polite"
        className="absolute w-[min(420px,calc(100vw-32px))] rounded-[1.35rem] border border-border/80 bg-card p-5 text-card-foreground shadow-[0_26px_80px_rgba(2,6,23,0.34)]"
        role="dialog"
        style={{
          left: tooltipPosition.left,
          top: tooltipPosition.top,
        }}
      >
        {targetBox && tooltipPosition.placement !== "center" ? (
          <span
            className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-border/80 bg-card ${
              tooltipPosition.placement === "bottom" ? "-top-2 border-l border-t" : "-bottom-2 border-b border-r"
            }`}
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">Buddy Tutorial</p>
              <h2 className="mt-1 text-xl font-black leading-tight text-foreground">{currentStep.title}</h2>
            </div>
          </div>
          <button
            aria-label="Đóng hướng dẫn"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
            onClick={() => onClose(false)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm font-semibold leading-6 text-muted-foreground">{currentStep.message}</p>

        {currentStep.mission ? (
          <div className="mt-4 rounded-[1rem] border border-emerald-300/60 bg-emerald-100/70 p-4 text-emerald-900 dark:border-emerald-400/25 dark:bg-emerald-500/12 dark:text-emerald-100">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="shrink-0" size={20} />
              <p className="font-black">{currentStep.mission}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {onboardingSteps.map((step, index) => (
              <span
                aria-label={`Bước ${index + 1}: ${step.title}`}
                className={`h-2 rounded-full transition-all ${index === stepIndex ? "w-6 bg-primary" : "w-2 bg-muted"}`}
                key={step.id}
              />
            ))}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button
              aria-label="Bước trước"
              className="secondary-button h-11 w-full justify-center rounded-xl px-0 py-0 text-sm disabled:opacity-45 sm:w-11"
              disabled={stepIndex === 0}
              onClick={() => moveToStep(stepIndex - 1)}
              type="button"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              aria-label={isLastStep ? "Hoàn thành hướng dẫn" : "Bước tiếp theo"}
              className="primary-button h-11 w-full justify-center rounded-xl px-0 py-0 text-sm sm:w-11"
              onClick={() => moveToStep(stepIndex + 1)}
              type="button"
            >
              {isLastStep ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );

  return createPortal(overlay, document.body);
}
