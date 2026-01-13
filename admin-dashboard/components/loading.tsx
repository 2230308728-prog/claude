import { cn } from "@/lib/utils"

function Loader({
  className,
  size = "md",
}: {
  className?: string
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-gray-200 border-t-gray-900",
        sizeClasses[size],
        className
      )}
    />
  )
}

export function LoadingScreen({ message = "加载中..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <Loader size="lg" className="mx-auto" />
        <p className="text-gray-500">{message}</p>
      </div>
    </div>
  )
}

export function LoadingSpinner({ size }: { size?: "sm" | "md" | "lg" }) {
  return <Loader size={size} />
}

export { Loader }
