// Campus coordinates are metres on a local grid rotated about 25 degrees from north.
// x runs roughly east, z runs roughly south. Estimated, not surveyed.
export const NORTH_YAW_DEG = 25;

// Footprints that the original floor plan images are fitted onto.
export const FOOT = {
  old: { x0: -5, x1: 57, z0: -38, z1: 6 },
  new: { x0: 0, x1: 44, z0: 52, z1: 90 },
};

const OB_GF_MAP = [717, 55, 1337, 590];
const SMALL_MAP = [431, 33, 803, 353];

// The Old Building plan is rotated 180 degrees so its lobby faces the plaza.
function oldRect([ax, ay, bx, by], [mx0, my0, mx1, my1]) {
  const f = FOOT.old;
  const W = f.x1 - f.x0, D = f.z1 - f.z0;
  const u0 = (ax - mx0) / (mx1 - mx0), u1 = (bx - mx0) / (mx1 - mx0);
  const v0 = (ay - my0) / (my1 - my0), v1 = (by - my0) / (my1 - my0);
  return { x0: f.x0 + (1 - u1) * W, x1: f.x0 + (1 - u0) * W, z0: f.z0 + (1 - v1) * D, z1: f.z0 + (1 - v0) * D };
}

// The New Building plan is rotated so its lobby faces S.V. Rizal St (assumption).
function newRect([ax, ay, bx, by]) {
  const f = FOOT.new;
  const [mx0, my0, mx1, my1] = SMALL_MAP;
  const W = f.x1 - f.x0, D = f.z1 - f.z0;
  const u0 = (ax - mx0) / (mx1 - mx0), u1 = (bx - mx0) / (mx1 - mx0);
  const v0 = (ay - my0) / (my1 - my0), v1 = (by - my0) / (my1 - my0);
  return { x0: f.x0 + (1 - v1) * W, x1: f.x0 + (1 - v0) * W, z0: f.z0 + u0 * D, z1: f.z0 + u1 * D };
}

const obgf = (n, k, r) => ({ n, k, ...oldRect(r, OB_GF_MAP) });
const oblg = (n, k, r) => ({ n, k, ...oldRect(r, SMALL_MAP) });
const nb = (n, k, r) => ({ n, k, ...newRect(r) });

