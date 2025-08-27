# OpenAI Integration Setup Guide

## Overview
The Test Case Writer now supports real AI-powered test case generation using OpenAI's GPT models. Users can configure their API keys and generate intelligent, context-aware test cases from requirements documents.

## Features

### 🤖 AI-Powered Generation
- **Real Document Analysis**: AI reads and understands uploaded requirements documents
- **Intelligent Test Creation**: Generates test cases based on actual document content
- **Template Compliance**: Follows your custom test case template structure
- **Configurable Parameters**: Control model, temperature, and token limits

### ⚙️ Configuration Options
- **AI Provider**: OpenAI (GPT-4, GPT-3.5), Claude, or Local models
- **Model Selection**: Choose from GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Custom Prompts**: Define specific instructions for test case generation
- **Generation Settings**: Control coverage, negative tests, edge cases

## Setup Instructions

### 1. Get OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" section
4. Create a new API key
5. Copy the key (keep it secure - you won't see it again)

### 2. Configure in Application
1. Go to **Settings** → **AI Configuration**
2. Select "OpenAI (GPT-4)" as provider
3. Paste your API key in the "API Key" field
4. Choose your preferred model (GPT-4 recommended)
5. Adjust temperature and max tokens as needed
6. Click "Save AI Configuration"

### 3. Generate Test Cases
1. Upload requirements documents (PDF, DOCX, TXT)
2. Select your test case template
3. Configure generation settings
4. Click "Generate Test Cases"
5. AI will analyze documents and create test cases

## Configuration Details

### AI Provider Options
- **OpenAI (GPT-4)**: Most powerful, best for complex requirements
- **OpenAI (GPT-3.5)**: Faster, more cost-effective for simple cases
- **Claude**: Alternative AI provider (requires separate API key)
- **Local**: Run models locally with Ollama (advanced users)

### Model Parameters
- **Temperature**: Controls creativity (0.0 = focused, 2.0 = creative)
- **Max Tokens**: Maximum response length (higher = more detailed)
- **Custom Prompt**: Specific instructions for your use case

### Generation Settings
- **Coverage Level**: Comprehensive, Focused, or Minimal
- **Negative Tests**: Include error condition testing
- **Edge Cases**: Test boundary conditions
- **Max Test Cases**: Limit total number generated

## Cost Estimation

### OpenAI Pricing (as of 2024)
- **GPT-4**: ~$0.03 per 1K tokens
- **GPT-3.5**: ~$0.002 per 1K tokens
- **Typical Usage**: 50 test cases ≈ $0.50-2.00

### Cost Optimization Tips
- Use GPT-3.5 for simple requirements
- Set reasonable max token limits
- Batch multiple documents together
- Use focused coverage for large projects

## Security & Privacy

### Data Handling
- API keys stored locally in browser
- Document content sent to OpenAI for processing
- No data stored on our servers
- Follow OpenAI's data usage policies

### Best Practices
- Use dedicated API keys for testing
- Monitor API usage and costs
- Don't share API keys in code
- Rotate keys periodically

## Troubleshooting

### Common Issues

#### "No OpenAI API key configured"
- Go to Settings → AI Configuration
- Add your API key and save

#### "OpenAI API Error: Invalid API key"
- Check your API key is correct
- Ensure you have sufficient credits
- Verify your OpenAI account is active

#### "Network error: Unable to connect"
- Check your internet connection
- Verify OpenAI API is accessible
- Try again in a few minutes

#### "Rate limit exceeded"
- Wait before trying again
- Consider upgrading your OpenAI plan
- Use GPT-3.5 for faster responses

### Fallback Behavior
- If AI generation fails, falls back to mock generation
- Mock generation provides sample test cases
- Perfect for testing the application flow

## Advanced Usage

### Custom Prompts
Write specific instructions for your domain:
```
Generate test cases for a healthcare application. Focus on HIPAA compliance, 
data security, and patient privacy. Include edge cases for medical record access.
```

### Template Integration
- AI respects your custom template structure
- Generates test cases matching your format
- Maintains consistency with existing processes

### Batch Processing
- Upload multiple documents at once
- AI analyzes all documents together
- Creates comprehensive test coverage

## Support

### Getting Help
- Check this documentation first
- Review OpenAI's API documentation
- Contact support for application issues
- Use mock generation for testing

### Feature Requests
- Suggest improvements via GitHub
- Request additional AI providers
- Ask for new template types
- Propose generation enhancements

## Future Enhancements

### Planned Features
- **Multi-language Support**: Generate test cases in different languages
- **Test Data Generation**: AI creates realistic test data
- **Automated Execution**: Run generated tests automatically
- **Integration APIs**: Connect with test management tools
- **Advanced Analytics**: Track generation quality and patterns

---

**Note**: This integration requires an active OpenAI account and API key. The application will fall back to mock generation if no valid API key is configured.
