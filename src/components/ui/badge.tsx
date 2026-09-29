import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3.5!",
  {
    variants: {
      variant: {
        default:
          "bg-primary/15 text-teal-dark border-primary/30 dark:bg-primary/25 dark:text-teal-light dark:border-primary/40",
        solid:
          "bg-primary text-primary-foreground shadow-teal-glow/30",
        gold:
          "bg-gold/20 text-[#735A00] border-gold/40 dark:bg-gold/25 dark:text-gold-light dark:border-gold/40",
        "gold-solid":
          "bg-gold text-accent-foreground shadow-accent-glow/30 font-extrabold",
        coral:
          "bg-coral/15 text-coral-dark border-coral/30 dark:bg-coral/25 dark:text-coral-light dark:border-coral/40",
        sky:
          "bg-sky-blue/15 text-[#1B6CA8] border-sky-blue/30 dark:bg-sky-blue/25 dark:text-sky-blue dark:border-sky-blue/40",
        secondary:
          "bg-secondary text-secondary-foreground border-border/60",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/30",
        outline:
          "border-border text-foreground bg-card/60 backdrop-blur-xs",
        ghost:
          "hover:bg-muted hover:text-muted-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
