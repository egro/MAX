from flask import Blueprint, jsonify, render_template, request
from flask_login import login_required

from app.services.engine_registry import (
    find_online_engine,
    get_all_engines,
    register_engine,
)

engines = Blueprint('engines', __name__, url_prefix='/engines')


@engines.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json(force=True)
    name = data.get('name', request.headers.get('X-Engine-Name', 'unknown'))
    network_tag = data.get(
        'network_tag', request.headers.get('X-Engine-Network-Tag', 'default')
    )
    ip = data.get('ip', request.headers.get('X-Engine-Ip', request.remote_addr))

    engine = register_engine(name, network_tag, ip)
    return jsonify({'id': engine.id, 'status': engine.status}), 200


@engines.route('/api/select')
def api_select():
    network_tag = request.args.get('network_tag', 'default')
    engine = find_online_engine(network_tag)
    if engine:
        return jsonify({'id': engine.id, 'name': engine.name, 'ip': engine.ip})
    return jsonify({'error': 'No online engine available'}), 404


@engines.route('/')
@login_required
def list_engines():
    all_engines = get_all_engines()
    return render_template('engines/list.html', engines=all_engines)
