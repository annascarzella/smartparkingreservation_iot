#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <MKL_HCSR04.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

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
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 0, 60000);

struct Lock {
  int id;
  int pinServo;
  int pinLedRed;
  int pinLedGreen;
  int pinBuzzer;
  int pinTrigger;
  int pinEcho;
  Servo servo;
  MKL_HCSR04* hc; // pointer perché MKL_HCSR04 non ha costruttore vuoto
};

Lock locks[NUM_LOCKS + 1];



unsigned long long get_current_millis() {
  return static_cast<unsigned long long>(timeClient.getEpochTime()) * 1000ULL;
}


void set_servo(int lock, int pos) {
  locks[lock].servo.write(pos);
}


void set_status(int lock, int status) {
  digitalWrite(locks[lock].pinLedRed, status == FREE ? LOW : HIGH);
  digitalWrite(locks[lock].pinLedGreen, status == FREE ? HIGH : LOW);
}


void toggle_alarm(int lock) {
  tone(locks[lock].pinBuzzer, 50);
}


void untoggle_alarm(int lock) {
  noTone(locks[lock].pinBuzzer);
}


float get_proximity(int lock) {
  return locks[lock].hc->dist();
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
    doc["lockId"] = locks[lock].id;
    doc["status"] = "occupied";
    doc["timestamp"] = get_current_millis();

    char buffer[256];
    serializeJson(doc, buffer);
    Serial.println("Publishing occupied status for lock " + String(locks[lock].id) + ": " + buffer);
    client.publish("1/up_link", buffer);
  } else if (!occupied && lock_status[lock] == OCCUPIED) {
    lock_status[lock] = FREE;
    set_status(lock, FREE);
    
    StaticJsonDocument<256> doc;
    doc["lockId"] = locks[lock].id;
    doc["status"] = "free";
    doc["timestamp"] = get_current_millis();

    char buffer[256];
    serializeJson(doc, buffer);
    Serial.println("Publishing free status for lock " + String(locks[lock].id) + ": " + buffer);
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

void send_heartbeat() {
  StaticJsonDocument<512> doc;
  doc["status"] = "connected";

  JsonArray locks_msg = doc.createNestedArray("locks");

  for (int i = 0; i < NUM_LOCKS; i++) {
    JsonObject lockObj = locks_msg.createNestedObject();
    lockObj["id"] = locks[i].id;
    lockObj["status"] = lock_status[i] == OCCUPIED ? "occupied" : 
                        (lock_status[i] == FREE ? "free" : "reserved");
  }

  char buffer[512];
  serializeJson(doc, buffer);

  Serial.println("Sending aggregated heartbeat: " + String(buffer));
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
  unsigned long endTime = doc["endTime"]==nullptr? 0 : doc["endTime"]; // endTime è un numero (timestamp)

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
  ack["timestamp"] = get_current_millis();

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
  


  // Lock 1
  locks[0] = {
    .id = 1,
    .pinServo = LOCK1_SERVO,
    .pinLedRed = LOCK1_LEDRED,
    .pinLedGreen = LOCK1_LEDGREEN,
    .pinBuzzer = LOCK1_BUZZER,
    .pinTrigger = LOCK1_HCTRIGGER,
    .pinEcho = LOCK1_HCECHO
  };

  locks[0].servo.attach(locks[0].pinServo);
  locks[0].hc = new MKL_HCSR04(locks[0].pinTrigger, locks[0].pinEcho);

  pinMode(locks[0].pinLedRed, OUTPUT);
  pinMode(locks[0].pinLedGreen, OUTPUT);
  pinMode(locks[0].pinBuzzer, OUTPUT);
  pinMode(locks[0].pinServo, OUTPUT);

  digitalWrite(locks[0].pinLedRed, LOW);
  digitalWrite(locks[0].pinLedGreen, LOW);

  set_servo(0, DOWN);
  set_status(0, FREE);



  // Connect to Wi-Fi
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(250);
  }
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  timeClient.begin();

  // Set up MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(on_message);

  connect();
  client.subscribe("1/down_link");
}

void loop() {
  timeClient.update();
  client.loop();
  reconnect();

  unsigned long now = get_current_millis();

  if (now - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    send_heartbeat();
    lastHeartbeat = now;
  }

  for (int i = 0; i < NUM_LOCKS; i++) {
    if (lock_endtime[i] > 0 && now >= lock_endtime[i]) {
      if (!lock_arrived[i]) {
        set_servo(i, DOWN);
        set_status(i, FREE);
        lock_status[i] = FREE;

        StaticJsonDocument<256> doc;
        doc["lockId"] = locks[i].id;
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