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

dotenv.config()

const app = express()

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use((req, res, next) => {
    if (req.originalUrl === '/payment/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
})
const PORT = 3000

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`)
})

app.use('/resume', resumeRouter)
app.use('/interview', interviewRouter)
app.use('/session-auth', sessionAuthRouter)
app.use('/question', questionsRouter)
app.use('/users', userRouter)
app.use('/payment', paymentRouter)
app.use('/vision', visionRouter)