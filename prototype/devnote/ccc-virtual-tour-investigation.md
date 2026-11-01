# CCC Virtual Tour: Investigation of the Original Application

Baseline analysis of the original **CCC Virtual Tour** (City College of Calamba) for the remaster.

- **Investigated:** 2 November 2026, on Windows 11
- **Installed at:** `C:\Program Files (x86)\CCC Virtual Tour\`
- **Installer:** `Downloads\Ccc Tour Guide Simulation-...\Installer\CCC Virtual Tour.exe` (78 MB)

## 1. Summary

The application is a mouse-driven **360° panorama tour**, not a 3D walkthrough. The user stands inside a panorama, drags to look around, and clicks floor hotspots to jump to the next panorama. Information hotspots open text panels. A static floor-plan map is available at all times.

| Measure | Value |
|---|---|
| Panorama views in use | **52** (Old Building 32, New Building 20) |
| Working travel links | 152 |
| Information panels | 57 open methods, 56 reachable |
| Floor-plan images | 5 |
| Audio and video | None |
| Links between the two buildings | None (the user must go back through Home) |

The content is the valuable part of the original. The main weaknesses are hand-wired navigation with a few wiring bugs, basic look-around controls, a map that does nothing but display, and no sound or transitions.

## 2. How this was investigated

| Method | What it covered |
|---|---|
| **Live play** | The menu, tutorial, map, and parts of both buildings |
| **Decompiled scripts** | Exact behaviour of the C# code (`Assembly-CSharp.dll`) |
| **Scene data extraction** | Buttons, panoramas, panel text, and textures from the Unity data files |

**Limits of this investigation:**

- I did not walk all 52 views. Only 10 were visited in live play (7 in the Old Building, 3 in the New Building). The rest of the route table comes from the extracted data.
- Turning the camera with automated mouse input was very slow and inconsistent, which is why the walkthrough stopped there. This came from the automation and says nothing about how the drag feels to a real user.
- Each finding below is marked **Played** (seen in the running app) or **Code** (confirmed from scripts or scene data, not reproduced in play).
- The Exit button was not clicked. Its behaviour comes from the code.

## 3. Technical profile

| Item | Finding |
|---|---|
| Engine | Unity 2020.3.9f1, Mono scripting, Direct3D 11 on this machine |
| Project identity | Left at the Unity default: company `DefaultCompany`, product `CCC Virtual Tour` |
| Executable date | 5 April 2022. Panorama file names are dated 26 February 2022 and map scans March 2022 |
| Scenes | 1 (`level0`). Everything is loaded at once and switched on and off |
| Scene size | 1,605 GameObjects, 327 buttons, 187 canvases (121 world-space, 66 overlay) |
| Panoramas | Equirectangular, 2048×1024 (2 at 1920×960), DXT1, with a cartoon-style filter applied |
| Texture memory | About 198 MB in total, of which about 73 MB is panoramas |
| Fonts | Fredoka One, LiberationSans, Arial |
| Input | Mouse only. No touch or keyboard handling in the tour scripts |
| Network or saved data | None found in the scripts |

### Code structure

| Script | Lines | Role | Used in scene |
|---|---|---|---|
| `TourManager` | 3,286 | All navigation and panels: 292 methods, 279 GameObject fields, 1,510 `SetActive` calls | Yes |
| `CameraController` | 25 | Drag to look | Yes |
| `SwitchCarrosel` | 53 | Tutorial pages | Yes |
| `Switch_Carrosel_Map` | 57 | Map pages | Yes |
| `officials_Carrosel` | 57 | Office of the President pages | Yes |
| `ExitControl` | 10 | Quit | Yes |
| `CameraFollow`, `CursorPointer`, `library_carrosel_sign` | 15–57 | Follow camera, custom cursors, library sign carousel | **No, unused** |

### How a view change works

Every panorama is a sphere with the camera inside, and all spheres already exist in the scene. Each link is its own hand-written method. It hides the current sphere, hotspot canvas, and info buttons, then shows the next set:

```csharp
public void CccLeftHallwayToCashier()
{
    canvasMainMenu.SetActive(false);
    Ccclefthallway_view.SetActive(false);
    Ccclefthallway_cv.SetActive(false);
    dentalclinicRoom_btn.SetActive(false);
    CccCashierOffice_view.SetActive(true);
    CccCashierOffice_cv.SetActive(true);
    cashierOffice_btn.SetActive(true);
}
```

There is no node data, so adding one view means writing new methods and wiring them up by hand. This repetition is the direct cause of the bugs in section 6.

### Camera

```csharp
if (Input.GetMouseButton(0))
    transform.localEulerAngles = new Vector3(
        transform.localEulerAngles.x + Input.GetAxis("Mouse Y") * Time.deltaTime * 150f,
        transform.localEulerAngles.y + Input.GetAxis("Mouse X") * Time.deltaTime * 150f,
        0f);
```

The field of view is fixed at 100°.

## 4. User experience as played

### Application flow

```text
Main Menu
├─ START TOUR → Building Select
│               ├─ OLD BUILDING → starts at the flagpole plaza
│               ├─ NEW BUILDING → starts in the lobby
│               └─ RETURN → Main Menu
├─ TUTORIAL → image pages with PREVIOUS / NEXT / RETURN
└─ EXIT → closes the app

