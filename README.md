# 🚀 NeuroaAI - AI Content Generation Platform

A modern, full-stack AI-powered content generation platform built with React and Node.js, featuring secure authentication and powerful AI capabilities.

![NeuroaAI Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=NeuroaAI+AI+Content+Generation)  
*[Add your project banner/screenshot here]*

## ✨ Features

- **AI-Powered Content Generation**
  - Generate high-quality articles, stories, and more
  - Support for multiple content types and formats
  - Customizable output length and style

- **User Management**
  - Secure authentication with Clerk
  - Role-based access control
  - User profile management

- **Modern Tech Stack**
  - React 18 with Vite for blazing fast frontend
  - Express.js backend with RESTful APIs
  - PostgreSQL database with Neon serverless
  - Google Gemini AI integration

- **Developer Friendly**
  - Comprehensive logging with Winston
  - Environment-based configuration
  - API documentation
  - Rate limiting and request validation

## �️ Tech Stack

| Category        | Technologies                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| **Frontend**    | React 18, Vite, Tailwind CSS, React Router, Clerk                           |
| **Backend**     | Node.js, Express.js, PostgreSQL (Neon)                                      |
| **AI**          | Google Gemini API                                                           |
| **Auth**        | Clerk Authentication                                                        |
| **DevOps**      | Vite, Winston, dotenv                                                      |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database (local or Neon)
- Google Gemini API key
- Clerk account and API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NeuroaAI.git
   cd NeuroaAI
   ```

2. **Set up environment variables**
   Create `.env` files in both `client/` and `server/` directories:
   
   `server/.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=your_postgres_connection_string
   CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

   `client/.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   ```

3. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

4. **Run the application**
   In separate terminals:
   ```bash
   # Terminal 1 - Start the server
   cd server
   npm run dev
   
   # Terminal 2 - Start the client
   cd ../client
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## � API Documentation

### Authentication
All protected routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Available Endpoints

#### Content Generation
- `POST /api/ai/generate` - Generate content based on prompt
  ```json
  {
    "prompt": "Your content prompt here",
    "length": 500,
    "tone": "professional"
  }
  ```

#### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile

## 🔒 Security

- All API routes are protected by authentication middleware
- Sensitive data is encrypted
- Rate limiting is implemented for API endpoints
- Input validation on all endpoints

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Clerk](https://clerk.com/) for authentication
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Neon](https://neon.tech/) for PostgreSQL hosting

---

<div align="center">
  Made with ❤️ by Your Name | [Website](https://yourwebsite.com) | [Twitter](https://twitter.com/yourhandle)
</div>
- AI 401/403:
  - Check `GEMINI_API_KEY` validity and quota.
- DB errors:
  - Verify `DATABASE_URL` and network connectivity.

## 📄 License
MIT