export default function Home() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 32 }}>
      <h1>React Native AI Server</h1>
      <p>The backend proxy is running.</p>
      <ul>
        <li>
          <code>GET /health</code>
        </li>
        <li>
          <code>GET /models</code>
        </li>
        <li>
          <code>POST /chat/:provider</code> (claude, gpt, gemini, glm, kimi)
        </li>
        <li>
          <code>POST /images/:provider</code> (gemini)
        </li>
      </ul>
    </main>
  )
}
