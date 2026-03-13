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

/**
 * Analyzes code to detect code smells
 * @param {string} code - The source code to analyze
 * @returns {Object} Analysis results with detected code smells
 */
function analyzeCodeSmells(code) {
	const lines = code.split('\n')
	const detectedSmells = []
	const functions = []
	
	// Extract functions with their line counts and actual statement counts
	let currentFunction = null
	let functionStartLine = 0
	let bracketCount = 0
	let statementCount = 0
	
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim()
		
		// Skip empty lines and comments when counting statements
		if (line === '' || line.startsWith('//') || line.startsWith('*')) {
			continue
		}
		
		// Detect function declarations
		const funcMatch = line.match(/^\s*(function|async\s+function|const\s+\w+\s*=\s*(async\s*)?\(|export\s+function)\s+(\w+)/) ||
								line.match(/^\s*(\w+)\s*\(.*\)\s*{/)
		
		if (funcMatch) {
			const funcName = funcMatch[3] || funcMatch[1]
			if (currentFunction) {
				// Store previous function
				functions.push(currentFunction)
			}
			currentFunction = {
				name: funcName,
				startLine: i + 1,
				lineCount: 0,
				statementCount: 0,
				contentLines: []
			}
			functionStartLine = i
			bracketCount = 0
			statementCount = 0
		}
		
		// Track bracket depth for function body
		if (currentFunction) {
			for (let j = 0; j < line.length; j++) {
				if (line[j] === '{') bracketCount++
				if (line[j] === '}') {
					bracketCount--
					if (bracketCount === 0) {
						currentFunction.blockEndLine = i + 1
						functions.push(currentFunction)
						currentFunction = null
						break
					}
				}
			}
			
			// Count actual statements (not empty lines, not just brackets)
			if (currentFunction && line && line !== '{' && line !== '}' && !line.startsWith('//')) {
				currentFunction.statementCount++
				currentFunction.contentLines.push(line)
			}
		}
	}
	
	// Detect Long Methods (more than 30 actual statements, excluding empty lines and comments)
	functions.forEach(func => {
		if (func.statementCount > 30) {
			detectedSmells.push({
				type: 'Long Method',
				function: func.name,
				location: `Line ${func.startLine}`,
				details: `Function '${func.name}' has ${func.statementCount} statements`
			})
		}
	})
	
	// Detect Duplicate Code by comparing function bodies
	const functionBodies = functions.map(f => ({
		name: f.name,
		body: f.contentLines.join('\n')
	}))
	
	for (let i = 0; i < functionBodies.length; i++) {
		for (let j = i + 1; j < functionBodies.length; j++) {
			const similarity = calculateSimilarity(functionBodies[i].body, functionBodies[j].body)
			// If 70%+ similar, consider it duplicate code
			if (similarity > 0.7) {
				detectedSmells.push({
					type: 'Duplicate Code',
					functions: [functionBodies[i].name, functionBodies[j].name],
					similarity: Math.round(similarity * 100),
					details: `Functions '${functionBodies[i].name}' and '${functionBodies[j].name}' have ${Math.round(similarity * 100)}% similar code`
				})
			}
		}
	}
	
	return {
		detectedSmells,
		summary: {
			totalFunctions: functions.length,
			totalSmells: detectedSmells.length,
			functions: functions.map(f => ({
				name: f.name,
				statements: f.statementCount,
				lines: f.blockEndLine ? f.blockEndLine - f.startLine + 1 : 0
			}))
		}
	}
}

/**
 * Calculates similarity between two code blocks
 * @param {string} code1 - First code block
 * @param {string} code2 - Second code block
 * @returns {number} Similarity score (0-1)
 */
function calculateSimilarity(code1, code2) {
	const tokens1 = code1.split(/\s+/).filter(t => t.length > 0)
	const tokens2 = code2.split(/\s+/).filter(t => t.length > 0)
	
	if (tokens1.length === 0 || tokens2.length === 0) return 0
	
	const matches = tokens1.filter(t => tokens2.includes(t)).length
	const totalTokens = Math.max(tokens1.length, tokens2.length)
	
	return matches / totalTokens
}

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
		// Analyze code smells
		const codeSmellAnalysis = analyzeCodeSmells(code)
		
		const smellsSummary = codeSmellAnalysis.detectedSmells.length > 0 
			? codeSmellAnalysis.detectedSmells.map(smell => 
				`- ${smell.type}${smell.function ? ` in '${smell.function}'` : ''}${smell.functions ? ` between '${smell.functions.join("' and '")}'` : ''}: ${smell.details}`
			).join('\n')
			: 'No major code smells detected'

		const prompt = `You are an expert code refactoring assistant specializing in code smell detection and SOLID principle compliance.

CRITICAL INSTRUCTION:
Take the given code and apply ALL refactoring techniques to ELIMINATE ALL CODE SMELLS, including removing ALL comments. The refactored code MUST follow SOLID principles. Return the final refactored code.

DETECTED CODE SMELLS to refactor:
${smellsSummary}

Your task is to comprehensively refactor the following ${language} code with these mandatory goals:
1. Apply all refactoring techniques to eliminate ALL identified code smells
2. Extract long methods into smaller, focused functions (single responsibility principle)
3. Eliminate duplicate code by creating shared utilities or helper functions
4. REMOVE ALL COMMENTS - code must be self-documenting through clear, meaningful names
5. Apply SOLID principles throughout (Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion)
6. Use crystal-clear variable and function names that eliminate the need for comments
7. Improve code readability, maintainability, and performance
8. Ensure NO code smells remain in the refactored version
9. Make the code production-ready and professional

REQUIREMENTS:
- MUST eliminate ALL code smells detected
- MUST remove EVERY comment and make code self-documenting
- MUST maintain original functionality and behavior
- MUST preserve all functions (extract/combine as needed, don't remove)
- MUST follow ${language} best practices and conventions
- MUST result in clean, maintainable, professional-grade code

Format your response exactly as:
REFACTORED_CODE:
\`\`\`
[refactored code here]
\`\`\`

EXPLANATION:
[detailed explanation of all code smells fixed and refactoring techniques applied]

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

		res.json({ 
			refactoredCode, 
			explanation, 
			language,
			codeSmellAnalysis: {
				detected: codeSmellAnalysis.detectedSmells,
				summary: codeSmellAnalysis.summary
			}
		})
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


