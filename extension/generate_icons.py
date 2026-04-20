from PIL import Image, ImageDraw

def draw_icon(size, bg_color):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    padding = max(1, size // 16)
    radius = size // 4
    
    x0, y0 = padding, padding
    x1, y1 = size - padding, size - padding
    
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=bg_color)
    
    white = (255, 255, 255, 255)
    cx, cy = size // 2, size // 2
    
    if size <= 16:
        r = size // 5
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=white)
    elif size <= 32:
        w = size // 5
        draw.line([(cx-w, cy-w), (cx+w, cy+w)], fill=white, width=max(2, size//10))
        draw.line([(cx+w, cy-w), (cx-w, cy+w)], fill=white, width=max(2, size//10))
    else:
        if size >= 128:
            r = size // 3
            draw.ellipse([cx-r, cy-r, cx+r, cy+r], outline=white, width=max(3, size//20))
            draw.line([(cx, cy), (cx, cy - r//2)], fill=white, width=max(3, size//20))
            draw.line([(cx, cy), (cx + r//2, cy)], fill=white, width=max(3, size//20))
        else:
            points = [
                (cx - size//8, cy - size//6),
                (cx - size//8, cy + size//6),
                (cx + size//6, cy),
            ]
            draw.polygon(points, fill=white)
    
    return img

# Original indigo icons
indigo = (99, 102, 241, 255)   # #6366f1
# Green active icons
green = (16, 185, 129, 255)    # #10b981

for s in [16, 32, 48, 128]:
    draw_icon(s, indigo).save(f"extension/icons/icon{s}.png")
    draw_icon(s, green).save(f"extension/icons/icon{s}-green.png")
    print(f"Generated icon{s}.png + icon{s}-green.png")
