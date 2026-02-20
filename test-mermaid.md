# Mermaid Diagram Tests

This file tests the Mermaid diagram rendering in the Markdown viewer.

## Flowchart Example

Here's a simple flowchart showing a decision process:

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
    C --> E[End]
```

## Sequence Diagram

This sequence diagram shows the file loading process:

```mermaid
sequenceDiagram
    participant User
    participant App
    participant File
    User->>App: Open File
    App->>File: Read Content
    File-->>App: Markdown
    App-->>User: Render View
    User->>App: Edit File
    App->>File: Detect Changes
    File-->>App: Updated Content
    App-->>User: Auto-Reload
```

## Class Diagram

Here's a simple class diagram:

```mermaid
classDiagram
    class MarkdownViewer {
        +string content
        +render()
    }
    class MermaidDiagram {
        +string chart
        +useTheme() theme
        +renderDiagram()
    }
    class ThemeProvider {
        +string theme
        +setTheme()
    }
    MarkdownViewer --> MermaidDiagram
    MermaidDiagram --> ThemeProvider
```

## State Diagram

Application states:

```mermaid
stateDiagram-v2
    [*] --> NoFile
    NoFile --> FileLoaded: Open File
    FileLoaded --> Rendering: Parse Content
    Rendering --> Displayed: Render Complete
    Displayed --> Rendering: File Changed
    Displayed --> NoFile: Close File
```

## Git Graph

```mermaid
gitGraph
    commit
    commit
    branch feature
    commit
    commit
    checkout main
    commit
    merge feature
    commit
```

## Error Handling Test

This should show an error message:

```mermaid
this is not valid mermaid syntax!
```

## Regular Code Block

This should still work with syntax highlighting:

```javascript
function hello() {
  console.log('Hello, World!');
}
```

## Inline Code

This is `inline code` which should work normally.
