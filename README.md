# 📚 Bookified - Intelligent AI PDF Chat Application

**Bookified** is a sophisticated, next-generation AI platform that transforms how you interact with PDF documents. Going beyond simple RAG (Retrieval-Augmented Generation), Bookified employs autonomous agent architecture, multi-source data synthesis, and advanced reasoning to deliver highly contextual, intelligent responses.

Whether you're a student, researcher, or professional, Bookified allows you to chat with your documents, extract insights, and search the web simultaneously for comprehensive answers.

## ✨ Features

- **🧠 Advanced AI Agent & Reasoning:** Integrates external search capabilities and multi-source data synthesis for context-aware and comprehensive responses.
- **📄 High-Performance PDF Processing:** Seamless document indexing, chunking, and intelligent vector search.
- **🔐 Secure Authentication:** Seamless and secure user login, registration, and session management powered by Clerk.
- **💳 Tiered Subscriptions:** Built-in Stripe integration for flexible subscription plans and usage limits.
- **⚡ Blazing Fast Architecture:** Built on Next.js 16 with asynchronous architecture to ensure peak performance and scalability.
- **🎨 Modern UI/UX:** A stunning, responsive, and accessible user interface crafted with Tailwind CSS, Shadcn UI, and Framer Motion animations.
- **🛡️ Rate Limiting & Security:** Enterprise-grade rate limiting using Upstash Redis to prevent abuse.

## 📸 Screenshots

| Landing Page | Library Dashboard |
|:---:|:---:|
| ![Landing Page](./public/assets/hero.png) | ![Library Dashboard](./public/assets/library.png) |
| **Chat Interface** | **Pricing Plans** |
| ![Chat Interface](./public/assets/chat.png) | ![Pricing Plans](./public/assets/pricing.png) |

*(Note: Please ensure your uploaded screenshots are saved as `hero.png`, `library.png`, `chat.png`, and `pricing.png` in your `public/assets/` folder to display them properly.)*

## 🛠️ Tech Stack

### Core
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI & Styling:** [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)

### AI & Data
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/docs), [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Web Search:** DuckDuckScrape

### Backend & Infrastructure
- **Database:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Storage:** [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
- **Payments:** [Stripe](https://stripe.com/)
- **Rate Limiting:** [Upstash Redis](https://upstash.com/)

---

## 🚀 How to Run It Locally

Follow these steps to get the project up and running on your local machine.

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18 or higher) and `npm` installed.

### 2. Clone the Repository
```bash
git clone https://github.com/Younes-sef/bookified.git
cd bookified
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Environment Variables
Create a `.env.local` file in the root directory and add the necessary API keys. (You can check the variables needed based on your `.env.local` setup):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# MongoDB Database
MONGODB_URI=

# AI Provider (Google Gemini)
GOOGLE_API_KEY=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### 5. Start the Stripe CLI (Optional for Payments)
To test webhooks locally, run the Stripe listener in a separate terminal:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---