Inside the tour: Home → Building Select | Map → toggles the floor plan
```

### Controls

| Action | Control | Status |
|---|---|---|
| Look around | Hold left click and drag | Played |
| Travel | Click a blue floor arrow, or a door icon for rooms | Played |
| Read information | Click an "i" icon | Played |
| Scroll a panel | Scrollbar or mouse wheel | Played |
| Close a panel | Close button, at the bottom of the panel content | Played |
| Show or hide the map | Map icon, top right | Played |
| Leave the tour | Home icon, top right | Played |
| Zoom | Not available | Played, Code |

### Hotspots and panels

- Floor arrows sit at the walking direction, and door icons mark enterable rooms. Hotspots change to teal on hover. **Played**
- Panels are full-screen overlays with a blue title bar, Fredoka One text, and a Close button. **Played**
- Views change with an instant cut. There is no fade or movement between views. **Code**
- There is no sound of any kind. The build contains no audio clips. **Code**

### Route walked in play

**Old Building:** Flagpole plaza → Rizal Monument (panel opened) → view facing the college → main entrance → lobby → right hallway (Testing Room panel opened) → next hallway view.

**New Building:** Lobby (Mission and Vision panel opened) → first-floor hallway → computer lab (Room 101 panel opened).

### Map

Five static images, shown in this order. There are no clickable rooms and no "you are here" marker.

| Slide | Content |
|---|---|
| OB1 | Old Building main floor |
| OB2 | Old Building lower ground |
| NB1 | New Building first floor |
| NB2 | New Building second floor (library) |
| NB3 | New Building third floor (AVR) |

## 5. Tour content

### Old Building (32 views)

- **Outdoors:** flagpole plaza, Rizal Monument, view facing the college, main entrance, exit gate
- **Main floor:** lobby, Lazaro Hall, left and right hallways, cashier, registrar area, faculty rooms, science and laboratory wing, offices including the Office of the President
- **Upper level:** three connected views
- **Lower ground:** hallways, aquarium, gazebo, student center, OSA, canteen, alumni, and rooms LG 001–007

### New Building (20 views)

- **First floor:** lobby and guard post, hallways, computer labs 101–105
- **Second floor:** hallways, library (three views), rooms 201–205
- **Third floor:** hallways, AVR, rooms 301–305

### Shared room panoramas

Several rooms reuse one panorama, with only the title and panel text changing:

| Shared view | Rooms using it |
|---|---|
| `Nb3_f1com1_view` | Computer labs 101–105 (5 rooms) |
| `Nb20_f3room1_view` | Rooms 201–205 and 301–305 (10 rooms) |
| `UnderGroundRoom_view` | OB LG rooms 001–007 (7 rooms) |

So 22 rooms are represented by 3 photographs. The remaster should either take new photos or be open about the reuse.

The full route table and panel text are in the appendices.

## 6. Bugs and issues

### Functional

| # | Issue | Evidence | Status |
|---|---|---|---|
| 1 | **Bio Chemistry Lab shows the Chemistry panel.** Both biochem hotspots call `chemRoom_popup`, and nothing calls `biochemroom_popup`, so the written Bio Chemistry text can never be seen | Button wiring | Code |
| 2 | **Stairs "turn back" hotspot activates two views.** `ugh1TurnBack_btn` calls both `CccHallwayRoom3ToBack` and `CccUgh1ToBack`, so Hallway Room 2 and the right hallway, with their hotspots, are switched on together | Button wiring | Code |
| 3 | **Aquarium "back" hotspot calls the wrong method.** It runs `CccUghAquariumToBack`, which hides Hall 8 rather than the aquarium, so the aquarium stays active alongside Hall 10 | Button wiring | Code |
| 4 | **Tutorial never shows the Scrolling page.** The index is capped, so `Tutorial7` (`TUTORIAL_SCROLLING`) is unreachable. NEXT silently stops on the Return page | Played: NEXT stops. Code: reason | Played, Code |
| 5 | **Tutorial starts on the wrong page.** All pages start active, so the last one sits on top. Page 1 (Home and Map) only appears after pressing NEXT and then going back | Played: opening page. Code: reason | Played, Code |
| 6 | **Map starts on the wrong slide.** It has the same cause and opens on New Building floor 3, even inside the Old Building. The first NEXT then jumps to Old Building lower ground, skipping the main floor | Played: behaviour. Code: reason | Played, Code |
| 7 | **Camera direction is not reset between views.** Only the initial building load sets it, so arriving views depend on where the user was last looking | `TourManager` | Code |
| 8 | **The camera can tip over.** Vertical rotation has no limit, so the view can go past straight up or down | `CameraController` | Code |
| 9 | **Dragging is not blocked over UI.** The camera checks the mouse button without checking for UI, so it also turns during scrollbar use | `CameraController` | Code |
| 10 | **Look speed is multiplied by frame time.** `GetAxis("Mouse X")` is already a per-frame movement, so multiplying by `deltaTime` makes speed depend on frame rate | `CameraController` | Code |

### Interface and content

| # | Issue | Status |
|---|---|---|
| 11 | Default Unity **"Button" label** is visible on the map arrows. 222 text objects still hold this default | Played |
| 12 | Tutorial picture shows **New Building on the left**, but the real screen has **Old Building on the left** | Played |
| 13 | Typing error: **"Computer Laborary Room 101"**, repeated on labs 101–105 | Played (101), Code (others) |
| 14 | Long panels hide Close at the bottom of the scroll area, with no close control at the top | Played |
| 15 | Home goes to Building Select while its icon suggests the main menu | Played |
| 16 | No custom cursor, because `CursorPointer` is never attached | Code |
| 17 | Vice President for Research text starts with a pasted fragment of the Academic Affairs text | Code |
| 18 | Hotspot and building names are confusing internally: `OB_LoadSite` enables `newbuilding_cv`, `NB_LoadSite` enables `oldbuilding_cv`, and `Old_Bulding` is misspelled | Code |
| 19 | Dead data: the unused method `CccrighthallwayToCccRightHallway`, the unassigned field `Ccc_registrar_exitgate_ve`, and a button with no action in the map UI (`Ob1/Button`) | Code |
| 20 | Names disagree: the map says **Computer Lab 1–5** while panels say **Room 101–105**, and the map shows **RM-306**, which has no panel | Played (map, Room 101), Code (others) |

### Odd routes to check against the real building

These links exist in the build and only go one way. Each may be intentional, so they need checking on site.

| From | To | Note |
|---|---|---|
| New Building lobby | `Nb14_hallway_f2f` | Second lobby hotspot, named `toNb2`, but it lands in a second-floor hallway view |
| Computer lab view | `Nb12_hallway_f2d` | `nb3b`: a first-floor lab linking to a second-floor hallway |
| Hall 3 | Aquarium | The aquarium's own links go to Hall 6 and, through bug 3, Hall 10 |
| Exit gate | Main entrance | No direct way back |

## 7. What the remaster should keep and change

### Keep

- The 52-view coverage and the route structure
- The written content, after proofreading (Appendix B)
- Separate Old and New Building entry points
- The clear floor arrows, door icons, and "i" icons

### Change

| Area | Original | Remaster goal |
|---|---|---|
| Data | Hard-coded methods | One data file of views, links, and panels, with a single navigation function |
| Bugs 1–3 | Hand-wiring errors | Removed by design, and checked by an automated route test |
| Camera | No limits, frame-rate dependent | Clamped pitch, consistent speed, wheel zoom, touch support |
| Arrival direction | Whatever the user last faced | Each link sets the arrival heading |
| Transitions | Instant cut | Short fade or movement effect |
| Map | Static scans | Clean redrawn plans, clickable rooms, "you are here" marker |
| Between buildings | Via Home only | Direct links, and outdoor routes if the site allows |
| Image quality | 2048×1024 with a cartoon filter | Higher-resolution source photos, with the filter as a design choice |
| Shared rooms | 22 rooms from 3 photos | New photos where possible |
| Sound | None | Optional ambience, interface sounds, and narration |
| Accessibility | Mouse only, large text, no alternatives | Keyboard use, screen-reader labels, and adjustable text |
| Platform | Windows installer, 78 MB | Decided by the remaster's target, with progressive loading if on the web |

### Questions for the thesis

The original raises these points, which the remaster evaluation could measure:

- Do users find rooms faster with an interactive map?
- Does setting the arrival direction reduce disorientation?
- Do transitions improve the sense of place compared with instant cuts?
- Is the content still accurate? The office names, officials, and floor plans date from 2022.

---

# Appendix A: Route table

Each row is a working hotspot link, using the build's own object names. Names follow the original's naming, which is sometimes inconsistent. Friendly location names should be confirmed on site before reuse.

The aquarium row marked † reflects bug 3, and the Hall 1 row marked ‡ reflects bug 2.

| View | Links to |
|---|---|
| `CccCashierOffice_view` | CccLazaroHall_view (`CccCashierOfficeToCccLazaroHall`)<br>Ccclefthallway_view (`CccCashierOfficeToLeftHallway`) |
| `CccExitGate_view` | CccFront_view (`CccExitGateToCccFront`)<br>CccRegister_view (`CccExitGateToRegistrar`) |
| `CccFacultyRoom_view` | CccLazaroHall_view (`CccFacultytoBack`)<br>CccUpstairRoom1_view (`CccFacultyToForward`) |
| `CccFront_view` | Ccclobby_view (`CccFrontToCccLobby`)<br>RizalBack_view (`CccFrontToRizalBack`) |
| `CccHallwayRoom1_view` | CccHallwayRoom2_view (`CccHallwayRoom1ToForward`)<br>CccRegister_view (`CccHallwayRoom1ToBack`) |
| `CccHallwayRoom2_view` | CccHallwayRoom1_view (`CccHallwayRoom2ToBack`)<br>CccHallwayRoom3_view (`CccHallwayRoom2ToForward`) |
| `CccHallwayRoom3_view` | CccHallwayRoom2_view (`CccHallwayRoom3ToBack`) |
| `CccLazaroHall_view` | CccCashierOffice_view (`CcclazaroTocashier`)<br>CccFacultyRoom_view (`CcclazaroToCccFaculty`)<br>Ccclobby_view (`CcclazaroToLobby`) |
| `Ccclefthallway_view` | CccCashierOffice_view (`CccLeftHallwayToCashier`)<br>CccRegister_view (`CccLeftHallwayToRegistrar`)<br>Ccclobby_view (`CccLeftHallwayToCccLobby`)<br>UnderGroundHall2_view (`CccLeftHallwayToDownstair`) |
| `Ccclobby_view` | CccFront_view (`CcclobbyToCccFront`)<br>CccLazaroHall_view (`CcclobbyToCccLazaroHall`)<br>Ccclefthallway_view (`CcclobbyToLefHallway`)<br>Cccrighthallway_view (`CcclobbyTorightHallway`) |
| `CccOsaOffice_view` | CccRightFaculty_view (`CccOsaOfficeToCccRightFaculty`)<br>Cccrighthallway_view (`CccOsaOfficeToCccrighthallway`) |
| `CccRegister_view` | CccExitGate_view (`CccRegistrarToExitGate`)<br>CccHallwayRoom1_view (`CccRegistrarToRight`)<br>Ccclefthallway_view (`CccRegistrarToLeftHallway`) |
| `CccRightFaculty_view` | CccOsaOffice_view (`CccRightFacultyToCccOsaOffice`)<br>CccUpstair_view (`CccRightFacultyToCccUpstair`) |
| `Cccrighthallway_view` | CccOsaOffice_view (`CccRightHallwayToCccOsaOffice`)<br>Ccclobby_view (`CccRightHallwayToCccLobby`)<br>UnderGroundHall1_view (`CccRightHallwayToDownstair`) |
| `CccUpstair_view` | CccRightFaculty_view (`CccUpstairToCccRightFaculty_view`)<br>CccUpstairRoom1_view (`CccUpstairRoomToCccUpstair1_view`) |
| `CccUpstairRoom1_view` | CccFacultyRoom_view (`CccUpstair1ToCccFaculty`)<br>CccUpstairRoom2_view (`CccUpstair1ToCccUpstairRoom2`)<br>CccUpstair_view (`CccUpstair1ToCccUpstair`) |
| `CccUpstairRoom2_view` | CccUpstairRoom1_view (`CccUpstairRoom2ToCccUpstair1`) |
| `nb10_libraryBack_back_view` | Nb8_library_view (`n10_Lib_b`) |
| `Nb11_hallway_f2c_view` | Nb12_hallway_f2d_view (`nb11f`)<br>Nb20_f3room1_view (`nb11Room201`)<br>Nb7_hallway_f2b_view (`nb11b`)<br>Nb8_library_view (`nb11toLibrary`) |
| `Nb12_hallway_f2d_view` | Nb11_hallway_f2c_view (`nb12b`)<br>Nb13_hallway_f2e_view (`nb12f`)<br>Nb20_f3room1_view (`nb12toRoom202`) |
| `Nb13_hallway_f2e_view` | Nb12_hallway_f2d_view (`nb13b`)<br>Nb14_hallway_f2f_view (`nb13f`)<br>Nb20_f3room1_view (`nb13toRoom203`)<br>Nb20_f3room1_view (`nb13toRoom204`) |
| `Nb14_hallway_f2f_view` | Nb13_hallway_f2e_view (`nb14b`)<br>Nb15_hallway_f3a_view (`nb14f`)<br>Nb20_f3room1_view (`nb14Room205`) |
| `Nb15_hallway_f3a_view` | Nb14_hallway_f2f_view (`nb15b`)<br>Nb16_hallway_f3b_view (`nb15f`)<br>Nb20_f3room1_view (`nb15Room304`)<br>Nb20_f3room1_view (`nb15Room305`) |
| `Nb16_hallway_f3b_view` | Nb15_hallway_f3a_view (`nb16b`)<br>Nb17_hallway_f3c_view (`nb16f`)<br>Nb20_f3room1_view (`nb16Room302`)<br>Nb20_f3room1_view (`nb16Room303`)<br>Nb20_f3room1_view (`nb16Room304`) |
| `Nb17_hallway_f3c_view` | Nb16_hallway_f3b_view (`nb17b`)<br>Nb18_hallway_f3d_view (`nb17f`)<br>Nb19_avrFront_f3_view (`nb17toAVR`)<br>Nb20_f3room1_view (`nb17Room301`) |
| `Nb18_hallway_f3d_view` | Nb17_hallway_f3c_view (`nb18b`)<br>Nb6_hallway_f2a_view (`nb18f`) |
| `Nb19_avrFront_f3_view` | Nb17_hallway_f3c_view (`nb19b`) |
| `Nb1_lobby_view` | Nb14_hallway_f2f_view (`nb1ftoNb2`)<br>Nb2_hallway_f1aview (`nb1f`) |
| `Nb20_f3room1_view` | Nb11_hallway_f2c_view (`nb11Room201Back`)<br>Nb12_hallway_f2d_view (`nb12Room202back`)<br>Nb13_hallway_f2e_view (`nb13Room203back`)<br>Nb13_hallway_f2e_view (`nb13Room204back`)<br>Nb14_hallway_f2f_view (`nb14Room205back`)<br>Nb15_hallway_f3a_view (`nb15Room304Back`)<br>Nb15_hallway_f3a_view (`nb15Room305Back`)<br>Nb15_hallway_f3a_view (`nb20f`)<br>Nb16_hallway_f3b_view (`nb16Room302Back`)<br>Nb16_hallway_f3b_view (`nb16Room303Back`)<br>Nb16_hallway_f3b_view (`nb16Room304Back`)<br>Nb17_hallway_f3c_view (`nb17Room301Back`) |
| `Nb2_hallway_f1aview` | Nb1_lobby_view (`nb2b`)<br>Nb3_f1com1_view (`nb2comlab1`)<br>Nb3_f1com1_view (`nb2comlab2`)<br>Nb4_hallway_f1b_view (`nb2f`) |
| `Nb3_f1com1_view` | Nb12_hallway_f2d_view (`nb3b`)<br>Nb2_hallway_f1aview (`comlab1back`)<br>Nb2_hallway_f1aview (`comlab2back`)<br>Nb4_hallway_f1b_view (`comlab3back`)<br>Nb4_hallway_f1b_view (`comlab4back`)<br>Nb5_hallway_f1c_view (`comlab5back`) |
| `Nb4_hallway_f1b_view` | Nb2_hallway_f1aview (`nb4b`)<br>Nb3_f1com1_view (`nb4comlab3`)<br>Nb3_f1com1_view (`nb4comlab4`)<br>Nb5_hallway_f1c_view (`nb4f`) |
| `Nb5_hallway_f1c_view` | Nb3_f1com1_view (`nb5comlab5`)<br>Nb4_hallway_f1b_view (`nb5b`)<br>Nb6_hallway_f2a_view (`nb5f`) |
| `Nb6_hallway_f2a_view` | Nb18_hallway_f3d_view (`nb6Upstair`)<br>Nb5_hallway_f1c_view (`nb6b`)<br>Nb7_hallway_f2b_view (`nb6f`) |
| `Nb7_hallway_f2b_view` | Nb11_hallway_f2c_view (`nb7f`)<br>Nb6_hallway_f2a_view (`nb7b`) |
| `Nb8_library_view` | Nb11_hallway_f2c_view (`nb8b`)<br>Nb9_library_front_view (`nb8f`)<br>nb10_libraryBack_back_view (`nb8to10`) |
| `Nb9_library_front_view` | Nb8_library_view (`nb9f`) |
| `RizalBack_view` | CccFront_view (`RizalBackToCccFront`)<br>RizalMain_view (`RizalBackToRizalMain`) |
| `Rizalfront_view` | RizalMain_view (`RizalFrontToRizalMain`) |
| `RizalMain_view` | RizalBack_view (`RizalMainToRizalBack`)<br>Rizalfront_view (`RizalMainToRizalfront`) |
| `ughAquarium_view` | UnderGroundHall10_view † (`CccUghAquariumToBack`)<br>UnderGroundHall6_view (`CccUghAquariumToForward`) |
| `UnderGroundHall10_view` | UnderGroundHall6_view (`CccUgh10ToBack`)<br>UnderGroundHall8_view (`CccUgh10Toforward`)<br>UnderGroundRoom_view (`CccUgh10ToRoom001`) |
| `UnderGroundHall1_view` | Cccrighthallway_view (`CccUgh1ToBack`)<br>UnderGroundHall2_view (`CccUgh1ToForward`)<br>CccHallwayRoom2_view ‡ (`CccHallwayRoom3ToBack`, same button) |
| `UnderGroundHall2_view` | Ccclefthallway_view (`CccUgh2ToReturnGroundFloor`)<br>UnderGroundHall1_view (`CccUgh2ToBack`)<br>UnderGroundHall3_view (`CccUgh2ToForward`) |
| `UnderGroundHall3_view` | UnderGroundHall2_view (`CccUgh3ToBack`)<br>UnderGroundHall4_view (`CccUgh3ToForward`)<br>ughAquarium_view (`CccUgh3ToLeft`) |
| `UnderGroundHall4_view` | UnderGroundHall3_view (`CccUgh4ToBack`)<br>UnderGroundRoom_view (`CccUgh4ToRoom006`)<br>UnderGroundRoom_view (`CccUgh4ToRoom007`) |
| `UnderGroundHall6_view` | UnderGroundHall10_view (`CccUgh6ToLeft`)<br>UnderGroundHall7_view (`CccUgh6ToForward`)<br>ughAquarium_view (`CccUgh6ToBack`) |
| `UnderGroundHall7_view` | UnderGroundHall6_view (`CccUgh7ToBack`)<br>UnderGroundHall_Gassibo5_view (`CccUgh7ToForward`)<br>UnderGroundRoom_view (`CccUgh7ToRoom002`)<br>UnderGroundRoom_view (`CccUgh7ToRoom003`)<br>UnderGroundRoom_view (`CccUgh7ToRoom004`)<br>UnderGroundRoom_view (`CccUgh7ToRoom005`) |
| `UnderGroundHall8_view` | UnderGroundHall10_view (`CccUgh8ToBack`)<br>UnderGroundHall9_view (`CccUgh8ToForward`) |
| `UnderGroundHall9_view` | UnderGroundHall8_view (`CccUgh9ToBack`) |
| `UnderGroundHall_Gassibo5_view` | UnderGroundHall7_view (`CccUgh5GassivoToCccUgh17`) |
| `UnderGroundRoom_view` | UnderGroundHall10_view (`CccUgh10ToRoom001Back`)<br>UnderGroundHall4_view (`CccUgh4ToRoom006Back`)<br>UnderGroundHall4_view (`CccUgh4ToRoom007Back`)<br>UnderGroundHall7_view (`CccUgh7ToRoom002Back`)<br>UnderGroundHall7_view (`CccUgh7ToRoom003Back`)<br>UnderGroundHall7_view (`CccUgh7ToRoom004Back`)<br>UnderGroundHall7_view (`CccUgh7ToRoom005Back`) |

# Appendix B: Panel text

This is the unique text extracted from the build, unedited and including its original errors. Rooms 202–205 and 301–305 use the same wording as Room 201 with the number changed, so only Room 201 is listed. Rooms LG 001–007 share one title pattern.

### `Image`

> Old Building Main Floor

### `AvrVirtualElement_ve`

> The audio-visual room is a place where the students of all classes experience learning in an effective way. The audio-visual method appeals most to the senses. It leaves a deeper impact as it involves greater attention in the act of learning and helps the child to retain the concepts taught through these aids. This is where Seminars take place.

### `ROOM201VirtualElement_panel`

> ROOM 201

> Welcome to ROOM 201! ROOM 201 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions.

### `com101VirtualElement_Unity-ve`

> Computer Laborary Room 101

> Welcome to the Computer Laboratory! The computer lab serves as the center for teaching computer use to whole classes, usually by a specialist computer teacher. Classroom teachers also use the lab with their classes for research, or for creating technology-based projects. Computer Laboratory is very significant especially for Computer Science students.

### `LibEntraceVE_panel`

> City College Of Calamba Library

> WHEN YOU ENTER THIS LIBRARY

> REMINDERS

> You are readers
> You are dreamers
> You are explorers
> You are researchers
> You are authors
> You are adventurers
> You are storyteller
> You are the future
> You are the reason why we are here!
> No library card, no entry
> No photo capturing
> Food and drinks are not allowed

### `Library_info_VirtualElement_panel`

> Welcome to the CCC Library! It is a designated space within the school which serves the reading, research, and information literacy needs of its students. Students can also borrow books but it is required to submit their Library Card too. Students can also study in this quiet place peacefully. There are also book-binded theses and capstone projects here that can be used for new research papers.

### `LobbyVirtualElement_panel`

> GUARD POST

> Welcome to City College of Calamba, please enjoy your virtual tour. You are now inside the institution, feel free to travel around. ☺
>
> This is the guard post where you can inquire your concerns about the institution. Feel free to ask anything so that the guard could assist you on your needs. During the pandemic, this is where you can check your temperature and disinfect your hands before entering the institution. Once you passed the temperature check, you can now proceed.

> MISSION AND VISION

> MISSION
> In pursuit of this vision, we, the faculty, staff, and students of City College of Calamba recognize our vital role in collaboratively honing the professionals by promoting Social Responsibility, Moral Uprightness and National Servitude guided by the ideals, philosophies and values of our national hero, Dr. Jose Rizal.

> VISION
> The City College of Calamba envisions itself as an accredited premier academic institution in the region providing quality learning opportunities to financially-challenged but deserving students in order to produce competent, conscientious, committed and compassionate global professionals.

### `RestRoomFVirtualElement_panel`

> This is the Ladies’ restroom.

### `RestRoomMVirtualElement_panel`

> This is the Mens’ restroom.

### `TesdaRoomVirtualElement_panel`

> Sorry! This door is for Technical Education And Skills Development Authority (TESDA) students only.

> TESDA

### `CashierOffice_ve`

> Cashier

> Welcome to the Cashier’s Office of CCC! The Cashier provides exceptional customer service to the College community while performing duties in the areas of cash handling and accounting. It also assists in guiding the College community on cash handling policies and procedures and coordinates with others to achieve College, business office, and team goals. This is where students need to go in order to pay a certain amount for a specific documents.

> SCHOOL CANTEEN

> This is the place where food and drinks is provided inside the college. The foods offered inside the institution includes healthy foods, drinks, and snacks.

> This is Simulation Room /
> Educational Technological Room

> STUDENT CENTER

> Welcome to the Student Center! The facility is devoted to student recreation and socialization. It is the community center of the college, serving students, faculty, staff, alumni, and guests. Like the Gazebo, students can also relax and study in the student center while enjoying the foods from the canteen. The canteen is located besides the student center

### `FacultyRoom_ve`

> Faculty Room

> Welcome to the Faculty Room! Faculty rooms make teachers more relaxed, more efficient and more effective for them to deliver the right kind of lessons. This is where you can usually find the professor you are looking for but please observe the peace and respect their space. Thank you!

### `DBEoffice_ve`

> Department of Business and Accountancy

> VISION
> The Department of Business and Accountancy envision itself to be the one of the leading schools on the field of business education in the region by providing globally competitive and God- fearing professionals and entrepreneurs who will share their resources in uplifting the lives of the needy but deserving students of City College of Calamba.
> MISSION
> The Department of Business and Accountancy commits itself to nurture and to develop the potentials of the students to become future Certified Public Accountants business leader and entrepreneurs who are technologically adept, fully aware of the global economic conditions, responsibly concerned with the environment, human and natural resources by providing an education instills the standard of Ethical conduct for business and personal dealings and Filipino values as emulated by Dr. Jose Rizal.

### `biochemRoom_ve`

> Bio Chemistry Laboratory

> Bio Chemistry lab is the required component of all chemistry courses not only to give experiments their due place in the subject but also to promote in general, an experimental culture in the school system. In the chemistry lab students are expected to indulge in a creative interplay of observation, experimentation and theoretical inferences. Students are trained to use scientific instruments, make observations, interpret and draw conclusions from observed facts. 
>
> As per the guidelines of the curriculum even the most basic techniques and procedures like inorganic and organic analysis, both qualitative and quantitative are dealt in such an enthusiastic and efficient manner that they not only enable students to face various changes related to health, nutrition, environment, industries, weather etc. but also acquaint them with different aspects of chemistry in daily life.

### `chemlabRoom_ve`

> Chemistry Laboratory

> Chemistry lab is the required component of all chemistry courses not only to give experiments their due place in the subject but also to promote in general, an experimental culture in the school system. In the chemistry lab students are expected to indulge in a creative interplay of observation, experimentation and theoretical inferences. Students are trained to use scientific instruments, make observations, interpret and draw conclusions from observed facts. 
>
> As per the guidelines of the curriculum even the most basic techniques and procedures like inorganic and organic analysis, both qualitative and quantitative are dealt in such an enthusiastic and efficient manner that they not only enable students to face various changes related to health, nutrition, environment, industries, weather etc. but also acquaint them with different aspects of chemistry in daily life.

### `dentalclinicRoom_ve`

> Dental Clinic

> Welcome to the CCC Dental Clinic! A Dental Clinic is where a dentist performs oral health treatments and dental procedures to the student. All the necessary dental tools and equipment are typically housed in a single room.

### `physicsRoom_ve`

> Physics Room

> Welcome to the CCC Physics Laboratory. Physics laboratory is a place where experiments of Physics are carried out. As we know physics is that branch of science where experimentation is an integral part of the core subject. It is in the laboratory that physics students learn to practice the activities of scientists - asking questions, performing procedures, collecting data, analyzing data, answering questions, and thinking of new questions to explore.

### `restRoom_ve`

> City College of Calamba

> Comfort Room (C.R)

### `scienceLectureroom_ve`

> Science Laboratory

> Welcome to the Science Laboratory! It is a special facility where experiments are done and typically contains equipment, beakers, burners and other tools necessary to complete experiments. This room is very significant especially to science major students.

### `LazaroHall_ve`

> History Of Lazaro Hall

> From 1919 to 1941, one of the most well-known political leader that have ran the affairs of Calamba was Romano Lazaro.
>
> Roman Lazaro served as municipal president for three terms (1919-1922, 1931-1934, 1938-1941)
>
> Roman Lazaro had the privilege of having served under four (4) different forms of government: the Civil Government ran by the Americans, the Philippine Commonwealth, the Japanese and the now Republic of the Philippines. Some of his well-remembered accomplishments were the establishment of municipal cemetery located in Barangay Lecheria, the construction of the old municipal building now converted into the City College of Calamba and the erection of the historical Banga in the town plaza. While Roman Lazaro witnessed 4 government transitions, Taciano Rizal and Mayor Severino J. Lajara served the longest term as mayor, although the latter served uninterruptedly for 10 years. It was during Mayor Lajara’s term when Municipality of Calamba was converted into a component city in 2001.

### `LazaroHallroom_ve`

> LAZARO HALL

> Academic Organization

> Non-Academic Org

> Spiritual Org

> Welcome to Roman Lazaro Hall! This is where most events happen inside the institution. For instance, this is where awardings, meetings with the president or the vice president, orientation for new students, Christmas parties, general assemblies and many events were accomplished. This is the main room where events mostly occur that were arranged by the academic organizations, non-academic organizations, and spiritual organizations of the institution. There are total of twenty organizations in the institution. The following is a list of the organizations:

> ALLS- Alliance of Language and Literature Students
>
> CSS - Computer Science Society
>
> FELTA-Future Elementary Teachers Association
>
> ITS- Information Technology Society 
>
> JPIA-Junior Philippine Institute of Accountants
>
> LEAD- Leader Educators Advocating Dynamism
>
> MSS- Maior Scientiam Sodalitas 
>
> UM3P - Ugnayan ng mga Math Majors para sa Makabuluhang Pagtuturo

> APL -ARISTOTELIAN PARLIAMENT OF LOGIC – DEBATE SOCIETY
>
> ASGRD-Alliance of Students with Great Responsibilities for Development
>
> CAITO-Creative Anime-Inspired Theme Organization
>
> CAPS- CCC Admirals Pepsquad 
>
> DCP-Dalubhasaan ng Calamba Productions
>
> EXCEL- Executive Computer Education Leader
>
> iFIGHT CCC Chapter
>
> ROTARACT - Rotaract Club of City College of Calamba
>
> SAVE - Society of Active Volunteers and Environment

> ENC- Every Nation Campus
> SFJ- Shine For Jesus
> BREAD- BREAD Society International

### `LobbyOldbuildingCccLogo_ve`

> History of City College of Calamba 
>
>      The City College of Calamba was founded in 2006 during the administration of Calamba City Mayor Joaquin M. Chipeco, Jr. He envisioned to provide quality yet, affordable tertiary education to the financially challenged but deserving youth of Calamba through the establishment of a College funded by the City Government. Through the unflinching determination of stakeholders and the Sangguniang Panlungsod ng Calamba headed by then Vice Mayor Pursino C. Oruga, the Charter of CCC was passed on June 5, 2006, known as Ordinance No. 359 – AN ORDINANCE ESTABLISHING THE CITY COLLEGE OF CALAMBA AND FOR OTHER PURPOSES.
>
>      The Old City Hall was renovated to become CCC, the greatest legacy to Calambeños of the Officials of the City Government of Calamba and the sanctuary of dreams of the youth of Calamba City. CCC was inaugurated on June 19, 2006, coinciding with the 145th birth anniversary of Dr. Jose Rizal, the greatest son of Calamba and most revered national hero of the Philippines.
>
>      True to its mandate, CCC initially offered programs relevant to Calamba City like Bachelor of Science in Accountancy (BSA), Bachelor of Science in Computer Science (BSCS), Bachelor of Science in Information Technology (BSIT), Bachelor of Secondary Education (BSED) major in English, Mathematics, Biological Science, and Diploma in Information Technology (DIT). In the first semester of AY 2006 – 2007, a total of four hundred seventy – six freshmen enrolled in the said programs. In 2008, CCC began offering Bachelor of Elementary Education (BEED).
>
>      After more than a decade of operation, the history of CCC isn’t finished yet. With God’s grace and through everyone’s competence, commitment, and character, the City College of Calamba will continue to soar in terms of delivery of quality instruction, to be of service to the deserving youth though they be the least and the last in society, and to ride with the winds of change and tradition of excellence.

### `LobbyOldbuildingGrdpst_ve`

> Guard Entrance

### `LobbyOldbuildingSecurity_ve`

> Safety and Security Room

> The institution use a variety of practices and procedures to promote the safety of students, faculty, and staff. These procedures include:
>
>
>     -Controlled access to buildings during school hours
>
>     -Security cameras used to monitor the school
>
>     -Required faculty and staff to wear badges or picture IDs
>
>     -Enforced a strict dress code
>
>     -Required students to wear badges or pictures IDs
>
>     -Temperature Checks
>
>     -Log book monitoring for visitors and students

### `MaintenanceRoom_ve`

> Maintenance Room

> Warning! 
> This room is for maintenance staff only!

### `OBLG001_ve`

> OB LG ROOM 001

> Welcome to ROOM 001! ROOM ROOM 001 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG002_ve`

