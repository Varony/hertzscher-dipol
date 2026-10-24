import io, sys, os
base = os.path.dirname(os.path.abspath(__file__))
def rd(n): return io.open(os.path.join(base, n), encoding='utf-8').read()
html = rd('index.html')
css = rd('style.css')
js = '\n'.join(rd(f) for f in ['core.js', 'scenes1.js', 'scenes2.js', 'scenes3.js', 'boot.js'])
out = html.replace('/*__CSS__*/', css).replace('/*__JS__*/', js)
icon_path = os.path.join(base, 'icon.dat')
if os.path.exists(icon_path):
    out = out.replace('__ICON__', rd('icon.dat'))
else:
    out = out.replace('<link rel="apple-touch-icon" href="__ICON__">', '').replace('<link rel="icon" href="__ICON__">', '')
dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(base, 'out.html')
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
io.open(dst, 'w', encoding='utf-8').write(out)
io.open(os.path.join(base, 'bundle.js'), 'w', encoding='utf-8').write(js)
print('geschrieben:', dst, len(out), 'Bytes')
