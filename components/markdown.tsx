import React from "react"

export const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
  return (
    <pre className="text-yellow-500 font-mono my-5">
      <code>{code}</code>
    </pre>
  )
}
