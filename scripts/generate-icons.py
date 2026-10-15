import io
import struct
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

def build_icns(master_1024: Image.Image) -> bytes:
    # Apple ICNS chunk specifications with modern Retina (@2x) and standard (@1x) FourCCs
    chunks_def = [
        (b'ic10', 1024),  # 1024x1024 (512x512@2x)
        (b'ic09', 512),   # 512x512 (512x512@1x)
        (b'ic14', 512),   # 512x512 (256x256@2x)
        (b'ic08', 256),   # 256x256 (256x256@1x)
        (b'ic13', 256),   # 256x256 (128x128@2x)
        (b'ic07', 128),   # 128x128 (128x128@1x)
        (b'ic12', 64),    # 64x64 (32x32@2x)
        (b'icp6', 64),    # 64x64 (64x64@1x)
        (b'ic11', 32),    # 32x32 (16x16@2x)
        (b'icp5', 32),    # 32x32 (32x32@1x)
        (b'icp4', 16),    # 16x16 (16x16@1x)
    ]

    chunk_data_list = []
    for fourcc, size in chunks_def:
        if size == 1024:
            resized = master_1024
        else:
            resized = master_1024.resize((size, size), Image.Resampling.LANCZOS)
        png_bytes = image_to_png_bytes(resized)
        chunk_len = 8 + len(png_bytes)
        chunk_header = struct.pack('>4sI', fourcc, chunk_len)
        chunk_data_list.append(chunk_header + png_bytes)

    all_chunks = b''.join(chunk_data_list)
    total_len = 8 + len(all_chunks)
    icns_header = struct.pack('>4sI', b'icns', total_len)
    return icns_header + all_chunks

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
    import os
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

    # Build ICNS
    icns_path = os.path.join(build_dir, 'icon.icns')
    icns_bytes = build_icns(master)
    with open(icns_path, 'wb') as f:
        f.write(icns_bytes)
    print(f"Saved build/icon.icns ({len(icns_bytes)} bytes, full multi-resolution ic10/ic09/ic14/ic08/ic13/ic07/ic12/icp6/ic11/icp5/icp4)")

    # Build ICO
    ico_path = os.path.join(build_dir, 'icon.ico')
    ico_bytes = build_ico(master)
    with open(ico_path, 'wb') as f:
        f.write(ico_bytes)
    print(f"Saved build/icon.ico ({len(ico_bytes)} bytes, multi-resolution 256/128/64/48/32/16)")
