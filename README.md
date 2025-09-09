<<<<<<< HEAD
# 🚀 SkillSphere: AI-Powered Skill & Career Advisor  

[![Firebase Hosting](https://img.shields.io/badge/Hosting-Firebase-orange)]()  
[![Cloud Run](https://img.shields.io/badge/Backend-GCP%20Cloud%20Run-blue)]()  
[![Next.js](https://img.shields.io/badge/Frontend-Next.js-black)]()  
[![Tailwind CSS](https://img.shields.io/badge/Style-TailwindCSS-teal)]()  
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)  

👉 **Live Demo:** [SkillSphere Web App](https://skillsphere-app.web.app)  

---

## 🎯 Why SkillSphere?  
Confused about your career path? Overwhelmed by too many choices?  
**SkillSphere** uses Google’s **Gemini AI** to turn your academic background, existing skills, and personal interests into **personalized career roadmaps**. No more guesswork — get **AI-powered guidance** that actually makes sense.  

---

## ✨ Features  
- 🤖 **AI-Powered Recommendations** — Generates 3 tailored career paths with justifications.  
- 🗺️ **Detailed Roadmaps** — Actionable steps to follow, not just vague advice.  
- 🔒 **Secure Authentication** — Sign in with Google via Firebase Auth.  
- 📜 **Persistent History** — Past recommendations saved in Firestore for each user.  
- 📱 **Responsive UI** — Next.js + Tailwind ensures smooth use across devices.  
- ☁️ **Cloud-Native** — Backend on Cloud Run, frontend on Firebase Hosting.  

---

## 🖼️ Screenshots  
👉 Place screenshots in `readme-assets/` folder.  

<p align="center">  
  <img src="readme-assets/skillsphere-screenshot.jpg" alt="SkillSphere Screenshot" width="700"/>  
</p>  

---

## 🛠️ Tech Stack  

**Frontend**  
- ⚡ Next.js (App Router)  
- 🎨 Tailwind CSS  
- 🔑 Firebase Authentication  

**Backend**  
- 🚀 Node.js + Express.js  
- 🤖 Google Vertex AI (Gemini Pro model)  
- 🔒 Cloud Firestore  

**Deployment**  
- 🐳 Docker + Google Cloud Run (backend)  
- 🌍 Firebase Hosting (frontend)  

---

## 🏗️ Architecture  

👉 Save an architecture diagram in `readme-assets/architecture.png`.  

<p align="center">  
  <img src="readme-assets/architecture.png" alt="SkillSphere Architecture" width="700"/>  
</p>  

---

## 📂 Project Structure  

```bash
SkillSphere/
├── backend/           # Node.js backend service
=======
SkillSphere: AI-Powered Skill & Career Advisor
SkillSphere is a modern, full-stack web application designed to provide personalized career and skill recommendations. Leveraging the power of Google's Gemini AI, this application offers tailored advice to help guide users on their professional journey.

The application is fully deployed to the cloud, featuring a responsive user interface, user authentication, and a persistent history of recommendations.

Live Application URL: https://skillsphere-app.web.app

(Suggestion: Create a folder named readme-assets in your root directory and add a nice screenshot of your app named skillsphere-screenshot.jpg)

✨ Core Features
Personalized AI Recommendations: Utilizes Google's Gemini Pro model to generate three distinct career paths based on user inputs.

Detailed Career Roadmaps: Each recommendation includes a clear justification and actionable steps for the user to follow.

Secure User Authentication: Users can sign in securely with their Google accounts via Firebase Authentication.

Persistent History: Logged-in users have their recommendation history automatically saved to a private collection in Cloud Firestore.

Fully Responsive UI: The user interface is built with Next.js and Tailwind CSS, providing a seamless experience on both desktop and mobile devices.

Professional Architecture: The codebase is organized into a scalable monorepo structure, with a clear separation between the frontend and a service-oriented backend.

Cloud-Native Deployment: The entire application is deployed on Google Cloud Platform, with the backend running on Cloud Run and the frontend on Firebase Hosting.

🛠️ Tech Stack & Architecture
This project is a full-stack application built with a modern, cloud-native architecture.

Frontend
Framework: Next.js (with App Router)

Language: TypeScript

Styling: Tailwind CSS

Authentication: Firebase Authentication

Database (Client): Cloud Firestore

Deployment: Firebase Hosting

Backend
Framework: Node.js with Express.js

Language: JavaScript

AI Integration: Google Vertex AI SDK for the Gemini Pro model.

Containerization: Docker

Deployment: Google Cloud Run

Project Structure
The project is organized as a monorepo with two main packages: frontend and backend.

SkillSphere/
├── backend/
>>>>>>> 6f9f51ae33da0aa6d724bda38432ad158394c9de
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── Dockerfile
│   └── ...
<<<<<<< HEAD
├── frontend/          # Next.js frontend application
=======
├── frontend/
>>>>>>> 6f9f51ae33da0aa6d724bda38432ad158394c9de
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── types/
│   └── ...
└── README.md
<<<<<<< HEAD
=======

🚀 Getting Started Locally
Prerequisites
Node.js (v18 or later)

Docker Desktop

Google Cloud SDK (gcloud)

Firebase CLI (firebase-tools)

Setup Instructions
Clone the repository:

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

Configure Backend:

Navigate to the backend directory: cd backend

Create a .env file and add your Google Cloud PROJECT_ID and REGION.

Install dependencies: npm install

Authenticate for local development: gcloud auth application-default login

Configure Frontend:

Navigate to the frontend directory: cd frontend

In src/lib/firebase.ts, replace the placeholder firebaseConfig with your actual Firebase web app configuration keys.

Install dependencies: npm install

Authenticate with Firebase: firebase login

Run the Application:

Start the backend server (from the backend folder): npm start

Start the frontend server (from the frontend folder): npm run dev

The application will then be available at http://localhost:3000.

☁️ Deployment
The application is designed for a full cloud deployment on Google Cloud Platform.

Backend (Cloud Run): The backend is containerized using Docker and deployed as a serverless service on Cloud Run. It is configured to run with a dedicated service account and has a minimum of 1 instance to prevent cold starts.

Frontend (Firebase Hosting): The frontend is a static Next.js application deployed to Firebase Hosting, which provides a global CDN for fast delivery.
>>>>>>> 6f9f51ae33da0aa6d724bda38432ad158394c9de