> Welcome to ROOM 002! ROOM 002 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG003_ve`

> Welcome to ROOM 003! ROOM 003 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG004_ve`

> Welcome to ROOM 004! ROOM 004 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG005_ve`

> Welcome to ROOM 005! ROOM 005 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG006_ve`

> Welcome to ROOM 006! ROOM 006 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `OBLG007_ve`

> Welcome to ROOM 007! ROOM 007 is used as a classroom. It is a learning space in which students study, absorb, or acquire new information which are taught by the professors. It also provides a space where learning can take place uninterrupted by outside distractions

### `GuidanceRoom_ve`

> Guidance Office

> In general, through the collaborative efforts of the City College of Calamba, and Guidance, Counseling, Testing, and Career Development Office, we are committed to uplift the lives and gearing towards the total human development of our clients from various barangays of Calamba City by providing and delivering quality services through its programs and activities that is responsive to their needs. The office includes the function of Guidance and Counseling, Psychological Testing, and Career Planning which involves the use of an integrated approach to the development of a well-functioning individual, by helping them to utilize their potentials to the fullest and plan their future in accordance with their abilities, interests and needs.
>
> Vision
>
>    In accordance with the CCC’s vision, the Guidance, Counseling, Testing, and Career Development Office envisions itself as an advocate; responsive, and committed in providing a positive, safe, and nurturing environment through its quality guidance services for the holistic development of learners.
>
> Mission
>
>    The Guidance, Counseling, Testing and Career Development Office commit itself to consistently deliver quality services through its psycho-education program and activities that is responsive to the needs of learners.
>
> GCTCDO Services Offered
>
> Admission Service
>
> Orientation Service
>
> Information Service
>
> Psychological Testing Service
>
> Career Guidance/Job Placement Service
>
> Counseling Service
>
> Academic Follow-Up/Referral Service
>
> Individiual Inventory
>
> Enrichment and Formation
>
> Peer Facilitators Supervision
>
> Research and Evaluation
>
> Community Extension Program

