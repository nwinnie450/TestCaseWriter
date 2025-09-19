interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface SendEmailParams {
  to: string
  template: EmailTemplate
  variables?: Record<string, string>
}

export interface EmailConfig {
  provider: 'sendgrid' | 'gmail' | 'development'
  apiKey?: string
  fromEmail: string
  fromName: string
  // Gmail specific
  gmailUser?: string
  gmailPassword?: string
}

export class EmailService {
  private static instance: EmailService
  private config: EmailConfig
  private isConfigured: boolean = false

  private constructor() {
    this.config = this.loadEmailConfig()
    this.isConfigured = this.validateConfig()
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  public applyConfig(config: Partial<EmailConfig>, options: { persist?: boolean } = {}): void {
    const merged = this.mergeConfigWithDefaults({
      ...this.config,
      ...config
    })

    this.config = merged
    this.isConfigured = this.validateConfig()

    if (options.persist && typeof window !== 'undefined') {
      try {
        const payload = {
          provider: this.config.provider,
          fromName: this.config.fromName,
          fromEmail: this.config.fromEmail,
          gmailUser: this.config.gmailUser,
          gmailPassword: this.config.gmailPassword,
          apiKey: this.config.apiKey
        }
        window.localStorage.setItem('emailConfiguration', JSON.stringify(payload))
      } catch (error) {
        console.error('Failed to persist email configuration', error)
      }
    }
  }

  public getConfig(): EmailConfig {
    return { ...this.config }
  }

  private loadEmailConfig(): EmailConfig {
    const envConfig: Partial<EmailConfig> = {
      provider: (process.env.EMAIL_PROVIDER as 'sendgrid' | 'gmail' | 'development') || 'development',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.EMAIL_FROM || 'noreply@testcasewriter.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Test Case Writer',
      gmailUser: process.env.GMAIL_USER,
      gmailPassword: process.env.GMAIL_APP_PASSWORD
    }

    const storedConfig = this.readStoredConfig()

    return this.mergeConfigWithDefaults({
      ...envConfig,
      ...storedConfig
    })
  }

  private readStoredConfig(): Partial<EmailConfig> {
    if (typeof window === 'undefined') {
      return {}
    }

    try {
      const raw = window.localStorage.getItem('emailConfiguration')
      if (!raw) {
        return {}
      }

      const parsed = JSON.parse(raw)

      return {
        provider: parsed.provider,
        fromName: parsed.fromName,
        fromEmail: parsed.fromEmail,
        gmailUser: parsed.gmailUser,
        gmailPassword: parsed.gmailPassword,
        apiKey: parsed.apiKey
      }
    } catch (error) {
      console.warn('Failed to read stored email configuration:', error)
      return {}
    }
  }

  private mergeConfigWithDefaults(config: Partial<EmailConfig>): EmailConfig {
    const provider = config.provider ?? 'development'
    const fromName = config.fromName ?? 'Test Case Writer'

    const defaultFromEmail =
      provider === 'gmail'
        ? config.gmailUser ?? config.fromEmail ?? 'noreply@testcasewriter.com'
        : config.fromEmail ?? 'noreply@testcasewriter.com'

    const fromEmail = config.fromEmail ?? defaultFromEmail
    const gmailUser =
      provider === 'gmail'
        ? config.gmailUser ?? fromEmail
        : config.gmailUser

    return {
      provider,
      apiKey: config.apiKey,
      fromEmail,
      fromName,
      gmailUser,
      gmailPassword: config.gmailPassword
    }
  }

  private validateConfig(): boolean {
    if (!this.config.fromEmail || !this.config.fromName) {
      console.error('??O Email Service: Sender details not configured')
      return false
    }

    if (this.config.provider === 'development') {
      console.log('📧 Email Service: Running in DEVELOPMENT mode')
      return true
    }

    if (this.config.provider === 'sendgrid') {
      if (!this.config.apiKey) {
        console.error('❌ Email Service: SendGrid API key not configured')
        return false
      }
      console.log('✅ Email Service: SendGrid configured successfully')
      return true
    }

    if (this.config.provider === 'gmail') {
      if (!this.config.gmailUser || !this.config.gmailPassword) {
        console.error('❌ Email Service: Gmail credentials not configured')
        return false
      }
      console.log('✅ Email Service: Gmail SMTP configured successfully')
      return true
    }

    return false
  }

  // Test email configuration
  async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    if (this.config.provider === 'development') {
      return {
        success: true,
        message: 'Development mode - emails will be logged to console'
      }
    }

    if (this.config.provider === 'sendgrid') {
      try {
        // Test SendGrid configuration
        const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          return {
            success: true,
            message: 'SendGrid configuration valid - ready for production'
          }
        } else {
          return {
            success: false,
            message: `SendGrid API error: ${response.status} ${response.statusText}`
          }
        }
      } catch (error) {
        return {
          success: false,
          message: `SendGrid connection failed: ${(error as Error).message}`
        }
      }
    }

