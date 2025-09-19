import subprocess
import os
import requests
import json
import re

# --- Configuration ---
OLLAMA_API_URL = "http://localhost:11434/api/chat"
OLLAMA_MODEL = "granite3.3:8b" # Ensure you have pulled this model with 'ollama pull granite3.3'

def check_mmdc_installed():
    """
    Checks if the 'mmdc' command-line tool is installed and accessible.
    Provides instructions if not found.
    """
    try:
        subprocess.run(['mmdc', '--version'], check=True, capture_output=True)
        print("Mermaid CLI (mmdc) is installed and ready.")
        return True
    except FileNotFoundError:
        print("Error: Mermaid CLI (mmdc) not found.")
        print("Please install it by running: npm install -g @mermaid-js/mermaid-cli")
        print("You'll need Node.js and npm installed first.")
        return False
    except subprocess.CalledProcessError as e:
        print(f"Error checking mmdc version: {e}")
        print(f"Stdout: {e.stdout.decode()}")
        print(f"Stderr: {e.stderr.decode()}")
        return False

def call_ollama_granite(user_prompt):
    """
    Calls the local Ollama instance with the Granite 3.3 model
    to generate a Mermaid flowchart definition, incorporating a 'thinking' control message.

    Args:
        user_prompt (str): The natural language description of the diagram.

    Returns:
        str: The generated Mermaid definition string, or None if an error occurs.
    """
    # System message to guide the LLM's behavior
    system_message_content = (
        "You are an expert in Mermaid diagram syntax. "
        "Your task is to convert natural language descriptions into valid Mermaid flowchart definitions. "
        "The output MUST be ONLY the Mermaid code block, enclosed in triple backticks and 'mermaid' language tag. "
        "For example:\n"
        "```mermaid\n"
        "graph TD;\n"
        "    A[Start] --> B[End];\n"
        "```\n"
        "Ensure the generated diagram is a flowchart (graph TD or LR). "
        "IMPORTANT: For node text, use square brackets `[]` for standard process steps. "
        "If using curly braces `{}` for decision nodes, keep the text inside simple and concise, "
        "avoiding special characters like parentheses `()`, commas `,`, or other punctuation that could confuse the parser. "
        "If you need to list multiple items, consider putting them in separate nodes or simplifying the main node text significantly."
    )

    # Construct the messages array including the 'control' role for thinking
    messages = [
        {"role": "control", "content": "thinking"}, # Added thinking capability
        {"role": "system", "content": system_message_content},
        {"role": "user", "content": user_prompt}
    ]

    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages, # Using messages array instead of prompt
        "stream": False # We want the full response at once
    }

    headers = {'Content-Type': 'application/json'}

    try:
        print(f"Calling Ollama with model: {OLLAMA_MODEL} and thinking control...")
        response = requests.post(OLLAMA_API_URL, headers=headers, data=json.dumps(payload))
        response.raise_for_status() #

        result = response.json()
        generated_content = result.get("message", {}).get("content", "").strip()

        # Extract the Mermaid code block using regex
        match = re.search(r"```mermaid\n(.*?)\n```", generated_content, re.DOTALL)
        if match:
            mermaid_code = match.group(1).strip()
            print("Successfully extracted Mermaid code from LLM response.")
            return mermaid_code
        else:
            print("Warning: Could not find a valid Mermaid code block in the LLM's response.")
            print("LLM Raw Response:\n", generated_content)
            return None

    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to Ollama server at {OLLAMA_API_URL}.")
        print(f"Please ensure Ollama is running and the model ('{OLLAMA_MODEL}') is pulled.")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error calling Ollama API: {e}")
        print(f"Response content: {response.text if 'response' in locals() else 'N/A'}")
        return None
    except json.JSONDecodeError:
        print("Error: Could not decode JSON response from Ollama.")
        return None
    except Exception as e:
        print(f"An unexpected error occurred during Ollama call: {e}")
        return None

