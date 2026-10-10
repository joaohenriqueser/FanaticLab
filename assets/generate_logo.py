import os

# Create SVG for the FanaticLab 3D logo
# Colors from brand:
# Electric Blue: #0066FF
# Dark Charcoal / Gunmetal: #242A30 (Light mode) or #F1F5F9 (Dark mode)

svg_icon_dark = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="100%" height="100%" fill="none">
  <defs>
    <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2582FF" />
      <stop offset="100%" stop-color="#0052E0" />
    </linearGradient>
    <linearGradient id="dark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>
  </defs>

  <!-- Isometric FL Cube Mark -->
  <g transform="translate(150, 140)" stroke-width="17" stroke-linecap="round" stroke-linejoin="round">
    <!-- Blue F segment forming top roof and front-left face -->
    <!-- Top roof stroke of F -->
    <path d="M 0,-85 L 65,-47.5" stroke="url(#blue-grad)" />
    
    <!-- Main F body: top edge, down left side, inward curl, and middle bar -->
    <!-- From top left down to bottom left, curving in -->
    <path d="M 0,-85 L -73.6,-42.5 L -73.6,35 C -73.6,50 -60,58 -45,49 L -32,41" stroke="url(#blue-grad)" />
    <!-- Middle crossbar of F -->
    <path d="M -73.6,-5 L -20,25 C -10,30 2,24 2,12 L 2,-25" stroke="url(#blue-grad)" />

    <!-- Charcoal/Light L segment forming right face and bottom floor -->
    <!-- Inner cut line across top face -->
    <path d="M -30,-68 L 35,-30" stroke="url(#dark-grad)" />
    <!-- Vertical right backbone of L -->
    <path d="M 73.6,-38 L 73.6,38 C 73.6,50 63,58 50,65 L 0,94 L 0,0" stroke="url(#dark-grad)" />
    <!-- Horizontal floor extension of L -->
    <path d="M 73.6,8 L 30,33 C 20,38 10,34 10,22 L 10,10" stroke="url(#dark-grad)" />
  </g>
</svg>'''

os.makedirs(r"c:\FanaticLab\assets", exist_ok=True)
with open(r"c:\FanaticLab\assets\logo-icon.svg", "w", encoding="utf-8") as f:
    f.write(svg_icon_dark)
print("Saved logo-icon.svg successfully")
