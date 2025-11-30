#!/bin/bash

# 🎨 3D Interactive Section - Installation Script
# Run this script to install all required dependencies

echo "🎨 Installing 3D Interactive Section Dependencies..."
echo ""

# Navigate to web app directory
cd "$(dirname "$0")"

echo "📦 Installing Three.js and React Three Fiber..."
npm install three @react-three/fiber @react-three/drei

echo "🎬 Installing animation libraries..."
npm install @react-three/postprocessing gsap

echo "📝 Installing TypeScript types..."
npm install -D @types/three

echo ""
echo "✅ Installation complete!"
echo ""
echo "📚 Next steps:"
echo "1. Copy 3D model to public/models/ folder (optional)"
echo "2. Import Hero3D component in your page"
echo "3. Customize colors and animations"
echo "4. Run 'npm run dev' to see the 3D section"
echo ""
echo "📖 Read SETUP_3D_SECTION.md for detailed instructions"
