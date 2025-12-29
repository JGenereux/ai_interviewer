import { randomInt } from 'crypto';
import express from 'express'
import questions from '../questions.json'

const router = express.Router();

router.get('/', async(req, res) => {
    const randNum = randomInt((Object.entries(questions).length - 1) - 0)
    return res.status(200).json({question: Object.entries(questions)[randNum]})
})

router.get('/:difficulty', async(req, res) => {
    const {difficulty} = req.params
    const diff = difficulty[0].toUpperCase() + difficulty.substring(1).toLowerCase();

    const validQuestions = Object.entries(questions).filter((value) => {
        return value[1].difficulty == diff
    })

    const randNum = randomInt(validQuestions.length - 1)
    return res.status(200).json({question: validQuestions[randNum]})
})

export default router