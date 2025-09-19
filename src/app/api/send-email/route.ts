import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface EmailRequest {
  provider: 'gmail' | 'sendgrid'
  to: string
  subject: string
  html: string
  text: string
  from: string
  fromName: string
  auth?: {
    user: string
    pass: string
  }
  apiKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { provider, to, subject, html, text, from, fromName, auth, apiKey } = body

    // Validate required fields
    if (!to || !subject || !html || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, html, text' },
        { status: 400 }
      )
    }

    if (provider === 'gmail') {
      return await sendViaGmailSMTP({ to, subject, html, text, from, fromName, auth })
    } else if (provider === 'sendgrid') {
      return await sendViaSendGrid({ to, subject, html, text, from, fromName, apiKey })
    } else {
      return NextResponse.json(
        { error: 'Unsupported email provider' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendViaGmailSMTP({
  to,
  subject,
  html,
  text,
  from,
  fromName,
  auth
}: {
  to: string
  subject: string
  html: string
  text: string
  from: string
  fromName: string
  auth?: { user: string; pass: string }
}) {
  try {
    if (!auth?.user || !auth?.pass) {
      return NextResponse.json(
        { error: 'Gmail credentials not provided' },
        { status: 400 }
      )
    }

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: auth.user,
        pass: auth.pass // This should be the Gmail App Password
      }
    })

    // Send email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: to,
      subject: subject,
      text: text,
      html: html
    })

    console.log('Gmail SMTP - Email sent successfully:', info.messageId)
    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      provider: 'gmail-smtp'
    })

  } catch (error) {
    console.error('Gmail SMTP error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email via Gmail SMTP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function sendViaSendGrid({
  to,
  subject,
  html,
  text,
  from,
  fromName,
  apiKey
}: {
  to: string
  subject: string
  html: string
  text: string
  from: string
  fromName: string
  apiKey?: string
}) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SendGrid API key not provided' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: to }],
            subject: subject
          }
        ],
        from: {
          email: from,
          name: fromName
        },
        content: [
          {
            type: 'text/plain',
            value: text
          },
          {
            type: 'text/html',
            value: html
          }
        ]
      })
    })

    if (response.ok) {
      console.log('SendGrid - Email sent successfully')
      return NextResponse.json({
        success: true,
        provider: 'sendgrid'
      })
    } else {
      const errorText = await response.text()
      console.error('SendGrid API error:', errorText)
      return NextResponse.json(
        {
          error: 'Failed to send email via SendGrid',
          details: errorText
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('SendGrid error:', error)
    return NextResponse.json(
      {
        error: 'Failed to send email via SendGrid',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}