export const FLOORS = {
  ob_gf: {
    name: 'Old Building · Ground Floor', building: 'old', foot: FOOT.old,
    rooms: [
      obgf('Chemistry Lab', 'lab', [743, 65, 845, 165]), obgf('Physics Lab', 'lab', [880, 65, 940, 165]),
      obgf('Coordinators', 'office', [945, 65, 1015, 140]), obgf('RMO / QA', 'office', [1020, 65, 1088, 150]),
      obgf('Faculty Room', 'office', [1092, 68, 1197, 155]), obgf('Faculty Room', 'office', [1092, 158, 1197, 235]),
      obgf('Faculty Room', 'office', [1092, 237, 1197, 370]), obgf('Psychology Lab', 'lab', [1220, 65, 1332, 160]),
      obgf('Admin Staff', 'office', [1220, 165, 1332, 250]), obgf('Testing Room 101', 'class', [1220, 255, 1332, 345]),
      obgf('Bio Chem Lab', 'lab', [720, 170, 845, 280]), obgf('Science Lecture', 'class', [720, 282, 845, 340]),
      obgf('Open Below', 'void', [868, 170, 942, 295]), obgf('DCI Office', 'office', [895, 298, 942, 345]),
      obgf('MIS', 'office', [870, 345, 895, 400]), obgf('Lazaro Hall', 'hall', [968, 222, 1060, 400]),
      obgf('DBE Office', 'office', [738, 397, 805, 450]), obgf('Registrar', 'office', [738, 455, 805, 545]),
      obgf("Cashier's Office", 'office', [832, 405, 950, 467]), obgf('Testing', 'office', [1078, 405, 1110, 465]),
      obgf('Guidance', 'office', [1112, 405, 1167, 465]), obgf('Consultation', 'office', [1170, 405, 1225, 465]),
      obgf('Lobby', 'lobby', [980, 440, 1065, 555]), obgf('Dental Clinic', 'office', [858, 497, 950, 580]),
      obgf('Health', 'office', [832, 497, 857, 580]), obgf('Security', 'office', [952, 497, 978, 580]),
      obgf('VPS', 'office', [1065, 497, 1145, 580]), obgf('President', 'office', [1148, 497, 1238, 580]),
      obgf('Speech Lab', 'lab', [1240, 467, 1302, 580]),
    ],
  },
  ob_lg: {
    name: 'Old Building · Lower Ground', building: 'old', foot: FOOT.old,
    rooms: [
      oblg('LG 004', 'class', [460, 37, 528, 92]), oblg('LG 003', 'class', [460, 93, 528, 150]),
      oblg('LG 002', 'class', [460, 150, 528, 205]), oblg('LG 005', 'class', [540, 37, 582, 97]),
      oblg('LG 006', 'class', [590, 37, 628, 82]), oblg('LG 007', 'class', [630, 37, 668, 82]),
      oblg('Simulation Room', 'lab', [597, 95, 668, 135]), oblg('Socios / Sentinel', 'office', [597, 135, 635, 232]),
      oblg('OSA', 'office', [635, 152, 668, 205]), oblg('BFP (no access)', 'closed', [670, 73, 800, 190]),
      oblg('Gazebo', 'garden', [542, 100, 582, 190]), oblg('Alumni', 'office', [542, 205, 582, 250]),
      oblg('Canteen', 'hall', [430, 150, 458, 235]), oblg('Storage', 'closed', [475, 237, 520, 300]),
      oblg('LG 101', 'class', [532, 250, 582, 300]), oblg('Student Center', 'hall', [595, 300, 690, 335]),
      oblg('PE Room', 'hall', [672, 250, 770, 283]), oblg('Police (no access)', 'closed', [475, 300, 520, 350]),
      oblg('Storage', 'closed', [535, 300, 582, 352]), oblg('Police (no access)', 'closed', [692, 300, 780, 352]),
    ],
  },
  nb_1: {
    name: 'New Building · 1st Floor', building: 'new', foot: FOOT.new,
    rooms: [
      nb('Computer Lab 5', 'comlab', [437, 37, 558, 92]), nb('Computer Lab 4', 'comlab', [565, 37, 688, 92]),
      nb('Computer Lab 3', 'comlab', [692, 37, 800, 92]), nb('Computer Lab 2', 'comlab', [692, 110, 800, 165]),
      nb('Computer Lab 1', 'comlab', [692, 225, 800, 283]), nb('Lobby', 'lobby', [437, 287, 565, 350]),
      nb('Guard Post', 'office', [568, 287, 688, 350]), nb('Chipeco Academy', 'class', [692, 287, 800, 350]),
      nb('Calamba Manpower', 'closed', [465, 170, 650, 280]),
    ],
  },
  nb_2: {
    name: 'New Building · 2nd Floor', building: 'new', foot: FOOT.new,
    rooms: [
      nb('CCC Library', 'library', [431, 37, 688, 92]), nb('Room 201', 'class', [692, 105, 800, 165]),
      nb('Room 202', 'class', [692, 225, 800, 283]), nb('Room 203', 'class', [692, 293, 800, 350]),
      nb('Room 204', 'class', [566, 293, 690, 350]), nb('Room 205', 'class', [437, 293, 563, 350]),
      nb('Calamba Manpower', 'closed', [465, 170, 650, 280]),
    ],
  },
  nb_3: {
    name: 'New Building · 3rd Floor', building: 'new', foot: FOOT.new,
    rooms: [
      nb('Audio Visual Room', 'hall', [431, 37, 688, 92]), nb('Room 301', 'class', [692, 37, 800, 92]),
      nb('Room 302', 'class', [692, 105, 800, 165]), nb('Room 303', 'class', [692, 225, 800, 283]),
      nb('Room 304', 'class', [692, 293, 800, 350]), nb('Room 305', 'class', [566, 293, 690, 350]),
      nb('Room 306', 'class', [437, 293, 563, 350]), nb('Calamba Manpower', 'closed', [465, 170, 650, 280]),
    ],
  },
};

const centre = (floor, name) => {
  const r = FLOORS[floor].rooms.find((room) => room.n === name);
  return [(r.x0 + r.x1) / 2, 1.2, (r.z0 + r.z1) / 2];
};

