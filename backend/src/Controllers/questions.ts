import { randomInt } from 'crypto';
import express from 'express'
import supabase from '../db/client'
import redis from '../db/redis'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'

const router = express.Router();

const CACHE_KEY = 'questions:all'
const CACHE_TTL = 3600
const RECENT_QUESTIONS_TTL = 3600
const MAX_RECENT_QUESTIONS = 10

const getRecentQuestionsCacheKey = (userId: string) => `user:${userId}:recent_questions`

async function getCachedQuestions() {
    const cached = await redis.get(CACHE_KEY)
    if (cached) {
        return JSON.parse(cached)
    }
    
    const { data, error } = await supabase.from('questions').select('*')
    if (error || !data) return null
    
    await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(data))
    return data
}

async function getRecentQuestionIds(userId: string): Promise<string[]> {
    const cached = await redis.get(getRecentQuestionsCacheKey(userId))
    if (cached) {
        return JSON.parse(cached)
    }
    
    const { data, error } = await supabase
        .from('users')
        .select('recent_question_ids')
        .eq('id', userId)
        .single()
    
    if (error || !data) return []
    
    const recentIds = data.recent_question_ids || []
    await redis.setex(getRecentQuestionsCacheKey(userId), RECENT_QUESTIONS_TTL, JSON.stringify(recentIds))
    return recentIds
}

async function updateRecentQuestionIds(userId: string, questionName: string, currentIds: string[]): Promise<string[]> {
    const newIds = [questionName, ...currentIds.filter(id => id !== questionName)].slice(0, MAX_RECENT_QUESTIONS)
    
    await supabase
        .from('users')
        .update({ recent_question_ids: newIds })
        .eq('id', userId)
    
    await redis.setex(getRecentQuestionsCacheKey(userId), RECENT_QUESTIONS_TTL, JSON.stringify(newIds))
    return newIds
}

function selectQuestionExcludingRecent(questions: any[], recentNames: string[]): any {
    const recentSet = new Set(recentNames)
    const available = questions.filter((q: any) => !recentSet.has(q.name))
    
    if (available.length === 0) {
        return questions[randomInt(questions.length)]
    }
    
    return available[randomInt(available.length)]
}

router.get('/', async(req, res) => {
    const questions = await getCachedQuestions()
    if (!questions?.length) {
        return res.status(500).json({ error: 'No questions found' })
    }
    const randNum = randomInt(questions.length)
    return res.status(200).json({ question: questions[randNum] })
})

router.get('/:difficulty', async(req, res) => {
    const { difficulty } = req.params
    const diff = difficulty[0].toUpperCase() + difficulty.substring(1).toLowerCase()
    
    const questions = await getCachedQuestions()
    const filtered = questions?.filter((q: any) => q.difficulty === diff)
    
    if (!filtered?.length) {
        return res.status(500).json({ error: 'No questions found' })
    }
    const randNum = randomInt(filtered.length)
    return res.status(200).json({ question: filtered[randNum] })
})

router.post('/:difficulty', requireAuth, async(req, res) => {
    const { difficulty } = req.params
    const authUser = (req as AuthenticatedRequest).user
    const userId = authUser.id
    
    const diff = difficulty[0].toUpperCase() + difficulty.substring(1).toLowerCase()
    
    const questions = await getCachedQuestions()
    const filtered = questions?.filter((q: any) => q.difficulty === diff)
    
    if (!filtered?.length) {
        return res.status(500).json({ error: 'No questions found' })
    }
    
    const recentIds = await getRecentQuestionIds(userId)
    const selectedQuestion = selectQuestionExcludingRecent(filtered, recentIds)
    
    await updateRecentQuestionIds(userId, selectedQuestion.name, recentIds)
    
    return res.status(200).json({ question: selectedQuestion })
})

/*
router.post('/upload', requireAuth, async(req, res) => {
    const first50 = Object.entries(questions).slice(0, 50).map(([slug, data]) => {
        const { 'in-place': inPlace, c: C, typescript: ts, ruby: R, rust: Rust,  ...rest } = (data as any)
        return {
            name: slug,
            inPlace,
            ...rest
        }
    })

    const { error } = await supabase.from('questions').insert(first50)

    if (error) {
        return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Uploaded 50 questions successfully' })
})*/

export default router