### `OBGFRoom_ve`

> Testing Room OB GR ROOM 101

> Welcome to the CCC Testing Room! A testing room is a room in which tests are conducted.

### `OfficePresident_ve`

> Office of the President and Vice President

> The President of the College is the chief executive, administrative, and education officer of the community college district and derives authority from, and is responsible to, the City College of Calamba Board of Trustees.  The President's primary responsibility is to provide vision for the College and continuous leadership and direction for the planning and operation of all aspects of the College's programs and services in conformity with Board policies and rules and regulations, more specifically, the President is responsible for:

> 1.  Developing and implementing a progressive and community-responsive College philosophy, including a comprehensive strategic plan that details the institutional mission, vision, goals and objectives, priorities, and resources for the current and long-range needs of the district;
>
> 2. Developing, maintaining, and evaluating the academic programs and student services of the College and creating a climate that enhances student learning, stimulates creative approaches to teaching and learning, and motivates staff, faculty, and students to optimum achievement;
>
> 3. Developing and maintaining an appropriate administrative organization to ensure effective and efficient management of the College and its resources;
>
> 4. Recommending policies for Board action, and implementing those policies adopted by the Board;
>
>
> 5. Developing and maintaining a personnel operation that includes the recruitment, selection, development, compensation, evaluation, and continuation of all College staff and faculty;
>
> 6. Preparing, recommending, and administrating the annual operating and capital budgets as approved by the Board of Trustees;
>
> 7. Maintaining and making efficient use of existing institutional resources, and creating new resources;
>
> 8. Providing for effective internal and external communications, including keeping the Board informed, being the College's chief spokesperson, and representing the College to the general public;
>
> 9. Providing for the preparation and submission of all reports required by local, state, and national agencies;
>
> 10. Representing and actively participating in appropriate local, state, and national efforts to promote the interests of the College;
>
> 11. Managing the operational affairs of the Board of Trustees, including being its professional advisor by analyzing implications of proposed actions and making recommendations, handling agendas, minutes, policies, and other necessary records;
>
> 12. Representing the College interests as a member of the City College of Calamba Board of Directors;
>
> 13. Delegating to appropriate staff, faculty, and committees powers and duties listed above as the President deems appropriate for the administration of the College;
>
> 14. Exercising the discretionary power necessary to ensure the continuous efficient operation of the College, and deciding all other administrative matters not outlined above and for which no specific provision has been made in the law or by Board policies; and
>
> 15. Performing any other duties assigned or delegated by the Board of Trustees.

