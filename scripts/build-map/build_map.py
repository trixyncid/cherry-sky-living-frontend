"""
Builds the neighbourhood model behind the landing page's location map.

Run headless from the project root:

  /Applications/Blender.app/Contents/MacOS/Blender -b -P scripts/build-map/build_map.py -- \
      --out public/media/map --work /tmp/map-work [--preview] [--samples 64] [--res 2048] [--gpu]

What it makes
  city.glb        ground + surrounding buildings/trees/cars/lamps + the two kost
                  buildings, with empties `pin_cherry` / `pin_sky` at their roofs
  ground.png      the ground, fully baked (colour and light)
  city-lm.png     baked light for the surroundings (second UV set)
  heroes-lm.png   baked light for the two kost buildings (second UV set)
  poster.png      a still of the page's view, shown while the model loads

`build.mjs` next to this file runs Blender and converts the PNGs to WebP.

The streets are an illustration, not a survey: the layout is generated from a
fixed seed. The two kost buildings are modelled after the photos in
public/assets. Lighting is blue hour, baked with Cycles, so the page only has
to draw textures.
"""

import math
import os
import random
import sys

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

# ───────────────────────── arguments ─────────────────────────

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def arg(name, default=None, flag=False):
    if flag:
        return name in argv
    return argv[argv.index(name) + 1] if name in argv else default


OUT = os.path.abspath(arg("--out", "public/media/map"))
WORK = os.path.abspath(arg("--work", "/tmp/map-work"))
PREVIEW = arg("--preview", flag=True)
SAMPLES = int(arg("--samples", "64"))
RES = int(arg("--res", "2048"))
os.makedirs(OUT, exist_ok=True)
os.makedirs(WORK, exist_ok=True)

rng = random.Random(7)
nrng = np.random.RandomState(7)

EXT = 128.0  # half-size of the ground, metres
SCALE = 1 / 16  # metres → scene units on export
RADIUS = 118.0  # nothing is built further than this from the centre
SIDEWALK = 2.5

# Roads: (centre, width). Plan coords: +X east, +Y north; the camera sits south.
EW = [(-111, 8), (-57, 16), (7, 10), (67, 8)]
NS = [(-85, 8), (-9, 10), (53, 8), (113, 8)]
AVENUE = -57

CHERRY = dict(cx=-32.0, y0=-40.0)  # front (south) face of the main block
SKY = dict(cx=31.0, y0=20.0)
RESERVED = [(-52, -47, -19, -14), (17, 14.5, 45, 42)]

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ───────────────────────── images ─────────────────────────


def lin(c):
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)


def save_img(name, arr):
    """arr: H×W×3 sRGB floats, row 0 at the bottom."""
    h, w, _ = arr.shape
    img = bpy.data.images.new(name, w, h, alpha=False)
    rgba = np.ones((h, w, 4), np.float32)
    rgba[..., :3] = np.clip(arr, 0, 1)
    img.pixels.foreach_set(rgba.ravel())
    path = os.path.join(WORK, name + ".png")
    img.filepath_raw = path
    img.file_format = "PNG"
    img.save()
    bpy.data.images.remove(img)
    img = bpy.data.images.load(path)
    img.name = name
    return img


def blur(a, n=1):
    for _ in range(n):
        a = (np.roll(a, 1, 0) + a + np.roll(a, -1, 0)) / 3
        a = (np.roll(a, 1, 1) + a + np.roll(a, -1, 1)) / 3
    return a


