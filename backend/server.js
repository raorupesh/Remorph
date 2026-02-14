import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: process.env.MODEL })	

app.post('/api/refactor', async (req, res) => {
	const { code, language } = req.body || {}

	if (!code || typeof code !== 'string') {
		return res.status(400).json({ error: 'Field "code" (string) is required.' })
	}

	if (!language || typeof language !== 'string') {
		return res.status(400).json({ error: 'Field "language" (string) is required.' })
	}

	if (!process.env.GEMINI_API_KEY) {
		return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' })
	}

	try {
		const prompt = `You are an expert code refactoring assistant. Your task is to refactor the following ${language} code to improve readability, maintainability, and performance.

Please provide:
1. The refactored code block
2. A brief explanation of the changes made (2-3 sentences)

Format your response exactly as:
REFACTORED_CODE:
\`\`\`
[refactored code here]
\`\`\`

EXPLANATION:
[brief explanation of changes]

Original code:
\`\`\`${language}
${code}
\`\`\``

		const result = await model.generateContent(prompt)
		const response = result.response
		const text = response.text()

		// Parse the response
		const codeMatch = text.match(/REFACTORED_CODE:\s*```[\s\S]*?\n([\s\S]*?)```/)
		const explanationMatch = text.match(/EXPLANATION:\s*([\s\S]*?)$/)

		const refactoredCode = codeMatch ? codeMatch[1].trim() : code
		const explanation = explanationMatch ? explanationMatch[1].trim() : 'Refactoring completed.'

		res.json({ refactoredCode, explanation, language })
	} catch (error) {
		console.error('Error calling Gemini API:', error)
		res.status(500).json({ error: 'Failed to refactor code. Please try again.' })
	}
})

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.listen(port, () => {
	console.log(`Backend server listening on port ${port}`)
})

