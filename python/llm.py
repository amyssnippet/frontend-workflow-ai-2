import subprocess
import os
import requests
import json
import re
import mimetypes
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

import pdfplumber
from docx import Document as DocxDocument
from pptx import Presentation

app = FastAPI(title="Ollama Mermaid Diagram API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next dev server
    allow_methods=["*"],
    allow_headers=["*"],
)

if not os.path.exists("static"):
    os.makedirs("static")
app.mount("/static", StaticFiles(directory="static"), name="static")

OLLAMA_API_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "granite3.3:8b"


def check_mmdc_installed():
    try:
        if os.name == "nt":  # Windows
            mmdc_path = r"C:\Users\OS6069\AppData\Roaming\npm\mmdc.cmd"
        else:  # Linux/Mac
            mmdc_path = r"/usr/bin/mmdc"
        subprocess.run([mmdc_path, "--version"], check=True)
        print("Mermaid CLI (mmdc) is installed and ready.")
        return True
    except FileNotFoundError:
        print("Error: Mermaid CLI (mmdc) not found.")
        return False
    except subprocess.CalledProcessError:
        return False


def sanitize_mermaid_code(mermaid_code: str) -> str:
    """Clean and normalize Mermaid code to avoid mmdc parse errors."""
    mermaid_code = re.sub(r"^```.*?$", "", mermaid_code, flags=re.MULTILINE)
    mermaid_code = re.sub(r"```$", "", mermaid_code, flags=re.MULTILINE)

    lines = mermaid_code.splitlines()
    cleaned = []
    has_graph = False
    node_counter = 0

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        if stripped.startswith("graph "):
            has_graph = True
            if not stripped.endswith(";"):
                stripped += ";"
            cleaned.append(stripped)
            continue

        if any(edge in stripped for edge in ["-->", "-.->", "---"]):
            safe_line = stripped.replace('"', "'")
            safe_line = safe_line.replace("{", "[").replace("}", "]")
            cleaned.append(safe_line)
            continue

        match = re.match(r"^(\w+)\[(.*)\]$", stripped)
        if match:
            node_id, label = match.groups()
            safe_label = label.replace('"', "'")
            safe_label = re.sub(r"[^\w\s\-\.,()']", "", safe_label)
            safe_label = " ".join(safe_label.split())
            cleaned.append(f"{node_id}[{safe_label}]")
            continue

        node_counter += 1
        safe_label = stripped.replace('"', "'")
        safe_label = re.sub(r"[^\w\s\-\.,()']", "", safe_label)
        safe_label = " ".join(safe_label.split())
        cleaned.append(f"N{node_counter}[{safe_label}]")

    if not has_graph:
        cleaned.insert(0, "graph TD;")

    return "\n".join(cleaned) + "\n"


def call_ollama_granite(user_prompt):
    system_message_content = (
        "You are ONLY to output a valid Mermaid flowchart code block. "
        "The output MUST be ONLY the Mermaid code block. "
        "It MUST begin with '```mermaid' and end with '```'. "
        "Do not include explanations."
    )
    messages = [
        {"role": "control", "content": "thinking"},
        {"role": "system", "content": system_message_content},
        {"role": "user", "content": user_prompt},
    ]
    payload = {"model": OLLAMA_MODEL, "messages": messages, "stream": False}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(OLLAMA_API_URL, headers=headers, data=json.dumps(payload))
        response.raise_for_status()
        result = response.json()
        generated_content = result.get("message", {}).get("content", "").strip()

        match = re.search(r"```mermaid\s*\n(.*?)\n```", generated_content, re.DOTALL)
        if match:
            return match.group(1).strip()
        else:
            return "graph TD;\nA[No valid Mermaid diagram generated];"
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "graph TD;\nA[Error generating diagram];"


def repair_mermaid_with_ollama(broken_code: str) -> str:
    """Ask Ollama to fix invalid Mermaid code."""
    prompt = (
        "The following Mermaid code is invalid. Please fix and return ONLY valid Mermaid code:\n\n"
        f"```mermaid\n{broken_code}\n```"
    )
    return call_ollama_granite(prompt)


def translate_mermaid_to_image(mermaid_code: str, output_filename: str, output_format="png") -> tuple:
    if not check_mmdc_installed():
        return False, "Mermaid CLI not found"

    temp_mermaid_file = "temp.mmd"
    output_path = f"static/{output_filename}.{output_format}"

    try:
        with open(temp_mermaid_file, "w") as f:
            f.write(mermaid_code)

        if os.name == "nt":
            mmdc_path = r"C:\Users\OS6069\AppData\Roaming\npm\mmdc.cmd"
        else:
            mmdc_path = r"/usr/bin/mmdc"

        subprocess.run([mmdc_path, "-i", temp_mermaid_file, "-o", output_path], check=True)
        return True, output_path
    except subprocess.CalledProcessError as e:
        return False, f"mmdc parse error: {e}"
    except Exception as e:
        return False, str(e)
    finally:
        if os.path.exists(temp_mermaid_file):
            os.remove(temp_mermaid_file)


def extract_text_from_file(file_path: str, mime_type: str) -> str:
    text = ""
    try:
        if mime_type == "application/pdf":
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        elif mime_type in [
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
        ]:
            doc = DocxDocument(file_path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text)
        elif mime_type in [
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
        ]:
            pres = Presentation(file_path)
            for slide in pres.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        text += shape.text + "\n"
        elif mime_type == "text/plain":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()
    except Exception as e:
        print(f"Failed to extract text: {e}")
        return ""
    return text.strip()


@app.post("/generate/")
async def generate_diagram(
    description: str = Form(None),
    file: UploadFile = File(None),
    output_format: str = Form("png"),
):
    prompt_text = description.strip() if description else None

    if file is not None:
        input_dir = "input"
        os.makedirs(input_dir, exist_ok=True)
        file_path = os.path.join(input_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        extracted_text = extract_text_from_file(file_path, mime_type)
        if not extracted_text:
            raise HTTPException(status_code=422, detail="File is empty or unsupported")
        prompt_text = extracted_text

    if not prompt_text:
        raise HTTPException(status_code=400, detail="No input provided")

    # Step 1: Generate
    mermaid_code = call_ollama_granite(prompt_text)
    mermaid_code = sanitize_mermaid_code(mermaid_code)

    # Step 2: Try rendering
    success, result = translate_mermaid_to_image(mermaid_code, "generated_flowchart", output_format)

    # Step 3: If fail, retry with repair
    if not success:
        print("First render failed. Attempting repair with Ollama...")
        repaired_code = repair_mermaid_with_ollama(mermaid_code)
        repaired_code = sanitize_mermaid_code(repaired_code)
        success, result = translate_mermaid_to_image(repaired_code, "generated_flowchart", output_format)

        if success:
            mermaid_code = repaired_code
        else:
            mermaid_code = "graph TD;\nA[Diagram generation failed after repair];"
            result = f"static/generated_flowchart.{output_format}"
            with open(result, "wb") as f:
                f.write(b"")

    return {"mermaid": mermaid_code, "image_url": f"/static/{os.path.basename(result)}"}


@app.get("/static/{image_name}")
async def get_diagram_image(image_name: str):
    path = f"static/{image_name}"
    if not os.path.exists(path):
        raise HTTPException(404, "Image not found")
    media_type = "image/svg+xml" if image_name.endswith(".svg") else "image/png"
    return FileResponse(path, media_type=media_type)


@app.get("/")
async def root():
    return {"message": "Ollama Mermaid FastAPI service running"}
