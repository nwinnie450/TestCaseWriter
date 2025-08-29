'use client'

// Dynamic import to avoid SSR issues
let pdfjs: any = null

async function initializePdfJs() {
  if (typeof window !== 'undefined' && !pdfjs) {
    console.log('📦 Importing PDF.js...')
    pdfjs = await import('pdfjs-dist')
    
    // Configure worker with local file for reliability
    try {
      // First try: use local worker file  
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
      console.log('✅ PDF.js worker configured with local file:', pdfjs.GlobalWorkerOptions.workerSrc)
    } catch (error) {
      // Fallback: use CDN worker with correct version
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.54/build/pdf.worker.min.js'
      console.log('⚠️ Using CDN worker as fallback:', pdfjs.GlobalWorkerOptions.workerSrc)
    }
  }
  return pdfjs
}

// Simple PDF parser using pdfjs-dist without complex webpack configuration
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Starting simple PDF text extraction for:', file.name)
    
    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF parsing only available on client side')
    }

    // Initialize PDF.js dynamically
    const pdfjsLib = await initializePdfJs()
    if (!pdfjsLib) {
      throw new Error('PDF.js could not be initialized - running in server environment')
    }
    
    console.log('🔧 PDF.js loaded, creating file URL...')
    
    // Create blob URL for the file
    const fileUrl = URL.createObjectURL(file)
    
    try {
      console.log('📖 Loading PDF document...')
      const loadingTask = pdfjsLib.getDocument({
        url: fileUrl,
        verbosity: 0 // Reduce logging noise
      })
      
      const pdf = await loadingTask.promise
      console.log(`📄 PDF loaded successfully: ${pdf.numPages} pages`)
      
      let fullText = ''
      
      // Extract text from each page
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        console.log(`📃 Processing page ${pageNumber}/${pdf.numPages}`)
        
        try {
          const page = await pdf.getPage(pageNumber)
          const textContent = await page.getTextContent()
          
          // Combine all text items from the page
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()
          
          if (pageText) {
            fullText += pageText + '\n\n'
            console.log(`✅ Page ${pageNumber}: Extracted ${pageText.length} characters`)
          } else {
            console.log(`⚠️ Page ${pageNumber}: No text found`)
          }
          
        } catch (pageError) {
          console.error(`❌ Error processing page ${pageNumber}:`, pageError)
          // Continue with next page instead of failing completely
        }
      }
      
      console.log(`✅ PDF text extraction completed: ${fullText.length} characters total`)
      
      if (!fullText.trim()) {
        throw new Error('No text content found in PDF. The PDF might contain only images or be password protected.')
      }
      
      return fullText.trim()
      
    } finally {
      // Clean up blob URL
      URL.revokeObjectURL(fileUrl)
    }
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(`PDF processing failed: ${error}`)
  }
}

// Extract text from various document types
export async function extractTextFromDocument(file: File): Promise<{ text: string; fileName: string }> {
  console.log('📄 Starting document text extraction for:', file.name, 'Type:', file.type)
  
  try {
    const fileName = file.name
    let text = ''
    
    // Handle different file types
    if (file.type === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
      console.log('📄 Processing as PDF file')
      text = await extractTextFromPDF(file)
    } else if (file.type.startsWith('text/') || fileName.toLowerCase().endsWith('.txt') || fileName.toLowerCase().endsWith('.md')) {
      console.log('📄 Processing as text file')
      text = await file.text()
    } else {
      // Try to read as text anyway (for unknown types)
      console.log('📄 Processing as generic text file')
      text = await file.text()
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text content could be extracted from the file')
    }
    
    console.log(`✅ Document processing complete: ${text.length} characters extracted`)
    
    return {
      text: text.trim(),
      fileName
    }
    
  } catch (error) {
    console.error('❌ Document processing failed:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('PDF processing failed')) {
        console.error('❌ PDF processing failed, trying fallback method:', error.message)
        throw new Error(`PDF processing failed: ${error.message}. Please try a different file or copy the text manually.`)
      }
      throw error
    }
    
    throw new Error(`Document processing failed: ${error}. Please try a different file format.`)
  }
}