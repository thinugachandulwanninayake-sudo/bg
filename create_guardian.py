import numpy as np, trimesh, math, os
from trimesh.visual.material import PBRMaterial
scene=trimesh.Scene()
colors={
'chrome':('#b5d6f0',0.88,0.16),'silver':('#e2f4ff',0.96,0.12),'titanium':('#233c61',0.76,0.27),
'navy':('#08172e',0.6,0.22),'glass':('#1267b5',0.34,0.16),'cyan':('#00cfff',0.18,0.4),
'violet':('#766bff',0.24,0.4),'black':('#030a15',0.5,0.3)}
def material(key):
    col,met,rough=colors[key]; rgb=tuple(int(col[i:i+2],16)/255 for i in (1,3,5))
    emissive=(0.0,0.0,0.0)
    if key=='cyan': emissive=(0.0,0.52,0.95)
    if key=='violet': emissive=(0.16,0.08,0.65)
    return PBRMaterial(name=key,baseColorFactor=(*rgb,1),metallicFactor=met,roughnessFactor=rough,emissiveFactor=emissive,doubleSided=True)
mats={k:material(k) for k in colors}
count=0
def add(mesh,key,name,parent='world',pos=(0,0,0),rotation=None):
    global count
    count+=1
    mesh.visual=trimesh.visual.TextureVisuals(material=mats[key]); M=np.eye(4); M[:3,3]=pos
    if rotation is not None: M[:3,:3]=rotation
    scene.add_geometry(mesh,node_name=f'{name}_{count}',geom_name=f'{name}_geo_{count}',parent_node_name=parent,transform=M)
def ball(key,name,pos,scale,parent='world',sub=2):
    mesh=trimesh.creation.icosphere(subdivisions=sub,radius=1); mesh.apply_scale(scale); add(mesh,key,name,parent,pos)
def tube(key,name,a,b,r,sections=12,parent='world'):
    a=np.array(a);b=np.array(b);d=b-a;length=np.linalg.norm(d)
    if length<1e-4:return
    mesh=trimesh.creation.cylinder(radius=r,height=length,sections=sections)
    z=d/length; up=np.array([0.,1.,0.]); x=np.cross(up,z)
    if np.linalg.norm(x)<1e-6:x=np.array([1.,0.,0.])
    x=x/np.linalg.norm(x); y=np.cross(z,x)
    add(mesh,key,name,parent,(a+b)/2,np.column_stack((x,y,z)))
def ring(key,name,center,radius,minor=0.02,parent='world',rotate=None):
    mesh=trimesh.creation.annulus(r_min=radius-minor,r_max=radius+minor,height=minor,sections=48)
    # annulus axis z, face camera
    add(mesh,key,name,parent,center,rotate)
def custom(key,name,points,faces,parent='world'):
    add(trimesh.Trimesh(vertices=points,faces=faces,process=False),key,name,parent)
# plinth and base
for y,r,h,key in [(-2.30,1.30,0.20,'navy'),(-2.19,1.22,0.05,'silver'),(-2.15,1.16,0.045,'cyan'),(-2.10,1.08,0.09,'titanium')]:
    add(trimesh.creation.cylinder(radius=r,height=h,sections=64),key,'base',pos=(0,y,0))
# torso core bust shaped with overlapping armor plates
ball('navy','chest_core',(0,-0.75,-0.07),(1.04,0.92,0.54),sub=3)
ball('titanium','lower_chest',(0,-1.38,0.0),(0.73,0.52,0.46),sub=2)
ball('chrome','sternum',(0,-0.75,0.44),(0.44,0.62,0.18),sub=3)
for s in (-1,1):
    ball('chrome','pectoral_armor',(s*.54,-.72,.33),(.48,.39,.29),sub=3)
    ball('titanium','side_armor',(s*.85,-1.17,.02),(.24,.52,.42),sub=2)
    ball('silver','shoulder_cap',(s*1.09,-.52,-.04),(.49,.35,.49),sub=3)
    ball('navy','shoulder_socket',(s*1.31,-.68,-.03),(.27,.29,.30),sub=2)
    ball('titanium','upper_arm',(s*1.32,-1.05,-.01),(.26,.52,.28),sub=2)
    ball('chrome','arm_plate',(s*1.38,-1.13,.22),(.20,.36,.13),sub=2)
    tube('cyan','shoulder_light',(s*.72,-.51,.56),(s*1.12,-.44,.48),.026)
    tube('cyan','chest_line',(s*.30,-.95,.65),(s*.71,-1.07,.50),.019)
    for j in range(3):
        tube('silver','collar_fins',(s*(.40+j*.10),-.21,.08),(s*(.48+j*.10),.05,.13),.065)