def grain(h, w, amount, coarse=8):
    fine = nrng.normal(0, amount, (h, w))
    low = nrng.normal(0, amount * 2.5, (h // coarse + 1, w // coarse + 1))
    low = np.repeat(np.repeat(low, coarse, 0), coarse, 1)[:h, :w]
    return (fine + blur(low, coarse))[..., None]


WARM = np.array([1.0, 0.72, 0.40])
COOL = np.array([0.82, 0.92, 1.0])


def facade(name, wall, win, cells=4, size=256, frame=(0.86, 0.85, 0.82), lit=0.3,
           stain=0.5, curtains=None, emit_name=None, lit_cells=None):
    """A grid of window cells. Returns (albedo, emissive) images."""
    c = size // cells
    alb = np.empty((size, size, 3))
    alb[:] = wall
    alb += grain(size, size, 0.012)
    emi = np.zeros((size, size, 3))
    wx0, wy0, wx1, wy1 = win
    for j in range(cells):
        for i in range(cells):
            ox, oy = i * c, j * c
            x0, x1 = ox + int(wx0 * c), ox + int(wx1 * c)
            y0, y1 = oy + int(wy0 * c), oy + int(wy1 * c)
            # slab line and rain streaks under the sill
            alb[oy : oy + max(1, c // 40), ox : ox + c] *= 0.82
            if stain:
                for k in range(y0 - oy):
                    alb[oy + k, x0:x1] *= 1 - stain * 0.18 * (k / max(1, y0 - oy))
            f = max(1, c // 28)
            alb[y0 - f : y1 + f, x0 - f : x1 + f] = frame
            alb[y0 - 2 * f : y0 - f, x0 - 2 * f : x1 + 2 * f] = np.array(frame) * 0.9
            glass = np.array([0.045, 0.06, 0.085]) * (0.8 + 0.5 * nrng.rand())
            alb[y0:y1, x0:x1] = glass
            # reflection of the sky toward the top of the pane
            for k in range(y1 - y0):
                alb[y0 + k, x0:x1] += np.array([0.02, 0.035, 0.07]) * (k / (y1 - y0)) ** 2
            mid = (x0 + x1) // 2
            alb[y0:y1, mid - f // 2 : mid - f // 2 + f] = frame
            is_lit = (lit_cells[j][i] if lit_cells else nrng.rand() < lit)
            if is_lit:
                tone = WARM if nrng.rand() < 0.72 else COOL
                power = 0.45 + 0.55 * nrng.rand()
                hh, ww = y1 - y0, x1 - x0
                yy = np.linspace(0.75, 1.0, hh)[:, None, None]
                xx = 1 - 0.35 * np.abs(np.linspace(-1, 1, ww))[None, :, None] ** 2
                emi[y0:y1, x0:x1] = tone * power * yy * xx
                cw = int(ww * (0.12 + 0.2 * nrng.rand()))
                if curtains is not None:
                    alb[y0:y1, x0 : x0 + cw] = curtains
                    alb[y0:y1, x1 - cw : x1] = curtains
                    emi[y0:y1, x0 : x0 + cw] *= 0.25
                    emi[y0:y1, x1 - cw : x1] *= 0.25
                elif nrng.rand() < 0.5:
                    emi[y0:y1, x0 : x0 + cw] *= 0.45
                emi[y0:y1, mid - f // 2 : mid - f // 2 + f] = 0
            if stain and nrng.rand() < 0.3:  # AC outdoor unit
                ax = x0 + int((x1 - x0) * 0.1)
                alb[oy + c // 12 : oy + c // 12 + c // 9, ax : ax + c // 6] = (0.8, 0.8, 0.78)
    return save_img(name, alb), save_img(emit_name or name + "_e", emi)


def shopfront(name):
    w, h, n = 512, 128, 4
    u = w // n
    alb = np.empty((h, w, 3))
    alb[:] = (0.62, 0.6, 0.57)
    alb += grain(h, w, 0.015)
    emi = np.zeros((h, w, 3))
    signs = [(0.75, 0.12, 0.1), (0.95, 0.75, 0.1), (0.1, 0.35, 0.7), (0.9, 0.9, 0.88), (0.1, 0.5, 0.3)]
    for i in range(n):
        ox = i * u
        p = 7
        sy = int(h * 0.74)
        col = np.array(signs[nrng.randint(len(signs))])
        alb[sy : h - 6, ox + p : ox + u - p] = col * 0.8
        if nrng.rand() < 0.6:
            emi[sy : h - 6, ox + p : ox + u - p] = col * 0.55 + 0.1
        if nrng.rand() < 0.45:  # open, lit shop
            tone = WARM if nrng.rand() < 0.5 else COOL
            emi[4:sy - 4, ox + p : ox + u - p] = tone * (0.6 + 0.4 * nrng.rand())
            alb[4:sy - 4, ox + p : ox + u - p] = (0.3, 0.28, 0.25)
            for _ in range(5):  # goods and people as dark shapes
                bx = ox + p + nrng.randint(u - 2 * p - 14)
                bh = nrng.randint(12, 44)
                emi[4 : 4 + bh, bx : bx + nrng.randint(6, 14)] *= 0.25
        else:  # rolling door
            alb[4:sy - 4, ox + p : ox + u - p] = (0.42, 0.44, 0.46)
            for y in range(6, sy - 4, 5):
                alb[y, ox + p : ox + u - p] *= 0.7
    return save_img(name, alb), save_img(name + "_e", emi)


def rooftile(name, base):
    s = 128
    a = np.empty((s, s, 3))
    a[:] = base
    for y in range(0, s, 8):
        a[y : y + 2] *= 0.72
        a[y + 2 : y + 8] *= 0.9 + 0.2 * nrng.rand(1, s // 4, 1).repeat(4, 1)
    a += grain(s, s, 0.03)
    return save_img(name, a)


def baluster(name):
    a = np.empty((32, 32, 3))
    a[:] = (0.2, 0.19, 0.17)
    for x0 in (4, 20):
        a[:, x0 : x0 + 8] = (0.93, 0.91, 0.86)
        a[:, x0 + 2 : x0 + 6] = (0.97, 0.95, 0.9)
    a[:4] = a[27:] = (0.95, 0.93, 0.88)
    return save_img(name, a)


def fbm(size, octaves=(4, 8, 16, 32)):
    """Tileable soft noise in 0..1."""
    total = np.zeros((size, size))
    for c in octaves:
        low = nrng.rand(size // c, size // c)
        total += blur(np.repeat(np.repeat(low, c, 0), c, 1), c // 2 + 1) * c
    total -= total.min()
    return total / max(total.max(), 1e-6)


def foliage(name, base, n=1300, size=256, long=False):
    """Overlapping leaves with a midrib and a lit half, dark gaps between."""
    base = np.array(base)
    a = np.empty((size, size, 3))
    a[:] = base * 0.36
    a += grain(size, size, 0.01)
    for _ in range(n):
        r = nrng.randint(4, 8)
        ang = nrng.rand() * np.pi
        yy, xx = np.mgrid[-r : r + 1, -r : r + 1]
        u = xx * np.cos(ang) + yy * np.sin(ang)
        v = -xx * np.sin(ang) + yy * np.cos(ang)
        half = r * (0.26 if long else 0.48)
        mask = (u / r) ** 2 + (v / half) ** 2 < 1
        tint = base * (0.7 + 0.8 * nrng.rand()) * np.array(
            [1 + 0.3 * (nrng.rand() - 0.5), 1, 1 + 0.3 * (nrng.rand() - 0.5)])
        shade = np.clip(1.0 + 0.4 * v / half, 0.6, 1.4)[..., None]
        rib = np.where(np.abs(v) < 0.6, 1.3, 1.0)[..., None]
        col = tint * shade * rib
        cy, cx = nrng.randint(size, size=2)
        a[(cy + yy)[mask] % size, (cx + xx)[mask] % size] = col[mask]
    return save_img(name, a)


def plaster(name, base, mottle=0.1, streaks=0.1, size=256):
    """Painted wall: soft blotches, fine grain and rain streaks running down."""
    a = np.empty((size, size, 3))
    a[:] = base
    a *= (1 - mottle / 2 + mottle * fbm(size))[..., None]
    cols = blur(np.repeat(nrng.rand(1, size) ** 3, size, 0), 1)
    a *= (1 - streaks * cols)[..., None]
    a += grain(size, size, 0.012, 4)
    return save_img(name, a)


def roofslab(name, base, size=256):
    """Flat concrete roof: patches of repair, water stains and cracks."""
    a = np.empty((size, size, 3))
    a[:] = base
    a *= (0.86 + 0.28 * fbm(size, (8, 16, 32, 64)))[..., None]
    for _ in range(10):
        x, y = nrng.randint(size, size=2)
        w, h = nrng.randint(18, 70, size=2)
        ys, xs = np.ix_(np.arange(y, y + h) % size, np.arange(x, x + w) % size)
        a[ys, xs] *= 0.9 + 0.2 * nrng.rand()
    for _ in range(7):
        x, y = nrng.randint(size, size=2).astype(float)
        ang = nrng.rand() * 6.28
        for _ in range(nrng.randint(40, 140)):
            a[int(y) % size, int(x) % size] *= 0.6
            ang += nrng.normal(0, 0.35)
            x, y = x + np.cos(ang), y + np.sin(ang)
    a += grain(size, size, 0.015, 4)
    return save_img(name, a)


def stone(name, base, size=256, course=16):
    a = np.empty((size, size, 3))
    for y in range(0, size, course):
        x = -nrng.randint(40)
        while x < size:
            w = nrng.randint(22, 60)
            a[y : y + course, max(0, x) : x + w] = np.array(base) * (0.78 + 0.36 * nrng.rand())
            a[y : y + course, max(0, x + w - 1) : x + w] *= 0.55
            x += w
        a[y : y + 1] *= 0.55
    a *= (0.92 + 0.16 * fbm(size, (4, 8)))[..., None]
    a += grain(size, size, 0.02, 4)
    return save_img(name, a)


def timber(name, base, plank=32, size=256):
    a = np.empty((size, size, 3))
    fibre = blur(np.repeat(nrng.rand(1, size), size, 0) + 0.25 * nrng.rand(size, size), 1)
    for x in range(0, size, plank or size):
        w = plank or size
        a[:, x : x + w] = np.array(base) * (0.8 + 0.35 * nrng.rand())
        if plank:
            a[:, x : x + 1] *= 0.45
    a *= (0.78 + 0.44 * fibre)[..., None]
    for _ in range(4 if plank else 0):  # knots
        cx, cy = nrng.randint(size, size=2)
        yy, xx = np.mgrid[-4:5, -3:4]
        m = (xx / 3) ** 2 + (yy / 4) ** 2 < 1
        a[(cy + yy)[m] % size, (cx + xx)[m] % size] *= 0.6
    return save_img(name, a)


# ───────────────────────── materials ─────────────────────────


def bsdf_of(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def mat(name, color=(0.8, 0.8, 0.8), rough=0.85, tex=None, emit_tex=None, emit=None, strength=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = bsdf_of(m)
    b.inputs["Base Color"].default_value = (*lin(color), 1)
    b.inputs["Roughness"].default_value = rough
    if tex or emit_tex:
        uv = nt.nodes.new("ShaderNodeUVMap")
        uv.uv_map = "uv"
    if tex:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = tex
        nt.links.new(uv.outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    if emit_tex:
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = emit_tex
        nt.links.new(uv.outputs["UV"], t.inputs["Vector"])
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = strength
    elif emit:
        b.inputs["Emission Color"].default_value = (*lin(emit), 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


RUKO_WIN = (0.2, 0.24, 0.8, 0.78)
ruko_emit = None
RUKO = []
for nm, wall in [("ruko_cream", (0.8, 0.74, 0.62)), ("ruko_white", (0.84, 0.84, 0.81)),
                 ("ruko_green", (0.62, 0.72, 0.62)), ("ruko_peach", (0.83, 0.64, 0.52)),
                 ("ruko_grey", (0.58, 0.58, 0.57))]:
    nrng.seed(11)  # same lit pattern, so one emissive map serves every colour
    a, e = facade(nm, wall, RUKO_WIN, emit_name="ruko_e")
    if ruko_emit is None:
        ruko_emit = e
    else:
        bpy.data.images.remove(e)
    RUKO.append(mat(nm, tex=a, emit_tex=ruko_emit, strength=2.2))

nrng.seed(21)
a, e = facade("tower_a", (0.7, 0.71, 0.72), (0.06, 0.2, 0.94, 0.82), lit=0.42, stain=0)
TOWER = [mat("tower_a", tex=a, emit_tex=e, strength=2.2, rough=0.6)]
nrng.seed(21)
a, e2 = facade("tower_b", (0.3, 0.33, 0.38), (0.06, 0.2, 0.94, 0.82), lit=0.42, stain=0,
               frame=(0.2, 0.2, 0.22), emit_name="tower_e2")
bpy.data.images.remove(e2)
TOWER.append(mat("tower_b", tex=a, emit_tex=e, strength=2.2, rough=0.55))

HOUSE = []
house_emit = None
for nm, wall in [("house_white", (0.86, 0.85, 0.8)), ("house_yellow", (0.84, 0.76, 0.52)),
                 ("house_blue", (0.6, 0.68, 0.74))]:
    nrng.seed(31)
    a, e = facade(nm, wall, (0.3, 0.28, 0.7, 0.74), lit=0.4, emit_name="house_e")
    if house_emit is None:
        house_emit = e
    else:
        bpy.data.images.remove(e)
    HOUSE.append(mat(nm, tex=a, emit_tex=house_emit, strength=2.0))

nrng.seed(41)
a, e = shopfront("shop")
SHOP = mat("shop", tex=a, emit_tex=e, strength=2.6)
TILE = [mat("tile_red", tex=rooftile("tile_red", (0.5, 0.24, 0.16)), rough=0.8),
        mat("tile_brown", tex=rooftile("tile_brown", (0.34, 0.24, 0.2)), rough=0.8)]

nrng.seed(51)
a, e = facade("cherry_wall", (0.93, 0.9, 0.84), (0.3, 0.16, 0.7, 0.76), cells=2, size=512,
              frame=(0.98, 0.96, 0.92), stain=0, curtains=(0.36, 0.2, 0.12),
              lit_cells=[[True, True], [True, False]])
CH_WALL = mat("cherry_wall", tex=a, emit_tex=e, strength=3.0)
nrng.seed(52)
a, e = facade("sky_wall", (0.5, 0.55, 0.64), (0.36, 0.2, 0.64, 0.72), cells=2, size=512,
              frame=(0.92, 0.92, 0.92), stain=0, lit_cells=[[True, False], [False, True]])
SK_WALL = mat("sky_wall", tex=a, emit_tex=e, strength=2.6)
BALUSTER = mat("baluster", tex=baluster("baluster"))

nrng.seed(61)
CH_WHITE = mat("cherry_white", tex=plaster("cherry_white", (0.94, 0.92, 0.87), 0.05, 0.05), rough=0.7)
CH_GLOW = mat("cherry_glow", (0.9, 0.8, 0.6), emit=(1.0, 0.8, 0.52), strength=2.4)
SK_GREY = mat("sky_grey", tex=plaster("sky_grey", (0.5, 0.55, 0.64), 0.08, 0.08), rough=0.8)
SK_DARK = mat("sky_dark", (0.2, 0.21, 0.24), 0.6)
SK_STONE = mat("sky_stone", tex=stone("sky_stone", (0.8, 0.79, 0.76)), rough=0.9)
SK_SIGN = mat("sky_sign", (0.9, 0.9, 0.9), emit=(1.0, 0.96, 0.88), strength=3.0)
WOOD = mat("wood", tex=timber("wood", (0.5, 0.31, 0.18)), rough=0.7)
VINE = mat("vine", tex=foliage("vine", (0.24, 0.42, 0.12), long=True), rough=0.9)
GLASS = mat("glass_lit", (0.25, 0.3, 0.32), 0.25, emit=(1.0, 0.86, 0.62), strength=1.1)
CONCRETE = mat("concrete", tex=plaster("concrete", (0.56, 0.55, 0.53), 0.14, 0.2), rough=0.9)
ROOF = mat("roof", tex=roofslab("roof", (0.42, 0.42, 0.41)), rough=0.95)
TRIM = mat("trim", tex=plaster("trim", (0.78, 0.77, 0.74), 0.1, 0.16), rough=0.85)
METAL = mat("metal", (0.3, 0.31, 0.33), 0.5)
TANK = [mat("tank_orange", (0.85, 0.42, 0.1), 0.5), mat("tank_blue", (0.15, 0.35, 0.6), 0.5)]
LEAF = [mat("leaf_a", tex=foliage("leaf_a", (0.13, 0.25, 0.08)), rough=0.95),
        mat("leaf_b", tex=foliage("leaf_b", (0.2, 0.29, 0.09)), rough=0.95)]
TRUNK = mat("trunk", tex=timber("bark", (0.27, 0.2, 0.15), plank=0), rough=0.95)
CAR = [mat("car_white", (0.85, 0.85, 0.85), 0.35), mat("car_dark", (0.1, 0.1, 0.12), 0.35),
       mat("car_silver", (0.5, 0.52, 0.55), 0.35), mat("car_red", (0.5, 0.08, 0.08), 0.35)]
CARGLASS = mat("car_glass", (0.04, 0.05, 0.07), 0.2)
HEAD = mat("headlight", (1, 1, 1), emit=(1.0, 0.95, 0.85), strength=6.0)
TAIL = mat("taillight", (0.6, 0.05, 0.05), emit=(1.0, 0.1, 0.06), strength=4.0)
LAMP = mat("lamp", (1, 0.9, 0.7), emit=(1.0, 0.78, 0.48), strength=8.0)

# ───────────────────────── mesh builder ─────────────────────────


TILE_M = 4.0  # metres covered by one repeat of the tiling surface textures


def box_uv(p, n):
    """Project a point onto the plane its face mostly looks along."""
    ax, ay, az = abs(n[0]), abs(n[1]), abs(n[2])
    if az >= ax and az >= ay:
        return (p[0] / TILE_M, p[1] / TILE_M)
    if ax >= ay:
        return (p[1] / TILE_M, p[2] / TILE_M)
    return (p[0] / TILE_M, p[2] / TILE_M)


class Mesh:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.uv = self.bm.loops.layers.uv.new("uv")
        self.mats = []

    def mi(self, m):
        if m not in self.mats:
            self.mats.append(m)
        return self.mats.index(m)

    def face(self, pts, m, uvs=None, smooth=False):
        f = self.bm.faces.new([self.bm.verts.new(p) for p in pts])
        f.material_index = self.mi(m)
        f.smooth = smooth
        if not uvs:
            f.normal_update()
            uvs = [box_uv(p, f.normal) for p in pts]
        for loop, uv in zip(f.loops, uvs):
            loop[self.uv].uv = uv
        return f

    def band(self, r, z0, z1, m, su=None, sv=None, ou=0.0, ov=0.0, sides="SNEW", flip=False):
        x0, y0, x1, y1 = r
        edges = {"S": ((x0, y0), (x1, y0)), "E": ((x1, y0), (x1, y1)),
                 "N": ((x1, y1), (x0, y1)), "W": ((x0, y1), (x0, y0))}
        for k in sides:
            a, b = edges[k]
            pts = [(*a, z0), (*b, z0), (*b, z1), (*a, z1)]
            uvs = None
            if su:
                u1, v1 = ou + math.dist(a, b) / su, ov + (z1 - z0) / sv
                uvs = [(ou, ov), (u1, ov), (u1, v1), (ou, v1)]
            if flip:
                pts.reverse()
                if uvs:
                    uvs.reverse()
            self.face(pts, m, uvs)

    def top(self, r, z, m, su=None):
        x0, y0, x1, y1 = r
        pts = [(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)]
        self.face(pts, m, [(p[0] / su, p[1] / su) for p in pts] if su else None)

    def box(self, r, z0, z1, m, top=None, bottom=False):
        self.band(r, z0, z1, m)
        self.top(r, z1, top or m)
        if bottom:
            x0, y0, x1, y1 = r
            self.face([(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)], m)

    def flat_roof(self, r, z, ph=0.7, t=0.3, roof=None, par=None):
        roof, par = roof or ROOF, par or TRIM
        x0, y0, x1, y1 = r
        inner = (x0 + t, y0 + t, x1 - t, y1 - t)
        self.band(inner, z, z + ph, par, flip=True)
        self.top(inner, z, roof)
        zt = z + ph
        for q in ((x0, y0, x1, y0 + t), (x0, y1 - t, x1, y1), (x0, y0 + t, x0 + t, y1 - t),
                  (x1 - t, y0 + t, x1, y1 - t)):
            self.top(q, zt, par)

    def prism(self, pts, z0, z1, m, cap=True, bottom=False, su=None, sv=None):
        n = len(pts)
        u = 0.0
        for i in range(n):
            a, b = pts[i], pts[(i + 1) % n]
            uvs = None
            if su:
                du = math.dist(a, b) / su
                v1 = (z1 - z0) / sv if sv else 1.0
                uvs = [(u, 0), (u + du, 0), (u + du, v1), (u, v1)]
                u += du
            self.face([(*a, z0), (*b, z0), (*b, z1), (*a, z1)], m, uvs)
        if cap:
            self.face([(*p, z1) for p in pts], m)
        if bottom:
            self.face([(*p, z0) for p in reversed(pts)], m)

    def cyl(self, x, y, z0, z1, r, m, seg=8, cap=True):
        pts = [(x + r * math.cos(2 * math.pi * i / seg), y + r * math.sin(2 * math.pi * i / seg))
               for i in range(seg)]
        self.prism(pts, z0, z1, m, cap=cap)

    def hip(self, r, z, h, m):
        x0, y0, x1, y1 = r
        w, d = x1 - x0, y1 - y0
        s = 3.0
        if w >= d:
            yc, ra, rb, zt = (y0 + y1) / 2, x0 + d / 2, x1 - d / 2, z + h
            quads = [[(x0, y0, z), (x1, y0, z), (rb, yc, zt), (ra, yc, zt)],
                     [(x1, y1, z), (x0, y1, z), (ra, yc, zt), (rb, yc, zt)],
                     [(x0, y1, z), (x0, y0, z), (ra, yc, zt)],
                     [(x1, y0, z), (x1, y1, z), (rb, yc, zt)]]
            swap = [False, False, True, True]
        else:
            xc, ra, rb, zt = (x0 + x1) / 2, y0 + w / 2, y1 - w / 2, z + h
            quads = [[(x1, y0, z), (x1, y1, z), (xc, rb, zt), (xc, ra, zt)],
                     [(x0, y1, z), (x0, y0, z), (xc, ra, zt), (xc, rb, zt)],
                     [(x0, y0, z), (x1, y0, z), (xc, ra, zt)],
                     [(x1, y1, z), (x0, y1, z), (xc, rb, zt)]]
            swap = [True, True, False, False]
        for pts, sw in zip(quads, swap):
            uvs = [((p[1] if sw else p[0]) / s, (p[0] if sw else p[1]) / s + p[2] / s) for p in pts]
            self.face(pts, m, uvs)

    def blob(self, x, y, z, rx, ry, rz, m, jitter=0.18, sub=2):
        mtx = Matrix.Translation((x, y, z)) @ Matrix.Diagonal((rx, ry, rz, 1))
        ret = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=1.0, matrix=mtx)
        faces = set()
        for v in ret["verts"]:
            k = 1 + rng.uniform(-jitter, jitter)
            v.co.x = x + (v.co.x - x) * k
            v.co.y = y + (v.co.y - y) * k
            v.co.z = z + (v.co.z - z) * (1 + rng.uniform(-jitter, jitter) * 0.6)
            faces.update(v.link_faces)
        mi = self.mi(m)
        for f in faces:
            f.material_index = mi
            f.smooth = True
            f.normal_update()
            for loop in f.loops:  # leaves at about twice the wall-texture scale
                uv = box_uv(loop.vert.co, f.normal)
                loop[self.uv].uv = (uv[0] * 1.6, uv[1] * 1.6)

    def tree(self, x, y, h=None):
        h = h or rng.uniform(5.5, 10.0)
        r = h * rng.uniform(0.3, 0.4)
        leaf = rng.choice(LEAF)
        self.cyl(x, y, 0, h * 0.5, 0.18, TRUNK, seg=5, cap=False)
        self.blob(x, y, h * 0.7, r, r, r * 0.7, leaf, jitter=0.22)
        a = rng.uniform(0, 6.28)
        for i in range(rng.randint(2, 3)):
            b = a + i * 2.2 + rng.uniform(-0.4, 0.4)
            k = rng.uniform(0.5, 0.68)
            self.blob(x + math.cos(b) * r * 0.75, y + math.sin(b) * r * 0.75, h * rng.uniform(0.5, 0.66),
                      r * k, r * k, r * k * 0.75, leaf, jitter=0.22, sub=1)

    def finish(self):
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0005)
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        scene.collection.objects.link(ob)
        return ob


# ───────────────────────── layout ─────────────────────────


def hits(r, others, pad=0.0):
    return any(r[0] < o[2] + pad and r[2] > o[0] - pad and r[1] < o[3] + pad and r[3] > o[1] - pad
               for o in others)


def keep(r):
    d = math.hypot((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)
    if d > RADIUS:
        return False
    return d < 96 or rng.random() < (RADIUS - d) / (RADIUS - 96) * 0.9 + 0.1


def intervals(roads):
    out, lo = [], -EXT
    for c, w in roads:
        out.append((lo, c - w / 2 - SIDEWALK))
        lo = c + w / 2 + SIDEWALK
    out.append((lo, EXT))
    return [iv for iv in out if iv[1] - iv[0] > 14]


buildings, yards, trees, cars = [], [], [], []


def row(bx0, bx1, yf, depth, facing, kind, tall_ok):
    """One row of lots along a street. yf is the street-side edge."""
    sgn = 1 if facing == "S" else -1
    x = bx0 + 1.0
    while x < bx1 - 6:
        if kind == "ruko":
            if tall_ok and rng.random() < 0.14 and bx1 - x > 16:
                w, d, fl = 13.5, min(15.75, depth), rng.randint(6, 10)
                b = dict(kind="tower", floors=fl, style=rng.randrange(2))
            else:
                n = min(rng.randint(2, 5), int((bx1 - 1 - x) // 4.5))
                if n < 1:
                    break
                w, d = n * 4.5, min(15.75, depth) if rng.random() < 0.7 else 13.5
                b = dict(kind="ruko", floors=rng.randint(2, 4) if tall_ok else rng.randint(2, 3),
                         style=rng.randrange(len(RUKO)), units=n)
            ya, yb = (yf + 0.6, yf + 0.6 + d) if sgn > 0 else (yf - 0.6 - d, yf - 0.6)
            r = (x, ya, x + w, yb)
            step = w + (3.0 if rng.random() < 0.12 else 0.0)
        else:
            lot = rng.choice((10.5, 12.0, 13.5))
            w, d = lot - 1.5, rng.choice((9.0, 12.0))
            sb = 4.5
            ya, yb = (yf + sb, yf + sb + d) if sgn > 0 else (yf - sb - d, yf - sb)
            r = (x + 0.75, ya, x + 0.75 + w, yb)
            b = dict(kind="house", floors=rng.choice((1, 1, 2)), style=rng.randrange(len(HOUSE)),
                     lot=(x, min(yf, yf + sgn * depth), x + lot, max(yf, yf + sgn * depth)))
            step = lot
        if x + (r[2] - x) <= bx1 - 0.5 and not hits(r, RESERVED, 1.0) and keep(r):
            b.update(r=r, facing=facing)
            buildings.append(b)
            if b["kind"] == "house":
                yards.append(b["lot"])
                if rng.random() < 0.65:
                    trees.append((r[0] - 0.2 + rng.uniform(0, w), yf + sgn * rng.uniform(1.5, 3.2)))
                if rng.random() < 0.45:
                    cars.append((r[2] - 1.6, yf + sgn * 2.4, 90))
        x += step


XI, YI = intervals(NS), intervals(EW)
for by0, by1 in YI:
    for bx0, bx1 in XI:
        bh = by1 - by0
        depth = min(18.0, (bh - 4) / 2)
        south_is_avenue = abs(by0 - (AVENUE + 8 + SIDEWALK)) < 1
        north_is_avenue = abs(by1 - (AVENUE - 8 - SIDEWALK)) < 1
        north_half = by0 > 10
        ks = "ruko" if south_is_avenue or rng.random() < 0.6 else "res"
        kn = "res" if north_is_avenue or rng.random() < 0.45 else "ruko"
        if by0 > -EXT + 1:
            row(bx0, bx1, by0, depth, "S", ks, north_half and not (bx0 < 45 and bx1 > 17 and by0 < 60))
        if by1 < EXT - 1:
            row(bx0, bx1, by1, depth, "N", kn, north_half and by1 > 62)
        if bh > 2 * depth + 6:  # trees in the leftover middle of the block
            yards.append((bx0 + 1, by0 + depth + 1, bx1 - 1, by1 - depth - 1))
            for _ in range(int((bx1 - bx0) / 7)):
                p = (rng.uniform(bx0 + 3, bx1 - 3), rng.uniform(by0 + depth + 2, by1 - depth - 2))
                if not hits((p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3), RESERVED) and math.hypot(*p) < 108:
                    trees.append(p)


def near_cross(v, roads, pad):
    return any(abs(v - c) < w / 2 + pad for c, w in roads)


lamps = []  # (x, y, dx, dy) with the arm pointing at the road
for yc, w in EW:
    if yc == AVENUE:
        for x in range(-108, 109, 24):
            if not near_cross(x, NS, 6) and math.hypot(x, yc) < 110:
                lamps += [(x, yc, 0, 1), (x, yc, 0, -1)]
                trees.append((x + 12, yc))
        continue
    for i, x in enumerate(range(-105, 106, 30)):
        s = 1 if i % 2 else -1
        if not near_cross(x, NS, 7) and math.hypot(x, yc) < 110:
            lamps.append((x, yc + s * (w / 2 + 0.8), 0, -s))
for xc, w in NS:
    for i, y in enumerate(range(-96, 106, 30)):
        s = 1 if i % 2 else -1
        if not near_cross(y, EW, 7) and math.hypot(xc, y) < 110:
            lamps.append((xc + s * (w / 2 + 0.8), y, -s, 0))

# street trees and parked cars
for yc, w in EW:
    for x in range(-110, 111, 13):
        for s in (1, -1):
            p = (x + rng.uniform(-2, 2), yc + s * (w / 2 + 1.4))
            if rng.random() < 0.4 and not near_cross(p[0], NS, 9) and math.hypot(*p) < 106:
                trees.append(p)
            c = (x + rng.uniform(-3, 3), yc + s * (w / 2 - 1.2), 0)
            if rng.random() < 0.3 and not near_cross(c[0], NS, 12) and math.hypot(c[0], c[1]) < 104:
                cars.append(c)
for xc, w in NS:
    for y in range(-104, 111, 13):
        for s in (1, -1):
            p = (xc + s * (w / 2 + 1.4), y + rng.uniform(-2, 2))
            if rng.random() < 0.35 and not near_cross(p[1], EW, 9) and math.hypot(*p) < 106:
                trees.append(p)
            c = (xc + s * (w / 2 - 1.2), y + rng.uniform(-3, 3), 90)
            if rng.random() < 0.22 and not near_cross(c[1], EW, 12) and math.hypot(c[0], c[1]) < 104:
                cars.append(c)
moving = [(-60, AVENUE - 2.2, 0, 1), (-22, AVENUE - 5.6, 0, 1), (22, AVENUE + 5.4, 0, -1),
          (70, AVENUE + 2.2, 0, -1), (-9 + 2.4, -22, 90, 1), (40, 7 - 2.4, 0, 1), (-48, 7 + 2.4, 0, -1)]

# ───────────────────────── ground texture ─────────────────────────

G = RES
PPM = G / (2 * EXT)


def px(v):
    return int(round((v + EXT) * PPM))


gt = np.empty((G, G, 3))
gt[:] = (0.25, 0.25, 0.22)
gt += grain(G, G, 0.012, 12)


def paint(r, col, noise=0.0, coarse=8):
    x0, y0, x1, y1 = (max(0, min(G, px(v))) for v in r)
    if x1 <= x0 or y1 <= y0:
        return
    gt[y0:y1, x0:x1] = col
    if noise:
        gt[y0:y1, x0:x1] += grain(y1 - y0, x1 - x0, noise, coarse)


for r in yards:
    paint(r, (0.15, 0.22, 0.1), 0.035)
    paint((r[0], r[1], r[0] + 0.3, r[3]), (0.5, 0.49, 0.46))
for r, col in ((RESERVED[0], (0.5, 0.49, 0.46)), (RESERVED[1], (0.44, 0.44, 0.45))):
    paint(r, col, 0.02)
paint((-52, -47, -40, -30), (0.16, 0.24, 0.1), 0.03)  # lawn by the Cherry annex

def pavers(r):
    x0, y0, x1, y1 = (max(0, min(G, px(v))) for v in r)
    step = max(2, int(round(0.6 * PPM)))
    gt[y0:y1:step, x0:x1] *= 0.86
    gt[y0:y1, x0:x1:step] *= 0.86


gt *= (0.8 + 0.4 * fbm(G, (4, 8, 16, 32)))[..., None]  # uneven grass and bare earth
for yc, w in EW:
    r = (-EXT, yc - w / 2 - SIDEWALK, EXT, yc + w / 2 + SIDEWALK)
    paint(r, (0.47, 0.46, 0.44), 0.02, 4)
    pavers(r)
for xc, w in NS:
    r = (xc - w / 2 - SIDEWALK, -EXT, xc + w / 2 + SIDEWALK, EXT)
    paint(r, (0.47, 0.46, 0.44), 0.02, 4)
    pavers(r)
for yc, w in EW:  # kerb line, then asphalt
    paint((-EXT, yc - w / 2 - 0.25, EXT, yc + w / 2 + 0.25), (0.6, 0.59, 0.56))
for xc, w in NS:
    paint((xc - w / 2 - 0.25, -EXT, xc + w / 2 + 0.25, EXT), (0.6, 0.59, 0.56))
for yc, w in EW:
    paint((-EXT, yc - w / 2, EXT, yc + w / 2), (0.105, 0.105, 0.115), 0.014, 16)
for xc, w in NS:
    paint((xc - w / 2, -EXT, xc + w / 2, EXT), (0.105, 0.105, 0.115), 0.014, 16)

# worn asphalt: broad tonal drift, resurfaced patches, a few manholes
x0, x1 = px(-EXT), px(EXT)
road_mask = np.zeros((G, G), bool)
for yc, w in EW:
    road_mask[px(yc - w / 2) : px(yc + w / 2), :] = True
for xc, w in NS:
    road_mask[:, px(xc - w / 2) : px(xc + w / 2)] = True
wear = (0.78 + 0.5 * fbm(G, (8, 16, 32, 64)))[..., None]
gt[:] = np.where(road_mask[..., None], gt * wear, gt)
for roads, horizontal in ((EW, True), (NS, False)):
    for c, w in roads:
        for _ in range(16):
            along, across = rng.uniform(-120, 116), rng.uniform(-w / 2 + 0.3, w / 2 - 2.6)
            la, lc = rng.uniform(2.5, 9), rng.uniform(1.4, 2.4)
            r = (along, c + across, along + la, c + across + lc) if horizontal else \
                (c + across, along, c + across + lc, along + la)
            xa, ya, xb, yb = (max(0, min(G, px(v))) for v in r)
            gt[ya:yb, xa:xb] *= rng.uniform(0.72, 1.32)
        for _ in range(5):
            along, across = rng.uniform(-110, 110), rng.uniform(-w / 2 + 1, w / 2 - 1)
            mx, my = (along, c + across) if horizontal else (c + across, along)
            paint((mx - 0.45, my - 0.45, mx + 0.45, my + 0.45), (0.2, 0.2, 0.2))
            paint((mx - 0.33, my - 0.33, mx + 0.33, my + 0.33), (0.07, 0.07, 0.075))

MARK = (0.72, 0.72, 0.68)
for yc, w in EW:
    offs = [0.0] if yc != AVENUE else [-4.2, 4.2]
    for x in range(-126, 126, 7):
        if near_cross(x + 1.5, NS, 9):
            continue
        for o in offs:
            paint((x, yc + o - 0.12, x + 3, yc + o + 0.12), MARK)
    if yc == AVENUE:  # planted median
        for x0, x1 in [(a + NS[i][1] / 2 + 8, NS[i + 1][0] - NS[i + 1][1] / 2 - 8)
                       for i, (a, _) in enumerate(NS[:-1])] + [(-EXT, NS[0][0] - 12)]:
            paint((x0, yc - 0.9, x1, yc + 0.9), (0.6, 0.59, 0.56))
            paint((x0 + 0.25, yc - 0.65, x1 - 0.25, yc + 0.65), (0.14, 0.2, 0.09), 0.03)
for xc, w in NS:
    for y in range(-126, 126, 7):
        if not near_cross(y + 1.5, EW, 9):
            paint((xc - 0.12, y, xc + 0.12, y + 3), MARK)
for xc, wx in NS:  # zebra crossings
    for yc, wy in EW:
        for s in (-1, 1):
            xa = xc + s * (wx / 2 + 3.5)
            k = yc - wy / 2 + 0.6
            while k < yc + wy / 2 - 0.8:
                paint((xa - 1.5, k, xa + 1.5, k + 0.5), MARK)
                k += 1.1
            ya = yc + s * (wy / 2 + 3.5)
            k = xc - wx / 2 + 0.6
            while k < xc + wx / 2 - 0.8:
                paint((k, ya - 1.5, k + 0.5, ya + 1.5), MARK)
                k += 1.1
ground_img = save_img("ground_albedo", gt)
GROUND = mat("ground", tex=ground_img, rough=0.9)

# ───────────────────────── surroundings ─────────────────────────

city = Mesh("city")


def roof_clutter(m, r, z, units):
    x0, y0, x1, y1 = r
    for i in range(units):
        cx = x0 + (i + 0.5) * (x1 - x0) / units
        t = rng.random()
        if t < 0.5:
            cy = rng.uniform(y0 + 2, y1 - 2)
            m.box((cx - 0.7, cy - 0.7, cx + 0.7, cy + 0.7), z, z + 1.4, METAL)
            m.cyl(cx, cy, z + 1.4, z + 2.9, 0.68, rng.choice(TANK))
        elif t < 0.75:
            cy = rng.uniform(y0 + 3, y1 - 3)
            m.box((cx - 1.3, cy - 1.6, cx + 1.3, cy + 1.6), z, z + 2.5, TRIM, top=ROOF)
        if rng.random() < 0.5:
            ax, ay = cx + rng.uniform(-1.2, 0.4), rng.uniform(y0 + 1, y1 - 1.8)
            m.box((ax, ay, ax + 0.9, ay + 0.4), z, z + 0.7, TRIM)


for b in buildings:
    r = b["r"]
    f, fl = b["facing"], b["floors"]
    back = "".join(k for k in "SNEW" if k != f)
    if b["kind"] in ("ruko", "tower"):
        m = RUKO[b["style"]] if b["kind"] == "ruko" else TOWER[b["style"]]
        H = 4.0 + (fl - 1) * 3.6
        city.band(r, 0, 4.0, SHOP, su=18.0, sv=4.0, ou=rng.randrange(4) / 4, sides=f)
        city.band(r, 0, 4.0, CONCRETE, sides=back)
        city.band(r, 4.0, H, m, su=9.0, sv=14.4, ou=rng.randrange(4) / 4, ov=rng.randrange(4) / 4)
        city.band(r, H, H + 0.8, TRIM)
        city.flat_roof(r, H, ph=0.8)
        yf = r[1] if f == "S" else r[3]
        s = -1 if f == "S" else 1
        aw = (r[0], min(yf, yf + s * 1.3), r[2], max(yf, yf + s * 1.3))
        city.box(aw, 3.85, 4.05, TRIM, bottom=True)
        if b["kind"] == "ruko":
            roof_clutter(city, r, H, b["units"])
            for i in range(1, b["units"]):  # party-wall fins between units
                x = r[0] + i * 4.5
                city.box((x - 0.12, min(yf, yf + s * 0.25), x + 0.12, max(yf, yf + s * 0.25)), 4.05, H + 0.8, TRIM)
        else:
            cx, cy = (r[0] + r[2]) / 2, (r[1] + r[3]) / 2
            city.box((cx - 3, cy - 2.5, cx + 3, cy + 2.5), H, H + 3.2, TRIM, top=ROOF)
            city.cyl(cx - 4.6, cy, H + 0.2, H + 2.4, 1.0, TANK[1], seg=10)
            city.box((cx + 3.6, cy - 1, cx + 5.2, cy + 1), H, H + 1.2, METAL)
    else:
        m = HOUSE[b["style"]]
        H = fl * 3.2
        city.band(r, 0, H, m, su=12.0, sv=12.8, ou=rng.randrange(4) / 4, ov=rng.randrange(4) / 4)
        e = 0.7
        city.hip((r[0] - e, r[1] - e, r[2] + e, r[3] + e), H - 0.05, rng.uniform(1.9, 2.6), rng.choice(TILE))
        lot = b["lot"]
        yf = lot[1] if f == "S" else lot[3]
        s = 1 if f == "S" else -1
        wall = (lot[0] + 0.2, min(yf, yf + s * 0.2), lot[2] - 3.4, max(yf, yf + s * 0.2))
        city.box(wall, 0, 1.5, TRIM)
        cp = (r[2] - 3.2, min(yf + s * 0.8, yf + s * 4.4), r[2], max(yf + s * 0.8, yf + s * 4.4))
        city.box(cp, 2.5, 2.65, TRIM, bottom=True)

for x, y in trees:
    city.tree(x, y)


def car(m, x, y, rot, paint_mat, lights=0):
    w, l = 1.75, 4.2
    hx, hy = (l / 2, w / 2) if rot == 0 else (w / 2, l / 2)
    m.box((x - hx, y - hy, x + hx, y + hy), 0.3, 0.95, paint_mat)
    cx, cy = (hx * 0.52, hy * 0.86) if rot == 0 else (hx * 0.86, hy * 0.52)
    m.box((x - cx, y - cy, x + cx, y + cy), 0.95, 1.45, CARGLASS, top=paint_mat)
    if lights:
        for mt, d in ((HEAD, lights), (TAIL, -lights)):
            if rot == 0:
                m.box((x + d * hx - 0.04, y - hy + 0.15, x + d * hx + 0.04, y + hy - 0.15), 0.6, 0.82, mt)
            else:
                m.box((x - hx + 0.15, y + d * hy - 0.04, x + hx - 0.15, y + d * hy + 0.04), 0.6, 0.82, mt)


for x, y, rot in cars:
    car(city, x, y, rot, rng.choice(CAR))
for x, y, rot, d in moving:
    car(city, x, y, rot, rng.choice(CAR), lights=d)

light_points = []  # (x, y, z, watts, colour, radius)
for x, y, dx, dy in lamps:
    city.cyl(x, y, 0, 8.0, 0.11, METAL, seg=5, cap=False)
    ax, ay = x + dx * 2.2, y + dy * 2.2
    city.box((min(x, ax) - 0.06, min(y, ay) - 0.06, max(x, ax) + 0.06, max(y, ay) + 0.06), 7.9, 8.02, METAL)
    city.box((ax - 0.35, ay - 0.35, ax + 0.35, ay + 0.35), 7.74, 7.9, LAMP, bottom=True)
    light_points.append((ax, ay, 7.4, 1150, (1.0, 0.72, 0.4), 0.25))

# ───────────────────────── the two kosts ─────────────────────────

hero = Mesh("heroes")
pins = {}


def arc(cx, y, half, bulge, n=10):
    """Points from (cx+half, y) round the front (−Y) to (cx−half, y)."""
    return [(cx + half * math.cos(math.pi * i / n), y - bulge * math.sin(math.pi * i / n))
            for i in range(n + 1)][::-1]


def cherry():
    cx, y0 = CHERRY["cx"], CHERRY["y0"]
    FH, FL = 3.6, 4
    H = FH * FL
    body = (cx - 7, y0 + 1.6, cx + 7, y0 + 22)
    hero.band(body, 0, H, CH_WALL, su=7.0, sv=7.2, sides="EW", ou=0.5)
    hero.band(body, 0, H, CH_WALL, su=7.0, sv=7.2, sides="N")
    hero.band(body, 0, H, CH_WALL, su=7.0, sv=7.2, sides="S", ou=0.0)  # lit doors behind the loggia
    for sx in (-1, 1):  # wings either side of the loggia
        wing = (cx + sx * 7 if sx < 0 else cx + 3.5, y0, cx - 3.5 if sx < 0 else cx + 7, y0 + 1.6)
        hero.band(wing, 0, H, CH_WALL, su=7.0, sv=7.2, sides="S", ou=0.5)
        hero.band(wing, 0, H, CH_WHITE, sides="EW")
        for px_ in (wing[0], wing[2] - 0.5):  # pilasters with capitals
            hero.box((px_, y0 - 0.25, px_ + 0.5, y0), 0.6, H - 0.7, CH_WHITE)
            hero.box((px_ - 0.12, y0 - 0.4, px_ + 0.62, y0), H - 0.7, H - 0.1, CH_WHITE, bottom=True)
            hero.box((px_ - 0.12, y0 - 0.4, px_ + 0.62, y0), 0, 0.6, CH_WHITE)
    # floor bands and cornice
    for k in range(1, FL):
        z = k * FH
        hero.box((cx - 7.12, y0 - 0.12, cx + 7.12, y0 + 22.12), z - 0.24, z - 0.03, CH_WHITE, bottom=True)
    hero.box((cx - 7.5, y0 - 0.5, cx + 7.5, y0 + 22.5), H - 0.1, H + 0.3, CH_WHITE, bottom=True)
    full = (cx - 7, y0, cx + 7, y0 + 22)
    hero.band(full, H + 0.35, H + 1.3, CH_WHITE)
    hero.flat_roof(full, H + 0.35, ph=0.95, par=CH_WHITE)
    # curved balconies with balustrades, and the curved crown
    for k in range(0, FL + 1):
        z = k * FH
        pts = arc(cx, y0, 3.5, 1.9) + [(cx + 3.5, y0 + 1.6), (cx - 3.5, y0 + 1.6)]
        if k > 0:
            hero.prism(pts, z - 0.35, z, CH_WHITE, bottom=True)
        if k == 0:
            hero.prism(pts, 0, 0.3, CH_WHITE)
        outer, inner = arc(cx, y0, 3.5, 1.9), arc(cx, y0, 3.3, 1.72)
        ring = outer + inner[::-1]
        zr = z if k else 0.3
        if k == FL:
            zr = H + 0.35
            hero.prism(pts, H, H + 0.33, CH_WHITE)
        hero.prism(ring, zr, zr + 0.95, BALUSTER, su=0.45, sv=0.95)
        if k < FL:  # warm ceiling of each loggia
            hero.face([(cx - 3.4, y0 + 0.1, z + FH - 0.37), (cx - 3.4, y0 + 1.55, z + FH - 0.37),
                       (cx + 3.4, y0 + 1.55, z + FH - 0.37), (cx + 3.4, y0 + 0.1, z + FH - 0.37)], CH_GLOW)
            light_points.append((cx, y0 + 0.3, z + FH - 0.9, 190, (1.0, 0.78, 0.5), 0.4))
    # single-storey annex with a balustrade, glazed pavilion beyond
    ann = (cx - 15, y0 - 2.5, cx - 7, y0 + 7)
    hero.band(ann, 0, 4.4, CH_WHITE)
    hero.box((ann[0] - 0.3, ann[1] - 0.3, ann[2], ann[3] + 0.3), 4.4, 4.72, CH_WHITE, bottom=True)
    hero.flat_roof(ann, 4.75, ph=0.1, par=CH_WHITE)
    edge = [(ann[0], ann[3]), (ann[0], ann[1]), (ann[2], ann[1]),
            (ann[2], ann[1] + 0.18), (ann[0] + 0.18, ann[1] + 0.18), (ann[0] + 0.18, ann[3])]
    hero.prism(edge, 4.75, 5.7, BALUSTER, su=0.45, sv=0.95)
    for ox in (1.2, 4.6):
        hero.box((ann[0] + ox, ann[1] - 0.06, ann[0] + ox + 1.9, ann[1]), 0.4, 3.4, GLASS)
    pav = (cx - 46 + 28.5, y0 - 1, cx - 16.2, y0 + 8)
    hero.box(pav, 0, 3.6, GLASS, top=CH_WHITE)
    hero.box((pav[0] - 0.3, pav[1] - 0.3, pav[2] + 0.3, pav[3] + 0.3), 3.6, 3.85, CH_WHITE, bottom=True)
    light_points.append(((pav[0] + pav[2]) / 2, pav[1] - 1.5, 2.5, 120, (1.0, 0.82, 0.6), 0.5))
    # front wall, gate, hedges, cypress
    yw = y0 - 5.5
    hero.box((cx - 6.6, yw, cx - 4.2, yw + 0.35), 0, 3.0, CH_WHITE)
    hero.box((cx - 4.2, yw + 0.1, cx + 2.6, yw + 0.25), 0.1, 2.8, TRIM)
    hero.box((cx + 2.6, yw, cx + 9, yw + 0.35), 0, 3.0, CH_WHITE)
    hero.box((cx + 9, yw, cx + 9.35, y0 + 22), 0, 2.4, CH_WHITE)
    hero.box((cx - 6.6, yw, cx - 6.25, y0 - 2.5), 0, 3.0, CH_WHITE)
    for i in range(4):
        hero.blob(cx + 10.6, y0 - 3 + i * 2.6, 3.0, 0.9, 0.9, 3.1, LEAF[0], jitter=0.1)
    hero.box((cx + 10, y0 - 5.2, cx + 11.4, y0 + 8), 0, 0.9, LEAF[1])
    for x in (-19.5, -13.2):
        hero.tree(cx + x, y0 - 5.2, 7.5)
    hero.box((cx - 24, y0 - 6.2, cx - 9, y0 - 5.2), 0, 0.8, LEAF[1])
    # roof: stair house and antenna
    hero.box((cx + 1.5, y0 + 13, cx + 6, y0 + 19), H + 0.35, H + 3.1, CH_WHITE, top=ROOF)
    hero.cyl(cx - 3, y0 + 9, H + 0.35, H + 5.4, 0.05, METAL, seg=4)
    for zz, half in ((H + 5.0, 0.9), (H + 4.5, 0.6)):
        hero.box((cx - 3 - half, y0 + 8.97, cx - 3 + half, y0 + 9.03), zz, zz + 0.05, METAL)
    # wall-washers on the facade
    for sx in (-5.2, 5.2):
        light_points.append((cx + sx, y0 - 1.6, 0.6, 260, (1.0, 0.8, 0.55), 0.3))
    light_points.append((cx + 7.9, y0 + 8, 0.6, 160, (1.0, 0.8, 0.55), 0.3))
    pins["pin_cherry"] = (cx, y0 + 6, H + 1.3)


def sky():
    cx, y0 = SKY["cx"], SKY["y0"]
    FH = 3.5
    H = FH * 3
    body = (cx - 10, y0 + 1.4, cx + 10, y0 + 18)
    hero.band(body, 0, H, SK_WALL, su=6.66, sv=7.0, ou=0.25)
    hero.band(body, H, H + 1.0, SK_GREY)
    hero.flat_roof(body, H, ph=1.0, par=SK_GREY)
    TOP = H + 2.3
    for sx in (-1, 1):  # the two piers of the big frame
        pier = (cx - 10 if sx < 0 else cx + 5.6, y0, cx - 5.6 if sx < 0 else cx + 10, y0 + 1.4)
        hero.box(pier, 0, TOP - 0.98, SK_GREY)
        px0 = pier[0] + (1.5 if sx < 0 else 0.6)
        hero.box((px0, y0 - 0.08, px0 + 1.7, y0), FH * (2 if sx < 0 else 1) + 0.4,
                 FH * (2 if sx < 0 else 1) + 3.2, SK_STONE)
        for k in (1, 2):  # small side balconies
            if (sx < 0) == (k == 2) and k == 2:
                continue
            z = k * FH
            bx0 = pier[0] + (0.2 if sx < 0 else 2.2)
            hero.box((bx0, y0 - 0.9, bx0 + 2.0, y0), z - 0.2, z, SK_GREY, bottom=True)
            hero.box((bx0, y0 - 0.9, bx0 + 2.0, y0 - 0.84), z + 0.95, z + 1.0, SK_DARK)
            for i in range(5):
                hero.box((bx0 + i * 0.49, y0 - 0.9, bx0 + i * 0.49 + 0.04, y0 - 0.86), z, z + 0.95, SK_DARK)
            for i in range(4):
                ln = rng.uniform(1.0, 2.0)
                hero.box((bx0 + i * 0.5, y0 - 0.98, bx0 + i * 0.5 + 0.46, y0 - 0.9), z - ln, z + 0.1, VINE)
    hero.box((cx - 10, y0, cx + 10, y0 + 1.4), TOP - 1.0, TOP, SK_GREY, bottom=True)
    hero.box((cx - 5.6, y0 + 0.5, cx + 5.6, y0 + 0.56), TOP, TOP + 0.9, SK_DARK)  # roof-terrace rail
    hero.box((cx + 5.2, y0 + 4, cx + 9.5, y0 + 9), H, H + 2.6, SK_GREY, top=ROOF)
    # long balconies with rails and hanging plants
    for k in (1, 2):
        z = k * FH
        hero.box((cx - 5.6, y0 - 0.3, cx + 5.6, y0 + 1.4), z - 0.25, z, SK_GREY, bottom=True)
        hero.box((cx - 5.6, y0 - 0.3, cx + 5.6, y0 - 0.24), z + 0.95, z + 1.0, SK_DARK)
        for i in range(24):
            x = cx - 5.6 + i * (11.2 / 23) - 0.02
            hero.box((x, y0 - 0.3, x + 0.04, y0 - 0.26), z, z + 0.95, SK_DARK)
        light_points.append((cx, y0 + 0.5, z - 0.7, 110, (1.0, 0.82, 0.58), 0.4))
        if k == 2:
            for i in range(20):
                ln = rng.uniform(1.1, 2.3)
                x = cx - 5 + i * 0.5
                hero.box((x, y0 - 0.4, x + 0.46, y0 - 0.3), z - ln, z + 0.15, VINE)
    for i in range(26):  # vines from the top beam
        if 8 < i < 12:
            continue
        ln = rng.uniform(0.9, 2.0)
        x = cx - 6 + i * 0.5
        hero.box((x, y0 - 0.1, x + 0.46, y0), TOP - 0.9 - ln, TOP - 0.7, VINE)
    # central recess: darker stair core and canopy with the lit name band
    hero.box((cx - 2.4, y0 + 1.1, cx + 2.4, y0 + 1.4), FH, H, SK_DARK)
    hero.box((cx - 10, y0 - 0.9, cx + 10, y0 + 1.4), FH - 0.75, FH - 0.25, SK_GREY, bottom=True)
    hero.box((cx - 2.3, y0 - 0.96, cx + 2.3, y0 - 0.9), FH - 0.66, FH - 0.34, SK_SIGN)
    hero.box((cx - 1.8, y0 + 1.3, cx + 1.8, y0 + 1.4), 0, FH - 0.75, SK_DARK)
    light_points.append((cx, y0 - 0.2, FH - 1.3, 140, (1.0, 0.84, 0.62), 0.4))
    # street wall: pillars, stone base, wood gate, dark screens, planting
    yw = y0 - 4.5
    for a, b_, kind in ((-12, -2.2, "wall"), (-2.2, 2.2, "gate"), (2.2, 12, "wall")):
        if kind == "gate":
            hero.box((cx + a, yw + 0.1, cx + b_, yw + 0.22), 0.05, 2.0, WOOD)
            hero.box((cx + a, yw + 0.1, cx + b_, yw + 0.22), 2.0, 2.9, SK_DARK)
            continue
        hero.box((cx + a, yw + 0.08, cx + b_, yw + 0.3), 0, 1.5, SK_STONE)
        hero.box((cx + a, yw + 0.12, cx + b_, yw + 0.2), 1.5, 2.6, SK_DARK)
        for p in (a, (a + b_) / 2 - 0.6, b_ - 1.2):
            hero.box((cx + p, yw, cx + p + 1.2, yw + 0.4), 0, 2.9, SK_GREY)
        hero.box((cx + a, yw - 0.9, cx + b_, yw), 0, 0.35, SK_GREY, top=LEAF[1])
        for i in range(3):
            hero.blob(cx + a + 1.8 + i * 3.2, yw - 0.45, 1.0, 0.35, 0.35, 0.8, LEAF[0], jitter=0.12, sub=1)
    hero.box((cx - 13.2, yw, cx - 12, y0 + 6), 0, 3.6, mat("sky_side_a", (0.78, 0.7, 0.58)))
    hero.box((cx + 12, yw, cx + 13.2, y0 + 6), 0, 3.6, mat("sky_side_b", (0.36, 0.44, 0.56)))
    for sx in (-7.5, 7.5):
        light_points.append((cx + sx, y0 - 2.2, 0.5, 170, (1.0, 0.84, 0.62), 0.3))
    pins["pin_sky"] = (cx, y0 + 6, TOP + 0.9)


cherry()
sky()

# ───────────────────────── scene ─────────────────────────

city_ob = city.finish()
hero_ob = hero.finish()

gm = bpy.data.meshes.new("ground")
gb = bmesh.new()
guv = gb.loops.layers.uv.new("uv")
gf = gb.faces.new([gb.verts.new(p) for p in ((-EXT, -EXT, 0), (EXT, -EXT, 0), (EXT, EXT, 0), (-EXT, EXT, 0))])
for loop, uv in zip(gf.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
    loop[guv].uv = uv
gb.to_mesh(gm)
gb.free()
gm.materials.append(GROUND)
ground_ob = bpy.data.objects.new("ground", gm)
scene.collection.objects.link(ground_ob)

world = bpy.data.worlds.new("dusk")
world.use_nodes = True
bg = next(n for n in world.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.1, 0.17, 0.42, 1)
bg.inputs["Strength"].default_value = 0.26
scene.world = world

sun = bpy.data.lights.new("afterglow", "SUN")
sun.energy = 0.42
sun.color = (1.0, 0.56, 0.36)
sun.angle = math.radians(22)
sun_ob = bpy.data.objects.new("afterglow", sun)
sun_ob.rotation_euler = (math.radians(74), 0, math.radians(52))  # low, from the south-west
scene.collection.objects.link(sun_ob)

for i, (x, y, z, watts, col, rad) in enumerate(light_points):
    ld = bpy.data.lights.new(f"pt{i}", "POINT")
    ld.energy = watts
    ld.color = col
    ld.shadow_soft_size = rad
    lo = bpy.data.objects.new(f"pt{i}", ld)
    lo.location = (x, y, z)
    scene.collection.objects.link(lo)

scene.render.engine = "CYCLES"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.sample_clamp_direct = 6.0
scene.cycles.sample_clamp_indirect = 1.5
if arg("--gpu", flag=True):  # off by default: Metal can stall when Blender runs headless
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"

tris = sum(len(p.vertices) - 2 for o in (city_ob, hero_ob) for p in o.data.polygons)
print(f"MAP buildings={len(buildings)} trees={len(trees)} lamps={len(lamps)} tris={tris}", flush=True)

# The page's camera (MapCanvas.tsx CAMERA), in plan metres: used for the poster.
CAM_POS = Vector((0, -8.0 / SCALE, 6.6 / SCALE))
CAM_TARGET = Vector((0, -0.3 / SCALE, 0))


def render_still(path, samples, width=1200, height=900):
    cam = bpy.data.cameras.new("cam")
    cam.sensor_fit = "VERTICAL"
    cam.angle = math.radians(38)
    cam.clip_end = 2000
    co = bpy.data.objects.new("cam", cam)
    co.location = CAM_POS
    co.rotation_euler = (CAM_TARGET - CAM_POS).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(co)
    scene.camera = co
    scene.render.resolution_x, scene.render.resolution_y = width, height
    scene.cycles.samples = samples
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.exposure = POSTER_EXPOSURE
    scene.render.film_transparent = True
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(co)


POSTER_EXPOSURE = 2.6
if PREVIEW:
    render_still(os.path.join(WORK, "preview.png"), 32, 1000, 750)
    sys.exit(0)

# ───────────────────────── bake ─────────────────────────


def select_only(ob):
    for o in scene.objects:
        o.select_set(False)
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob


def unwrap_lightmap(ob):
    lm = ob.data.uv_layers.new(name="lm")
    ob.data.uv_layers.active = lm
    ob.data.uv_layers["uv"].active_render = True
    select_only(ob)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0018)
    bpy.ops.object.mode_set(mode="OBJECT")


def bake(ob, name, size, with_colour, samples):
    scene.cycles.samples = samples
    print("MAP baking", name, size, samples, flush=True)
    img = bpy.data.images.new(name, size, size, alpha=False, float_buffer=True)
    nodes = []
    for m in ob.data.materials:
        n = m.node_tree.nodes.new("ShaderNodeTexImage")
        n.image = img
        m.node_tree.nodes.active = n
        nodes.append((m, n))
    select_only(ob)
    scene.render.bake.margin = 6
    flt = {"DIRECT", "INDIRECT"} | ({"COLOR"} if with_colour else set())
    bpy.ops.object.bake(type="DIFFUSE", pass_filter=flt, use_clear=True)
    px_ = np.empty(size * size * 4, np.float32)
    img.pixels.foreach_get(px_)
    for m, n in nodes:
        m.node_tree.nodes.remove(n)
    bpy.data.images.remove(img)
    a = px_.reshape(size, size, 4)[..., :3].astype(np.float64)
    # Bakes are not denoised: pull stray bright texels back to their surroundings.
    covered = (a.sum(-1, keepdims=True) > 0).astype(np.float64)
    local = blur(a, 2) / np.maximum(blur(covered, 2), 1e-3)
    a = np.minimum(a, local * 1.6 + 0.002)
    if not with_colour:
        a = np.where(covered > 0, 0.5 * a + 0.5 * blur(a, 1) / np.maximum(blur(covered, 1), 1e-3), a)
    return a


unwrap_lightmap(city_ob)
unwrap_lightmap(hero_ob)
ground_ob.data.uv_layers.active = ground_ob.data.uv_layers["uv"]

# The ground is baked as light only, smoothed, then multiplied by its own
# crisp albedo here: road markings stay sharp and the light stays clean.
g = bake(ground_ob, "bake_ground", RES, False, SAMPLES)
g = blur(g, 2)
gl = np.where(gt <= 0.04045, gt / 12.92, np.power((np.clip(gt, 0, 1) + 0.055) / 1.055, 2.4))
g = g * gl
c = bake(city_ob, "bake_city", RES, False, SAMPLES)
h = bake(hero_ob, "bake_heroes", RES // 2, False, SAMPLES * 2)

print("MAP rendering poster", flush=True)
render_still(os.path.join(OUT, "poster.png"), max(32, SAMPLES), 1600, 1200)

# One exposure for all three so they agree on the page.
lum = g @ np.array([0.2126, 0.7152, 0.0722])
E = 0.5 / float(np.percentile(lum, 99.0))
print("MAP exposure", E)


def encode(a, k):
    a = np.clip(a * k, 0, 1)
    return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(a, 1 / 2.4) - 0.055)


LM_HEADROOM = 0.5  # light maps store light × 0.5; the page multiplies it back
for name, a, k in (("ground", g, E), ("city-lm", c, E * LM_HEADROOM), ("heroes-lm", h, E * LM_HEADROOM)):
    img = save_img(name, encode(a, k))
    os.replace(os.path.join(WORK, name + ".png"), os.path.join(OUT, name + ".png"))
    bpy.data.images.remove(img)

# ───────────────────────── export ─────────────────────────

ground_ob.data.materials.clear()
ground_ob.data.materials.append(mat("ground_baked", (0.3, 0.3, 0.3)))
for ob in (ground_ob, city_ob, hero_ob):
    ob.data.transform(Matrix.Scale(SCALE, 4))
for name, (x, y, z) in pins.items():
    e = bpy.data.objects.new(name, None)
    e.location = (x * SCALE, y * SCALE, z * SCALE)
    scene.collection.objects.link(e)

for o in scene.objects:
    o.select_set(o.type in ("MESH", "EMPTY"))
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "city.glb"),
    export_format="GLB",
    use_selection=True,
    export_image_format="WEBP",
    export_apply=True,
    export_yup=True,
    export_cameras=False,
    export_lights=False,
    export_meshopt_compression_enable=True,
)
print("MAP done", OUT)
