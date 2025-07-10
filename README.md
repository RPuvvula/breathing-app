# Breathe: A Wim Hof Method Guide

A modern, calming, and configurable web application to guide users through the Wim Hof Method breathing technique. This app is designed to be mobile-first, fully responsive, and works offline after the first visit.

## ✨ Features

- **Guided Sessions:** Step-by-step guidance for each phase: Power Breaths, Retention, and Recovery.
- **Customizable Sessions:** Easily configure the number of breaths and rounds with interactive sliders.
- **Immersive Experience:** Visual animations and distinct audio cues for each phase.
- **Spoken Guidance:** Optional voice-over instructions to guide you through the session with your eyes closed.
- **Calming Background Audio:** Choose from multiple ambient soundscapes (or silence) to enhance focus and relaxation.
- **Session History:** Automatically saves your session data to track your progress and retention times.
- **Light & Dark Modes:** Automatically adapts to your system theme, with a manual override.
- **Safety First:** Includes clear safety warnings and educational content about the practice.
- **Persistent Settings:** Remembers your preferred session configuration between visits.
- **No Build Tools Needed:** Runs directly in modern browsers using ES modules and import maps.

## 🛠️ Tech Stack

- **Framework:** [React](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
- **Audio:** Web Audio API & Web Speech API for programmatic sounds and voice synthesis.
- **Local Storage:** Browser `localStorage` for persisting settings and session history.

## 🚀 Getting Started: Local Development

This project is configured to run directly in the browser without any build steps or package installation.

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge, Safari).
- [Visual Studio Code](https://code.visualstudio.com/) or another code editor.

### Installation & Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/breathing-app.git
    ```

2.  **Navigate to the project directory:**

    ```bash
    cd breathing-app
    ```

3.  **Run the app with Vite's dev server:**
    This project uses [Vite](https://vitejs.dev/) to handle TypeScript and React modules.

    - If you haven't already, install dependencies:
      ```bash
      npm install
      ```
    - Start the development server:
      ```bash
      npm run dev
      ```
    - Open the local URL shown in your terminal (usually `http://localhost:5173`).

> **Note:**  
> The VS Code "Live Server" extension will not work for this project because it does not compile TypeScript or JSX files. Always use Vite's dev server

The application will open in your default browser, and the page will automatically reload whenever you save a file.

## 🌐 Deploying to GitHub Pages

You can publish this app to GitHub Pages for free static hosting. Follow these steps:

### 1. Configure the Repository

- Ensure your repository is **public** on GitHub.
- In your `package.json`, add a `homepage` field (replace with your actual username and repo name):

  ```json
  "homepage": "https://your-username.github.io/breathing-app"
  ```

- Your `vite.config.ts` should already have the correct base:
  ```ts
  base: '/breathing-app/',
  ```

### 2. Update Asset Paths (if needed)

- In `index.html`, change any absolute asset paths (e.g., `/index.css`) to relative paths (e.g., `index.css`) so assets load correctly on GitHub Pages.

### 3. Install gh-pages

Install the `gh-pages` package as a dev dependency:

```bash
npm install --save-dev gh-pages
```

### 4. Add Deploy Scripts

Add these scripts to your `package.json`:

```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### 5. Deploy to GitHub Pages

Run the following command to build and publish your app:

```bash
npm run deploy
```

This will push the contents of the `dist` folder to a `gh-pages` branch on your repository.

### 6. Enable GitHub Pages

- Go to your repository on GitHub.
- Click **Settings** > **Pages**.
- Under "Source", select the `gh-pages` branch and `/ (root)` folder.
- Save.

Your app will be available at:  
`https://your-username.github.io/breathing-app/`

---

### 🚩 After the First Build

- For future updates, simply run `npm run deploy` again after making changes.
- No need to repeat the setup steps; just commit your changes and redeploy.

---

**Note:**

- If you change your repo name or username, update the `homepage` and `base` fields accordingly.
- If you see a blank page after deployment, double-check that all asset paths in `index.html` are relative and that the `base` is set correctly in

## ⚠️ Important Safety Notice

This breathing method is powerful and should be practiced with caution.

- **NEVER** practice in or near water (e.g., shower, bath, pool, ocean). Fainting during the breath-hold is a risk and is extremely dangerous in water.
- **NEVER** practice while driving a vehicle or operating machinery.
- If you are pregnant, have epilepsy, high blood pressure, or a history of serious health conditions like heart disease, **DO NOT** practice without consulting a medical professional first.
- Always listen to your body. Light-headedness can be normal, but if you feel sharp pain or extreme discomfort, stop the practice immediately.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## 🎵 Audio Credits

Some of Background music and sound effects used in this app are sourced from [Pixabay](https://pixabay.com/music/) and are used under the Pixabay Content License.

Please visit [pixabay.com/music](https://pixabay.com/music/) for more royalty-free music.
