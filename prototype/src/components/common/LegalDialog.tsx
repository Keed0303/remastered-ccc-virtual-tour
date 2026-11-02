import { Dialog } from './Dialog';

// Must agree with ../COPYRIGHT.md at the repository root.
export function LegalDialog({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  return (
    <Dialog id="legal-dialog" aria-labelledby="legal-title" isOpen={isOpen} onDismiss={onDismiss}>
      <h2 id="legal-title">Copyright Policy</h2>
      <p><strong>© 2026 Manuel Kyd Thomas Nagpala. All rights reserved.</strong></p>
      <p>The V2 source code, 3D campus model, character designs, game design, and interface belong to the author.</p>
      <h3>You may</h3>
      <p>View and use this site for personal or educational purposes, share its link, and quote short parts with credit to the author.</p>
      <h3>Written permission is needed to</h3>
      <p>Copy, modify, redistribute, or republish the code or 3D assets, use any part commercially, present it as your own work, or use it to train AI models.</p>
      <h3>Owned by others</h3>
      <p>The 2022 CCC Virtual Tour photos, panoramas, floor plans, and text remain with the original project group and other rights holders. The City College of Calamba name, seal, and uniform design belong to the college and its relevant authorities. React, React Router, Three.js, Vite, and the Supabase client are MIT licensed. Fredoka and Inter use the SIL Open Font License. Map and Street View references belong to Google and its data providers. Street shapes and the campus land outline are based on OpenStreetMap data, © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>, under the Open Database License.</p>
      <p>This is an independent student work and does not imply endorsement by City College of Calamba. If you own material used here and want it credited, corrected, or removed, please contact the author.</p>
      <form method="dialog"><button className="primary">Close</button></form>
    </Dialog>
  );
}
