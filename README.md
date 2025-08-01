# NextGenArchitect 🏗️

NextGenArchitect is an AI-powered platform for custom floor plan generation and seamless plot purchasing. The platform provides tools for designing, validating, and approving architectural projects with advanced compliance management.

[![React](https://img.shields.io/badge/React-18.0+-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.0+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.0+-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Features](#features)
- [Contributing](#contributing)

## ✅ Prerequisites

**IMPORTANT:** Install these before proceeding:

### Required Software:
- **Node.js** (version 16.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

### Verify Installation:
```bash
node --version    # Should show v16.0.0 or higher
npm --version     # Should show 8.0.0 or higher
git --version     # Should show version info
```

If any command fails, install the missing software before continuing.

## 🚀 Quick Start (5 Minutes Setup)

**Copy and paste these commands one by one:**

```bash
# 1. Clone the repository
git clone https://github.com/Aashfa/NextGenArchitect.git

# 2. Navigate to project directory
cd NextGenArchitect

# 3. Go to frontend folder
cd frontend

# 4. Install dependencies (this may take 2-3 minutes)
npm install

# 5. Install Tailwind CSS dependencies
npm install -D tailwindcss postcss autoprefixer

# 6. Initialize Tailwind configuration
npx tailwindcss init -p

# 7. Start the development server
npm run dev
```

**🎉 That's it! Your project should now be running at `http://localhost:5173`**

## 🔧 Detailed Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/Aashfa/NextGenArchitect.git
cd NextGenArchitect
```

### Step 2: Navigate to Frontend
```bash
cd frontend
```

### Step 3: Install Dependencies
```bash
# Install all project dependencies
npm install

# Install Tailwind CSS and related packages
npm install -D tailwindcss postcss autoprefixer

# Install additional dependencies if needed
npm install react-router-dom react-icons
```

### Step 4: Configure Tailwind CSS

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2F3D57',
        secondary: '#ED7600',
      }
    },
  },
  plugins: [],
}
```

Create `postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 5: Ensure CSS Setup

Make sure `src/index.css` contains:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 6: Start Development Server
```bash
npm run dev
```

## 📁 Project Structure

```
NextGenArchitect/
├── frontend/                    # Main application folder
│   ├── index.html              # Entry HTML file
│   ├── package.json            # Dependencies and scripts
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS config
│   ├── postcss.config.js       # PostCSS config
│   ├── src/
│   │   ├── main.jsx            # Application entry point
│   │   ├── App.jsx             # Main App component
│   │   ├── index.css           # Global styles
│   │   ├── components/         # Reusable components
│   │   │   ├── user/           # User-facing components
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── subadmin/       # Admin components
│   │   │       └── ComplianceManagement.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── user/           # User pages
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── SocietyPage.jsx
│   │   │   │   ├── PlotDetails.jsx
│   │   │   │   └── Login.jsx
│   │   │   ├── subadmin/       # Admin pages
│   │   │   │   └── SubAdminDashboard.jsx
│   │   │   └── userprofile/    # User profile pages
│   │   │       └── userprofile.jsx
│   │   ├── layouts/            # Layout components
│   │   │   ├── UserLayout.jsx
│   │   │   └── UserProfileLayout.jsx
│   │   └── assets/             # Static assets (images, icons)
│   ├── public/                 # Public assets
│   └── dist/                   # Build output (auto-generated)
├── README.md                   # This file
└── .gitignore                  # Git ignore rules
```

## 📜 Available Scripts

In the `frontend` directory, you can run:

### `npm run dev`
- Starts the development server
- Opens at `http://localhost:5173`
- Hot reload enabled (changes reflect instantly)

### `npm run build`
- Builds the app for production
- Optimized and minified output in `dist/` folder

### `npm run preview`
- Preview the production build locally
- Runs after `npm run build`

### `npm run lint`
- Runs ESLint to check code quality
- Fix issues automatically with `npm run lint -- --fix`

## 🛠️ Technology Stack

### Core Technologies
- **React 18** - UI library
- **Vite** - Build tool and development server
- **JavaScript/JSX** - Programming language

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **React Icons** - Icon library

### Routing & State
- **React Router DOM** - Client-side routing
- **React Hooks** - State management

### Development Tools
- **ESLint** - Code linting
- **Hot Module Replacement** - Fast development

## 🎯 Key Features

### 🏠 User Features
- **Homepage** - Platform overview with image carousel
- **Society Browsing** - Browse housing societies and plots
- **Plot Details** - Detailed plot information and specifications
- **User Authentication** - Login and user management
- **Responsive Design** - Works on desktop, tablet, and mobile

### 👨‍💼 Sub-Admin Features
- **Dashboard** - Administrative overview and analytics
- **Compliance Management** - Manage building compliance rules
- **Room Connections** - Define relationships between rooms
- **Plot Configuration** - Configure plot sizes and requirements

### 🎨 Design System
- **Consistent Color Scheme** - Primary (#2F3D57) and Secondary (#ED7600)
- **Modern UI Components** - Cards, buttons, forms, tables
- **Responsive Layouts** - Mobile-first design approach

## 🐛 Troubleshooting

### ❌ Common Issues & Solutions

#### 1. **"Cannot find module 'tailwindcss'" Error**
```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### 2. **Port 5173 is already in use**
```bash
# Kill the process using the port
npx kill-port 5173

# Or specify a different port
npm run dev -- --port 3000
```

#### 3. **Node modules issues**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json
# For Windows: rmdir /s node_modules & del package-lock.json

# Reinstall
npm install
```

#### 4. **Git clone permission denied**
```bash
# Use HTTPS instead of SSH
git clone https://github.com/Aashfa/NextGenArchitect.git
```

#### 5. **Vite build errors**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

#### 6. **CSS not loading/Tailwind not working**
```bash
# Ensure Tailwind is properly configured
npx tailwindcss init -p

# Check if index.css has Tailwind imports
# @tailwind base;
# @tailwind components;
# @tailwind utilities;
```

### 🔄 Complete Reset (if nothing works)
```bash
# 1. Delete everything and start fresh
rm -rf node_modules package-lock.json dist

# 2. Reinstall dependencies
npm install
npm install -D tailwindcss postcss autoprefixer

# 3. Reconfigure Tailwind
npx tailwindcss init -p

# 4. Start development server
npm run dev
```

### 🖥️ Platform-Specific Notes

#### Windows Users:
- Use PowerShell or Command Prompt
- If you get execution policy errors: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

#### macOS/Linux Users:
- You might need to use `sudo` for global npm installs
- Ensure you have the latest version of Node.js

## 🌐 Accessing the Application

Once the development server starts:

1. **Open your browser**
2. **Navigate to:** `http://localhost:5173`
3. **You should see:** NextGenArchitect homepage

### Available Routes:
- `/` - Homepage
- `/society` - Society listings
- `/login` - User login
- `/subadmin` - Sub-admin dashboard
- `/plot-details` - Plot information

## 🤝 Contributing

### Making Changes:
1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test your changes:**
   ```bash
   npm run dev
   npm run build
   ```
5. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add your feature description"
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request**

### Code Style:
- Use functional components with hooks
- Follow Tailwind CSS utility classes
- Keep components small and reusable
- Add comments for complex logic

## 📞 Support & Help

### Getting Help:
1. **Check this README first** - Most issues are covered here
2. **Search existing issues** - [GitHub Issues](https://github.com/Aashfa/NextGenArchitect/issues)
3. **Create a new issue** - Include error messages and steps to reproduce
4. **Contact the team** - Provide your system info and error details

### When Reporting Issues:
```bash
# Include this information:
node --version
npm --version
npm list react react-dom
# Your operating system
# Error messages (copy the full error)
# Steps that led to the error
```

## 🎯 Next Steps After Setup

1. **Explore the codebase** - Start with `src/App.jsx`
2. **Run the application** - Test all pages and features
3. **Make a small change** - Edit a component and see hot reload
4. **Read the component docs** - Understand the project structure
5. **Start contributing** - Pick an issue or add a feature

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ✅ Setup Verification Checklist

After following this guide, verify your setup:

- [ ] Node.js version 16+ installed
- [ ] Repository cloned successfully
- [ ] Dependencies installed without errors
- [ ] Tailwind CSS configured
- [ ] Development server starts on port 5173
- [ ] Homepage loads correctly
- [ ] Navigation works between pages
- [ ] No console errors in browser
- [ ] Hot reload works (make a small change and see it update)

**🎉 If all checkboxes are checked, you're ready to start developing!**

---

**Happy Coding! 🚀**

> **Need help?** Open an issue on GitHub or contact the development team.
