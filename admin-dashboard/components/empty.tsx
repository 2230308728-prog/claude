import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function Empty({
  icon: Icon,
  title = "暂无数据",
  description,
  action,
  className,
}: EmptyProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

interface EmptyStateProps extends EmptyProps {
  type?: "no-data" | "no-results" | "error" | "no-connection"
}

const emptyStateConfig = {
  "no-data": {
    title: "暂无数据",
    description: "还没有创建任何数据",
  },
  "no-results": {
    title: "未找到结果",
    description: "尝试调整搜索条件或筛选器",
  },
  "error": {
    title: "加载失败",
    description: "加载数据时出现错误，请稍后重试",
  },
  "no-connection": {
    title: "连接失败",
    description: "无法连接到服务器，请检查网络连接",
  },
}

export function EmptyState({ type = "no-data", icon, title, description, action, className }: EmptyStateProps) {
  const config = emptyStateConfig[type]

  return (
    <Empty
      icon={icon}
      title={title || config.title}
      description={description || config.description}
      action={action}
      className={className}
    />
  )
}
