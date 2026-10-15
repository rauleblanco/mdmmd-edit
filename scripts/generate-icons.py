import io
import os
import shutil
import struct
import subprocess
from PIL import Image, ImageDraw, ImageFilter

def make_master_icon(src_path: str) -> Image.Image:
    # 1. Load source icon
    src = Image.open(src_path).convert('RGBA')

    CANVAS_SIZE = 1024
    # Apple HIG standard for macOS 1024x1024 icon: 824x824 squircle, 100px inset
    ICON_SIZE = 824
    INSET = (CANVAS_SIZE - ICON_SIZE) // 2  # 100px
    RADIUS = 185  # Apple standard continuous corner radius for 824px squircle

    # If the image is already a 1024x1024 master icon with transparent corners, return it
    if src.size == (CANVAS_SIZE, CANVAS_SIZE) and src.getpixel((0, 0))[3] == 0:
        return src

    # If source is the original 512x512 mock image, squircle is centered at (256, 254)
    if src.size == (512, 512):
        crop_box = (91, 89, 421, 419)
        cropped = src.crop(crop_box)
    else:
        cropped = src

    # High-quality scale squircle to 824x824
    scaled_squircle = cropped.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)

    # Generate ultra-smooth antialiased mask using 4x supersampling
    SS = 4
    mask_large = Image.new('L', (ICON_SIZE * SS, ICON_SIZE * SS), 0)
    draw_mask = ImageDraw.Draw(mask_large)
    draw_mask.rounded_rectangle(
        [0, 0, ICON_SIZE * SS - 1, ICON_SIZE * SS - 1],
        radius=RADIUS * SS,
        fill=255
    )
    mask = mask_large.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
    scaled_squircle.putalpha(mask)

    # Master canvas with full alpha transparency
    master = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))

    # Native macOS drop shadow under squircle
    shadow_canvas = Image.new('RGBA', (CANVAS_SIZE, CANVAS_SIZE), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_canvas)
    # Shadow offset y+12px, soft dark
    shadow_box = [INSET, INSET + 12, INSET + ICON_SIZE, INSET + ICON_SIZE + 12]
    shadow_draw.rounded_rectangle(shadow_box, radius=RADIUS, fill=(0, 0, 0, 95))
    shadow_blurred = shadow_canvas.filter(ImageFilter.GaussianBlur(radius=18))

    # Composite: shadow first, then squircle
    master.paste(shadow_blurred, (0, 0), shadow_blurred)
    master.paste(scaled_squircle, (INSET, INSET), scaled_squircle)

    return master

def image_to_png_bytes(im: Image.Image) -> bytes:
    buf = io.BytesIO()
    im.save(buf, format='PNG', optimize=True)
    return buf.getvalue()

