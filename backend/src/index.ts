import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import resumeRouter from './Controllers/resume'
import sessionAuthRouter from './Controllers/sessionAuth'
import questionsRouter from './Controllers/questions'
import interviewRouter from './Controllers/interview'

dotenv.config()

const app = express()

app.use(express.json())
app.use(cors({
    origin: '*'
}))
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})

app.use('/resume', resumeRouter)
app.use('/interview', interviewRouter)
app.use('/session-auth', sessionAuthRouter)
app.use('/question', questionsRouter)