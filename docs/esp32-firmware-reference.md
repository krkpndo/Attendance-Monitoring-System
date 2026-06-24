# ESP32 RFID Tap-In Terminal — Firmware Reference

Future reference for the hardware tap-in terminal that drives the
`POST /device/attendance/tap` endpoint. Hardware not yet acquired; this captures
the wiring, libraries, and a working sketch so it can be built later without
re-deriving anything.

## Hardware

- **ESP32** dev board (e.g. ESP32 DevKit v1)
- **RC522** RFID reader module (13.56 MHz, SPI, **3.3 V only**)
- **0.96" SSD1306 OLED**, I²C

## Wiring

### RC522 (SPI) — 3.3 V module, do **not** feed it 5 V

| RC522 | ESP32 |
|-------|-------|
| SDA/SS | GPIO 5 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| RST | GPIO 27 |
| 3.3V | 3.3V |
| GND | GND |

### OLED 0.96" SSD1306 (I²C)

| OLED | ESP32 |
|------|-------|
| SDA | GPIO 21 |
| SCL | GPIO 22 |
| VCC | 3.3V |
| GND | GND |

## Libraries (Arduino IDE → Library Manager)

- **MFRC522** (by GithubCommunity)
- **Adafruit SSD1306** + **Adafruit GFX** (dependency)
- **ArduinoJson** (by Benoît Blanchon, v7)
- `WiFi.h` / `HTTPClient.h` ship with the ESP32 board package

Install the ESP32 board package first (Boards Manager → "esp32" by Espressif),
then select your board (e.g. "ESP32 Dev Module").

## How it fits the backend

1. The device authenticates with its bearer token in the header
   `Authorization: Device dev_<token>` (the one-time plaintext token from
   `POST /admin/devices`).
2. On a tap, the device reads the card UID and POSTs
   `{ "rfidNumber": "<uid>" }` to `/device/attendance/tap`.
3. The server (`AttendanceEngine.resolveTap`) finds the OPEN session that
   claimed this device (Model C), maps the UID → active card → student, and
   stamps the record `PRESENT`/`LATE` based on the grace window.

### UID format

`readUid()` emits **uppercase hex, no separators** — the same canonical form
the server's `normalizeRfid()` produces. A card registered via
`PATCH /student/rfid/register` will therefore match a tap byte-for-byte.

### Response → OLED mapping

- `success: true` → show `studentName / status / courseCode`
  (covers normal `RECORDED`, plus `ALREADY_RECORDED` and `SKIPPED_MANUAL`,
  which still return the current status).
- `success: false` → show the error `code`
  (`UNKNOWN_CARD`, `NOT_ENROLLED`, `NO_OPEN_SESSION`, `INVALID_DEVICE_TOKEN`, …).

## Sketch

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------
// Configuration — fill these in. Keep DEVICE_TOKEN secret; don't commit it.
// ----------------------------------------------------------------------------
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// Your backend's LAN address (the machine running `npm run dev`) + the tap route.
// Find your dev machine's IP with `ipconfig getifaddr en0` (macOS) and keep port 3000.
const char* TAP_URL = "http://192.168.1.10:3000/device/attendance/tap";

// The one-time plaintext token returned by POST /admin/devices ("dev_...").
const char* DEVICE_TOKEN = "dev_PASTE_YOUR_TOKEN_HERE";

// ----------------------------------------------------------------------------
// Pin assignments
// ----------------------------------------------------------------------------
#define RC522_SS_PIN   5
#define RC522_RST_PIN  27

#define OLED_WIDTH   128
#define OLED_HEIGHT  64
#define OLED_ADDR    0x3C   // common for 0.96" SSD1306; some are 0x3D

// ----------------------------------------------------------------------------
// Globals
// ----------------------------------------------------------------------------
MFRC522 mfrc522(RC522_SS_PIN, RC522_RST_PIN);
Adafruit_SSD1306 display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1);

String lastUid = "";
unsigned long lastTapMs = 0;
const unsigned long TAP_COOLDOWN_MS = 3000;  // ignore the same card for 3s

// ----------------------------------------------------------------------------
// OLED helpers
// ----------------------------------------------------------------------------
void showLines(const String& l1, const String& l2 = "", const String& l3 = "") {
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(l1);

  display.setTextSize(2);
  display.setCursor(0, 20);
  display.println(l2);

  display.setTextSize(1);
  display.setCursor(0, 52);
  display.println(l3);

  display.display();
}