def translate_mermaid_to_image(mermaid_definition, output_filename, output_format='png'):
    """
    Translates a Mermaid definition string into an image file (PNG or SVG).

    Args:
        mermaid_definition (str): The Mermaid diagram definition string.
        output_filename (str): The desired name for the output image file (without extension).
        output_format (str): The desired output format ('png' or 'svg').
                             Note: mmdc does not directly support GIF for static diagrams.
    """
    if not check_mmdc_installed():
        return False

    supported_formats = ['png', 'svg'] # Limiting to common image formats for direct output
    if output_format.lower() not in supported_formats:
        print(f"Error: Unsupported output format '{output_format}'. Please choose one of: {', '.join(supported_formats)}.")
        return False

    # Create a temporary file for the Mermaid definition
    temp_mermaid_file = "temp_mermaid_diagram.mmd"
    output_file_full_path = f"{output_filename}.{output_format}"
    try:
        with open(temp_mermaid_file, "w") as f:
            f.write(mermaid_definition)

        command = [
            'mmdc',
            '-i', temp_mermaid_file,
            '-o', output_file_full_path
        ]

        print(f"Executing command: {' '.join(command)}")
        process = subprocess.run(command, capture_output=True, text=True, check=True)

        print(f"Successfully translated Mermaid to {output_file_full_path}")
        if process.stdout:
            print("mmdc stdout:\n", process.stdout)
        if process.stderr:
            print("mmdc stderr:\n", process.stderr)
        return True

    except subprocess.CalledProcessError as e:
        print(f"Error translating Mermaid: {e}")
        print(f"mmdc stdout:\n{e.stdout}")
        print(f"mmdc stderr:\n{e.stderr}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred during image generation: {e}")
        return False
    finally:
        # Clean up the temporary Mermaid file
        if os.path.exists(temp_mermaid_file):
            os.remove(temp_mermaid_file)

def main():
    """
    Main function to run the interactive Mermaid diagram generator.
    """
    print("Welcome to my Ollama-powered Mermaid Diagram Generator!")
    print("You can either describe a flowchart for me to generate,")
    print("or provide a Mermaid definition file from your 'input' folder.")
    print("\nMake sure Ollama is running and you have 'granite3.3' model pulled.")
    print("Also ensure 'mmdc' (Mermaid CLI) is installed.")

    while True:
        choice = input("\nDo you want to (1) Describe a flowchart or (2) Provide a Mermaid file? (1/2): ").strip()

        mermaid_code = None
        output_base_name = "generated_flowchart" # Default output base name

        if choice == '1':
            user_description = input("Provide the definition of the flowchart you want to build:\n> ")
            if not user_description.strip():
                print("Description cannot be empty. Please try again.")
                continue
            print("\nGenerating Mermaid definition using Ollama...")
            mermaid_code = call_ollama_granite(user_description)
            output_base_name = "generated_flowchart" # Ensure default for descriptions
        elif choice == '2':
            input_dir = "input"
            # Create 'input' directory if it doesn't exist
            if not os.path.exists(input_dir):
                os.makedirs(input_dir)
                print(f"Created '{input_dir}' directory. Please place your Mermaid files here and try again.")
                continue # Loop back to prompt for choice after creating dir

            file_name = input(f"Enter the Mermaid file name (e.g., my_diagram.mmd) from the '{input_dir}' folder:\n> ")
            file_path = os.path.join(input_dir, file_name)

            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r') as f:
                        mermaid_code = f.read()
                    print(f"Successfully read Mermaid definition from '{file_path}'.")
                    # Set output base name from the input file name
                    output_base_name = os.path.splitext(file_name)[0]
                except Exception as e:
                    print(f"Error reading file '{file_path}': {e}")
                    continue
            else:
                print(f"Error: File '{file_path}' not found. Please ensure it exists in the '{input_dir}' folder.")
                continue
        else:
            print("Invalid choice. Please enter '1' or '2'.")
            continue

        if mermaid_code:
            print("\n--- Mermaid Definition ---")
            print(mermaid_code)
            print("--------------------------")

            print(f"\nAttempting to generate images: {output_base_name}.png and {output_base_name}.svg")
            print("Note: GIF output is not directly supported by mmdc for static diagrams.")

            # Generate PNG
            png_success = translate_mermaid_to_image(mermaid_code, output_base_name, "png")

            # Generate SVG
            svg_success = translate_mermaid_to_image(mermaid_code, output_base_name, "svg")

            if png_success and svg_success:
                print(f"\nSuccessfully created '{output_base_name}.png' and '{output_base_name}.svg'.")
            else:
                print("\nImage generation failed for one or both formats. Please check the errors above.")
        else:
            print("\nFailed to get Mermaid code. Please check your input, Ollama connection, or LLM response.")

        another = input("\nDo you want to generate another diagram? (yes/no): ").lower()
        if another != 'yes':
            print("Exiting. Goodbye!")
            break

if __name__ == "__main__":
    main()