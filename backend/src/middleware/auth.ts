import { Request, Response, NextFunction } from 'express'
import dbClient from '../db/client'
import type { User } from '@supabase/supabase-js'

export interface AuthenticatedRequest extends Request {
    user: User
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    const { data: { user }, error } = await dbClient.auth.getUser(token)
    
    if (error || !user) {
        res.status(401).json({ error: 'Unauthorized' })
        return
    }

    (req as AuthenticatedRequest).user = user
    next()
}

