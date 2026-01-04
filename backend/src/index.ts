import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import resumeRouter from './Controllers/resume'
import sessionAuthRouter from './Controllers/sessionAuth'
import questionsRouter from './Controllers/questions'
import interviewRouter from './Controllers/interview'
import userRouter from './Controllers/users'
import paymentRouter from './Controllers/payment'
import visionRouter from './Controllers/vision'
import accessGateRouter from './Controllers/accessGate'

dotenv.config()

const app = express()

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}))
app.use((req, res, next) => {
    if (req.originalUrl === '/api/payment/webhook') {
        next();
    } else if (req.originalUrl.startsWith('/api/vision')) {
        express.json({ limit: '5mb' })(req, res, next);
    } else {
        express.json()(req, res, next);
    }
})
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})

app.use('/api/resume', resumeRouter)
app.use('/api/interview', interviewRouter)
app.use('/api/session-auth', sessionAuthRouter)
app.use('/api/question', questionsRouter)
app.use('/api/users', userRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/vision', visionRouter)
app.use('/api/gate', accessGateRouter)