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

#define LOCK2_SERVO 26
#define LOCK2_LEDRED 14
#define LOCK2_LEDGREEN 27
#define LOCK2_BUZZER 32
#define LOCK2_HCTRIGGER 25
#define LOCK2_HCECHO 33

// const definitions
#define ID 1
#define UP 90
#define DOWN 0
#define FREE 0
#define OCCUPIED 1
#define RESERVED 2
#define CLIENT_ID "SmartParkingFST"
#define SSID "Wokwi-GUEST"
#define PASSWORD ""
#define MQTT_SERVER "mqtt.eclipseprojects.io"
#define MQTT_PORT 1883
#define NUM_LOCKS 2

// Global variables
int lock_status[NUM_LOCKS + 1] = {FREE, FREE};
bool lock_arrived[NUM_LOCKS + 1] = {false, false};
unsigned long lock_endtime[NUM_LOCKS + 1] = {0, 0};
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000; // 60 secondi

// Device objects
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
  tone(locks[lock].pinBuzzer, 262);
}


void untoggle_alarm(int lock) {
  noTone(locks[lock].pinBuzzer);
}


float get_proximity(int lock) {
  return locks[lock].hc->dist();
}


void is_occupied(int lock){
  float distance = get_proximity(lock);
  //Serial.println("Distance: " + String(distance));
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
    String topic = String(ID) + "/up_link";
    client.publish(topic.c_str(), buffer);
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
    String topic = String(ID) + "/up_link";
    client.publish(topic.c_str(), buffer);
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
  String topic = String(ID) + "/heartbeat";
  client.publish(topic.c_str(), buffer);
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
  lock_id = lock_id - 1;
  unsigned long endTime = doc["endTime"]==nullptr? 0 : doc["endTime"]; // endTime è un numero (timestamp)

  toggle_alarm(lock_id);
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
  delay(1000);
  untoggle_alarm(lock_id);

  // Ack
  StaticJsonDocument<256> ack;
  ack["lockId"] = lock_id + 1;
  ack["status"] = command;
  ack["timestamp"] = get_current_millis();

  char buffer[256];
  serializeJson(ack, buffer);
  String topicack = String(ID) + "/down_link_ack";
  client.publish(topicack.c_str(), buffer);

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

  // Lock 2
  locks[1] = {
    .id = 2,
    .pinServo = LOCK2_SERVO,
    .pinLedRed = LOCK2_LEDRED,
    .pinLedGreen = LOCK2_LEDGREEN,
    .pinBuzzer = LOCK2_BUZZER,
    .pinTrigger = LOCK2_HCTRIGGER,
    .pinEcho = LOCK2_HCECHO
  };

  for(int i = 0; i < NUM_LOCKS; i++){
    locks[i].servo.attach(locks[i].pinServo);
    locks[i].hc = new MKL_HCSR04(locks[i].pinTrigger, locks[i].pinEcho);

    pinMode(locks[i].pinLedRed, OUTPUT);
    pinMode(locks[i].pinLedGreen, OUTPUT);
    pinMode(locks[i].pinBuzzer, OUTPUT);
    pinMode(locks[i].pinServo, OUTPUT);

    digitalWrite(locks[i].pinLedRed, LOW);
    digitalWrite(locks[i].pinLedGreen, LOW);

    set_servo(i, UP);
    set_status(i, FREE);
  }

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
  String topic = String(ID) + "/down_link";
  client.subscribe(topic.c_str());
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
        String topic = String(ID) + "/up_link";
        client.publish(topic.c_str(), buffer);
      }
      lock_endtime[i] = 0; // reset
    }

    is_occupied(i);
  }

  delay(5000);
}