def build_iconset_and_icns(master_1024: Image.Image, build_dir: str) -> None:
    iconset_dir = os.path.join(build_dir, 'icon.iconset')
    os.makedirs(iconset_dir, exist_ok=True)

    # Apple standard 10-file iconset specification in ascending order
    specs = [
        ('icon_16x16.png', 16, b'icp4'),
        ('icon_16x16@2x.png', 32, b'ic11'),
        ('icon_32x32.png', 32, b'icp5'),
        ('icon_32x32@2x.png', 64, b'ic12'),
        ('icon_128x128.png', 128, b'ic07'),
        ('icon_128x128@2x.png', 256, b'ic13'),
        ('icon_256x256.png', 256, b'ic08'),
        ('icon_256x256@2x.png', 512, b'ic14'),
        ('icon_512x512.png', 512, b'ic09'),
        ('icon_512x512@2x.png', 1024, b'ic10'),
    ]

    chunks_data = []
    for filename, size, fourcc in specs:
        if size == 1024:
            resized = master_1024
        else:
            resized = master_1024.resize((size, size), Image.Resampling.LANCZOS)
        
        filepath = os.path.join(iconset_dir, filename)
        resized.save(filepath, format='PNG', optimize=True)
        with open(filepath, 'rb') as f:
            png_bytes = f.read()
        chunks_data.append((fourcc, png_bytes))

    print(f"Generated build/icon.iconset with 10 standard PNG images (16x16 to 1024x1024)")

    icns_path = os.path.join(build_dir, 'icon.icns')

    # If iconutil is available (macOS), always use the official Apple tool
    if shutil.which('iconutil'):
        try:
            print("Compiling icon.icns using native Apple iconutil...")
            subprocess.run(['iconutil', '-c', 'icns', iconset_dir, '-o', icns_path], check=True)
            print(f"Saved build/icon.icns using native Apple iconutil ({os.path.getsize(icns_path)} bytes)")
            return
        except Exception as e:
            print(f"Native iconutil compilation failed ({e}), using fallback TOC writer...")

    # Platform-independent Apple ICNS specification with TOC (Table of Contents) chunk
    # Header (8 bytes): 'icns' + total_length
    # TOC Chunk: 'TOC ' + length + entries
    # Followed by each icon chunk in ascending order
    toc_entries = []
    icon_chunks = []
    for fourcc, png_bytes in chunks_data:
        chunk_len = 8 + len(png_bytes)
        toc_entries.append(struct.pack('>4sI', fourcc, chunk_len))
        icon_chunks.append(struct.pack('>4sI', fourcc, chunk_len) + png_bytes)

    toc_payload = b''.join(toc_entries)
    toc_chunk_len = 8 + len(toc_payload)
    toc_chunk = struct.pack('>4sI', b'TOC ', toc_chunk_len) + toc_payload

    all_data = toc_chunk + b''.join(icon_chunks)
    total_len = 8 + len(all_data)
    header = struct.pack('>4sI', b'icns', total_len)
    
    with open(icns_path, 'wb') as f:
        f.write(header + all_data)
    print(f"Saved build/icon.icns with standard TOC chunk in ascending order ({len(header + all_data)} bytes)")

def build_ico(master_1024: Image.Image) -> bytes:
    # Windows ICO with multiple resolutions (256, 128, 64, 48, 32, 16)
    sizes = [256, 128, 64, 48, 32, 16]
    entries = []
    png_buffers = []

    for s in sizes:
        resized = master_1024.resize((s, s), Image.Resampling.LANCZOS)
        png_data = image_to_png_bytes(resized)
        png_buffers.append(png_data)

    num_images = len(sizes)
    # ICO Header: 6 bytes
    # Reserved (2) = 0, Type (2) = 1 (ICO), Count (2) = num_images
    header = struct.pack('<HHH', 0, 1, num_images)

    # Offset to first image data = 6 + 16 * num_images
    offset = 6 + 16 * num_images

    entries_data = bytearray()
    for s, png_data in zip(sizes, png_buffers):
        w = 0 if s >= 256 else s
        h = 0 if s >= 256 else s
        colors = 0
        reserved = 0
        planes = 1
        bpp = 32
        size_bytes = len(png_data)
        entry = struct.pack('<BBBBHHII', w, h, colors, reserved, planes, bpp, size_bytes, offset)
        entries_data.extend(entry)
        offset += size_bytes

    return bytes(header) + bytes(entries_data) + b''.join(png_buffers)

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    build_dir = os.path.join(base_dir, '..', 'build')

    source_icon = os.path.join(build_dir, 'icon-source.png')
    target_icon = os.path.join(build_dir, 'icon.png')
    src = source_icon if os.path.exists(source_icon) else target_icon

    print(f"Generating master 1024x1024 macOS icon from {src}...")
    master = make_master_icon(src)

    # Save master 1024x1024 PNG with transparent background
    master.save(target_icon, format='PNG', optimize=True)
    print("Saved build/icon.png (1024x1024, RGBA transparent)")

    # Also save to src/assets/icon.png for frontend UI
    assets_dir = os.path.join(base_dir, '..', 'src', 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    assets_icon = os.path.join(assets_dir, 'icon.png')
    master.save(assets_icon, format='PNG', optimize=True)
    print("Saved src/assets/icon.png (1024x1024, RGBA transparent)")

    # Build iconset directory and ICNS with TOC
    build_iconset_and_icns(master, build_dir)

    # Build ICO
    ico_path = os.path.join(build_dir, 'icon.ico')
    ico_bytes = build_ico(master)
    with open(ico_path, 'wb') as f:
        f.write(ico_bytes)
    print(f"Saved build/icon.ico ({len(ico_bytes)} bytes, multi-resolution 256/128/64/48/32/16)")
