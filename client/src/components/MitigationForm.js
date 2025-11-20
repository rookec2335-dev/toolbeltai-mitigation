import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

const emptyRoom = {
  roomName: "",
  moisturePercent: "",
  moistureDetails: "",
  roomNotes: "",
  photos: [],
};

const emptyDryLog = {
  date: "",
  room: "",
  moisture: "",
  notes: "",
};

function MitigationForm() {
  const [jobInfo, setJobInfo] = useState({
    customerName: "",
    jobAddress: "",
    claimNumber: "",
    paymentStatus: "Waiting on Insurance",
    waitingOnInsurance: "Yes",
  });

  const [rooms, setRooms] = useState([emptyRoom]);
  const [dryLogs, setDryLogs] = useState([emptyDryLog]);
  const [fieldNotes, setFieldNotes] = useState("");

  const [aiSummary, setAiSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // NEW: Psychrometric state
  const [psyData, setPsyData] = useState({
    dehuModel: "",
    inletTemp: "",
    inletRH: "",
    outletTemp: "",
    outletRH: "",
    roomNotes: "",
  });
  const [psyResult, setPsyResult] = useState("");
  const [psyLoading, setPsyLoading] = useState(false);

  // -------- JOB INFO HANDLERS ----------
  const handleJobChange = (field, value) => {
    setJobInfo((prev) => ({ ...prev, [field]: value }));
  };

  // -------- ROOMS HANDLERS ----------
  const handleRoomChange = (index, field, value) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const handleRoomPhotos = (index, files) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], photos: files };
    setRooms(updated);
  };

  const addRoom = () => {
    setRooms((prev) => [...prev, { ...emptyRoom }]);
  };

  // -------- DRY LOG HANDLERS ----------
  const handleDryLogChange = (index, field, value) => {
    const updated = [...dryLogs];
    updated[index] = { ...updated[index], [field]: value };
    setDryLogs(updated);
  };

  const addDryLog = () => {
    setDryLogs((prev) => [...prev, { ...emptyDryLog }]);
  };

  // -------- AI SUMMARY ----------
  const generateSummary = async () => {
    try {
      setIsGenerating(true);
      setAiSummary("");

      // only send text data for rooms (no File objects)
      const textRooms = rooms.map(
        ({ roomName, moisturePercent, moistureDetails, roomNotes }) => ({
          roomName,
          moisturePercent,
          moistureDetails,
          roomNotes,
        })
      );

      const payload = {
        jobInfo,
        rooms: textRooms,
        dryLogs,
        fieldNotes,
      };

      const res = await axios.post(
        "http://localhost:5000/api/mitigation-summary",
        payload
      );

      setAiSummary(res.data.summary || "");
    } catch (err) {
      console.error(err);
      alert("AI Error – check backend / API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // -------- PSYCHROMETRIC AI ----------
  const handlePsyChange = (field, value) => {
    setPsyData((prev) => ({ ...prev, [field]: value }));
  };

  const generatePsychrometric = async () => {
    try {
      setPsyLoading(true);
      setPsyResult("");

      const res = await axios.post(
        "http://localhost:5000/api/psychrometric",
        psyData
      );

      setPsyResult(res.data.table || "");
    } catch (err) {
      console.error(err);
      alert("Psychrometric AI Error – check backend.");
    } finally {
      setPsyLoading(false);
    }
  };

  // -------- PDF EXPORT ----------
  const exportPdf = () => {
    if (!aiSummary) {
      alert("Generate the AI summary first.");
      return;
    }

    const doc = new jsPDF({ unit: "pt", format: "letter" });
    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ToolbeltAI – Mitigation Report", 40, y);
    y += 25;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Customer: ${jobInfo.customerName || ""}`, 40, y);
    y += 14;
    doc.text(`Address: ${jobInfo.jobAddress || ""}`, 40, y);
    y += 14;
    doc.text(`Claim #: ${jobInfo.claimNumber || ""}`, 40, y);
    y += 14;
    doc.text(
      `Waiting on Insurance: ${jobInfo.waitingOnInsurance || ""}`,
      40,
      y
    );
    y += 22;

    // Rooms
    doc.setFont("helvetica", "bold");
    doc.text("Rooms & Moisture Readings", 40, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    rooms.forEach((r, idx) => {
      const block = `Room ${idx + 1} – ${r.roomName || "N/A"}
Moisture %: ${r.moisturePercent || "N/A"}
Details: ${r.moistureDetails || "N/A"}
Notes: ${r.roomNotes || "N/A"}`;

      const lines = doc.splitTextToSize(block, 530);
      lines.forEach((line) => {
        if (y > 760) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, 40, y);
        y += 12;
      });
      y += 6;
    });

    // Dry logs
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Daily Dry Log", 40, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    dryLogs.forEach((d, idx) => {
      const block = `Visit ${idx + 1}
Date: ${d.date || "N/A"}
Room: ${d.room || "N/A"}
Moisture %: ${d.moisture || "N/A"}
Notes: ${d.notes || "N/A"}`;

      const lines = doc.splitTextToSize(block, 530);
      lines.forEach((line) => {
        if (y > 760) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, 40, y);
        y += 12;
      });
      y += 6;
    });

    // Psychrometric table (if present)
    if (psyResult) {
      if (y > 720) {
        doc.addPage();
        y = 40;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Psychrometric Table – Dehumidifier Performance", 40, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const psyLines = doc.splitTextToSize(psyResult, 530);
      psyLines.forEach((line) => {
        if (y > 760) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, 40, y);
        y += 12;
      });

      y += 10;
    }

    // AI summary
    if (y > 720) {
      doc.addPage();
      y = 40;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Supervisor / Insurance-Level Summary", 40, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(aiSummary, 530);
    summaryLines.forEach((line) => {
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
      doc.text(line, 40, y);
      y += 12;
    });

    const fileName =
      jobInfo.claimNumber && jobInfo.claimNumber.trim().length > 0
        ? `ToolbeltAI_Mitigation_Report_${jobInfo.claimNumber}.pdf`
        : "ToolbeltAI_Mitigation_Report.pdf";

    doc.save(fileName);
  };

  return (
    <div className="form-card">
      {/* HEADER WITH LOGO + TITLE */}
      <header className="header">
        <div className="logo-wrap">
          {/* Drop your logo file into /public as toolbeltai-logo.png */}
          <img
            src="/toolbeltai-logo.png"
            alt="ToolbeltAI Logo"
            className="logo-img"
          />
        </div>
        <div>
          <h1 className="title">ToolbeltAI – Mitigation Logger</h1>
          <p className="subtitle">Supervisor-grade reports for insurance & QA</p>
        </div>
      </header>

      {/* JOB INFO */}
      <section>
        <h2 className="section-title">Job Information</h2>
        <input
          className="input"
          placeholder="Customer Name"
          value={jobInfo.customerName}
          onChange={(e) => handleJobChange("customerName", e.target.value)}
        />
        <input
          className="input"
          placeholder="Job Address"
          value={jobInfo.jobAddress}
          onChange={(e) => handleJobChange("jobAddress", e.target.value)}
        />
        <input
          className="input"
          placeholder="Claim Number"
          value={jobInfo.claimNumber}
          onChange={(e) => handleJobChange("claimNumber", e.target.value)}
        />

        <div className="inline-row">
          <select
            className="input inline-input"
            value={jobInfo.paymentStatus}
            onChange={(e) =>
              handleJobChange("paymentStatus", e.target.value)
            }
          >
            <option value="Waiting on Insurance">Waiting on Insurance</option>
            <option value="Customer Paid">Customer Paid</option>
            <option value="Partial Paid">Partial Paid</option>
          </select>

          <select
            className="input inline-input"
            value={jobInfo.waitingOnInsurance}
            onChange={(e) =>
              handleJobChange("waitingOnInsurance", e.target.value)
            }
          >
            <option value="Yes">Waiting on Insurance – Yes</option>
            <option value="No">Waiting on Insurance – No</option>
          </select>
        </div>
        <p className="helper-text">
          Payment is for internal tracking only – it will **not** appear in the
          AI insurance summary.
        </p>
      </section>

      {/* ROOMS */}
      <section>
        <h2 className="section-title">Rooms & Moisture Readings</h2>

        {rooms.map((room, index) => (
          <div key={index} className="room-block">
            <input
              className="input"
              placeholder="Room Name (e.g., Basement, Living Room)"
              value={room.roomName}
              onChange={(e) =>
                handleRoomChange(index, "roomName", e.target.value)
              }
            />
            <input
              className="input"
              placeholder="Moisture % (e.g., 22% walls, 18% floor)"
              value={room.moisturePercent}
              onChange={(e) =>
                handleRoomChange(index, "moisturePercent", e.target.value)
              }
            />
            <input
              className="input"
              placeholder="Moisture Reading Details (meter type, reference readings, etc.)"
              value={room.moistureDetails}
              onChange={(e) =>
                handleRoomChange(index, "moistureDetails", e.target.value)
              }
            />
            <textarea
              className="textarea"
              placeholder="Room Notes – what was removed/dried, equipment placed, access issues, etc."
              value={room.roomNotes}
              onChange={(e) =>
                handleRoomChange(index, "roomNotes", e.target.value)
              }
            />
            <label className="upload-label">
              Upload Photos (for your records – mentioned in report but not
              uploaded):
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => handleRoomPhotos(index, e.target.files)}
            />
          </div>
        ))}

        <button className="add-btn" onClick={addRoom}>
          ➕ Add Another Room
        </button>
      </section>

      {/* DRY LOG SECTION */}
      <section>
        <h2 className="section-title">Daily Dry Log</h2>

        {dryLogs.map((log, index) => (
          <div key={index} className="room-block">
            <div className="inline-row">
              <input
                className="input inline-input"
                type="date"
                value={log.date}
                onChange={(e) =>
                  handleDryLogChange(index, "date", e.target.value)
                }
              />
              <input
                className="input inline-input"
                placeholder="Room"
                value={log.room}
                onChange={(e) =>
                  handleDryLogChange(index, "room", e.target.value)
                }
              />
              <input
                className="input inline-input"
                placeholder="Moisture Level %"
                value={log.moisture}
                onChange={(e) =>
                  handleDryLogChange(index, "moisture", e.target.value)
                }
              />
            </div>
            <textarea
              className="textarea"
              placeholder="Dry log notes – what was checked, equipment changes, progress, concerns."
              value={log.notes}
              onChange={(e) =>
                handleDryLogChange(index, "notes", e.target.value)
              }
            />
          </div>
        ))}

        <button className="add-btn" onClick={addDryLog}>
          ➕ Add Another Dry Log Entry
        </button>
      </section>

      {/* NEW: PSYCHROMETRIC SECTION */}
      <section>
        <h2 className="section-title">Psychrometric Table (Dehumidifier)</h2>
        <p className="helper-text">
          This section documents dehumidifier performance (inlet / outlet
          conditions) so adjusters can see grain depression and psychrometric
          data.
        </p>

        <div className="room-block">
          <input
            className="input"
            placeholder="Dehumidifier Model (e.g., LGR 7000, Revolution)"
            value={psyData.dehuModel}
            onChange={(e) => handlePsyChange("dehuModel", e.target.value)}
          />

          <div className="inline-row">
            <input
              className="input inline-input"
              placeholder="Inlet (Return) Temp °F"
              value={psyData.inletTemp}
              onChange={(e) => handlePsyChange("inletTemp", e.target.value)}
            />
            <input
              className="input inline-input"
              placeholder="Inlet RH %"
              value={psyData.inletRH}
              onChange={(e) => handlePsyChange("inletRH", e.target.value)}
            />
          </div>

          <div className="inline-row">
            <input
              className="input inline-input"
              placeholder="Outlet (Supply) Temp °F"
              value={psyData.outletTemp}
              onChange={(e) => handlePsyChange("outletTemp", e.target.value)}
            />
            <input
              className="input inline-input"
              placeholder="Outlet RH %"
              value={psyData.outletRH}
              onChange={(e) => handlePsyChange("outletRH", e.target.value)}
            />
          </div>

          <textarea
            className="textarea"
            placeholder="Room / equipment notes – where the dehu is set, size of area, any airflow notes."
            value={psyData.roomNotes}
            onChange={(e) => handlePsyChange("roomNotes", e.target.value)}
          />

          <button
            className={`generate-btn ${psyLoading ? "loading" : ""}`}
            style={{ marginTop: "6px" }}
            onClick={generatePsychrometric}
            disabled={psyLoading}
          >
            {psyLoading
              ? "Calculating Psychrometric Table..."
              : "📊 Generate Psychrometric Table (AI)"}
          </button>

          <textarea
            className="output"
            style={{ marginTop: "10px", minHeight: "140px" }}
            placeholder="Psychrometric table and explanation will appear here..."
            value={psyResult}
            readOnly
          />
        </div>
      </section>

      {/* FIELD NOTES */}
      <section>
        <h2 className="section-title">Tech / Field Notes (Optional)</h2>
        <textarea
          className="textarea"
          placeholder="Anything else the supervisor or adjuster should know – prior damage, access issues, homeowner concerns, etc."
          value={fieldNotes}
          onChange={(e) => setFieldNotes(e.target.value)}
        />
      </section>

      {/* ACTION BUTTONS */}
      <section>
        <button
          className={`generate-btn ${isGenerating ? "loading" : ""}`}
          onClick={generateSummary}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating with ToolbeltAI..." : "⚡ Generate AI Summary"}
        </button>

        <button
          className="pdf-btn"
          onClick={exportPdf}
          disabled={!aiSummary}
        >
          📄 Export Insurance-Ready PDF
        </button>

        <textarea
          className="output"
          placeholder="AI supervisor / insurance summary will appear here..."
          value={aiSummary}
          readOnly
        />
      </section>
    </div>
  );
}

export default MitigationForm;
