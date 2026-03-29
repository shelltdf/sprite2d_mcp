# UML 类图草案（逻辑模型 / Mermaid）

```mermaid
classDiagram
  class Sprite {
    +string id
    +string name
    +Frame frame
  }
  class Frame {
    +number x
    +number y
    +number w
    +number h
  }
  class ProjectState {
    +string name
    +Sprite[] sprites
    +string selectedId
    +View view
    +string statusMessage
  }
  class View {
    +number scale
    +number offsetX
    +number offsetY
  }
  Sprite --> Frame
  ProjectState --> Sprite
  ProjectState --> View
```
