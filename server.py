from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv  # Import dotenv

# Load environment variables from .env file (for local development)
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load API Key from environment variables
API_KEY = os.environ.get("GENAI_API_KEY")
if not API_KEY:
    raise ValueError("API Key not found. Set the GENAI_API_KEY environment variable.")
genai.configure(api_key=API_KEY)

# Root route
@app.route('/')
def home():
    return "Welcome to the Flask App!", 200

# Route for generating content
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

        return jsonify({"response": raw_text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
