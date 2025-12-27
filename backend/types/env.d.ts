declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      GEMINI_API_KEY: string;
    }
  }
}

export { };