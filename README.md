# How to run the app

To run the application locally:

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a .env file:

   - Copy the example credentials:
     ```sh
     cp .env.example .env
     ```
   - Edit the `.env` file if needed to provide your own credentials or configuration.

3. Start the development server:
   ```sh
   npm run dev
   ```

The app will be available at the local address shown in your terminal (usually http://localhost:5173 or similar).

# File structure and code comments

- The project follows a standard Vite + React + TypeScript structure.
- Key files and folders are organized for clarity and maintainability.
- Code is commented throughout to explain logic and important decisions.
