from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import socket
import threading

app = Flask(__name__)
socketio = SocketIO(app)

esp_socket = None
client_connected = False

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect_to_esp')
def connect_to_esp(data):
    global esp_socket, client_connected
    ip = data['ip']
    port = 23

    def tcp_worker(ip, port):
        global esp_socket, client_connected
        esp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            esp_socket.connect((ip, port))
            client_connected = True
            socketio.emit('server_response', f"Connected to ESP32 at {ip}")

            while client_connected:
                data = esp_socket.recv(1024)
                if data:
                    socketio.emit('server_response', data.decode('utf-8', errors="replace"))
        except Exception as e:
            socketio.emit('server_response', f"Connection error: {e}")
            client_connected = False

    threading.Thread(target=tcp_worker, args=(ip, port), daemon=True).start()

@socketio.on('send_command')
def send_command(data):
    global esp_socket
    cmd = data.strip()
    if esp_socket and cmd:
        esp_socket.sendall((cmd + "\n").encode())

@socketio.on('disconnect_esp')
def disconnect_esp():
    global esp_socket, client_connected
    client_connected = False
    if esp_socket:
        esp_socket.close()
        esp_socket = None
    emit('server_response', "Disconnected from ESP32")

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)