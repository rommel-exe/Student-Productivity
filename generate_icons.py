#!/usr/bin/env python3
"""Generate Tauri app icons - valid PNGs at required sizes."""
import struct
import zlib
import os
def create_png(width, height, r=30, g=30, b=30, accent_r=100, accent_g=140, accent_b=255):
    """Create a minimal valid PNG with a simple app icon design."""
    def make_chunk(chunk_type, data):
        chunk = chunk_type + data
        return struct.pack('>I', len(data)) + chunk + struct.pack('>I', zlib.crc32(chunk) & 0xFFFFFFFF)
    # PNG signature
    signature = b'\x89PNG\r\n\x1a\n'
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)  # 8-bit RGB
    ihdr = make_chunk(b'IHDR', ihdr_data)
    # Image data: draw a rounded-ish icon with gradient
    raw_data = bytearray()
    cx, cy = width // 2, height // 2
    radius = min(width, height) // 2 - 2
    inner_radius = radius * 0.6
    for y in range(height):
        raw_data.append(0)  # filter byte
        for x in range(width):
            dx = x - cx
            dy = y - cy
            dist = (dx * dx + dy * dy) ** 0.5
            if dist <= radius:
                # Inside the circle - gradient from accent to darker
                t = dist / radius
                # Outer ring
                if dist > inner_radius:
                    ring_t = (dist - inner_radius) / (radius - inner_radius)
                    pr = int(accent_r * (1 - ring_t * 0.5))
                    pg = int(accent_g * (1 - ring_t * 0.5))
                    pb = int(accent_b * (1 - ring_t * 0.5))
                else:
                    # Inner area - dark with a subtle gradient
                    inner_t = dist / inner_radius
                    pr = int(r + (accent_r - r) * inner_t * 0.3)
                    pg = int(g + (accent_g - g) * inner_t * 0.3)
                    pb = int(b + (accent_b - b) * inner_t * 0.3)
                # Draw a simple "S" shape for "Student"
                # Two horizontal bars with connecting diagonal
                bar_h = max(1, height // 8)
                bar_margin = max(1, width // 5)
                in_top_bar = (bar_margin <= x <= width - bar_margin * 2) and (cy - bar_h * 2 <= y <= cy - bar_h)
                in_bottom_bar = (bar_margin * 2 <= x <= width - bar_margin) and (cy + bar_h <= y <= cy + bar_h * 2)
                in_mid_connect = (bar_margin <= x <= width - bar_margin) and (cy - bar_h // 2 <= y <= cy + bar_h // 2)
                if in_top_bar or in_bottom_bar or in_mid_connect:
                    pr, pg, pb = 255, 255, 255
                raw_data.extend([min(255, max(0, pr)), min(255, max(0, pg)), min(255, max(0, pb))])
            else:
                # Transparent area (but RGB so just use bg)
                raw_data.extend([0, 0, 0])
    compressed = zlib.compress(bytes(raw_data), 9)
    idat = make_chunk(b'IDAT', compressed)
    # IEND
    iend = make_chunk(b'IEND', b'')
    return signature + ihdr + idat + iend
def create_ico(png_data_list):
    """Create a .ico file from multiple PNG data blobs."""
    num_images = len(png_data_list)
    # ICO header: reserved(2) + type(2) + count(2)
    header = struct.pack('<HHH', 0, 1, num_images)
    # Calculate offsets
    dir_entry_size = 16
    data_offset = 6 + num_images * dir_entry_size
    entries = b''
    all_data = b''
    for png_data in png_data_list:
        # Parse width/height from PNG IHDR
        w = struct.unpack('>I', png_data[16:20])[0]
        h = struct.unpack('>I', png_data[20:24])[0]
        ico_w = w if w < 256 else 0
        ico_h = h if h < 256 else 0
        entry = struct.pack('<BBBBHHII',
                            ico_w, ico_h, 0, 0,  # width, height, palette, reserved
                            1, 32,  # planes, bpp
                            len(png_data),  # size
                            data_offset + len(all_data))  # offset
        entries += entry
        all_data += png_data
    return header + entries + all_data
def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sizes = {
        '32x32.png': 32,
        '128x128.png': 128,
        '128x128@2x.png': 256,
    }
    for filename, size in sizes.items():
        png_data = create_png(size, size)
        path = os.path.join(script_dir, filename)
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f"Created {filename} ({size}x{size}, {len(png_data)} bytes)")
    # Create icon.ico from 32 and 128 sizes
    ico_pngs = [create_png(32, 32), create_png(128, 128), create_png(256, 256)]
    ico_path = os.path.join(script_dir, 'icon.ico')
    with open(ico_path, 'wb') as f:
        f.write(create_ico(ico_pngs))
    print(f"Created icon.ico")
    # For macOS .icns, create a minimal valid file
    # Use PNG as the data format for ic07 (128x128) and ic08 (256x256)
    icns_path = os.path.join(script_dir, 'icon.icns')
    png_128 = create_png(128, 128)
    png_256 = create_png(256, 256)
    # ICNS format: 'icns' header + size + entries
    # ic07 = 128x128 PNG, ic08 = 256x256 PNG
    entries = b''
    # ic07 entry
    ic07_data = b'ic07' + struct.pack('>I', len(png_128) + 8) + png_128
    entries += ic07_data
    # ic08 entry
    ic08_data = b'ic08' + struct.pack('>I', len(png_256) + 8) + png_256
    entries += ic08_data
    icns_data = b'icns' + struct.pack('>I', len(entries) + 8) + entries
    with open(icns_path, 'wb') as f:
        f.write(icns_data)
    print(f"Created icon.icns")
if __name__ == '__main__':
    main()