> The following are the responsibilities of the Vice President for Administration:

> 1. Lead, guide and mentor administrative staff in their tasks and functions.
>
>
> 2. Integrate and coordinate functions of administrative, finance, sales and marketing departments.
>
>
> 3. Develop innovative strategies to enhance performance of the administrative staff.
>
>
> 4. Assess and evaluate existing methods and functions in administrative functions.
>
>
> 5. Track, monitor and document performance of each individual.
>
>
> 6. Integrate, upgrade and update all databases.
>
>
> 7. Plan, schedule and conduct training new employees.
>
>
> 8. Supervise functions of payroll, vendor payments and accounts receivable and payable.
>
>
> 9. Manage accounting, investing and financial services including audits.
>
>
> 10. Ensure best corporate practices in implementing administrative activities.

> The Vice-President for Academic Affairs is directly responsible to the President for carrying out all educational policies, for implementing all programs and projects of the institution, and for supervising curricular, instructional, and other academic activities in the institution. In addition he/she shall perform the following specific duties and functions:

> 1. Plan and implement approved plans on academic affairs and programs of the university in coordination with other Division heads, Campus Directors, Deans and Heads of Units;
>
> 2. Assume educational leadership in the academic council;
>
>
> 3. Implement university policies on academic affairs and shall promote the welfare and development of faculty members, Campus Directors, Deans, Heads of units and the students;
>
> 4. Manage and supervise all the Campus Directors, Deans of colleges/centers, directors of student services/instruction and all academic units of the university;
>
> 5. Recommend to the University President policies on promotion and qualified persons to fill positions in the different offices and units under your supervision;
>
> 6. Conduct meetings and conferences with the Campus Directors, Deans, Heads of Units and faculty members; and
>
> 7. Perform other functions as may be delegated by the President.

