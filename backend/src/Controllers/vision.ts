import express from 'express'
import OpenAI from 'openai'

const router = express.Router()

router.post('/interpret-image', async (req, res) => {
    try {
        const { image } = req.body

        if (!image) {
            return res.status(400).json({ error: 'Image data is required' })
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `You are analyzing a whiteboard drawing from a technical interview. Describe what you see in detail, focusing on:
- Any diagrams, flowcharts, or visual representations
- Code or pseudocode written
- Algorithm designs or data structure drawings
- Problem-solving work or mathematical notation
- Any annotations or notes

Be specific and thorough in your description so that someone who cannot see the image can understand exactly what was drawn. If the whiteboard appears empty or has minimal content, state that clearly.`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: image,
                                detail: 'high'
                            }
                        }
                    ]
                }
            ],
            max_tokens: 1000
        })

        const interpretation = response.choices[0]?.message?.content || 'Unable to interpret the whiteboard image.'

        return res.json({ interpretation })
    } catch (error) {
        console.error('Error interpreting image:', error)
        return res.status(500).json({ error: 'Failed to interpret image' })
    }
})

export default router

