import express from 'express'
import dbClient from '../db/client'

const router = express.Router();

router.get('/leaderboard', async (req, res) => {
    const { userId } = req.query;

    try {
        const { data: allUsers, error } = await dbClient
            .from('users')
            .select('id, userName, xp, interview_ids')
            .order('xp', { ascending: false });

        if (error) {
            return res.status(500).json({ message: 'Failed to fetch leaderboard' });
        }

        const rankedUsers = allUsers.map((user, index) => ({
            rank: index + 1,
            username: user.userName,
            xp: user.xp || 0,
            interviews: user.interview_ids?.length || 0,
            id: user.id
        }));

        const top15 = rankedUsers.slice(0, 15);

        let currentUser = null;
        if (userId) {
            const userIndex = rankedUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                currentUser = rankedUsers[userIndex];
            }
        }

        return res.status(200).json({
            leaderboard: top15,
            currentUser,
            totalUsers: rankedUsers.length
        });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

router.get('/:userId/interviews', async (req, res) => {
    const { userId } = req.params;

    try {
        const { data: interviews, error } = await dbClient
            .from('interviews')
            .select('id, created_at, feedback, problem_attempt_ids')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ message: 'Failed to fetch interviews' });
        }

        const formattedInterviews = interviews.map(interview => {
            const feedback = interview.feedback;
            return {
                id: interview.id,
                date: interview.created_at,
                overallScore: feedback?.overallScore || null,
                technicalScore: feedback?.technical?.score || null,
                behavioralScore: feedback?.behavioral?.score || null,
                mode: feedback?.mode || 'full',
                problemCount: interview.problem_attempt_ids?.length || 0
            };
        });

        return res.status(200).json({ interviews: formattedInterviews });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

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
        
        const {data: newUser, error: addUserErr} = await dbClient.from('users').insert({id: userId, fullName, resume, userName, tokens: 750}).select().single()
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

router.post('/xp', async (req, res) => {
    const { userId, technicalScore, behavioralScore, overallScore } = req.body;

    if (!userId || overallScore === undefined) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const { data: user, error: fetchError } = await dbClient
            .from('users')
            .select('xp')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const baseXp = 100;
        const overallBonus = Math.min(overallScore * 15, 150);
        const technicalBonus = technicalScore ? Math.min(technicalScore * 10, 100) : 0;
        const behavioralBonus = behavioralScore ? Math.min(behavioralScore * 10, 100) : 0;
        const xpGained = Math.round(baseXp + overallBonus + technicalBonus + behavioralBonus);

        const currentXp = user.xp || 0;
        const newXp = currentXp + xpGained;

        const { error: updateError } = await dbClient
            .from('users')
            .update({ xp: newXp })
            .eq('id', userId);

        if (updateError) {
            return res.status(500).json({ message: 'Failed to update XP' });
        }

        return res.status(200).json({ newXp, xpGained });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

export default router