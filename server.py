from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='.')
CORS(app)

UPLOAD_FOLDER = 'images'
ASSIGNMENTS_FILE = 'image-assignments.json'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

@app.route('/')
def serve_organizer():
    return app.send_static_file('image-organizer.html')

@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)
    return jsonify({'filename': file.filename})

@app.route('/assignments', methods=['GET', 'POST'])
def assignments():
    if request.method == 'GET':
        if os.path.exists(ASSIGNMENTS_FILE):
            with open(ASSIGNMENTS_FILE, 'r', encoding='utf-8') as f:
                return f.read(), 200, {'Content-Type': 'application/json'}
        else:
            return '{}', 200, {'Content-Type': 'application/json'}
    else:
        data = request.get_json()
        with open(ASSIGNMENTS_FILE, 'w', encoding='utf-8') as f:
            f.write(jsonify(data).get_data(as_text=True))
        return jsonify({'status': 'saved'})

@app.route('/<path:path>')
def serve_static(path):
    return app.send_static_file(path)

if __name__ == '__main__':
    app.run(debug=True)
