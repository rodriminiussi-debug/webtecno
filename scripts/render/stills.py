"""Product stills on a transparent background, from the same rig and poses as the film.

Usage: python3 stills.py -- <usdz> <out_dir> [size] [samples]"""
import math
import sys
import bpy
from mathutils import Vector
import apple_rig as A
from film import build

args = sys.argv[sys.argv.index('--') + 1:]
usdz, out_dir = args[0], args[1]
size = int(args[2]) if len(args) > 2 else 1400
samples = int(args[3]) if len(args) > 3 else 96


def hide(obs, hidden=True):
    for ob in obs:
        for d in A.descendants(ob):
            d.hide_render = hidden


s, cam, target, hinge, buds, case_root = build(usdz, size, samples)
s.render.film_transparent = True
s.render.image_settings.color_mode = 'RGBA'
case_objs = [bpy.data.objects['ofjkiGLlLDwBpQF'], hinge]


def shot(name, frame, cam_loc=None, target_loc=None, hide_left=False, hide_case=False):
    s.frame_set(frame)
    # Stills are framed by hand, so drop the film's camera animation
    cam.animation_data_clear()
    target.animation_data_clear()
    if cam_loc:
        cam.location = cam_loc
    if target_loc:
        target.location = target_loc
    hide(case_objs, hide_case)
    hide([buds['L'][0]], hide_left)
    s.render.filepath = f'{out_dir}/{name}.png'
    bpy.ops.render.render(write_still=True)
    # Restore for the next pose
    hide(case_objs, False)
    hide([buds['L'][0]], False)


shot('case-closed', 1, (6.5, -15.5, 7.0), (0, 0, 0.1))
shot('case-open', 76, (4.5, -15.0, 7.4), (0, 0, 0.9))
shot('pair', 200, (0.0, -13.0, 10.6), (0, 0, 9.1), hide_case=True)
shot('bud', 200, (3.2, -9.5, 10.4), (1.4, 0, 9.1), hide_left=True, hide_case=True)
shot('case-buds', 110, (3.4, -19.5, 8.6), (0, 0, 1.9))
