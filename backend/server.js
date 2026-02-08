import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.post('/api/refactor', (req, res) => {
	const { code, language } = req.body || {}

	if (!code || typeof code !== 'string') {
		return res.status(400).json({ error: 'Field "code" (string) is required.' })
	}

	if (!language || typeof language !== 'string') {
		return res.status(400).json({ error: 'Field "language" (string) is required.' })
	}

	const refactoredCode = code
		.split('\n')
		.map((line) => line.trimEnd())
		.join('\n')

	res.json({ refactoredCode, language })
})

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.listen(port, () => {
	console.log(`Backend server listening on port ${port}`)
})

