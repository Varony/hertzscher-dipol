import zlib, struct, math, io, base64, os

W = H = 180
def px(x, y):
    # Hintergrund: dunkles Blau mit Vignette
    cx, cy = W / 2, H / 2
    d = math.hypot(x - cx, y - cy) / (W * 0.7)
    r0, g0, b0 = 10, 16, 36
    r1, g1, b1 = 5, 8, 16
    t = min(1, d)
    r, g, b = (int(r0 + (r1 - r0) * t), int(g0 + (g1 - g0) * t), int(b0 + (b1 - b0) * t))
    # Dipol: senkrechter Stab
    barr = abs(x - cx) <= 3.0 and abs(y - cy) <= 52
    # Strahlungsschalen
    for rad, col in ((30, (60, 120, 190)), (46, (50, 100, 165)), (62, (40, 82, 140))):
        dd = abs(math.hypot(x - cx, y - cy) - rad)
        if dd < 2.0:
            f = 1 - dd / 2.0
            br, bg, bb = r + (col[0] - r) * f * 0.9, g + (col[1] - g) * f * 0.9, b + (col[2] - b) * f * 0.9
            r, g, b = int(br), int(bg), int(bb)
    if barr:
        lum = 1 - abs(y - cy) / 60.0
        r, g, b = 215, 228, 250
        if abs(y - cy) < 8: r, g, b = 255, 255, 255
    # Lampe
    dl = math.hypot(x - cx, y - (cy - 34))
    if dl < 13:
        f = max(0, 1 - dl / 13)
        r = min(255, int(r + (255 - r) * f)); g = min(255, int(g + (214 - g) * f)); b = min(255, int(b + (90 - b) * f))
    return (r, g, b, 255)

raw = bytearray()
for y in range(H):
    raw.append(0)
    for x in range(W):
        raw += bytes(px(x, y))

def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
png += chunk(b'IEND', b'')
b64 = base64.b64encode(png).decode()
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icon.dat')
io.open(out, 'w').write('data:image/png;base64,' + b64)
print(len(png), 'Bytes PNG ->', out)
