import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SuggestedQuestionsProps {
  onQuestionClick: (question: string) => void
}

const suggestions = [
  {
    category: 'Fines',
    icon: '💰',
    questions: [
      'What is the fine for not wearing a helmet?',
      'What is the penalty for drunk driving?',
      'What is the fine for jumping a red light?',
    ],
  },
  {
    category: 'Documents',
    icon: '📄',
    questions: [
      'What documents do I need while driving?',
      'How long is a driving license valid?',
      'What is a PUC certificate?',
    ],
  },
  {
    category: 'Violations',
    icon: '⚠️',
    questions: [
      'What happens if I do not wear a seatbelt?',
      'Can I use mobile phone while driving?',
      'What are the speed limits in India?',
    ],
  },
]

export function SuggestedQuestions({ onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/70 text-white mb-2"
        >
          <MessageCircle className="w-8 h-8" />
        </motion.div>
        <h2 className="text-2xl font-bold gradient-text">Ask me anything about Indian Traffic Laws</h2>
        <p className="text-muted-foreground">Select a question below or type your own</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {suggestions.map((category, categoryIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <h3 className="font-semibold text-sm text-muted-foreground">{category.category}</h3>
            </div>
            <div className="space-y-2">
              {category.questions.map((question, questionIndex) => (
                <Button
                  key={questionIndex}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => onQuestionClick(question)}
                >
                  <span className="text-sm line-clamp-2">{question}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}