> The Office of the Vice President for Extension and Linkages shall exercise general supervision of all the units and offices under it which services and concerns pertaining to research, extension, planning, and institutional development.

> 1. manages and supervises all the offices, units, and programs in the implementation of the extension policies and agenda;
>
> 2. participates in the policy review, formulation, and revision as may be necessary to ensure relevance, responsiveness, and quality of research and extension
>
> programs and provision of research support services and incentives;
> 3. recommend programs, projects, and policies needed to improve university linkages and partnerships;
>
> 4. ensures coordination and harmonious functioning of all offices and units 
>
> 5. attends to internal and external invitations, and other local, national, and international concerns of the Office, as well as those which may be delegated by the President;
>
> 6. recommends qualified personnel when needed, evaluates their performances, and recommends disciplinary action as may be warranted;
>
> 7.submits regular/periodic reports required by higher authorities and/or external bodies; and
>
> 8.performs other tasks that the President may assign from time to time.

> The Vice-President for Academic Affairs is directly responsible to the President for carrying out all educational policies, for The Vice-President for Research and Innovation is responsible for the management, administration, and leadership of research at City College of Calamba and is instrumental in promoting, formalizing and embedding successful innovation throughout the institution. Reporting to the President, the Vice President Research and Innovation holds primary responsibility for the planning, development and implementation of all research administration initiatives in support of City College of Calamba’s vision, mission, and strategic directions.  projects of the institution, and for supervising curricular, instructional, and other academic activities in the institution. In addition he/she shall perform the following specific duties and functions:

