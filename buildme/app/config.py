import os


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'postgresql://waa:changeme@localhost:5432/waa'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    REDIS_URL = os.environ.get('REDIS_URL', 'redis://:changeme@localhost:6379/0')
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL

    LLM_ENDPOINT = os.environ.get('LLM_ENDPOINT', '')
    LLM_API_KEY = os.environ.get('LLM_API_KEY', '')
    LLM_MODEL = os.environ.get('LLM_MODEL', '')
