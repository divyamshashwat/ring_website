#!/usr/bin/python3.12
"""Load a page in real WebKit (WebKitGTK), wait, and print the 3D diagnostics panel.

usage: xvfb-run -s "-screen 0 1280x1024x24" /usr/bin/python3.12 scripts/qa/webkit-probe.py URL [seconds] [shot.png] [width] [height]
"""
import sys
import gi
gi.require_version('Gtk', '3.0')
gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, GLib, WebKit2

url = sys.argv[1]
wait = float(sys.argv[2]) if len(sys.argv) > 2 else 12
shot = sys.argv[3] if len(sys.argv) > 3 else None
w = int(sys.argv[4]) if len(sys.argv) > 4 else 402
h = int(sys.argv[5]) if len(sys.argv) > 5 else 674

win = Gtk.OffscreenWindow()
win.set_default_size(w, h)
view = WebKit2.WebView()
s = view.get_settings()
s.set_enable_webgl(True)
s.set_enable_developer_extras(True)
s.set_user_agent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1')
try:
    s.set_hardware_acceleration_policy(WebKit2.HardwareAccelerationPolicy.ALWAYS)
except Exception as e:
    print('hw policy:', e)
win.add(view)
win.show_all()

console = []
def on_console(_v, msg, *a):
    return False

JS = r"""
(() => {
  const panel = [...document.querySelectorAll('div')].map(d => d.textContent).filter(t => t && t.includes('VYOMA 3D diagnostics')).pop() || '(no panel)';
  return JSON.stringify({ canvases: document.querySelectorAll('canvas').length, imgs: document.querySelectorAll('main img').length, panel });
})()
"""

def done(view, res, _):
    try:
        val = view.evaluate_javascript_finish(res)
        print(val.to_string())
    except Exception as e:
        print('js error', e)
    if shot:
        view.get_snapshot(WebKit2.SnapshotRegion.VISIBLE, WebKit2.SnapshotOptions.NONE, None, snap_done, None)
    else:
        Gtk.main_quit()

def snap_done(view, res, _):
    try:
        surf = view.get_snapshot_finish(res)
        surf.write_to_png(shot)
        print('saved', shot)
    except Exception as e:
        print('snapshot error', e)
    Gtk.main_quit()

def probe():
    view.evaluate_javascript(JS, -1, None, None, None, done, None)
    return False

view.load_uri(url)
GLib.timeout_add(int(wait * 1000), probe)
GLib.timeout_add(int((wait + 30) * 1000), Gtk.main_quit)
Gtk.main()
