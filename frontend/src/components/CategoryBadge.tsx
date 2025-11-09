import { motion } from 'framer-motion'
import { 
  Scale, 
  FileText, 
  AlertTriangle, 
  Car, 
  Shield, 
  Banknote,
  LucideIcon 
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryBadgeProps {
  category: string
  variant?: 'default' | 'outline'
  showIcon?: boolean
  className?: string
}

const categoryConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  'fines': {
    icon: Banknote,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
  },
  'penalties': {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
  },
  'documents': {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  },
  'violations': {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
  },
  'vehicle': {
    icon: Car,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  },
  'safety': {
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  },
  'license': {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
  },
  'default': {
    icon: Scale,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
  },
}

export function CategoryBadge({ 
  category, 
  variant = 'default', 
  showIcon = true,
  className 
}: CategoryBadgeProps) {
  const categoryKey = category.toLowerCase().replace(/\s+/g, '-')
  const config = categoryConfig[categoryKey] || categoryConfig.default
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
        variant === 'default' ? config.bgColor : 'bg-background border-border',
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span className="capitalize">{category}</span>
    </motion.div>
  )
}