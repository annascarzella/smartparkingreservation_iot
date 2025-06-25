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
#define ID "GATEWAY1"



// Device objects
Servo lock1_servo;
MKL_HCSR04 lock1_hc(LOCK1_HCTRIGGER, LOCK1_HCECHO);


void setup() {
  pinMode(LOCK1_LEDRED, OUTPUT);
  pinMode(LOCK1_LEDGREEN, OUTPUT);
  pinMode(LOCK1_BUZZER, OUTPUT);
  pinMode(LOCK1_SERVO, OUTPUT);

  lock1_servo.attach(LOCK1_SERVO); // attach servo to pin

  digitalWrite(LOCK1_LEDRED, LOW);
  digitalWrite(LOCK1_LEDGREEN, LOW);

  lock1_servo.write(90);


}

void loop() {
  
  digitalWrite(LOCK1_LEDGREEN, LOW);
  delay(1000);
  digitalWrite(LOCK1_LEDGREEN, HIGH);

}
