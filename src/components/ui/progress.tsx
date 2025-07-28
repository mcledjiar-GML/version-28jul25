
import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "success" | "warning" | "danger" | "coach"
  }
>(({ className, value, variant = "default", ...props }, ref) => {
  const getVariantClass = () => {
    switch (variant) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "danger":
        return "bg-red-500"
      case "coach":
        return "bg-coach-500"
      default:
        return "bg-primary"
    }
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", getVariantClass())}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
