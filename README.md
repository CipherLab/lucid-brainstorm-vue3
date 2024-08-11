# Gemini Flow: Visual Programming for AI Workflows 

Gemini Flow is an innovative visual programming application designed to make working with Google Gemini LLMs (Large Language Models) more intuitive, efficient, and engaging. 

## Key Features

* **Interactive Flowchart:** Drag-and-drop nodes to represent different agents (with distinct personalities) and connect them visually to create your AI workflow.
* **Customizable Agent Personalities:**  Create agents with unique roles (The Coder, The Architect, The Creative, etc.) and adjust their "temperature" (creativity) settings for varied responses.
* **Context-Rich Inputs:**  Upload files, web content, or text prompts to provide context to specific agents or stages in your workflow.
* **Real-time Chat:** Interact directly with individual agents to refine ideas or get instant feedback as they process your requests.
* **Dynamic Visualization:** See how agents communicate, with animated "thought" pulses and visual cues that indicate the flow of information and the mood of the interaction.
* **Automated Processes:** Build feedback loops where agents automatically receive updates to your code or data, streamlining your iterative process. 
* **Custom Agent Creation:** Design and add your own specialized agents with specific instructions, skills, and personalities to tailor the app to your exact needs. 

## Built With

* **UI Framework:** Vue.js and Quasar Framework for a fast, visually appealing interface.
* **Graph Visualization:** Vue Flow library for creating and manipulating the interactive flowchart. 
* **Backend:** Node.js (or alternative) for API interactions, file handling, and communication with the Google Gemini API.

## Installation (Customize for your project)
You're right! Let's make those installation instructions more complete and include the necessary steps for Quasar and yarn.


## Installation

1. **Clone Repository:** 
   ```bash
   git clone [repository URL]
   ```

2. **Install Dependencies:** 
   ```bash
   cd [your-repo-name]
   yarn install  # Install all Node.js package dependencies
   ```

3. **(If needed) Install Quasar CLI:**
   ```bash
   yarn global add @quasar/cli  # If you don't have it already
   ```

4. **Set Up Environment Variables:** 
   - Update the Gemini API key value in the 

5. **Run Development Server:**
   ```bash
   quasar dev   # Start the Quasar development server
   ```
   
**Explanation:**

- **`yarn install`:** This command installs all the dependencies listed in your `package.json` file, which should include Vue.js, Quasar, Vue Flow, any Axios or CORS proxy libraries you're using, and other project-specific packages.
- **`yarn global add @quasar/cli`:** This installs the Quasar CLI globally if it's not already installed. The Quasar CLI provides commands for creating, building, and running Quasar projects.
- **`.env` File:**  This file stores sensitive information (like API keys) that shouldn't be directly committed to your repository.  
- **`quasar dev`:**  This command starts the Quasar development server, allowing you to run your app locally and see live updates as you make changes to the code.

**Additional Notes:**

- **Troubleshooting:** If you encounter any errors during installation, double-check that you have Node.js and yarn installed on your system. Refer to the official documentation for Vue.js, Quasar, and Vue Flow if needed.
- **Production Build:**  For a production-ready build of your app, you'll need to use a command like `quasar build`. The specific build process may vary depending on how you're deploying the application (e.g., as a website, a desktop app, or a mobile app). 


## Project Goals

* **Make AI More Accessible:**   Empower users with varying levels of coding experience to leverage LLMs effectively.
* **Boost Developer Productivity:** Streamline complex tasks and provide a more intuitive way to integrate LLMs into development workflows.
* **Visualize Creative Processes:**  Showcase how ideas evolve and are synthesized through visual interactions between AI agents.

## Contributing

Contributions are welcome! Feel free to submit issues, pull requests, or suggestions. 

## Demo 

[Link to your demo video or website, if available]

## Google Gemini App Competition

This project is being developed for the Google Gemini App Competition. We aim to showcase the exciting possibilities of visual programming and AI collaboration. 
