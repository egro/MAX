import click
from flask.cli import with_appcontext


def init_cli(app):
    @app.cli.command('set-role')
    @click.argument('username')
    @click.argument('role')
    @with_appcontext
    def set_role(username, role):
        """Set a user's role (admin or user)."""
        from app.extensions import db
        from app.models.user import User

        user = User.query.filter_by(username=username).first()
        if not user:
            click.echo(f'User "{username}" not found.')
            return

        valid_roles = ('admin', 'user')
        if role not in valid_roles:
            click.echo(f'Role must be one of: {", ".join(valid_roles)}')
            return

        user.role = role
        db.session.commit()
        click.echo(f'User "{username}" role set to "{role}".')

    @app.cli.command('list-users')
    @with_appcontext
    def list_users():
        """List all registered users and their roles."""
        from app.models.user import User

        users = User.query.all()
        if not users:
            click.echo('No users registered.')
            return

        click.echo(f'{"ID":<4} {"Username":<20} {"Email":<30} {"Role":<10}')
        click.echo('-' * 64)
        for u in users:
            click.echo(f'{u.id:<4} {u.username:<20} {u.email:<30} {u.role:<10}')
