#!/usr/bin/env python3
"""
Simple script to create Android app icons for FinanceAI
Creates basic colored icons in different sizes for Android app
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a simple FinanceAI app icon"""
    # Create a new image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background gradient circle
    center = size // 2
    radius = size // 2 - 4
    
    # Draw background circle with gradient effect
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                fill=(99, 102, 241, 255))  # Primary color #6366f1
    
    # Add a smaller inner circle for depth
    inner_radius = radius - size // 8
    draw.ellipse([center - inner_radius, center - inner_radius, center + inner_radius, center + inner_radius], 
                fill=(139, 92, 246, 255))  # Secondary color #8b5cf6
    
    # Add "F" letter for FinanceAI
    try:
        # Try to use a nice font
        font_size = size // 2
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font_size = size // 3
        font = ImageFont.load_default()
    
    # Draw the "F" letter
    text = "F"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = center - text_width // 2
    text_y = center - text_height // 2 - 2
    
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Save the image
    img.save(output_path, "PNG")
    print(f"Created icon: {output_path} ({size}x{size})")

def main():
    """Create all required Android icon sizes"""
    icon_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192
    }
    
    base_path = "app/src/main/res"
    
    for folder, size in icon_sizes.items():
        folder_path = os.path.join(base_path, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        # Create launcher icon
        icon_path = os.path.join(folder_path, "ic_launcher.png")
        create_icon(size, icon_path)
        
        # Create round launcher icon (same design)
        round_icon_path = os.path.join(folder_path, "ic_launcher_round.png")
        create_icon(size, round_icon_path)

if __name__ == "__main__":
    main()