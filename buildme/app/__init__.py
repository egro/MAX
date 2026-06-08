from flask import Flask, render_template
from app.config import Config
from app.extensions import db, migrate, login_manager, celery


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)

    celery.conf.update(
        broker_url=app.config['CELERY_BROKER_URL'],
        result_backend=app.config['CELERY_RESULT_BACKEND'],
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    with app.app_context():
        from app.extensions import db
        db.create_all()

    @app.route('/')
    def index():
        return render_template('base.html')

    return app
