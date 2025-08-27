// Dynamic import to avoid SSR issues
let pdfjs: any = null

async function initializePdfJs() {
  if (typeof window !== 'undefined' && !pdfjs) {
    pdfjs = await import('pdfjs-dist')
    // Use the copied worker file from public directory
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    console.log('✅ PDF.js worker configured with local file:', pdfjs.GlobalWorkerOptions.workerSrc)
  }
  return pdfjs
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Starting PDF text extraction for:', file.name)
    
    // Initialize PDF.js dynamically
    const pdfjsLib = await initializePdfJs()
    if (!pdfjsLib) {
      throw new Error('PDF.js could not be initialized - running in server environment')
    }
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    console.log('✅ File converted to ArrayBuffer, size:', arrayBuffer.byteLength, 'bytes')
    
    // Load PDF document with error handling for worker issues
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    })
    
    const pdf = await loadingTask.promise
    
    console.log('✅ PDF loaded successfully, pages:', pdf.numPages)
    
    let fullText = ''
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`📖 Processing page ${pageNum}/${pdf.numPages}`)
      
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      const pageText = textContent.items
        .filter((item: any) => item.str && item.str.trim())
        .map((item: any) => item.str)
        .join(' ')
      
      if (pageText.trim()) {
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`
        console.log(`✅ Page ${pageNum} extracted: ${pageText.length} characters`)
      } else {
        console.log(`⚠️ Page ${pageNum} has no readable text`)
      }
    }
    
    if (!fullText.trim()) {
      throw new Error('No readable text found in PDF - the document may be image-based or password protected')
    }
    
    console.log('✅ PDF text extraction complete. Total characters:', fullText.length)
    return fullText.trim()
  } catch (error) {
    console.error('❌ Error parsing PDF:', error)
    throw new Error(`Failed to parse PDF file "${file.name}": ${error.message}`)
  }
}

export async function extractTextFromDocument(file: File): Promise<string> {
  try {
    console.log('🔍 Extracting text from document:', { name: file.name, type: file.type, size: file.size })
    
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file)
    } else if (file.type === 'text/plain') {
      const text = await file.text()
      console.log('✅ Plain text file extracted:', text.length, 'characters')
      return text
    } else if (file.type.includes('word') || file.type.includes('document')) {
      // For Word documents, we would need additional parsing
      throw new Error(`Word document parsing not yet implemented. Please convert "${file.name}" to PDF or plain text.`)
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Supported formats: PDF, TXT`)
    }
  } catch (error) {
    console.error('❌ Error extracting text from document:', error)
    throw error
  }
}