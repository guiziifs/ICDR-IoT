#include <Arduino.h>
#include <WiFi.h>

#define RXD2 32
#define TXD2 33
#define BAUD_PC 115200
#define BAUD_U2 9600

const char* ssid     = "iPhone_de_Guilherme_(2)";
const char* password = "pcguigui";

// =====================
// Telnet/Wi-Fi (comentado por enquanto)
// =====================
WiFiServer server(23);
WiFiClient client;

void setup() {
  pinMode(RXD2, INPUT_PULLUP);
  Serial.begin(BAUD_PC);
  Serial2.begin(BAUD_U2, SERIAL_8N1, RXD2, TXD2);

  Serial.println("\n== ESP32 <-> Cisco Bridge (Serial apenas) ==");

  // =====================
  // Conexão Wi-Fi (comentada)
  // =====================
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());

  server.begin();
  server.setNoDelay(true);

  // "Cutucão" inicial para acordar o console Cisco
  for (int i = 0; i < 6; i++) { Serial2.write('\r'); delay(120); }
}

void loop() {
  // =====================
  // Telnet/Wi-Fi: Aceita cliente TCP (comentado)
  // =====================
  if (server.hasClient()) {
    WiFiClient newClient = server.available();
    if (!client || !client.connected()) {
      client = newClient;
      Serial.println("Cliente Wi-Fi conectado!");
      Serial2.flush();
    } else {
      newClient.stop();
    }
  }

  // =====================
  // Cisco -> Serial Monitor (VSCode)
  // =====================
  while (Serial2.available()) {
    char c = Serial2.read();
    // =====================
    // Telnet/Wi-Fi: enviar para cliente TCP 
    // =====================
    if (client && client.connected()) client.write(c);
    Serial.write(c);  // Mostra no terminal local
  }

  // =====================
  // Telnet/Wi-Fi: Cliente TCP -> Cisco
  // =====================

  while (client && client.connected() && client.available()) {
    char c = client.read();
    Serial2.write(c == '\n' ? '\r' : c);
    Serial.write(c);  // Ecoa localmente
  }

  // =====================
  // Serial Monitor (VSCode) -> Cisco
  // =====================
  while (Serial.available()) {
    char c = Serial.read();
    Serial2.write(c == '\n' ? '\r' : c);  // converte LF → CR
  }
}
