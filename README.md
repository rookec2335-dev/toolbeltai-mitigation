# ToolbeltAI Mitigation – Daily Log Demo

This is a simple demo app to generate structured mitigation daily logs
that you can copy/paste into ServiceTitan or send to the office.

## Project Structure

toolbeltai-mitigation/
├── client/   (React front-end)
└── server/   (Node/Express API that formats the log)

---

## How to Run

### 1️⃣ Start the server

Open a terminal:

```bash
cd toolbeltai-mitigation/server
npm install
npm start
```

This will start the server on **http://localhost:5000**.

### 2️⃣ Start the client

Open a second terminal:

```bash
cd toolbeltai-mitigation/client
npm install
npm start
```

This will start the React app (usually on **http://localhost:3000**).

---

## How to Use

1. Enter the **job number** and **technician name**.
2. For each room:
   - Enter room name (ex: Master Bedroom)
   - Moisture readings
   - Temp IN / OUT (°F)
   - RH IN / OUT (%)
3. Use the **Equipment Added / Removed** dropdowns to tag what was set or picked up.
4. Add **Photo Notes** (ex: "Photo 1 - Containment in hallway").
5. Add any **general notes** about demo, extraction, monitoring, etc.
6. Click **Generate Daily Log**.
7. Copy the generated log text into ServiceTitan, email, etc.

You can add multiple rooms using the **"Add Room"** button.

---

## Notes

- This is a demo only and does **not** yet integrate directly with the ServiceTitan API.
- All logic is local: the server just formats what you type into a clean report.
- You can later extend this to:
  - Save logs to a database
  - Integrate directly with ServiceTitan
  - Attach photos and auto-generate captions
