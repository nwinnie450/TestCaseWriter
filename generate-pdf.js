const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generatePDF() {
    try {
        // Read the markdown file
        const markdownContent = fs.readFileSync('USER_GUIDE.md', 'utf8');
        
        // Convert markdown to HTML
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Case Writer Agent - User Guide</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #0066CC;
            font-weight: 600;
            margin-top: 2em;
            margin-bottom: 0.5em;
        }
        h1 {
            font-size: 2.5em;
            border-bottom: 3px solid #0066CC;
            padding-bottom: 0.3em;
        }
        h2 {
            font-size: 2em;
            border-bottom: 2px solid #E5E7EB;
            padding-bottom: 0.3em;
        }
        h3 {
            font-size: 1.5em;
            color: #374151;
        }
        h4 {
            font-size: 1.25em;
            color: #6B7280;
        }
        code {
            background-color: #F3F4F6;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Fira Code', 'Consolas', monospace;
            font-size: 0.9em;
        }
        pre {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 1em;
            overflow-x: auto;
        }
        pre code {
            background: none;
            padding: 0;
        }
        ul, ol {
            padding-left: 2em;
        }
        li {
            margin-bottom: 0.5em;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #E5E7EB;
            padding: 0.75em;
            text-align: left;
        }
        th {
            background-color: #F9FAFB;
            font-weight: 600;
        }
        .toc {
            background-color: #F9FAFB;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 1.5em;
            margin: 2em 0;
        }
        .toc h2 {
            margin-top: 0;
            border: none;
            font-size: 1.5em;
        }
        .feature-highlight {
            background-color: #EFF6FF;
            border-left: 4px solid #0066CC;
            padding: 1em;
            margin: 1em 0;
        }
        .warning {
            background-color: #FFFBEB;
            border-left: 4px solid #F59E0B;
            padding: 1em;
            margin: 1em 0;
        }
        .success {
            background-color: #F0FDF4;
            border-left: 4px solid #22C55E;
            padding: 1em;
            margin: 1em 0;
        }
        @page {
            size: A4;
            margin: 20mm;
        }
        @media print {
            body {
                max-width: none;
                margin: 0;
                padding: 0;
            }
        }
    </style>
</head>
<body>
${markdownToHTML(markdownContent)}
</body>
</html>`;

        // Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Set content and generate PDF
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            },
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: `
                <div style="font-size: 10px; margin: 0 auto; width: 100%; text-align: center;">
                    Test Case Writer Agent - User Guide | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                </div>`
        });
        
        // Save PDF
        fs.writeFileSync('Test_Case_Writer_User_Guide.pdf', pdf);
        
        await browser.close();
        
        console.log('✅ PDF generated successfully: Test_Case_Writer_User_Guide.pdf');
        
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

function markdownToHTML(markdown) {
    return markdown
        // Headers
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        
        // Bold and Italic
        .replace(/\*\*\*(.*)\*\*\*/gim, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\*(.*)\*/gim, '<em>$1</em>')
        
        // Code blocks
        .replace(/\`\`\`([\\s\\S]*?)\`\`\`/gim, '<pre><code>$1</code></pre>')
        .replace(/\`([^\`]*)\`/gim, '<code>$1</code>')
        
        // Links
        .replace(/\[([^\]]*)\]\(([^\)]*)\)/gim, '<a href="$2">$1</a>')
        
        // Line breaks
        .replace(/\\n\\n/gim, '</p><p>')
        .replace(/\\n/gim, '<br>')
        
        // Wrap in paragraphs
        .replace(/^([^<].*)$/gim, '<p>$1</p>')
        
        // Lists
        .replace(/^\\s*\\* (.*)$/gim, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
        
        // Clean up
        .replace(/<\/ul>\\s*<ul>/gim, '')
        .replace(/<p><\/p>/gim, '')
        .replace(/<p>(<h[1-6]>)/gim, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/gim, '$1');
}

// Run the function
generatePDF();