void showReady() {
  showLines("Attendance reader", "TAP", "Ready");
}

// ----------------------------------------------------------------------------
// WiFi
// ----------------------------------------------------------------------------
void connectWifi() {
  showLines("Connecting WiFi", "...", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(300);
  }

  if (WiFi.status() == WL_CONNECTED) {
    showLines("WiFi connected", "OK", WiFi.localIP().toString());
    delay(1000);
  } else {
    showLines("WiFi FAILED", "X", "Retrying...");
    delay(1000);
  }
}

// ----------------------------------------------------------------------------
// Read the card UID in canonical form: uppercase hex, no separators.
// Matches the server's normalizeRfid() so the stored card matches the tap.
// ----------------------------------------------------------------------------
String readUid() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";   // zero-pad each byte
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// ----------------------------------------------------------------------------
// POST the UID to the backend and render the result on the OLED.
// ----------------------------------------------------------------------------
void sendTap(const String& uid) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  showLines("Sending...", uid);

  WiFiClient client;
  HTTPClient http;
  http.begin(client, TAP_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Device ") + DEVICE_TOKEN);

  // Build the request body: { "rfidNumber": "<uid>" }
  JsonDocument reqDoc;
  reqDoc["rfidNumber"] = uid;
  String body;
  serializeJson(reqDoc, body);

  int httpCode = http.POST(body);
  String payload = http.getString();
  http.end();

  if (httpCode <= 0) {
    showLines("Network error", "ERR", "Try again");
    return;
  }

  JsonDocument resDoc;
  DeserializationError err = deserializeJson(resDoc, payload);
  if (err) {
    showLines("Bad response", "ERR", String(httpCode));
    return;
  }

  bool success = resDoc["success"] | false;

  if (success) {
    // data: { outcome, studentName, courseCode, status, timeIn }
    const char* name   = resDoc["data"]["studentName"] | "";
    const char* status = resDoc["data"]["status"]      | "";
    const char* course = resDoc["data"]["courseCode"]  | "";
    showLines(String(name), String(status), String(course));
  } else {
    // failure: { success:false, message, code }
    const char* message = resDoc["message"] | "Rejected";
    const char* code    = resDoc["code"]    | "";
    showLines("Not recorded", "X", String(code).length() ? String(code) : String(message));
  }
}

// ----------------------------------------------------------------------------
// Setup / loop
// ----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);  // SDA, SCL
  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {
    Serial.println("SSD1306 init failed");
    for (;;);  // halt — wiring/address problem
  }

  SPI.begin();          // default ESP32 SPI: SCK 18, MISO 19, MOSI 23
  mfrc522.PCD_Init();

  connectWifi();
  showReady();
}

void loop() {
  // Keep WiFi alive.
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    showReady();
  }

  // No new card? Nothing to do.
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  String uid = readUid();
  mfrc522.PICC_HaltA();        // stop talking to this card
  mfrc522.PCD_StopCrypto1();

  // Debounce: ignore the same card within the cooldown window.
  unsigned long now = millis();
  if (uid == lastUid && (now - lastTapMs) < TAP_COOLDOWN_MS) {
    return;
  }
  lastUid = uid;
  lastTapMs = now;

  sendTap(uid);

  delay(2500);   // hold the result on screen
  showReady();
}
```

## Notes & gotchas

- **The token is a secret** — it's the device's identity. Don't commit it; for a
  real build, move `DEVICE_TOKEN` + WiFi creds into a gitignored `secrets.h`.
- **HTTP, not HTTPS** here is fine for LAN dev, but the token + taps travel in
  cleartext. For production, terminate TLS and switch to `WiFiClientSecure` + an
  `https://` URL.
- **RC522 is 3.3 V only.** Powering it from 5 V is the most common way to fry the
  module. Erratic reads usually mean a weak 3.3 V rail.
- **OLED address:** if the screen stays blank, try `0x3D` instead of `0x3C`.
- **Improvements to consider later:** WiFiManager captive portal so WiFi creds
  aren't hardcoded; a buzzer/LED for audible/visual tap feedback; OTA updates.
