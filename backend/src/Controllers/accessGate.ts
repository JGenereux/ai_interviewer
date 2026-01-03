import { Router, Request, Response } from 'express'
import supabase from '../db/client'

const router = Router()

router.post('/waitlist', async (req: Request, res: Response) => {
    const { email } = req.body

    if (!email || typeof email !== 'string') {
        res.status(400).json({ error: 'Email is required' })
        return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        res.status(400).json({ error: 'Invalid email format' })
        return
    }

    try {
        const { error } = await supabase
            .from('waitlist')
            .insert({ email: email.toLowerCase().trim() })

        if (error) {
            if (error.code === '23505') {
                res.status(200).json({ message: 'You are already on the waitlist!' })
                return
            }
            throw error
        }

        res.status(201).json({ message: 'Successfully joined the waitlist!' })
    } catch (error) {
        console.error('Waitlist error:', error)
        res.status(500).json({ error: 'Failed to join waitlist' })
    }
})

router.post('/access-code/validate', async (req: Request, res: Response) => {
    const { code } = req.body

    if (!code || typeof code !== 'string') {
        res.status(400).json({ valid: false, error: 'Access code is required' })
        return
    }

    try {
        const { data, error } = await supabase
            .from('access_codes')
            .select('id, is_active')
            .eq('code', code.toUpperCase().trim())
            .single()

        if (error || !data) {
            res.status(200).json({ valid: false, error: 'Invalid access code' })
            return
        }

        if (!data.is_active) {
            res.status(200).json({ valid: false, error: 'This access code is no longer active' })
            return
        }

        const { data: currentData } = await supabase
            .from('access_codes')
            .select('uses')
            .eq('id', data.id)
            .single()

        await supabase
            .from('access_codes')
            .update({ uses: (currentData?.uses || 0) + 1 })
            .eq('id', data.id)

        res.status(200).json({ valid: true })
    } catch (error) {
        console.error('Access code validation error:', error)
        res.status(500).json({ valid: false, error: 'Failed to validate access code' })
    }
})

export default router

