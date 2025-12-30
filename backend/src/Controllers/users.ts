import express from 'express'
import dbClient from '../db/client'

const router = express.Router();

router.get('/:userId', async (req, res) => {
    const {userId} = req.params;

    try{
        const {data, error} = await dbClient.from('users').select('*').eq('id', userId).single()
        if (error) {
            return res.status(404).json({message: 'No account with this id exists'})
        }
        return res.status(200).json({user: data, error})
    } catch(error) {
        return res.status(500).json({error})
    }
})

/**
 * @description Creates a user in the pending_users db. This is done so
 *              users aren't created before account verification.
 */
router.post('/', async (req, res) => {
    const {sessionID, fullName, userName, resume} = req.body;

    try {
        const {data, error} = await dbClient.from('pending_users').insert({id: sessionID, fullName, userName, resume}).select().single()
        if (error) {
            return res.status(400).json({message: "Make sure all information is filled out"})
        }
        
        return res.status(200).json({data: data, error: error, message: ''})
    } catch(error) {
        return res.status(500).json({error, message: 'Internal Server Error, please contact admin'})
    }
})

/**
 * @description Create's a user using the info from pending_users
 */
router.post('/confirm', async(req, res) => {
    const {sessionID, userId} = req.body;

    try{
        const {data, error} = await dbClient.from('pending_users').select('*').eq('id', sessionID).single()
        if (error) {
            return res.status(404).json({message: 'Session is expired'})
        }

        const {fullName, userName, resume} = data;
        
        const {data: newUser, error: addUserErr} = await dbClient.from('users').insert({id: userId, fullName, resume, userName}).select().single()
        if (addUserErr) {
            return res.status(400).json({message: "Couldn't create account. Please contact admin"})
        }

        const {error: delPendingErr} = await dbClient.from('pending_users').delete().eq('id', sessionID).single()
        if (delPendingErr) {
            return res.status(500).json({message: "Internal error deleting pending user info"})
        }

        return res.status(200).json({user: newUser, message: ''})
    } catch(error) {
        return res.status(500).json({error, message: ''})
    }
})

export default router