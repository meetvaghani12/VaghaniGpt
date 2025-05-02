# 🔮 VAGHANI GPT- AI Chat Application

An intelligent multi-model chat application that allows users to converse with leading AI models, secured by robust authentication mechanisms and enhanced by rich features like chat history and session management.

## ✨ Features

### 🔐 Authentication
- **Two-Factor Authentication (2FA)**:  
  - OTP sent to the registered email during **registration**.  
  - OTP verification required again during **login** to enhance security.
- **OAuth Integration**:  
  - Seamless login using **Google Authentication**.

### 🤖 AI Models
Users can interact with any of the following AI models:
- **Google Gemini**
- **OpenAI GPT-4.1**
- **DeepSeek**

Easily switch between models based on your needs and preferences.

### 💬 Chat Interface
- Interactive and responsive chat experience.
- Choose your desired AI model before starting the conversation.
- Track the model you’re chatting with.

### 📂 Chat History
- Every session is **automatically saved**.
- **Sidebar navigation** allows switching between past chat sessions.
- Effortlessly continue conversations from where you left off.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- A configured environment with the required API keys (OpenAI, Google Gemini, etc.)
- SMTP setup for email-based OTPs

### Installation

```bash
git clone https://github.com/meetvaghani12/VaghaniGpt
cd VaghaniGpt
npm install