// Panel text comes from the original tour, lightly trimmed and with typos corrected.
export const LOCATIONS = [
  {
    id: 'flagpole', name: 'Flagpole Plaza', kind: 'Rizal Plaza', floor: null, pos: [34, 2, -105], pano: 'panos/flagpole.jpg',
    text: ['The first stop of the original tour. The plaza leads past the Rizal Monument to the front of the college, which was once the Old City Hall of Calamba.'],
    quiz: { q: 'What was the Old Building before it became CCC?', options: ['A market', 'The Old City Hall', 'A hospital'], answer: 1 },
  },
  {
    id: 'monument', name: 'Rizal Monument', kind: 'Rizal Plaza', floor: null, pos: [34, 5, -74], pano: 'panos/monument.jpg',
    text: ['Dr. José Rizal, the national hero of the Philippines, was born in 1861 in the town of Calamba in Laguna province. This statue was built to honor and commemorate the things that our hero made for this country.'],
    quiz: { q: 'In what year was José Rizal born?', options: ['1861', '1896', '1919'], answer: 0 },
  },
  {
    id: 'entrance', name: 'Main Entrance', kind: 'Old Building', floor: null, pos: [24, 7.2, -53], pano: 'panos/entrance.jpg',
    text: ['The City College of Calamba was founded in 2006 during the administration of Calamba City Mayor Joaquin M. Chipeco, Jr. The Old City Hall was renovated to become CCC, and it was inaugurated on June 19, 2006, coinciding with the 145th birth anniversary of Dr. Jose Rizal.'],
    quiz: { q: 'In what year was CCC founded?', options: ['2001', '2006', '2016'], answer: 1 },
  },
  {
    id: 'lobby', name: 'Old Building Lobby', kind: 'Old Building · Ground Floor', floor: 'ob_gf', pos: centre('ob_gf', 'Lobby'), walkPos: [24, -30], pano: 'panos/lobby.jpg',
    text: ['The City College of Calamba envisions itself as an accredited premier academic institution in the region providing quality learning opportunities to financially-challenged but deserving students.'],
    quiz: { q: "CCC's mission is guided by the ideals of which national hero?", options: ['Andres Bonifacio', 'Dr. Jose Rizal', 'Apolinario Mabini'], answer: 1 },
  },
  {
    id: 'lazaro', name: 'Roman Lazaro Hall', kind: 'Old Building · Ground Floor', floor: 'ob_gf', pos: centre('ob_gf', 'Lazaro Hall'), walkPos: [24, -17], pano: 'panos/lazaro.jpg',
    text: ['This is where most events happen inside the institution: awardings, orientation for new students, Christmas parties, general assemblies and many more. It is named after Roman Lazaro, who served as municipal president of Calamba for three terms.'],
    quiz: { q: 'How many terms did Roman Lazaro serve as municipal president?', options: ['Two', 'Three', 'Four'], answer: 1 },
  },
  {
    id: 'cashier', name: "Cashier's Office", kind: 'Old Building · Ground Floor', floor: 'ob_gf', pos: centre('ob_gf', "Cashier's Office"), pano: 'panos/cashier.jpg',
    text: ['The Cashier provides customer service to the College community while performing duties in the areas of cash handling and accounting. This is where students go to pay for specific documents.'],
    quiz: { q: 'Why would a student visit the Cashier?', options: ['To borrow books', 'To pay for documents', 'To join a club'], answer: 1 },
  },
  {
    id: 'gazebo', name: 'Gazebo', kind: 'Old Building · Lower Ground', floor: 'ob_lg', pos: centre('ob_lg', 'Gazebo'), pano: 'panos/gazebo.jpg',
    text: ['Welcome to the most peaceful location inside the institution! It offers an open view of the surrounding area and is a place where students can relax and study.'],
    quiz: { q: 'What can students do at the Gazebo?', options: ['Pay fees', 'Relax and study', 'Take exams'], answer: 1 },
  },
  {
    id: 'aquarium', name: 'Aquarium', kind: 'Old Building · Lower Ground', floor: 'ob_lg', pos: [26, 1.2, 1.5], pano: 'panos/aquarium.jpg',
    text: ['A stop along the lower ground hallways in the original tour. The original has no written panel for this spot, and its position on this model is a placeholder until it is checked on site.'],
  },
  {
    id: 'nb-lobby', name: 'New Building Lobby', kind: 'New Building · 1st Floor', floor: 'nb_1', pos: centre('nb_1', 'Lobby'), pano: 'panos/nb-lobby.jpg',
    text: ['Welcome to City College of Calamba, please enjoy your virtual tour. This is the guard post area, where you can ask about your concerns. Feel free to ask anything so that the guard can assist you with your needs.'],
    quiz: { q: 'Who can help you with questions at this entrance?', options: ['The guard', 'The librarian', 'The cashier'], answer: 0 },
  },
  {
    id: 'comlab', name: 'Computer Laboratory', kind: 'New Building · 1st Floor', floor: 'nb_1', pos: centre('nb_1', 'Computer Lab 1'), pano: 'panos/comlab.jpg',
    text: ['The computer lab serves as the center for teaching computer use to whole classes. Teachers also use the lab for research or for creating technology-based projects. It is very significant especially for Computer Science students.'],
    quiz: { q: 'Which students especially benefit from this lab, according to the panel?', options: ['Computer Science', 'Accountancy', 'Education'], answer: 0 },
  },
  {
    id: 'library', name: 'CCC Library', kind: 'New Building · 2nd Floor', floor: 'nb_2', pos: centre('nb_2', 'CCC Library'), pano: 'panos/library.jpg',
    text: ['The library serves the reading, research, and information literacy needs of students. Students can borrow books by submitting their Library Card. There are also book-binded theses and capstone projects here that can be used for new research papers.'],
    quiz: { q: 'What do you need to submit to borrow a book?', options: ['A school ID photo', 'Your Library Card', 'A cash deposit'], answer: 1 },
  },
  {
    id: 'avr', name: 'Audio Visual Room', kind: 'New Building · 3rd Floor', floor: 'nb_3', pos: centre('nb_3', 'Audio Visual Room'), pano: 'panos/avr.jpg',
    text: ['The audio-visual room is a place where students of all classes experience learning in an effective way. It appeals to the senses and helps learners retain concepts. This is where seminars take place.'],
    quiz: { q: 'What usually takes place in the AVR?', options: ['Seminars', 'Sports', 'Lunch'], answer: 0 },
  },
];

