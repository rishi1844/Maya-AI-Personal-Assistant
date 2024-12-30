from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)  # This will allow CORS for all routes

API_KEY = "AIzaSyA04t0-WSljx8jV6ff1Ct48O1iu4udwOB4"
genai.configure(api_key=API_KEY)

@app.route('/generate-content', methods=['POST'])
def generate_content():
    data = request.json
    user_message = data.get("message", "")
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        model = genai.GenerativeModel(model_name="gemini-1.5-flash")
        response = model.generate_content(user_message)
        raw_text = response.text
        
        # Format and structure the response
        structured_response = structure_response(raw_text)

        return jsonify({"response": structured_response})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def structure_response(raw_text):
    # Example structure to split the response into introduction and sections
    introduction = raw_text.split("\n")[0]  # Use the first line as the introduction
    sections = []

    # Split raw_text into sections (this can be customized based on actual content structure)
    lines = raw_text.split("\n")[1:]  # Skipping the first line for the introduction
    section = {}
    current_title = "Main Section"
    section["title"] = current_title
    section["content"] = "\n".join(lines)
    
    sections.append(section)

    return {
        "introduction": introduction,
        "sections": sections
    }

if __name__ == '__main__':
    app.run(debug=True)
