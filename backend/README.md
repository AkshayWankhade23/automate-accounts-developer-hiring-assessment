# Receipt Processor Backend

A Django-based backend service for processing, validating, and managing receipt data.

## Overview

This backend application provides a RESTful API for uploading, validating, and processing receipt documents. It extracts information from receipts and stores structured data for easy retrieval and management.

## Features

- PDF receipt upload and storage
- Receipt data extraction and validation
- RESTful API for receipt management
- Cross-origin resource sharing (CORS) support
- Secure authentication and authorization

## Technology Stack

- **Python 3.12**: Core programming language
- **Django 5.2.3**: Web framework
- **Django REST Framework 3.16.0**: API development
- **Groq 0.29.0**: AI integration for receipt processing
- **PyPDF2 3.0.1**: PDF parsing
- **Pydantic 2.11.7**: Data validation
- **python-magic-bin 0.4.14**: File type detection

## Prerequisites

- Python 3.12 or higher
- pip (Python package manager)
- Virtual environment tool (venv)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd project/backend
```

2. **Create and activate a virtual environment**

```bash
python -m venv venv_new
venv_new\Scripts\activate  # On Windows
source venv_new/bin/activate  # On macOS/Linux
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Apply database migrations**

```bash
python manage.py migrate
```

5. **Create a superuser (admin)**

```bash
python manage.py createsuperuser
```

## Configuration

1. Create a `.env` file in the project root with the following variables:

```
SECRET_KEY=your_django_secret_key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
GROQ_API_KEY=your_groq_api_key
```

2. Configure your database settings in `receipt_processor/settings.py` if you want to use a database other than the default SQLite.

## Running the Server

```bash
python manage.py runserver
```

The server will start at http://127.0.0.1:8000/

## API Endpoints

- **POST /api/receipts/upload/**: Upload a receipt file
- **POST /api/receipts/validate/{id}/**: Validate an uploaded receipt
- **POST /api/receipts/process/{id}/**: Process a validated receipt
- **GET /api/receipts/**: List all receipts
- **GET /api/receipts/{id}/**: Get details of a specific receipt

## Development

### Running Tests

```bash
python manage.py test
```

### Code Formatting

We use Black for code formatting:

```bash
black .
```

## Troubleshooting

### Common Issues

- **ImportError: failed to find libmagic**: Install the python-magic-bin package which includes the necessary DLLs for Windows.
- **ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'**: Reinstall pydantic with `pip install --no-binary pydantic`.

## License

[MIT License](LICENSE)
