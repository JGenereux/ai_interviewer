import { randomInt } from 'crypto';
import express from 'express'
import questions from '../questions.json'

const router = express.Router();

router.get('/question', async(req, res) => {
    const randNum = randomInt((Object.entries(questions).length - 1) - 0)
    return res.status(200).json({question: Object.entries(questions)[randNum]})
})

export default router