### `adminStaffRoom_ve`

> Administrative Staff Room

> An administrative or staff room is a space devoted to supervisory or managerial functions related to institutional administration.

### `psychLabRoom_ve`

> PSYCHOLOGY LABORATORY/ RESEARCH OFFICE

> Welcome to the Psychology Laboratory and Research Office of the CCC! 
>
> The general purpose of a psychology laboratory is to create a controlled environment in which researchers can study human behavior. This level of control is of the utmost importance in psychology laboratory work.
>
> The Research Office is the institution’s official signatory for research grants and contracts, with formally delegated authority to submit applications, accept research grants and negotiate appropriate terms and conditions.

### `testingRoom_ve`

> TESTING ROOM

### `RizalMonument_ve`

> Rizal Monument

> José Protasio Rizal Mercado y Alonso Realonda (Spanish: [xoˈse riˈsal]; June 19, 1861 – December 30, 1896) was a Filipino nationalist, writer, and polymath during the tail end of the Spanish colonial period of the Philippines. 
>
>
> He is considered as the national hero (pambansang bayani) of the Philippines. An ophthalmologist by profession, Rizal became a writer and a key member of the Filipino Propaganda Movement, which advocated political reforms for the colony under Spain.
>
>
> Jose Rizal was born in 1861 to Francisco Rizal Mercado y Alejandro and Teodora Alonso Realonda y Quintos in the town of Calamba in Laguna province. This statue was built to honor and commemorate the things that our hero made for this country.

### `SpeechLab_ve`

> Speech Laboratory

> Welcome to the CCC Speech Laboratory! A dedicated space for students to record & rehearse speeches and to assist with the production of high quality, multimedia projects. It is also a space for faculty and educators to record instructional videos and eLessons; Moreover, it is a multimedia studio dedicated to your success! Receive instant, formative feedback on presentation style, technique, content-flow and more!

### `AlumniOffice_ve`

> This is Alumni Room

### `GazziboVe_ve`

> Gazebo

> Welcome to the most peaceful location inside the institution, the Gazebo! It offers an open view of the surrounding area, typically used for relaxation or entertainment. It is a place where students can relax and study inside the institution.

### `OsaOffice_ve`

> Office Of Student Affairs

> Welcome to the Office of Student Affairs! It takes charge of the campus life of the students, their welfare and discipline, and dormitory facilities. As such, it guides and supervises the recognized student organizations, the student councils, the COMELECs; and conducts capability-building seminars for the organization advisers. The OSA looks into all student-initiated and student-related activities.

### `SociosSenOffice_ve`

> SOCIOS, SENTINEL, SSC ROOM

> Welcome to the room of SOCIOS, SENTINEL, and SSC! 
>
> Students who are interested in dancing, singing, and playing instruments can join the SOCIOS club. 
>
> Students who are interested in cartooning, editorial assistant, photojournalism, publishing copy editor can join the SENTINEL.
>
> Students who are interested in assessment of student concerns and programs arrangement on the institution and other events can join the SSC!

### `ccc_registrar_ACC_ve`

> Department of Business and Accountancy
>
> VISION
> The Department of Business and Accountancy envision itself to be the one of the leading schools on the field of business education in the region by providing globally competitive and God- fearing professionals and entrepreneurs who will share their resources in uplifting the lives of the needy but deserving students of City College of Calamba.
>
> MISSION
> The Department of Business and Accountancy commits itself to nurture and to develop the potentials of the students to become future Certified Public Accountants business leader and entrepreneurs who are technologically adept, fully aware of the global economic conditions, responsibly concerned with the environment, human and natural resources by providing an education instills the standard of Ethical conduct for business and personal dealings and Filipino values as emulated by Dr. Jose Rizal.
>
> This is where students of the following should go if going to the registrar:
>
> Bachelor of Science in Accountancy
>
> Program Outcomes
> At the end of this program, graduates will have the ability to:
>
> Resolve business issues and problems, with a global and strategic perspective using knowledge and technical proficiency in the areas of financial accounting and reporting, cost accounting and management, accounting and control, taxation, and accounting information systems;
>
> Conduct accountancy research through independent studies of relevant literature and appropriate use of accounting theory and methodologies;
>
> Employ technology as a business tool in capturing financial and non-financial information, generating reports and making decisions;
>
> Apply knowledge and skills to successfully respond to various types of assessments; and (including professional licensure and certifications); and
>
> Confidently maintain a commitment to good corporate citizenship, social responsibility and ethical practice in performing functions as an accountant.
>
>
> Bachelor of Science in Accounting Information System
>
> Program Outcomes
> At the end of this program, graduates will have the ability to:
> Resolve business issues and problems, with a global and strategic perspective using knowledge and technical proficiency in the areas of financial accounting and reporting, cost accounting and management, accounting and control, taxation, and accounting information systems;
>
> Conduct accountancy research through independent studies of relevant literature and appropriate use of accounting theory and methodologies;
>
> Employ technology as a business tool in capturing financial and non-financial information, generating reports and making decisions;
>
> Apply knowledge and skills to successfully respond to various types of assessments; and (including professional licensure and certifications); and
>
> Confidently maintain a commitment to good corporate citizenship, social responsibility and ethical practice in performing functions as an accountant.

