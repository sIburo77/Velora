# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = 'Velora'
copyright = '2026, Абубакаров Т.С.-Э., Коваленко К.А., Шестопалов Т.В., Никитин И.Н.'
author = 'Абубакаров Т.С.-Э., Коваленко К.А., Шестопалов Т.В., Никитин И.Н.'

# -- Path setup --------------------------------------------------------------
import os
import sys
sys.path.insert(0, os.path.abspath('..'))

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = ['sphinx.ext.autodoc', 'sphinx.ext.viewcode']

autodoc_mock_imports = [
    'fastapi', 'uvicorn', 'sqlalchemy', 'asyncpg', 'alembic',
    'pydantic', 'pydantic_settings', 'jose', 'passlib', 'bcrypt',
    'multipart', 'dotenv', 'aiosmtplib', 'google', 'aiofiles',
    'websockets', 'starlette', 'httpx',
    'app.api.dependencies', 'app.core.config', 'app.core.security',
    'app.core.exceptions', 'app.core.database',
    'app.services.auth_service', 'app.services.user_service',
    'app.services.workspace_service', 'app.services.board_service',
    'app.services.chat_service', 'app.services.comment_service',
    'app.services.attachment_service', 'app.services.notification_service',
    'app.services.tag_service', 'app.services.invitation_service',
    'app.services.activity_log_service', 'app.services.permission_service',
    'app.services.email_service',
    'app.schemas.user', 'app.schemas.workspace', 'app.schemas.board',
    'app.schemas.chat', 'app.schemas.comment', 'app.schemas.attachment',
    'app.schemas.notification', 'app.schemas.tag', 'app.schemas.invitation',
    'app.schemas.activity_log',
    'app.models', 'app.repositories',
    'app.ws_manager', 'app.tasks',
]

templates_path = ['_templates']
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']

language = 'ru'

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = 'sphinx_rtd_theme'
html_static_path = ['_static']
