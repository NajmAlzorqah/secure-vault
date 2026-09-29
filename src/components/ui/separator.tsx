"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  dashed = false,
  ...props
}: SeparatorPrimitive.Props & { dashed?: boolean }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border/80 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        dashed &&
          "border-b border-dashed border-border/80 bg-transparent data-horizontal:h-0",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
