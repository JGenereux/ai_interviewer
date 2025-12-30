import express from 'express'
import dbClient from '../db/client'

const router = express.Router();

router.get('/', async (req, res) => {
    const {data, error} = await dbClient.from('users').select('*').single()
    return res.status(200).json({user: data, error: error})
})

router.get('/:userId', async (req, res) => {
    const {userId} = req.params;

    try{
        const {data, error} = await dbClient.from('users').select('*').eq('id', userId).single()
        return res.status(200).json({user: data, error})
    } catch(error) {
        return res.status(500).json({error})
    }
})

router.post('/', async (req, res) => {
    const {sessionID, fullName, userName, resume} = req.body;

    try {
        const {data, error} = await dbClient.from('pending_users').insert({id: sessionID, fullName, userName, resume}).select().single()
        return res.status(200).json({data: data, error: error})
    } catch(error) {
        return res.status(500).json({error})
    }
})

router.post('/confirm', async(req, res) => {
    const {sessionID, userId} = req.body;

    try{
        const {data, error} = await dbClient.from('pending_users').select('*').eq('id', sessionID).single()
        if (error) {
            return res.status(404).json({message: 'Session is expired'})
        }

        const {fullName, userName, resume} = data;
        console.log('2', resume)
        const {data: newUser, error: addUserErr} = await dbClient.from('users').insert({id: userId, fullName, resume, userName}).select().single()
        if (addUserErr) {
            return res.status(417).json({message: "Couldn't add user info please contact admin"})
        }

        const {error: delPendingErr} = await dbClient.from('pending_users').delete().eq('id', sessionID).single()
        if (delPendingErr) {
            return res.status(500).json({message: "Internal error deleting pending user info"})
        }

        return res.status(200).json({user: newUser})
    } catch(error) {
        return res.status(500).json({error})
    }
})

export default router