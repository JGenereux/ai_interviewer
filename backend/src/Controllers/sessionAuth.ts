import express from 'express'
import { createSessionKey } from '../Utils/createSessionKey';

const router = express.Router();

router.get('/token', async (req,res) => {
    const key = await createSessionKey()
    return res.status(200).json({key: key})  
})

export default router