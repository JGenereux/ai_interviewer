import { randomInt } from 'crypto';
import express from 'express'
import questions from '../questions.json'
import supabase from '../db/client'
import redis from '../db/redis'

const router = express.Router();

const CACHE_KEY = 'questions:all'
const CACHE_TTL = 3600

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

/*
router.post('/upload', async(req, res) => {
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