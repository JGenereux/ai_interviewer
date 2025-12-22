import express from 'express'
import { GetUserInformation } from '../Utils/getUserInformation';

const router = express.Router();

router.post('/', async (req,res) => {
    const {resumeText} = req.body;
    const userInfo = await GetUserInformation(resumeText)
    return res.status(200).json({userInfo})
})

export default router