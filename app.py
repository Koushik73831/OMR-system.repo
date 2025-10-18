from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import datetime
import os

app = Flask(__name__)
CORS(app)

# Store answer keys and sheets
answer_keys = {}        # { "A": {"testName": ..., "questions": {...}}, ... }
uploaded_sheets = []
results = []

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return jsonify({"status": "OMR Backend running"})


#Save Answer Key
@app.route("/save-answer-key", methods=["POST"])
def save_answer_key():
    data = request.json
    version = str(data.get("version")).upper()
    if not version or "questions" not in data:
        return jsonify({"error": "Invalid payload"}), 400

    # Save/replace version key
    answer_keys[version] = {
        "testName": data.get("testName", "Untitled Test"),
        "questions": data["questions"]
    }

    return jsonify({
        "message": f"Answer key for {version} saved successfully",
        "keys": list(answer_keys.keys())
    })


#Upload Sheets
@app.route("/upload-sheets", methods=["POST"])
def upload_sheets():
    if "files" not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    files = request.files.getlist("files")
    uploaded = []

    for f in files:
        # Simulated student data
        version = random.choice(list(answer_keys.keys()) if answer_keys else ["A"])
        sheet = {
            "id": f.filename,
            "studentName": f"Student {len(uploaded_sheets) + 1}",
            "studentId": f"ID{1000 + len(uploaded_sheets)}",
            "version": version,
            "answers": {i: random.choice(["A", "B", "C", "D", None]) for i in range(1, 101)},
            "timestamp": datetime.datetime.now().isoformat()
        }
        uploaded.append(sheet)

    uploaded_sheets.extend(uploaded)
    return jsonify({"message": f"{len(uploaded)} sheets uploaded", "sheets": uploaded})


#Process Sheets (per version)
@app.route("/process-sheets", methods=["POST"])
def process_sheets():
    global results
    results = []

    if not answer_keys:
        return jsonify({"error": "No answer keys defined"}), 400
    if not uploaded_sheets:
        return jsonify({"error": "No uploaded sheets"}), 400

    for sheet in uploaded_sheets:
        version = str(sheet.get("version", "")).upper()
        key = answer_keys.get(version)

        if not key:
            results.append({
                "studentName": sheet["studentName"],
                "studentId": sheet["studentId"],
                "version": version,
                "correctAnswers": 0,
                "totalQuestions": 0,
                "percentage": 0,
                "grade": "N/A (No Key)"
            })
            continue

        correct = sum(
            1 for q, ans in key["questions"].items()
            if sheet["answers"].get(int(q)) == ans
        )
        total = len(key["questions"])
        percentage = round((correct / total) * 100, 1) if total > 0 else 0

        grade = (
            "A" if percentage >= 85 else
            "B" if percentage >= 70 else
            "C" if percentage >= 50 else
            "F"
        )

        results.append({
            "studentName": sheet["studentName"],
            "studentId": sheet["studentId"],
            "version": version,
            "correctAnswers": correct,
            "totalQuestions": total,
            "percentage": percentage,
            "grade": grade
        })

    return jsonify({"results": results})


if __name__ == "__main__":
    app.run(debug=True)

