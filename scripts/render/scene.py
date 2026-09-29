"""Blender scene: studio lighting on black, product materials, mesh import."""
import bpy
import numpy as np
from mathutils import Vector


def reset(width=1600, height=900, samples=64):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.render.engine = 'CYCLES'
    s.cycles.device = 'CPU'
    s.cycles.samples = samples
    s.cycles.use_adaptive_sampling = True
    s.cycles.adaptive_threshold = 0.02
    s.cycles.use_denoising = True
    s.cycles.max_bounces = 8
    s.cycles.transparent_max_bounces = 4
    s.render.resolution_x = width
    s.render.resolution_y = height
    s.render.film_transparent = False
    s.view_settings.view_transform = 'AgX'
    s.view_settings.look = 'AgX - Medium High Contrast'
    s.view_settings.exposure = 1.7
    s.render.image_settings.file_format = 'PNG'
    s.render.image_settings.color_mode = 'RGB'
    world = bpy.data.worlds.new('World')
    s.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0, 0, 0, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.0
    return s


def add_mesh(name, verts, faces, material, parent=None):
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts))
    me.vertices.foreach_set('co', np.asarray(verts, dtype=np.float32).ravel())
    n = len(faces)
    me.loops.add(n * 3)
    me.loops.foreach_set('vertex_index', np.asarray(faces, dtype=np.int32)[:, ::-1].ravel())
    me.polygons.add(n)
    me.polygons.foreach_set('loop_start', np.arange(0, n * 3, 3, dtype=np.int32))
    me.update(calc_edges=True)
    me.validate()
    me.shade_smooth()
    me.materials.append(material)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def empty(name, location=(0, 0, 0), parent=None):
    ob = bpy.data.objects.new(name, None)
    ob.location = location
    bpy.context.scene.collection.objects.link(ob)
    if parent is not None:
        ob.parent = parent
    return ob


def _principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m, m.node_tree.nodes['Principled BSDF'], m.node_tree


def white_plastic(name='WhitePlastic', metal_below_z=None):
    m, b, t = _principled(name)
    b.inputs['Base Color'].default_value = (0.86, 0.86, 0.85, 1)
    b.inputs['Roughness'].default_value = 0.2
    b.inputs['Coat Weight'].default_value = 0.35
    b.inputs['Coat Roughness'].default_value = 0.06
    b.inputs['Subsurface Weight'].default_value = 0.06
    b.inputs['Subsurface Radius'].default_value = (0.2, 0.2, 0.2)
    b.inputs['Subsurface Scale'].default_value = 0.05
    if metal_below_z is not None:
        # Brushed-metal cap at the end of the stem, masked in object space
        nodes, links = t.nodes, t.links
        out = nodes['Material Output']
        metal = nodes.new('ShaderNodeBsdfPrincipled')
        metal.inputs['Base Color'].default_value = (0.72, 0.72, 0.72, 1)
        metal.inputs['Metallic'].default_value = 1.0
        metal.inputs['Roughness'].default_value = 0.28
        coord = nodes.new('ShaderNodeTexCoord')
        sep = nodes.new('ShaderNodeSeparateXYZ')
        ramp = nodes.new('ShaderNodeMapRange')
        ramp.inputs['From Min'].default_value = metal_below_z + 0.004
        ramp.inputs['From Max'].default_value = metal_below_z - 0.004
        mix = nodes.new('ShaderNodeMixShader')
        links.new(coord.outputs['Object'], sep.inputs[0])
        links.new(sep.outputs['Z'], ramp.inputs['Value'])
        links.new(ramp.outputs['Result'], mix.inputs['Fac'])
        links.new(b.outputs[0], mix.inputs[1])
        links.new(metal.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], out.inputs['Surface'])
    return m


def silicone():
    m, b, _ = _principled('Silicone')
    b.inputs['Base Color'].default_value = (0.88, 0.88, 0.87, 1)
    b.inputs['Roughness'].default_value = 0.5
    b.inputs['Subsurface Weight'].default_value = 0.35
    b.inputs['Subsurface Radius'].default_value = (0.5, 0.45, 0.4)
    b.inputs['Subsurface Scale'].default_value = 0.08
    return m


def mesh_grille():
    m, b, t = _principled('Grille')
    b.inputs['Base Color'].default_value = (0.012, 0.012, 0.013, 1)
    b.inputs['Roughness'].default_value = 0.45
    b.inputs['Metallic'].default_value = 0.4
    nodes, links = t.nodes, t.links
    coord = nodes.new('ShaderNodeTexCoord')
    tex = nodes.new('ShaderNodeTexVoronoi')
    tex.feature = 'F1'
    tex.inputs['Scale'].default_value = 900.0
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.6
    bump.inputs['Distance'].default_value = 0.002
    links.new(coord.outputs['Object'], tex.inputs['Vector'])
    links.new(tex.outputs['Distance'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def dark(name='Dark', value=0.01, roughness=0.5):
    m, b, _ = _principled(name)
    b.inputs['Base Color'].default_value = (value, value, value, 1)
    b.inputs['Roughness'].default_value = roughness
    return m


def metal(name='Metal', value=0.75, roughness=0.25):
    m, b, _ = _principled(name)
    b.inputs['Base Color'].default_value = (value, value, value, 1)
    b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = roughness
    return m


def area(name, location, target, size, power, shape='RECTANGLE', size_y=None, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, 'AREA')
    data.shape = shape
    data.size = size
    if size_y is not None:
        data.size_y = size_y
    data.energy = power
    data.color = color
    ob = bpy.data.objects.new(name, data)
    ob.location = location
    bpy.context.scene.collection.objects.link(ob)
    direction = Vector(target) - Vector(location)
    ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return ob


def studio(scale=1.0):
    """Apple-style: big soft key from top-left, cool rim strips behind, faint fill below."""
    k = scale
    area('Key', (-18 * k, -22 * k, 26 * k), (0, 0, 0), 22 * k, 5200 * k * k)
    area('Top', (2 * k, 4 * k, 34 * k), (0, 0, 0), 30 * k, 2600 * k * k)
    area('RimL', (-24 * k, 22 * k, 6 * k), (0, 0, 0), 4 * k, 2600 * k * k, size_y=30 * k)
    area('RimR', (26 * k, 18 * k, 4 * k), (0, 0, 0), 4 * k, 2600 * k * k, size_y=30 * k)
    area('Fill', (10 * k, -30 * k, -12 * k), (0, 0, 0), 26 * k, 900 * k * k)


def camera(location, target, lens=85):
    data = bpy.data.cameras.new('Camera')
    data.lens = lens
    data.clip_start = 0.1
    data.clip_end = 1000
    ob = bpy.data.objects.new('Camera', data)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = location
    direction = Vector(target) - Vector(location)
    ob.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.scene.camera = ob
    return ob


def load_npz(path):
    d = np.load(path)
    parts = {}
    for key in d.files:
        name, idx = key.rsplit('_', 1)
        parts.setdefault(name, [None, None, None])[int(idx)] = d[key]
    return parts
