import { useState } from 'react'
import { 
  Upload, 
  RefreshCw, 
  Database, 
  FileText, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useIndexStats } from '@/lib/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function AdminPanel() {
  const [file, setFile] = useState<File | null>(null)
  const [chunkSize, setChunkSize] = useState(512)
  const { data: stats, isLoading } = useIndexStats()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const buildIndexMutation = useMutation({
    mutationFn: () => api.buildIndex(file || undefined, chunkSize),
    onSuccess: (data) => {
      toast({
        title: '✅ Index Built Successfully',
        description: data.message,
      })
      queryClient.invalidateQueries({ queryKey: ['index-stats'] })
      setFile(null)
    },
    onError: (error) => {
      toast({
        title: '❌ Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validTypes = ['text/csv', 'application/json']
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a CSV or JSON file',
          variant: 'destructive',
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const statCards = stats ? [
    {
      title: 'Total Documents',
      value: stats.doc_count.toLocaleString(),
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Index Size',
      value: `${stats.index_size_mb.toFixed(2)} MB`,
      icon: Database,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
    },
    {
      title: 'Retrieval Count',
      value: stats.top_k.toString(),
      icon: TrendingUp,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Embedding Model',
      value: stats.embedding_model.split('/').pop() || 'N/A',
      icon: CheckCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      isSmall: true,
    },
  ] : []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your traffic law knowledge base and monitor system performance
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass hover:shadow-lg transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <p className="text-sm text-muted-foreground font-medium">
                        {stat.title}
                      </p>
                      <p className={cn(
                        "font-bold gradient-text",
                        stat.isSmall ? "text-lg" : "text-3xl"
                      )}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={cn(
                      "p-3 rounded-xl transition-transform group-hover:scale-110",
                      stat.bgColor
                    )}>
                      <stat.icon className={cn(
                        "h-6 w-6",
                        `bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`
                      )} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Index Status */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Index Health
              </CardTitle>
              <CardDescription>Current system performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Index Efficiency</span>
                  <span className="font-semibold text-green-600">98%</span>
                </div>
                <Progress value={98} className="h-2" indicatorClassName="bg-gradient-to-r from-green-500 to-green-600" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <span className="font-semibold text-blue-600">
                    {((stats.index_size_mb / 1024) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={(stats.index_size_mb / 1024) * 100} 
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-blue-500 to-blue-600"
                />
              </div>

              {stats.last_updated && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last updated: {new Date(stats.last_updated).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Dataset Management */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Dataset Management
            </CardTitle>
            <CardDescription>Upload and index your traffic law dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="dataset" className="text-sm font-semibold">
                Dataset File (CSV/JSON)
              </Label>
              <Input
                id="dataset"
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                disabled={buildIndexMutation.isPending}
                className="h-11 cursor-pointer file:mr-4 file:px-4 file:py-2 file:h-8 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:text-sm file:font-medium hover:file:bg-primary/90 file:cursor-pointer"
              />
              {file && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                </motion.div>
              )}
            </div>

            {/* Chunk Size */}
            <div className="space-y-3">
              <Label htmlFor="chunk-size" className="text-sm font-semibold">
                Chunk Size
              </Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="chunk-size"
                  type="number"
                  min={100}
                  max={2000}
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  disabled={buildIndexMutation.isPending}
                  className="max-w-32 h-11"
                />
                <span className="text-sm text-muted-foreground">characters</span>
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Recommended: 512 characters for optimal retrieval accuracy
              </p>
            </div>

            {/* Build Button */}
            <Button
              onClick={() => buildIndexMutation.mutate()}
              disabled={buildIndexMutation.isPending}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
            >
              {buildIndexMutation.isPending ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Building Index...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  {file ? 'Upload & Build Index' : 'Rebuild Index'}
                </>
              )}
            </Button>

            {/* Info Box */}
            <div className="p-4 glass rounded-lg border-2 border-primary/10">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Expected Dataset Format
              </p>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>File format: CSV or JSON</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>Required columns: <code className="bg-muted px-1 rounded">id, question, answer, source, category</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>Each row represents a Q&A pair about Indian traffic laws</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">▸</span>
                  <span>Source should reference legal documents (e.g., "Motor Vehicles Act Section 129")</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}