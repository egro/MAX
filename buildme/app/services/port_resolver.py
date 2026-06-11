import subprocess
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

import redis as redis_lib

_WEB_SERVICE_PATTERNS = ('http', 'https', 'http-proxy', 'sweb', 'websm')


def extract_host(target):
    target = target.strip()
    if '://' in target:
        parsed = urlparse(target)
        return parsed.hostname or parsed.netloc.split(':')[0]
    return target.split('/')[0].split(':')[0]


def resolve_web_ports(target, redis_url=None):
    host = extract_host(target)
    if not host:
        return '80,443'

    if redis_url:
        try:
            r = redis_lib.Redis.from_url(redis_url)
            cached = r.get(f'ports:{host}')
            if cached is not None:
                return cached.decode()
        except Exception:
            pass

    try:
        cmd1 = f"nmap -sT --open -p- -T4 --min-rate=500 {host} -oX -"
        r1 = subprocess.run(
            cmd1, shell=True, capture_output=True, text=True, timeout=600
        )
        if r1.returncode != 0:
            return '80,443'

        open_ports = _parse_open_ports(r1.stdout)
        if not open_ports:
            return '80,443'

        port_list = ','.join(str(p) for p in open_ports)
        cmd2 = f"nmap -sV --open -p {port_list} -T4 {host} -oX -"
        r2 = subprocess.run(
            cmd2, shell=True, capture_output=True, text=True, timeout=300
        )
        if r2.returncode != 0:
            return '80,443'

        web_ports = _parse_web_ports(r2.stdout)
        if not web_ports:
            return '80,443'

        result = ','.join(str(p) for p in sorted(web_ports))

        if redis_url:
            try:
                r = redis_lib.Redis.from_url(redis_url)
                r.setex(f'ports:{host}', 3600, result)
            except Exception:
                pass

        return result

    except (subprocess.TimeoutExpired, OSError):
        return '80,443'


def _parse_open_ports(xml_output):
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError:
        return []
    ports = []
    for host in root.findall('.//host'):
        for port in host.findall('.//port'):
            state = port.find('.//state')
            if state is not None and state.get('state') == 'open':
                ports.append(int(port.get('portid')))
    return ports


def _parse_web_ports(xml_output):
    try:
        root = ET.fromstring(xml_output)
    except ET.ParseError:
        return []
    ports = []
    for host in root.findall('.//host'):
        for port in host.findall('.//port'):
            state = port.find('.//state')
            if state is not None and state.get('state') == 'open':
                service = port.find('.//service')
                if service is not None:
                    svc = (service.get('name') or '').lower()
                    if any(p in svc for p in _WEB_SERVICE_PATTERNS):
                        ports.append(int(port.get('portid')))
    return ports
