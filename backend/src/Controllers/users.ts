import express from 'express'
import dbClient from '../db/client'
import redis from '../db/redis'
import { requireAuth } from '../middleware/auth'

const router = express.Router();

const LEADERBOARD_CACHE_KEY = 'leaderboard:ranked'
const LEADERBOARD_CACHE_TTL = 300

router.get('/usernames', async (req, res) => {
    try {
        const { data: users, error: usersError } = await dbClient
            .from('users')
            .select('userName');

        const { data: pendingUsers, error: pendingError } = await dbClient
            .from('pending_users')
            .select('userName');

        if (usersError || pendingError) {
            return res.status(500).json({ message: 'Failed to fetch usernames' });
        }

        const usernames = [
            ...(users?.map(u => u.userName) || []),
            ...(pendingUsers?.map(u => u.userName) || [])
        ].filter(Boolean);

        return res.status(200).json({ usernames });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

router.get('/leaderboard', async (req, res) => {
    const { userId } = req.query;

    try {
        let rankedUsers;
        const cached = await redis.get(LEADERBOARD_CACHE_KEY)
        
        if (cached) {
            rankedUsers = JSON.parse(cached)
        } else {
            const { data: allUsers, error } = await dbClient
                .from('users')
                .select('id, userName, xp, interview_ids')
                .order('xp', { ascending: false });

            if (error) {
                return res.status(500).json({ message: 'Failed to fetch leaderboard' });
            }

            rankedUsers = allUsers.map((user, index) => ({
                rank: index + 1,
                username: user.userName,
                xp: user.xp || 0,
                interviews: user.interview_ids?.length || 0,
                id: user.id
            }));

            await redis.setex(LEADERBOARD_CACHE_KEY, LEADERBOARD_CACHE_TTL, JSON.stringify(rankedUsers))
        }

        const top15 = rankedUsers.slice(0, 15);

        let currentUser = null;
        if (userId) {
            const userIndex = rankedUsers.findIndex((u: any) => u.id === userId);
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

router.get('/:userId/interviews', requireAuth, async (req, res) => {
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

router.post('/oauth', async (req, res) => {
    const { userId, email, fullName, userName, resume } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'Missing userId' });
    }

    try {
        const { data: existingUser, error: fetchError } = await dbClient
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (existingUser && !fetchError) {
            return res.status(200).json({ user: existingUser, isNew: false });
        }

        const tempUserName = `user_${userId.slice(0, 8)}`;

        const { data: newUser, error: createError } = await dbClient
            .from('users')
            .insert({
                id: userId,
                fullName: fullName || null,
                userName: tempUserName,
                resume: null,
                xp: 0,
                interview_ids: [],
                tokens: 750,
                subscription: null,
                signup_complete: false
            })
            .select()
            .single();

        if (createError) {
            return res.status(500).json({ message: 'Failed to create user account' });
        }

        return res.status(200).json({ user: newUser, isNew: true });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

router.post('/oauth/complete', async (req, res) => {
    const { userId, userName, resume } = req.body;

    if (!userId || !userName) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const { data: usernameTaken } = await dbClient
            .from('users')
            .select('id')
            .eq('userName', userName)
            .neq('id', userId)
            .single();

        if (usernameTaken) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        const { data: updatedUser, error: updateError } = await dbClient
            .from('users')
            .update({
                userName,
                resume: resume || null,
                signup_complete: true
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('OAuth complete update error:', updateError);
            return res.status(500).json({ message: 'Failed to complete signup', error: updateError.message });
        }

        return res.status(200).json({ user: updatedUser });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

router.get('/:userId', requireAuth, async (req, res) => {
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
        const { data: existingUser } = await dbClient
            .from('users')
            .select('id')
            .eq('userName', userName)
            .single();

        if (existingUser) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

        const { data: existingPending } = await dbClient
            .from('pending_users')
            .select('id')
            .eq('userName', userName)
            .single();

        if (existingPending) {
            return res.status(409).json({ message: 'Username is already taken' });
        }

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
        
        const {data: newUser, error: addUserErr} = await dbClient.from('users').insert({
            id: userId,
            fullName,
            resume,
            userName,
            xp: 0,
            interview_ids: [],
            tokens: 750,
            subscription: null,
            signup_complete: true
        }).select().single()
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

router.put('/:userId/resume', requireAuth, async (req, res) => {
    const { userId } = req.params;
    const { resume } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const { data: user, error: fetchError } = await dbClient
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { error: updateError } = await dbClient
            .from('users')
            .update({ resume })
            .eq('id', userId);

        if (updateError) {
            return res.status(500).json({ message: 'Failed to update resume' });
        }

        return res.status(200).json({ message: 'Resume updated successfully', resume });
    } catch (error) {
        return res.status(500).json({ error, message: 'Internal server error' });
    }
});

router.post('/xp', requireAuth, async (req, res) => {
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