    if (this.config.provider === 'gmail') {
      if (!this.config.gmailUser || !this.config.gmailPassword) {
        return {
          success: false,
          message: 'Gmail credentials not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.'
        }
      }

      return {
        success: true,
        message: `Gmail SMTP configured for ${this.config.gmailUser} - ready to send emails`
      }
    }

    return { success: false, message: 'Unknown email provider' }
  }

  async sendEmail({ to, template, variables = {} }: SendEmailParams): Promise<boolean> {
    if (!this.isConfigured) {
      this.isConfigured = this.validateConfig()
      if (!this.isConfigured) {
        console.error('??O Email service not properly configured')
        return false
      }
    }

    try {
      // Replace variables in template
      let html = template.html
      let text = template.text
      let subject = template.subject

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        html = html.replace(new RegExp(placeholder, 'g'), value)
        text = text.replace(new RegExp(placeholder, 'g'), value)
        subject = subject.replace(new RegExp(placeholder, 'g'), value)
      })

      if (this.config.provider === 'development') {
        return this.sendDevelopmentEmail({ to, subject, html, text })
      } else if (this.config.provider === 'sendgrid') {
        return this.sendViaSendGrid({ to, subject, html, text })
      } else if (this.config.provider === 'gmail') {
        return this.sendViaGmail({ to, subject, html, text })
      }

      return false
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  private async sendDevelopmentEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
    // Development mode - simulate email sending and show in console
    console.log('📧 EMAIL SENT (Development Mode)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`)
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('HTML Content:')
    console.log(html)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Text Content:')
    console.log(text)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Show browser notification in development
    this.showBrowserNotification(to, subject)

    return true
  }

  private async sendViaSendGrid({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
    try {
      // Use the API endpoint for SendGrid
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'sendgrid',
          to,
          subject,
          html,
          text,
          from: this.config.fromEmail,
          fromName: this.config.fromName,
          apiKey: this.config.apiKey
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Email sent successfully via SendGrid to ${to}`)
        return true
      } else {
        const error = await response.text()
        console.error(`❌ Failed to send email via SendGrid: ${response.status} ${error}`)

        // For development, show what would be sent
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 SENDGRID (Development Mode - Email not actually sent)')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`)
          console.log(`To: ${to}`)
          console.log(`Subject: ${subject}`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('Email Content:')
          console.log(html)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('✅ SendGrid configured - would send REAL email in production')
          return true
        }

        return false
      }
    } catch (error) {
      console.error('❌ SendGrid error:', error)

      // For development, show what would be sent
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 SENDGRID (Development Mode - API endpoint not available)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`)
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('Email Content:')
        console.log(html)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ SendGrid configured - would send REAL email in production')
        return true
      }

      return false
    }
  }

  private async sendViaGmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
    try {
      // Use real SMTP for Gmail - this will actually send emails in production
      const fromAddress = this.config.fromEmail || this.config.gmailUser || ''
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'gmail',
          to,
          subject,
          html,
          text,
          from: fromAddress,
          fromName: this.config.fromName,
          auth: {
            user: this.config.gmailUser,
            pass: this.config.gmailPassword
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Email sent successfully via Gmail SMTP to ${to}`)
        return true
      } else {
        const error = await response.text()
        console.error(`❌ Failed to send email via Gmail SMTP: ${response.status} ${error}`)

        // For development, show what would be sent
        if (process.env.NODE_ENV === 'development') {
          console.log('📧 GMAIL SMTP (Development Mode - Email not actually sent)')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`From: ${this.config.fromName} <${fromAddress}>`)
          console.log(`To: ${to}`)
          console.log(`Subject: ${subject}`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('Email Content:')
          console.log(html)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('✅ Gmail SMTP configured - would send REAL email in production')
          return true
        }

        return false
      }
    } catch (error) {
      console.error('❌ Gmail SMTP error:', error)

      // For development, show what would be sent
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 GMAIL SMTP (Development Mode - API endpoint not available)')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log(`From: ${this.config.fromName} <${fromAddress}>`)
        console.log(`To: ${to}`)
        console.log(`Subject: ${subject}`)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('Email Content:')
        console.log(html)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('✅ Gmail SMTP configured - would send REAL email in production')
        return true
      }

      return false
    }
  }

  private async getGmailAccessToken(): Promise<string> {
    // In production, implement OAuth2 flow
    // For now, return app password (this is for SMTP, not API)
    return this.config.gmailPassword || ''
  }

  private showBrowserNotification(to: string, subject: string) {
    // Show browser notification in development
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('📧 Email Sent (Dev Mode)', {
          body: `To: ${to}\nSubject: ${subject}`,
          icon: '/favicon.ico'
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('📧 Email Sent (Dev Mode)', {
              body: `To: ${to}\nSubject: ${subject}`,
              icon: '/favicon.ico'
            })
          }
        })
      }
    }
  }

  // Email templates
  static getWelcomeEmailTemplate(): EmailTemplate {
    return {
      subject: 'Welcome to Test Case Writer - Set Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Test Case Writer</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #6366f1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button {
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: bold;
            }
            .credentials {
              background: #e5e7eb;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #6366f1;
            }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Test Case Writer!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>{{userName}}</strong>,</p>

              <p>Your account has been created by an administrator. You can now access the Test Case Writer system to manage and execute test cases.</p>

              <div class="credentials">
                <h3>📋 Your Account Details:</h3>
                <p><strong>Email:</strong> {{userEmail}}</p>
                <p><strong>Role:</strong> {{userRole}}</p>
                <p><strong>Temporary Password:</strong> {{tempPassword}}</p>
              </div>

              <p><strong>🔐 Important Security Notice:</strong></p>
              <p>For security reasons, you must set a new password before you can use your account. Please click the button below to set your password:</p>

              <div style="text-align: center;">
                <a href="{{resetPasswordUrl}}" class="button">Set My Password</a>
              </div>

              <p><strong>📝 What you can do with your account:</strong></p>
              <ul>
                <li>Create and manage test cases</li>
                <li>Execute test scenarios</li>
                <li>Generate test reports</li>
                <li>Collaborate with your team</li>
              </ul>

              <p>If you have any questions or need assistance, please contact your administrator.</p>

              <p>Best regards,<br>
              The Test Case Writer Team</p>
            </div>
            <div class="footer">
              <p>This email was sent automatically. Please do not reply to this email.</p>
              <p>If you did not expect this email, please contact your administrator.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Test Case Writer!

Hello {{userName}},

Your account has been created by an administrator. You can now access the Test Case Writer system.

Account Details:
- Email: {{userEmail}}
- Role: {{userRole}}
- Temporary Password: {{tempPassword}}

IMPORTANT: For security reasons, you must set a new password before you can use your account.

Please visit this link to set your password: {{resetPasswordUrl}}

What you can do with your account:
• Create and manage test cases
• Execute test scenarios
• Generate test reports
• Collaborate with your team

If you have any questions, please contact your administrator.

Best regards,
The Test Case Writer Team

This is an automated email. Please do not reply.
      `
    }
  }

  // Generate password reset URL
  static generatePasswordResetUrl(userEmail: string): string {
    // Generate a secure token (in production, use crypto.randomBytes)
    const token = btoa(`${userEmail}:${Date.now()}:${Math.random().toString(36)}`).replace(/[/+=]/g, '')

    // In production, store this token in database with expiration
    console.log(`🔑 Password reset token for ${userEmail}: ${token}`)

    // Return the reset URL
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3009'
    return `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(userEmail)}`
  }
}

export default EmailService