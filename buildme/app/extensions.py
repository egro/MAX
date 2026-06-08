from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from celery import Celery
from redis import Redis as RedisClient

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
celery = Celery()

login_manager.login_view = 'auth.login'
