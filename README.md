# MOMENTUM — Interactive Motion Design Experience

MOMENTUM is a sleek, minimalist, high-fidelity black-and-white landing page that explores physical dynamics—mass, velocity, inertia, friction, and tension—applied directly to visual design and interaction.

## Features

1. **Aesthetic Minimalism**: Designed with a pure monochrome dark/light palette, crisp typography, and frosted glass components.
2. **Interactive Cursor Follower**: Follows the mouse cursor using inertia (linear interpolation) and scales dynamically based on physical drag speed.
3. **Ambient Hero Flow Field**: 120 particle elements drifting along mathematical sine/cosine waves that gently react to cursor movements.
4. **Scroll-Driven Word-by-Word Manifesto Reveal**: Smoothly illuminates parts of the text corresponding exactly to viewport scroll progression.
5. **Interactive Physics Simulator Sandbox**:
   - Customizable parameters: Particle Count, Max Speed, Gravity/Antigravity Force, Friction/Drag, and Influence Radius.
   - Presets:
     - **Orbital Well**: Particles swing dynamically around the pointer.
     - **Viscous Fluid**: Slow, heavy physics simulating motion through oil.
     - **Chaos Field**: Strong particle repulsion creating interconnected web nets.
     - **Inertial Grid**: A lattice structure that warps under cursor proximity and snaps back to original grid cells using mass-spring-damper math.
   - Floating metrics overlay showing real-time **Velocity** and **Tension** values.
6. **3D Tilt Gallery**: Feature showcase cards that tilt in 3D space in response to cursor angles, including radial lighting overlay effects.

---

## Technical Stack
- **Core Structure**: HTML5 (Descriptive metadata, semantic elements)
- **Styling**: Vanilla CSS3 (Custom properties, transitions, responsive layout, glassmorphism)
- **Engine Logic**: Vanilla JavaScript (Dual HTML5 Canvas contexts, Intersection Observer, spring-mass physics solvers)
- **Development Tooling**: Vite

---

## Local Development Setup

To run the application locally, make sure you have [Node.js](https://nodejs.org/) installed, then execute:

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

By default, the development server will run at:
👉 **[http://localhost:5173/](http://localhost:5173/)**
