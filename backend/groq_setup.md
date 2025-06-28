# Setting up Groq API for Receipt Processing

## Overview

This project uses the Groq API with the LLaMA 4 Scout model to extract structured data from receipt PDFs. This guide explains how to set up the necessary environment variables to use this functionality.

## Prerequisites

1. Sign up for a Groq account at https://console.groq.com/
2. Generate an API key from your Groq account settings

## Setting Environment Variables

### On Windows (PowerShell)

```powershell
# Set the environment variable for the current session
$env:GROQ_API_KEY = "your-api-key-here"

# To make it permanent for your user account
[Environment]::SetEnvironmentVariable("GROQ_API_KEY", "your-api-key-here", "User")
```

### On Windows (Command Prompt)

```cmd
# Set the environment variable for the current session
set GROQ_API_KEY=your-api-key-here

# To make it permanent for your user account
setx GROQ_API_KEY "your-api-key-here"
```

### On macOS/Linux

```bash
# Set the environment variable for the current session
export GROQ_API_KEY="your-api-key-here"

# To make it permanent, add to your shell profile file (~/.bashrc, ~/.zshrc, etc.)
echo 'export GROQ_API_KEY="your-api-key-here"' >> ~/.bashrc
```

## Testing the Environment Variable

After setting the environment variable, you can test if it's correctly set by running:

```python
import os
print(os.environ.get('GROQ_API_KEY', 'Not found'))
```

## Usage in Django Settings (Alternative Approach)

For a more secure setup, you can add the Groq API key to your Django settings:

1. Edit your `settings.py` file:

```python
# Add Groq API settings
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
```

2. Then in `views.py`, use:

```python
from django.conf import settings

# Use the API key from settings
client = Groq(api_key=settings.GROQ_API_KEY)
```

## Notes

- Never hardcode your API key directly in the code
- Don't commit your actual API key to version control
- Consider using a .env file with python-dotenv for development