export const BADGES = [
  { id: 'first', name: 'First Step', icon: '👣', test: (s) => s.stamps.length >= 1 },
  { id: 'old', name: 'Old Building Explorer', icon: '🏛️', test: (s) => ['entrance', 'lobby', 'lazaro', 'cashier', 'gazebo', 'aquarium'].every((i) => s.stamps.includes(i)) },
  { id: 'new', name: 'New Building Explorer', icon: '🏫', test: (s) => ['nb-lobby', 'comlab', 'library', 'avr'].every((i) => s.stamps.includes(i)) },
  { id: 'scholar', name: 'Scholar', icon: '🎓', test: (s) => s.quiz.length >= 6 },
  { id: 'guide', name: 'Campus Guide', icon: '⭐', test: (s) => s.stamps.length === LOCATIONS.length },
];

export const RANKS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

export const VIEWS = [
  { id: 'overview', name: 'Campus overview', cam: [-118, 128, -112], target: [26, 0, -12] },
  { id: 'plaza', name: 'Rizal Plaza', cam: [-30, 38, -136], target: [28, 2, -78] },
  { id: 'ob_lg', name: 'Old Building · Lower Ground', floor: 'ob_lg', cam: [26, 88, 40], target: [26, 0, -16] },
  { id: 'ob_gf', name: 'Old Building · Ground Floor', floor: 'ob_gf', cam: [26, 88, 40], target: [26, 0, -16] },
  { id: 'nb_1', name: 'New Building · 1st Floor', floor: 'nb_1', cam: [22, 58, 124], target: [22, 0, 72] },
  { id: 'nb_2', name: 'New Building · 2nd Floor', floor: 'nb_2', cam: [22, 58, 124], target: [22, 0, 72] },
  { id: 'nb_3', name: 'New Building · 3rd Floor', floor: 'nb_3', cam: [22, 58, 124], target: [22, 0, 72] },
];

