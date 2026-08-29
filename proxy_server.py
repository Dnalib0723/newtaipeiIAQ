"""
EB05 Dashboard Proxy Server
解決瀏覽器 CORS 問題，將請求轉發至 https://eb.ecobear.tw

安裝依賴: pip install flask flask-cors requests
啟動: python proxy_server.py
瀏覽器開啟: http://localhost:5050
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

EB_BASE = 'https://eb.ecobear.tw'
HEADERS_BASE = {'Accept-Encoding': 'gzip, deflate'}


@app.route('/')
def serve_dashboard():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'dashboardv2.html')


@app.route('/logo.png')
def serve_logo():
    return send_from_directory(os.path.dirname(os.path.abspath(__file__)), 'logo.png')


@app.route('/api/login', methods=['POST'])
def login():
    body = request.get_json(force=True)
    email    = body.get('email', '')
    password = body.get('password', '')

    attempts = [
        # 方法1: JSON body
        lambda: requests.post(f'{EB_BASE}/users/login.php',
            json={'email': email, 'password': password},
            headers={**HEADERS_BASE, 'Content-Type': 'application/json; charset=UTF-8'},
            timeout=15),
        # 方法2: Form data
        lambda: requests.post(f'{EB_BASE}/users/login.php',
            data={'email': email, 'password': password},
            headers={**HEADERS_BASE, 'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=15),
        # 方法3: 帳密放 Headers
        lambda: requests.post(f'{EB_BASE}/users/login.php',
            headers={**HEADERS_BASE, 'email': email, 'password': password,
                     'Content-Type': 'application/json; charset=UTF-8'},
            timeout=15),
        # 方法4: Query Parameters
        lambda: requests.post(f'{EB_BASE}/users/login.php',
            params={'email': email, 'password': password},
            headers={**HEADERS_BASE, 'Content-Type': 'application/json; charset=UTF-8'},
            timeout=15),
    ]

    print(f'  Debug recv: email={repr(email)}, password={repr(password)}')

    last_data = None
    for i, attempt in enumerate(attempts, 1):
        try:
            r = attempt()
            data = r.json()
            print(f'  Login method {i}: {data.get("ret")} - {data.get("retDescription", data.get("description", ""))}')
            if data.get('ret') == 'RET_OK':
                print(f'  -> Success with method {i}')
                return jsonify(data), r.status_code
            last_data = (data, r.status_code)
        except Exception as e:
            print(f'  Login method {i} exception: {e}')

    if last_data:
        return jsonify(last_data[0]), last_data[1]
    return jsonify({'ret': 'RET_ERROR', 'retDescription': 'All login methods failed'}), 500


@app.route('/api/devices', methods=['GET', 'POST'])
def get_devices():
    token = request.headers.get('accessToken', '')
    try:
        r = requests.post(
            f'{EB_BASE}/devices/getByAuth.php',
            headers={**HEADERS_BASE, 'accessToken': token},
            timeout=15
        )
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({'ret': 'RET_ERROR', 'retDescription': str(e)}), 500


@app.route('/api/history', methods=['GET', 'POST'])
def get_history():
    token = request.headers.get('accessToken', '')
    params = {k: v for k, v in request.args.items()}
    try:
        r = requests.post(
            f'{EB_BASE}/devices/history.php',
            headers={**HEADERS_BASE, 'accessToken': token},
            params=params,
            timeout=30
        )
        return jsonify(r.json()), r.status_code
    except Exception as e:
        return jsonify({'ret': 'RET_ERROR', 'retDescription': str(e)}), 500


if __name__ == '__main__':
    print('=' * 50)
    print('EB05 Dashboard Proxy Server')
    print('=' * 50)
    print('開啟瀏覽器前往: http://localhost:5050')
    print('按 Ctrl+C 停止伺服器')
    print('=' * 50)
    app.run(host='0.0.0.0', port=5050, debug=False)
