from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import socket
import threading
import time

app = Flask(__name__)
socketio = SocketIO(app)

esp_socket = None
client_connected = False
reader_thread = None
stop_reader = threading.Event()

def read_from_esp():
    global esp_socket, client_connected

    print("[DEBUG] Thread de leitura iniciada.")
    esp_socket.settimeout(1.0)  # timeout curto p/ checar stop_reader periodicamente

    while not stop_reader.is_set() and client_connected:
        try:
            data = esp_socket.recv(1024)
            if data:
                decoded = data.decode('utf-8', errors='ignore')
                decoded = decoded.replace('\r', '')  # limpa quebras CR extras
                decoded = decoded.replace('\x08', '')

                print(f"[DEBUG] Dados recebidos do ESP: {repr(decoded)}")


                socketio.emit('server_response', decoded)
            
            else:
                # Socket retornou vazio → pode ser desconexão, vamos confirmar
                time.sleep(0.1)
                continue

        except socket.timeout:
            # Timeout esperado — apenas verificar flags e continuar
            continue
        except (ConnectionResetError, ConnectionAbortedError):
            print("[DEBUG] Conexão com ESP perdida.")
            client_connected = False
            break
        except Exception as e:
            print(f"[ERROR] Erro na thread de leitura: {e}")
            break

    print("[DEBUG] Thread de leitura encerrada.")

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect_to_esp')
def connect_to_esp(data=None):
    global esp_socket, client_connected, reader_thread, stop_reader
    
    ip = data['ip']
    port = 23
    
    if client_connected:
        emit('server_response', "\nESP ja esta conectado")
        return

    if esp_socket:
        try:
            esp_socket.close()
        except:
            pass
        esp_socket = None

    try: 
        esp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        esp_socket.settimeout(5)
        esp_socket.connect((ip, port))
        time.sleep(0.3) # tempo de estabilizacao a ponte serial
        client_connected = True
        stop_reader.clear()

        reader_thread = threading.Thread(target=read_from_esp, daemon=True)
        reader_thread.start()

        emit('server_response', "\nConectado ao ESP32")
    except Exception as e:
        emit('server_response', f"Erro ao se conectar: {e}")
        client_connected = False
        if esp_socket:
            esp_socket.close()
            esp_socket = None


@socketio.on('send_command')
def send_command(cmd):
    global esp_socket, client_connected

    if client_connected and esp_socket:
        try:
            esp_socket.sendall((cmd + "\n").encode())
        except Exception as e:
            emit('server_response', f"Erro ao enviar: {e}")
    else:
        emit('server_response', "\nESP nao esta conectado")
    

@socketio.on('disconnect_esp')
def disconnect_esp():
    global esp_socket, client_connected, stop_reader, reader_thread
    
    if not client_connected:
        emit('server_response', "\nEsp ja esta desconectado")
        return
    
    emit('server_response', "\nDesconectando do ESP32")
    
    client_connected = False
    stop_reader.set()

    # aguarda thread encerrar
    if reader_thread and reader_thread.is_alive():
        reader_thread.join(timeout=3)
        print("[DEBUG] Thread de leitura finalizada")
    reader_thread = None


    if esp_socket:
        try:
            esp_socket.shutdown(socket.SHUT_RDWR)
        except:
            pass
        esp_socket.close()
        esp_socket = None

    emit('server_response', " \nESP32 Desconectado")
    
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)