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
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── Dockerfile
│   └── ...
├── frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── types/
│   └── ...
└── README.md