# chest core rings face front
ring('cyan','core_light',(0,-.81,.644),.20,.027)
ring('silver','core_bezel',(0,-.81,.635),.27,.038)
ball('glass','core_lens',(0,-.81,.66),(.16,.16,.055),sub=2)
# neck mechanism
for i in range(6):
    y=.04+i*.105
    add(trimesh.creation.cylinder(radius=.245 if i%2 else .285,height=.055,sections=28),'chrome' if i%2 else 'navy','neck_collar',pos=(0,y,0))
for s in (-1,1):
    tube('silver','neck_piston',(s*.20,.02,.08),(s*.29,.55,.10),.057)
    tube('cyan','neck_cable',(s*.25,.06,.25),(s*.29,.52,.22),.026)
# head: node with transform parent; all head geometry in local coordinates
head_y=.99
scene.graph.update(frame_to='HeadRig',frame_from='world',matrix=trimesh.transformations.translation_matrix((0,head_y,0)))
H='HeadRig'
# helmet central shell and brow
ball('navy','skull',(0,.13,-.03),(.63,.70,.61),H,3)
ball('chrome','helmet_outer',(0,.27,-.16),(.65,.66,.59),H,3)
ball('glass','face_visor',(0,.08,.45),(.50,.52,.19),H,3)
ball('navy','visor_inner',(0,.02,.55),(.43,.42,.12),H,3)
# visor V shaped contours with cyan tracing
for s in (-1,1):
    tube('cyan','visor_brow',(0,.29,.66),(s*.38,.25,.62),.030,parent=H)
    tube('cyan','visor_eye',(s*.07,.10,.677),(s*.36,.08,.63),.042,parent=H)
    tube('silver','visor_cheek',(s*.48,.10,.52),(s*.38,-.34,.50),.063,parent=H)
    ball('chrome','jaw_side',(s*.42,-.34,.32),(.19,.25,.25),H,2)
    ball('titanium','temple',(s*.58,.15,.01),(.18,.31,.31),H,2)
    ball('chrome','ear_housing',(s*.66,.12,.0),(.16,.29,.28),H,3)
    ball('navy','ear_disc',(s*.79,.12,.0),(.05,.20,.20),H,2)
    ball('cyan','ear_core',(s*.83,.12,.0),(.025,.105,.105),H,2)
    tube('cyan','temple_trace',(s*.52,.40,.23),(s*.59,.10,.35),.022,parent=H)
    tube('silver','crown_seam',(s*.12,.83,-.03),(s*.43,.55,.20),.033,parent=H)
    tube('cyan','side_fiber',(s*.55,-.11,.28),(s*.47,-.40,.15),.021,parent=H)
# chin and crest
ball('silver','chin',(0,-.49,.32),(.30,.16,.25),H,3)
tube('cyan','chin_trace',(-.17,-.50,.54),(.17,-.50,.54),.024,parent=H)
ball('chrome','forehead_crest',(0,.66,.33),(.22,.14,.20),H,2)
# rear spine
for i in range(6):
    ball('silver','spinal_disc',(0,-.1-i*.18,-.52),(.18,.065,.11),sub=2)
# accent floating holo arcs around robot, attached world
for i in range(18):
    a=i/18*2*math.pi
    tube('cyan','orbit_segment',(1.77*math.cos(a),.06+0.18*math.sin(a),1.77*math.sin(a)),(1.77*math.cos(a+.10),.06+0.18*math.sin(a+.10),1.77*math.sin(a+.10)),.008,8)
out='/mnt/data/v8build/public/oryqen-guardian-v8.glb'
scene.export(out)
print('exported',out,os.path.getsize(out),'bytes',count,'parts')
