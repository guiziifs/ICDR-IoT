#include <Arduino.h>
#include <WiFi.h>

#define RXD2 32         // R1OUT -> 32
#define TXD2 33         // 33 -> T1IN
#define BAUD_U2 9600    // Cisco console

const char* ssid     = "iPhone_de_Guilherme_(2)";
const char* password = "pcguigui";

WiFiServer server(23);   // Porta Telnet (23)
WiFiClient client;

void setup() {
  pinMode(RXD2, INPUT_PULLUP);
  Serial.begin(115200);
  Serial2.begin(BAUD_U2, SERIAL_8N1, RXD2, TXD2);

  Serial.println("\n== ESP32 <-> Cisco Bridge ==");

  // Conexão Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Conectando ao WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi conectado!");
  Serial.print("Endereço IP: ");
  Serial.println(WiFi.localIP());

  server.begin();
  server.setNoDelay(true);

  // “Cutucão” inicial: envia alguns CR no console
  for (int i = 0; i < 5; i++) { Serial2.write('\r'); delay(150); }
}

void loop() {
  // Aceita cliente novo
  if (server.hasClient()) {
    if (client) client.stop();  // derruba cliente anterior
    client = server.available();
    Serial.println("Cliente conectado!");
  }

  // Cisco -> Cliente TCP + Serial Monitor
  while (Serial2.available()) {
    char c = Serial2.read();
    if (client && client.connected()) client.write(c);
    Serial.write(c);   // ESPelha no monitor serial
  }

  // Cliente TCP -> Cisco + Serial Monitor
  while (client && client.connected() && client.available()) {
    char c = client.read();
    Serial2.write(c == '\n' ? '\r' : c);  // converte LF → CR
    Serial.write(c);                      // mostra no Serial também
  }
}
