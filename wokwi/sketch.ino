#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <MKL_HCSR04.h>

// Pin1 definitions
#define LOCK1_SERVO 0
#define LOCK1_LEDRED 19
#define LOCK1_LEDGREEN 18
#define LOCK1_BUZZER 5
#define LOCK1_HCTRIGGER 17
#define LOCK1_HCECHO 16

// const definitions
#define ID 1
#define UP 0
#define DOWN 90
#define FREE 0
#define OCCUPIED 1
#define RESERVED 2
#define CLIENT_ID "SmartParkingFST"
#define SSID "Wokwi-GUEST"
#define PASSWORD ""
#define MQTT_SERVER "mqtt.eclipseprojects.io"
#define MQTT_PORT 1883
#define NUM_LOCKS 1


// Global variables
int lock_status[NUM_LOCKS + 1] = {FREE};
bool lock_arrived[NUM_LOCKS + 1] = {false};
unsigned long lock_endtime[NUM_LOCKS + 1] = {0};
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000; // 60 secondi



// Device objects
Servo lock1_servo;
MKL_HCSR04 lock1_hc(LOCK1_HCTRIGGER, LOCK1_HCECHO);
WiFiClient wifiClient;
PubSubClient client(wifiClient);


void set_servo(int lock, int pos){
  if(lock == 1)
    lock1_servo.write(pos);
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");
}

void set_status(int lock, int status){
  if(lock == 1)
    if(status == FREE){
      digitalWrite(LOCK1_LEDRED, LOW);
      digitalWrite(LOCK1_LEDGREEN, HIGH);
    }else{
      digitalWrite(LOCK1_LEDRED, HIGH);
      digitalWrite(LOCK1_LEDGREEN, LOW);
    }
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");

}

void toggle_alarm(int lock){
  if(lock == 1)
    tone(LOCK1_BUZZER, 50);
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");
}

void untoggle_alarm(int lock){
  if(lock == 1)
    noTone(LOCK1_BUZZER);
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");
}

float get_proximity(int lock){//in cm
  if(lock == 1)
    return lock1_hc.dist();
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");
    return 0.0;
}

void is_occupied(int lock){
  float distance = get_proximity(lock);
  Serial.println("Distance: " + String(distance));
  bool occupied = distance <= 50;

  if (occupied && lock_status[lock] != OCCUPIED) {
    lock_status[lock] = OCCUPIED;
    set_status(lock, OCCUPIED);
    
    // publish uplink
    StaticJsonDocument<256> doc;
    doc["lockId"] = lock;
    doc["status"] = "occupied";
    doc["timestamp"] = millis();

    char buffer[256];
    serializeJson(doc, buffer);
    Serial.println("Publishing occupied status for lock " + String(lock) + ": " + buffer);
    client.publish("1/up_link", buffer);
  } else if (!occupied && lock_status[lock] == OCCUPIED) {
    lock_status[lock] = FREE;
    set_status(lock, FREE);
    
    StaticJsonDocument<256> doc;
    doc["lockId"] = lock;
    doc["status"] = "free";
    doc["timestamp"] = millis();

    char buffer[256];
    serializeJson(doc, buffer);
    Serial.println("Publishing free status for lock " + String(lock) + ": " + buffer);
    client.publish("1/up_link", buffer);
  }
}


void connect(){
  while (!client.connected()) {
    Serial.println("Connecting to MQTT...");
    if (client.connect(CLIENT_ID)) {
      Serial.println("connected");
    } else {
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
    }
  }
  Serial.println("You're connected to the MQTT broker!");
  Serial.println();
}

void reconnect() {
  while (!client.connected()) {
    Serial.println("Attempting MQTT connection...");
    if (client.connect(CLIENT_ID)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void send_heartbeat(int lock) {
  StaticJsonDocument<256> doc;
  doc["timestamp"] = millis();
  doc["lockId"] = lock;
  doc["status"] = lock_status[lock] == OCCUPIED ? "occupied" : (lock_status[lock] == FREE ? "free" : "reserved");

  char buffer[256];
  serializeJson(doc, buffer);
  Serial.println("Sending heartbeat for lock " + String(lock) + ": " + buffer);
  client.publish("1/heartbeat", buffer);
}



void on_message(char *topic, byte *payload, unsigned int length){
  payload[length] = '\0'; // null terminate
  String msg = String((char *)payload);
  Serial.println("Message arrived: " + msg);

  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.println("JSON parse error");
    return;
  }

  const char* command = doc["command"];
  int lock_id = doc["lock_id"];
  unsigned long endTime = doc["endTime"]; // endTime è un numero (timestamp)

  if (strcmp(command, "up") == 0) {
    set_servo(lock_id, UP);
    set_status(lock_id, RESERVED);
    lock_arrived[lock_id] = false;
    lock_status[lock_id] = RESERVED;
  } else if (strcmp(command, "down") == 0) {
    set_servo(lock_id, DOWN);
    set_status(lock_id, FREE);
    lock_arrived[lock_id] = true;
    lock_status[lock_id] = FREE;
  } else {
    Serial.println("Unknown command");
    return;
  }

  // Ack
  StaticJsonDocument<256> ack;
  ack["lockId"] = lock_id;
  ack["status"] = command;
  ack["timestamp"] = millis();

  char buffer[256];
  serializeJson(ack, buffer);
  client.publish("1/down_link_ack", buffer);

  // Programma timeout se c'è endTime
  if (endTime > 0) {
    lock_endtime[lock_id] = endTime;
  }
}


void setup() {
   // Initialize Serial
  Serial.begin(9600);


  pinMode(LOCK1_LEDRED, OUTPUT);
  pinMode(LOCK1_LEDGREEN, OUTPUT);
  pinMode(LOCK1_BUZZER, OUTPUT);
  pinMode(LOCK1_SERVO, OUTPUT);

  lock1_servo.attach(LOCK1_SERVO); // attach servo to pin

  digitalWrite(LOCK1_LEDRED, LOW);
  digitalWrite(LOCK1_LEDGREEN, LOW);

  set_servo(1,DOWN);
  set_status(1, FREE);


  // Connect to Wi-Fi
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(250);
  }
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  // Set up MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(on_message);

  connect();
  client.subscribe("1/down_link");
}

void loop() {
  client.loop();
  reconnect();

  unsigned long now = millis();

  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    for (int i = 1; i <= NUM_LOCKS; i++) {
      send_heartbeat(i);
    }
    lastHeartbeat = now;
  }

  for (int i = 1; i <= NUM_LOCKS; i++) {
    if (lock_endtime[i] > 0 && now >= lock_endtime[i]) {
      if (!lock_arrived[i]) {
        set_servo(i, DOWN);
        set_status(i, FREE);
        lock_status[i] = FREE;

        StaticJsonDocument<256> doc;
        doc["lockId"] = i;
        doc["status"] = "FREE";
        doc["timestamp"] = now;

        char buffer[256];
        serializeJson(doc, buffer);
        client.publish("1/up_link", buffer);
      }
      lock_endtime[i] = 0; // reset
    }

    is_occupied(i);
  }

  delay(5000);
}

