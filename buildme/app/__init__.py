from flask import Flask, render_template
from app.config import Config
from app.extensions import db, migrate, login_manager, celery
from app.models.user import User
from app.cli import init_cli
from app.routes.auth import auth
from app.routes.engines import engines
from app.routes.assessments import assessments
from app.routes.phase_definitions import phase_defs
from app.routes.findings import findings
from app.routes.reports import reports
from app.routes.api import api
from app.services.seed_data import seed_default_phases


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    app.register_blueprint(auth)
    app.register_blueprint(engines)
    app.register_blueprint(assessments)
    app.register_blueprint(phase_defs)
    app.register_blueprint(findings)
    app.register_blueprint(reports)
    app.register_blueprint(api)

    @login_manager.user_loader
    def load_user(user_id):
        return db.session.get(User, int(user_id))

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
        db.create_all()
        seed_default_phases()

    @app.template_filter('datetime')
    def format_datetime(value):
        return value.strftime('%Y-%m-%d %H:%M:%S UTC')

    @app.route('/')
    def index():
        return render_template('base.html')

    init_cli(app)

    return app
