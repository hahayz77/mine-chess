from PIL import Image
from collections import deque

def find_white_regions(img_path):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    visited = set()
    regions = []
    
    for y in range(h):
        for x in range(w):
            if (x, y) in visited:
                continue
            r, g, b, a = img.getpixel((x, y))
            if r > 240 and g > 240 and b > 240:
                # new region
                q = deque([(x, y)])
                visited.add((x, y))
                comp = []
                touches_border = False
                while q:
                    cx, cy = q.popleft()
                    comp.append((cx, cy))
                    if cx == 0 or cy == 0 or cx == w - 1 or cy == h - 1:
                        touches_border = True
                    for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
                        if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                            nr, ng, nb, na = img.getpixel((nx, ny))
                            if nr > 240 and ng > 240 and nb > 240:
                                visited.add((nx, ny))
                                q.append((nx, ny))
                regions.append((touches_border, len(comp), comp[0], comp))
                
    print(f"File {img_path}:")
    for touches_border, size, sample, comp in regions:
        if not touches_border and size > 10:
            print(f"  Internal white region: size={size}, sample={sample}")

if __name__ == "__main__":
    find_white_regions("assets/pieces/b_knight.png")
    find_white_regions("assets/pieces/b_bishop.png")
    find_white_regions("assets/pieces/w_bishop.png")
    find_white_regions("assets/pieces/w_knight.png")