export const THEMES = [
  { id: 'day', name: 'Day', sky: '#cfe3f1', fog: '#dbe8f1', sun: '#fff4e0', sunI: 3.0, hemi: 1.15, hemiG: '#c5ccc4', pos: [-70, 130, -60], glow: 0, lamps: 0 },
  { id: 'gold', name: 'Golden hour', sky: '#f4c9a0', fog: '#f1d4b8', sun: '#ffb26b', sunI: 3.1, hemi: 0.8, hemiG: '#b49a8b', pos: [-120, 48, 40], glow: 0.35, lamps: 0.8 },
  { id: 'night', name: 'Night', sky: '#0f1a2e', fog: '#121e33', sun: '#9fb6e8', sunI: 0.75, hemi: 0.42, hemiG: '#1b2438', pos: [60, 110, -70], glow: 1.5, lamps: 3 },
];

// Solid footprints used for on-foot collisions.
export const COLLIDERS = [
  // Old Building exterior. The door gap between x 21.7 and 26.3 stays open.
  { x0: -4, x1: 10, z0: -39, z1: -24 }, { x0: 38, x1: 52, z0: -39, z1: -24 }, { x0: 10, x1: 21.7, z0: -39.6, z1: -37.4 },
  { x0: 26.3, x1: 38, z0: -39.6, z1: -37.4 }, { x0: 3.5, x1: 14.2, z0: -50, z1: -39, top: 3 }, { x0: 33.8, x1: 44.5, z0: -50, z1: -39, top: 3 },
  { x0: 15.7, x1: 16.9, z0: -45.2, z1: -44, top: 0 }, { x0: 31.1, x1: 32.3, z0: -45.2, z1: -44, top: 0 },
  { x0: -5, x1: 10, z0: -24, z1: 6 }, { x0: 38, x1: 57, z0: -24, z1: -16 }, { x0: 46, x1: 57, z0: -16, z1: 6 }, { x0: 10, x1: 46, z0: -5, z1: 6 }, { x0: 38, x1: 40, z0: -16, z1: -5 },
  // Lobby walls, corridors, stage, and furniture.
  { x0: 16.5, x1: 21.3, z0: -20, z1: -5 }, { x0: 26.7, x1: 31.5, z0: -20, z1: -5 }, { x0: 10, x1: 13.5, z0: -20, z1: -5 }, { x0: 34.5, x1: 38, z0: -20, z1: -5 },
  { x0: 21, x1: 27, z0: -15.5, z1: -5 }, { x0: 13.5, x1: 16.5, z0: -6, z1: -5 }, { x0: 31.5, x1: 34.5, z0: -6, z1: -5 },
  { x0: 19.6, x1: 21.3, z0: -22.2, z1: -19.7, top: 3.2 }, { x0: 26.7, x1: 28.4, z0: -22.2, z1: -19.7, top: 3.2 },
  { x0: 10, x1: 16.3, z0: -24.5, z1: -23.4, top: 2.9 }, { x0: 10, x1: 11.4, z0: -23.4, z1: -20, top: 2.9 }, { x0: 33.5, x1: 37.8, z0: -25, z1: -22.4, top: 2.7 }, { x0: 31.8, x1: 33, z0: -22.6, z1: -21.5, top: 3.3 },
  { x0: 21.5, x1: 21.9, z0: -37.4, z1: -35.1, top: 0 }, { x0: 26.1, x1: 26.5, z0: -37.4, z1: -35.1, top: 0 },
  // Other buildings and landmarks.
  { x0: 0, x1: 47, z0: 6, z1: 50 }, { x0: 0, x1: 44, z0: 52, z1: 90 }, { x0: 49.5, x1: 57.5, z0: 8, z1: 48 }, { x0: 46, x1: 57.5, z0: 52, z1: 88 },
  { x0: 4, x1: 30, z0: 90, z1: 94, top: 3.3 }, { x0: 53, x1: 66, z0: -92, z1: -74 }, { x0: 28.4, x1: 39.6, z0: -79.6, z1: -68.4, top: 3 },
];

