"""Hero film: Apple's AirPods model, closed case -> lid opens -> earbuds rise -> hero pair.

Usage: python3 film.py -- <usdz> <out_dir> <size> <samples> [first last]
Renders a square PNG sequence on pure black, meant to be scrubbed by scroll."""
import math
import sys
import bpy
from mathutils import Vector
import scene as S
import apple_rig as A

FRAMES = 200


def build(usdz, size, samples):
    s = S.reset(size, size, samples)
    s.render.use_persistent_data = True
    s.frame_start, s.frame_end = 1, FRAMES
    hinge, buds = A.rig(usdz)

    case_root = S.empty('CaseRoot')
    for name in ('ofjkiGLlLDwBpQF',):
        ob = bpy.data.objects[name]
        mw = ob.matrix_world.copy()
        ob.parent = case_root
        ob.matrix_world = mw
    mw = hinge.matrix_world.copy()
    hinge.parent = case_root
    hinge.matrix_world = mw

    S.studio(1.0)
    target = S.empty('Target')
    cam = S.camera((7, -15, 7), (0, 0, 0), 60)
    track = cam.constraints.new('TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'

    def key(ob, path, frame, value, index=-1):
        if index >= 0:
            getattr(ob, path)[index] = value
        else:
            setattr(ob, path, value)
        ob.keyframe_insert(path, index=index, frame=frame)

    def keys(ob, path, pairs, index=-1):
        for frame, value in pairs:
            key(ob, path, frame, value, index)

    rad = math.radians
    # Camera orbit + framing
    keys(cam, 'location', [(1, (7.5, -15.5, 7.5)), (40, (5.5, -14.5, 6.8)), (80, (3.5, -14.0, 6.6)), (130, (1.5, -14.5, 8.0)), (185, (0.3, -13.2, 10.2)), (200, (0.0, -12.6, 10.4))])
    keys(target, 'location', [(1, (0, 0, 0.1)), (40, (0, 0, 0.2)), (80, (0, 0, 0.9)), (130, (0, 0, 4.8)), (185, (0, 0, 8.9)), (200, (0, 0, 9.1))])
    # Lid: closed (114deg) -> open
    keys(hinge, 'rotation_euler', [(1, rad(A.LID_CLOSED_DEG)), (34, rad(A.LID_CLOSED_DEG)), (72, rad(4.0))], index=0)
    # Case falls out of frame
    keys(case_root, 'location', [(1, (0, 0, 0)), (100, (0, 0, 0)), (150, (0, 0, -9.0))])
    keys(case_root, 'rotation_euler', [(1, (0, 0, 0)), (100, (0, 0, 0)), (150, (rad(-18), 0, 0))])
    # Earbuds: lift out of the sockets, then float into the hero pair
    for side, (outer, p) in buds.items():
        sgn = 1 if side == 'R' else -1
        seat = A.SEAT[side]
        keys(p, 'location', [(1, (0, 0, 0)), (78, (0, 0, 0)), (112, (0, 0, 3.4))])
        keys(outer, 'location', [(1, seat['socket']), (100, seat['socket']), (200, Vector((sgn * 1.35, -0.6, 4.6)))])
        keys(outer, 'rotation_euler', [(1, (0, 0, rad(seat['yaw']))), (100, (0, 0, rad(seat['yaw']))), (200, (rad(-8), sgn * rad(6), rad(seat['yaw'] + sgn * 26)))])

    for ob in (cam, target, hinge, case_root, *[x for pair in buds.values() for x in pair]):
        if ob.animation_data and ob.animation_data.action:
            for fc in ob.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = 'BEZIER'
                    kp.easing = 'AUTO'
    return s, cam, target, hinge, buds, case_root


if __name__ == '__main__':
    args = sys.argv[sys.argv.index('--') + 1:]
    usdz, out_dir, size, samples = args[0], args[1], int(args[2]), int(args[3])
    first, last = (int(args[4]), int(args[5])) if len(args) > 5 else (1, FRAMES)
    s = build(usdz, size, samples)[0]
    for f in range(first, last + 1):
        s.frame_set(f)
        s.render.filepath = f'{out_dir}/{f:04d}.png'
        bpy.ops.render.render(write_still=True)
