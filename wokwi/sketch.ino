#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <MKL_HCSR04.h> // for ultrasonic sensor

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
#define CLIENT_ID "SmartParkingFST"
#define SSID "Wokwi-GUEST"
#define PASSWORD ""
#define MQTT_SERVER "mqtt.eclipseprojects.io"
#define MQTT_PORT 1883
#define NUM_LOCKS 1



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
    if(status == 0){
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
    lock1_hc.dist();
  else if(lock == 2)
    ;
  else
    Serial.println("Lock not found");
}

void is_occupied(int lock){
  if(get_proximity(lock) <= 50){
    //up_link
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
    if (client.connect("")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}


void on_message(char *topic, byte *payload, unsigned int length){

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
}

void loop() {
  for(int i = 1; i <= NUM_LOCKS; i++){
    is_occupied(i);
  }
  reconnect();
  delay(5000);
}