// Height of the walkable surface at a point. This matches the steps built in world.js.
export function floorHeight(x, z) {
  if (x >= 14.2 && x <= 33.8 && z >= -50 && z < -45.94) return (1.5 * (Math.floor((z + 50) / 0.58) + 1)) / 8;
  if (x >= 14.2 && x <= 33.8 && z >= -45.94 && z < -38) return 1.5;
  if (x >= 10 && x <= 38 && z >= -38 && z <= -5) {
    if (x >= 21.3 && x <= 26.7 && z >= -22.2 && z < -19.2) return 1.84 + 0.17 * (Math.floor((z + 22.2) / 0.5) + 1);
    if (x >= 21.3 && x <= 26.7 && z >= -19.2) return 2.86;
    if (x >= 16 && x <= 32 && z >= -25 && z < -20) return 1.84;
    if (x >= 15 && x <= 33 && z >= -26 && z < -20) return 1.67;
    return 1.5;
  }
  if (x >= 18 && x <= 50 && z >= -125 && z < -58) return 0.1;
  return 0;
}

// The highest the third-person camera may go at a point, so it stays under ceilings.
export function cameraCeiling(x, z) {
  if (x >= 15.5 && x <= 32.5 && z >= -46.2 && z < -38) return 6;
  if (x >= 10 && x <= 38 && z >= -38 && z <= -5) {
    if (z >= -20) {
      if (x < 17 || x > 31) return 4.15;
      return 5.6;
    }
    return 5.65;
  }
  return Infinity;
}

// True when a point is inside the lobby or its corridors.
export function indoorBounds(x, z) {
  return z >= -38.2 && z <= -5 && x >= 10 && x <= 38;
}
export const WALK_BOUNDS = { x0: -16, x1: 66, z0: -124, z1: 101 };

// Character looks. Colours from other users always pass through cleanProfile first.
export const SKIN_SWATCHES = [
  { name: 'Fair', value: '#f3cfb3' }, { name: 'Light', value: '#e8b995' }, { name: 'Tan', value: '#e0ac84' },
  { name: 'Morena', value: '#c98d63' }, { name: 'Kayumanggi', value: '#a96f48' }, { name: 'Deep', value: '#7c4f33' },
];
export const HAIR_SWATCHES = [
  { name: 'Black', value: '#17120e' }, { name: 'Dark brown', value: '#2a2118' }, { name: 'Brown', value: '#5a3a22' },
  { name: 'Auburn', value: '#7d3a1e' }, { name: 'Blonde', value: '#c9a24d' }, { name: 'Gray', value: '#9a9a9a' },
  { name: 'Blue', value: '#1f62b8' }, { name: 'Pink', value: '#d65b94' },
];
export const DEFAULT_LOOK = { gender: 'male', skin: '#e0ac84', hair: '#2a2118' };

export const isHexColor = (value) => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

export function cleanProfile(raw) {
  if (!raw || typeof raw.id !== 'string' || !raw.id) return null;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 24) : '';
  return {
    id: raw.id.slice(0, 64),
    name: name.length >= 2 ? name : 'Student',
    gender: raw.gender === 'female' ? 'female' : 'male',
    skin: isHexColor(raw.skin) ? raw.skin : DEFAULT_LOOK.skin,
    hair: isHexColor(raw.hair) ? raw.hair : DEFAULT_LOOK.hair,
  };
}

// Site-wide settings that admins control.
export const NPC_MAX = 200;
export const DEFAULT_SETTINGS = { showWireframe: true, showStudents: true, showVehicles: true, showLabels: true, npcCount: 46 };

export function cleanSettings(raw) {
  const s = raw || {};
  const flag = (value, fallback) => (typeof value === 'boolean' ? value : fallback);
  const npc = Number(s.npcCount);
  return {
    showWireframe: flag(s.showWireframe, DEFAULT_SETTINGS.showWireframe),
    showStudents: flag(s.showStudents, DEFAULT_SETTINGS.showStudents),
    showVehicles: flag(s.showVehicles, DEFAULT_SETTINGS.showVehicles),
    showLabels: flag(s.showLabels, DEFAULT_SETTINGS.showLabels),
    npcCount: Number.isFinite(npc) ? Math.min(NPC_MAX, Math.max(0, Math.round(npc))) : DEFAULT_SETTINGS.npcCount,
  };
}
