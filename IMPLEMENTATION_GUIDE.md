# Remorph - AI Code Refactoring Tool

## Implementation Summary

This document outlines the implementation of Stories 2, 3, and 4 for the Remorph code refactoring application.

### Features Implemented

#### Story 2: Refactor Button with Gemini API Integration
- **Refactor Button**: Triggers API call to Google Gemini API when clicked
- **AI Refactoring**: Uses Gemini 1.5 Flash model to analyze and refactor code
- **Response Handling**: Displays refactored code in the output panel

#### Story 3: File Upload Functionality
- **File Upload Input**: Users can upload source code files directly
- **Auto-Language Detection**: Automatically detects programming language from file extension
- **Supported Extensions**: `.js`, `.ts`, `.py`, `.java`, `.cs`, `.cpp`, `.go`, `.rb`, `.php`

#### Story 4: AI Explanation
- **Change Explanation**: Displays a brief explanation of refactoring changes
- **Formatted Display**: Shows explanation in a highlighted box above the refactored code

---

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Step 1: Get a Free Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key

### Step 2: Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Update the `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   PORT=3000
   ```

3. Install dependencies (if not already done):
   ```bash
   npm install
   ```

### Step 3: Start the Backend Server

```bash
npm start
```

You should see:
```
Backend server listening on port 3000
```

### Step 4: Start the Frontend Development Server

In a new terminal, navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

The frontend will typically be available at `http://localhost:5173`

---

## How to Use

### Method 1: Paste Code
1. Select a programming language from the dropdown
2. Paste your source code into the text area
3. Click the "Refactor" button
4. View the refactored code and explanation

### Method 2: Upload File
1. Click "Or upload a file" button
2. Select a source code file (extensions: .js, .ts, .py, .java, .cs, .cpp, .go, .rb, .php)
3. Language will auto-detect based on file extension
4. Click "Refactor" button
5. View results

---

## Technical Details

### Backend Changes
- Integrated `@google/generative-ai` package
- Enhanced `/api/refactor` endpoint to:
  - Accept source code and language
  - Call Gemini API with formatted prompt
  - Parse response for code and explanation
  - Return both refactored code and explanation

### Frontend Changes
- Added `explanation` state to component
- Implemented file upload handler with auto-language detection
- Enhanced API response handling to capture explanation
- Added explanation display box with styling
- File input with dashed border styling

### Styling
- Added `.field-file` class for file input styling
- Added `.explanation-box`, `.explanation-title`, `.explanation-text` classes for explanation display
- Green highlight for explanation box to distinguish from other content

---

## API Response Format

The backend returns a JSON response:
```json
{
  "refactoredCode": "refactored code here",
  "explanation": "brief explanation of changes",
  "language": "javascript"
}
```

---

## Error Handling

- Missing GEMINI_API_KEY: Returns 500 error with message
- Invalid request format: Returns 400 error with details
- API failures: Catches errors and returns 500 status with user-friendly message
- Frontend validation: Disables refactor button until language and code are provided

---

## Notes

- Free Gemini API has rate limits - be mindful when testing
- Supported languages: JavaScript, TypeScript, Python, Java, C#, C++, Go, Ruby, PHP
- For best results, keep code snippets under 10KB
- The explanation is formatted to be concise (2-3 sentences)

