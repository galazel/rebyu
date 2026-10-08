import { cloneElement } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "@/components/icons";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const BUTTON_VARIANTS = {
  feather: "",
  mask: "rb-btn-mask",
  macaw: "rb-btn-macaw",
  beetle: "rb-btn-beetle",
  fox: "rb-btn-fox",
  cardinal: "rb-btn-cardinal",
  ghost: "rb-btn-ghost",
  snow: "rb-btn-snow",
};

const BUTTON_SIZES = {
  sm: "rb-btn-sm",
  md: "",
  lg: "rb-btn-lg",
};

export function TactileButton({
  variant = "feather",
  size = "md",
  asChild = false,
  className,
  ...props
}) {
  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      className={cn("rb-btn", BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  );
}

export function BackButton({
  variant = "ghost",
  size = "md",
  asChild = false,
  label,
  className,
  children,
  ...props
}) {
  const icon = <ArrowLeft className="size-5" aria-hidden="true" />;

  return (
    <TactileButton
      variant={variant}
      size={size}
      asChild={asChild}
      aria-label={label}
      title={label}
      className={cn("rb-btn-icon", className)}
      {...props}
    >
      {asChild ? cloneElement(children, undefined, icon) : icon}
    </TactileButton>
  );
}

export function RebyuCard({ raised = false, press = false, className, ...props }) {
  return (
    <div
      className={cn(
        "rb-card",
        raised && "rb-card-raised",
        press && "rb-card-press",
        className,
      )}
      {...props}
    />
  );
}

export function Chip({ tone = "neutral", className, children, ...props }) {
  const TONES = {
    neutral: "",
    feather: "bg-rb-feather-wash text-rb-feather-ink",
    macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
    bee: "bg-rb-bee-wash text-rb-bee-ink",
    fox: "bg-rb-fox-wash text-rb-fox-lip",
    beetle: "bg-rb-beetle-wash text-rb-beetle-lip",
    cardinal: "bg-rb-cardinal-wash text-rb-cardinal-lip",
    leaf: "bg-rb-leaf-wash text-rb-leaf",
  };

  return (
    <span className={cn("rb-chip", TONES[tone], className)} {...props}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, label, tone = "mask", className }) {
  const clamped = Math.max(0, Math.min(100, value));
  const TONES = {
    mask: "bg-rb-mask",
    feather: "bg-rb-feather",
    macaw: "bg-rb-macaw",
    fox: "bg-rb-fox",
    bee: "bg-rb-bee",
    beetle: "bg-rb-beetle",
    leaf: "bg-rb-leaf",
    cardinal: "bg-rb-cardinal",
  };

  return (
    <div
      className={cn("rb-progress", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={cn("rb-progress-fill", TONES[tone])}
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped}%` }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        style={{ transition: "none" }}
      />
    </div>
  );
}

export function AnswerOption({ optionKey, state = "idle", className, children, ...props }) {
  return (
    <button type="button" data-state={state} className={cn("rb-answer", className)} {...props}>
      <span className="rb-answer-key">{optionKey}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

export function StatTile({ icon: Icon, value, label, tone = "feather", className }) {
  const TONES = {
    feather: "bg-rb-feather-wash text-rb-feather-lip",
    macaw: "bg-rb-macaw-wash text-rb-macaw-lip",
    bee: "bg-rb-bee-wash text-rb-bee-ink",
    fox: "bg-rb-fox-wash text-rb-fox-lip",
    beetle: "bg-rb-beetle-wash text-rb-beetle-lip",
  };

  return (
    <div className={cn("rb-card flex items-center gap-4", className)}>
      {Icon ? (
        <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", TONES[tone])}>
          <Icon className="size-6" aria-hidden="true" />
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="rb-numeric text-2xl leading-none">{value}</div>
        <div className="mt-1 truncate text-sm font-medium text-rb-wolf">{label}</div>
      </div>
    </div>
  );
}