### `ccc_registrar_DCI_ve`

> Department of Computing and Informatics

> Department of Computing and Informatics
>
> VISION
> A leader provider of excellent information technology professional who manifest global standards, prepare to meet and respond to the needs and demands of the computer and IT industry.
>
> MISSION
> To strengthen the foundation for computer and IT education and literacy by exposing the would-be IT professionals to the theories and practice guided by ethics, values and professionalism.
>
> These are the courses offered under this department:
> Bachelor of Science in Information Technology
>
> Program Outcomes
> At the end of this program, graduates will have the ability to:
>
> Knowledge for Solving Computing Problems:
> IT01 - Apply knowledge of computing, science, and mathematics appropriate to the discipline.
> IT02 - Understand best practices and standards and their applications.
>
> Problem Analysis:
> IT03 - Analyse complex problems, and identify and define the computing requirements appropriate to its solution.
> IT04 - Identify and analyse user needs and take them into account in the selection, creation, evaluation and administration of computer-based systems.
>
> Design/Development of Solutions:
> IT05 - Design, implement, and evaluate computer-based systems, processes, components, or programs to meet desired needs and requirements under various constraints.
> IT06 - Integrate IT-based solutions into the user environment effectively.
>
> Modern Tool Usage:
> IT07 - Apply knowledge through the use of current techniques, skills, tools and practices necessary for the IT profession.
>
> Communication:
> IT10 - Communicate effectively with the computing community and with society at large about complex computing activities through logical writing, presentations, and clear instructions.
>
> Computing Professionalism and Ethics:
> IT11 - Analyse the local and global impact of computing information technology on individuals, organizations, and society.
> IT12 -Understand professional, ethical, legal, security and social issues and responsibilities in the utilization of information technology.
>
> Life-Long Learning:
> IT13 - Recognize the need for and engage in planning self-learning and improving performance as a foundation for continuing professional development.
>
>
> Bachelor of Science in Computer Science
>
> Program Outcomes
> At the end of this program, graduates will have the ability to:
>
> Knowledge for Solving Computing Problems:
> CS01 - Apply knowledge of computing fundamentals, knowledge of a computing specialization, and mathematics, science, and domain knowledge appropriate for the computing specialization to the abstraction and conceptualization of computing models from defined problems and requirements.
> Problem Analysis:
> CS02 - Identify, analyze, formulate, research literature, and solve complex computing problems and requirements reaching substantiated conclusions using fundamental principles of mathematics, computing sciences, and relevant domain disciplines.
>
> Design/Development of Solutions:
> CS03 - An ability to apply mathematical foundations, algorithmic principles and computer science theory in the modelling and design of computer-based systems in a way that demonstrates comprehension of the trade-offs involved in design choices.
> CS04 - Knowledge and understanding of information security issues in relation to the design, development and use of information systems.
> CS05 - Design and evaluate solutions for complex computing problems, and design and evaluate systems, components, or processes that meet specified needs with appropriate consideration for public health and safety, cultural, societal, and environmental considerations.
>
> Modern Tool Usage:
> CS06 - Create, select, adapt and apply appropriate techniques, resources and modern computing tools to complex computing activities, with an understanding of the limitations to accomplish a common goal.
>
>
> Individual & Team Work:
> CS07 - Function effectively as an individual and as a member or leader in diverse teams and in multidisciplinary settings.
>
> Communication:
> CS08 - Communicate effectively with the computing community and with society at large about complex computing activities by being able to comprehend and write effective reports, design documentation, make effective presentations, and give and understand clear instructions.
>
> Computing Professionalism and Ethics:
> CS09 - An ability to recognize the legal, social, ethical and professional issues involved in the utilization of computer technology and be guided by the adoption of appropriate professional, ethical and legal practices.
>
> Life-Long Learning:
> CS10 - Recognize the need, and have the ability, to engage in independent learning for continual development as a computing professional.

### `ccc_registrar_EDU_ve`

> Department of Arts, Sciences, and Teacher Education

> Department of Arts, Sciences, and Teacher Education (DASTE)
>
> VISION
> The Teacher Education of DASTE shall be known as the center of excellence in teacher development and training in the region, thereby producing global education shapers who possess intellectual, moral, and ethical standards for the 21st century teacher and graduates.
>
> MISSION
> The Teacher Education of DASTE shall provide quality teaching and learning experiences by exposing both the faculty and students to greater deal of opportunities for their professional and pedagogical advancements.
>
> These are the courses offered under this department:
>
> Bachelor of Elementary Education
>
> Program Outcomes
> At the end of this program, graduates will have the ability to:
>
> Demonstrate in-depth understanding of the diversity of learners in various learning areas.
>
>
> Manifest meaningful and comprehensive pedagogical content knowledge (PCK) of the different subject areas.
>
> Utilize appropriate assessment and evaluation tools to measure learning outcomes.
>
> Manifest skills in communication, higher order thinking and use of tools and technology to accelerate learning and teaching.
>
> Demonstrate positive attributes of a model teacher, both as an individual and as a professional.
>
> Manifest a desire to continuously pursue personal and professional development.
>
>
> Bachelor of Secondary Education Major in English
>
> Program Outcomes
>
> At the end of this program, graduates will have the ability to:
>
> Possess broad knowledge of language and literature for effective learning.
> Use English as a global language in a multilingual context as it applies to the teaching of language and literature.
>
> Acquire extensive reading background in language, literature, and allied fields.
> Demonstrate proficiency in oral and written communication.
>
>
> Shows competence in employing innovative language and literature teaching approaches, methodologies, and strategies.
>
> Use technology in facilitating language learning and teaching.
>
> Inspire students and colleagues to lead relevant and transfomative chances to improve learning and teaching language and literature.
> Display skills and abilities to be a reflective and research-oriented language and literature teacher.
>
>
> Bachelor of Secondary Education Major in Mathematics
> Program Outcomes
> At the end of this program, graduates will have the ability to:
> Exhibit competence in mathematical concepts and procedures.
> Exhibit proficiency in relating mathematics to other curricular areas.
> Manifest meaningful and comprehensive pedagogical content knowledge (PCK) of mathematics.
> Demonstrate competence in designing, constructing and utilizing different forms of assessment in mathematics.
> Demonstrate proficiency in problem-solving by solving and creating routing and non-routine problems with different levels of complexity.
> Use effectively appropriate approaches, methods, and techniques in teaching mathematics including technological.
> Appreciate mathematics as an opportunity for creative work, moments of enlightenment, discovery and gaining insights of the world.
>
> Bachelor of Secondary Education Major in Science
> Program Outcomes
> At the end of this program, graduates will have the ability to:
> Demonstrate deep understanding of scientific concepts and principles.
> Apply scientific inquiry in teaching and learning.
> Utilize effective science teaching and assessment methods.

