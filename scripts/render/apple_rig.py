"""Rig for Apple's AirPods AR model (airpods-mid.usdz): hinge the lid, seat the earbuds.

Group names are the (obfuscated) prim names inside the USDZ. Coordinates are Blender
world units after import (Z up, front of the case = -Y, hinge at +Y)."""
import math
import bpy
from mathutils import Matrix, Vector

BASE = ('AKhEoFAHKWbkOxD', 'XwJGTFQhPVGqSPo')
LID = 'lzlFTcaWXElXzIq'
BUDS = {'R': 'JCCUJxXiqjlfhLm', 'L': 'rgwuwCnPtZggRDa'}
HINGE_AXIS_POINT = Vector((0.0, 0.95, 0.98))
STEM_TIP = {'R': 'hVuJUiXoFyUlWzS', 'L': 'EdussWEbEvjdSUZ'}


def descendants(ob):
    out, stack = [], [ob]
    while stack:
        o = stack.pop()
        out.append(o)
        stack.extend(o.children)
    return out


def mesh_bounds(obs):
    pts = [m.matrix_world @ Vector(c) for o in obs for m in descendants(o) if m.type == 'MESH' for c in m.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def pivot(name, point):
    """Insert an empty at `point` (world) that becomes the parent of `name`, keeping its transform."""
    ob = bpy.data.objects[name]
    e = bpy.data.objects.new(name + '_pivot', None)
    bpy.context.scene.collection.objects.link(e)
    e.location = point
    bpy.context.view_layer.update()
    mw = ob.matrix_world.copy()
    ob.parent = e
    ob.matrix_parent_inverse = Matrix.Identity(4)
    ob.matrix_world = mw
    bpy.context.view_layer.update()
    assert (ob.matrix_world.translation - mw.translation).length < 1e-4
    return e


def import_model(path):
    bpy.ops.wm.usd_import(filepath=path)
    bpy.context.view_layer.update()


LID_PIVOT = Vector((0.0, 0.9553, 1.0921))
LID_CLOSED_DEG = 114.0
# Seat in the case, relative to the AR pose: yaw about the stem tip, then drop into the socket
SEAT = {
    'R': dict(tip=Vector((1.49, 0.125, 2.05)), socket=Vector((1.59, 0.30, -1.36)), yaw=-31.0),
    'L': dict(tip=Vector((-1.49, 0.125, 2.05)), socket=Vector((-1.59, 0.30, -1.36)), yaw=31.0),
}


def rig(path):
    """Import and return handles: lid hinge (rotate X), bud pivots at the stem tips (seated)."""
    import_model(path)
    hinge = pivot(LID, LID_PIVOT)
    buds = {}
    for side, name in BUDS.items():
        seat = SEAT[side]
        p = pivot(name, seat['tip'])
        # Outer empty carries the seated transform; animation moves `p` relative to it
        outer = bpy.data.objects.new('Seat' + side, None)
        bpy.context.scene.collection.objects.link(outer)
        outer.location = seat['socket']
        outer.rotation_euler = (0, 0, math.radians(seat['yaw']))
        bpy.context.view_layer.update()
        mw = p.matrix_world.copy()
        p.parent = outer
        p.matrix_parent_inverse = Matrix.Identity(4)
        p.location = (0, 0, 0)
        p.rotation_euler = (0, 0, 0)
        buds[side] = (outer, p)
    bpy.context.view_layer.update()
    return hinge, buds
