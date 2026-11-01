export function PanoOverlay({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <div id="pano-ui">
      <div className="pano-title"><strong id="pano-name">{name}</strong><span>Drag to look · Scroll to zoom · Esc to exit</span></div>
      <button id="pano-close" className="primary" onClick={onClose}>Back to campus</button>
    </div>
  );
}
